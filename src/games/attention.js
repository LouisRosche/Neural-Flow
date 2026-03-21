// games/attention.js — Sustained Attention game logic

import {
    ATTENTION_TARGET_BASE_MS,
    ATTENTION_TARGET_DIFF_MS,
    ATTENTION_SPAWN_BASE_MS,
    ATTENTION_SPAWN_DIFF_MS
} from '../config.js';
import { zScore, logLinearRate } from '../scoring.js';

/**
 * Create the initial attention game state.
 * @param {number} currentDifficulty
 * @returns {Object} attentionState
 */
export function createAttentionState(currentDifficulty) {
    const targetCount = 5 + currentDifficulty;
    const distractorCount = Math.ceil(targetCount * 0.4);

    // Pre-build a deterministic interleaved schedule for test-retest reliability.
    // Targets and distractors are interleaved rather than randomly assigned,
    // ensuring a consistent ratio across runs at the same difficulty.
    const schedule = [];
    const total = targetCount + distractorCount;
    for (let i = 0; i < total; i++) {
        // Distribute distractors evenly using Bresenham-style interleaving
        const isDistractor = Math.floor((i + 1) * distractorCount / total)
            > Math.floor(i * distractorCount / total);
        schedule.push(!isDistractor);
    }

    return {
        targets: targetCount,
        distractorCount,
        schedule,
        scheduleIndex: 0,
        hits: 0,
        misses: 0,
        falsePositives: 0,
        targetsShown: 0,
        distractorsShown: 0,
        completed: false,
        startTime: Date.now(),
        active: [],
        els: {}
    };
}

/**
 * Build the attention task UI (target area + stats).
 * @param {HTMLElement} area - The game area element
 * @param {Object} attentionState
 */
export function buildAttentionUI(area, attentionState) {
    const title = document.createElement('h3');
    title.textContent = 'Click blue circles, avoid red circles!';

    const targetArea = document.createElement('div');
    targetArea.className = 'target-area';
    targetArea.id = 'targetArea';

    const stats = document.createElement('div');
    stats.className = 'stats';
    const statDefs = [
        { id: 'hitsDisplay', label: 'Hits', value: '0' },
        { id: 'missesDisplay', label: 'Misses', value: '0' },
        { id: 'accuracyDisplay', label: 'Accuracy', value: '100%' }
    ];
    statDefs.forEach(def => {
        const item = document.createElement('div');
        item.className = 'stat-item';
        const val = document.createElement('div');
        val.className = 'stat-value';
        val.id = def.id;
        val.textContent = def.value;
        const lbl = document.createElement('div');
        lbl.className = 'stat-label';
        lbl.textContent = def.label;
        item.appendChild(val);
        item.appendChild(lbl);
        stats.appendChild(item);
    });

    area.appendChild(title);
    area.appendChild(targetArea);
    area.appendChild(stats);

    // Cache display elements for hot-path updates
    attentionState.els.hits = document.getElementById('hitsDisplay');
    attentionState.els.misses = document.getElementById('missesDisplay');
    attentionState.els.accuracy = document.getElementById('accuracyDisplay');
    attentionState.els.targetArea = targetArea;
}

/**
 * Spawn a target or distractor in the attention game.
 * @param {Object} ctx - Context: { attentionState, currentDifficulty, currentGame, gameTimeout, logTrial, completeTask }
 */
export function spawnTarget(ctx) {
    const { attentionState, currentDifficulty, gameTimeout, logTrial } = ctx;

    if (!attentionState || ctx.currentGame !== 'attention') return;

    if (attentionState.completed) return;

    if (attentionState.scheduleIndex >= attentionState.schedule.length && attentionState.active.length === 0) {
        attentionState.completed = true;
        endAttentionTask(ctx);
        return;
    }

    const shouldSpawn = attentionState.scheduleIndex < attentionState.schedule.length;

    if (shouldSpawn) {
        const isTarget = attentionState.schedule[attentionState.scheduleIndex];
        attentionState.scheduleIndex++;

        const dot = document.createElement('div');
        dot.className = `target ${isTarget ? 'blue' : 'red'}`;
        dot.dataset.isTarget = isTarget;
        dot.dataset.spawnTime = Date.now();
        dot.setAttribute('role', 'button');
        dot.setAttribute('tabindex', '0');
        dot.setAttribute('aria-label', isTarget ? 'Blue target \u2014 click or press Enter' : 'Red distractor \u2014 avoid');

        // Keyboard support
        dot.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTargetClick(dot, ctx);
            }
        });

        const area = attentionState.els.targetArea;
        const maxX = Math.max(0, area.offsetWidth - 50);
        const maxY = Math.max(0, area.offsetHeight - 50);

        dot.style.left = `${Math.random() * maxX}px`;
        dot.style.top = `${Math.random() * maxY}px`;

        area.appendChild(dot);
        attentionState.active.push(dot);

        if (isTarget) attentionState.targetsShown++;
        else attentionState.distractorsShown++;

        // Auto-remove after timeout
        gameTimeout(() => {
            if (dot.dataset.handled === 'true') return; // Already clicked
            dot.dataset.handled = 'true';
            if (dot.parentNode) {
                if (isTarget) {
                    attentionState.misses++;
                    logTrial({
                        trialType: 'attention_miss',
                        stimulus: 'target',
                        response: 'none',
                        correct: false,
                        rt: null,
                        posX: parseInt(dot.style.left),
                        posY: parseInt(dot.style.top),
                        targetsShownSoFar: attentionState.targetsShown,
                        distractorsShownSoFar: attentionState.distractorsShown
                    });
                    updateAttentionDisplay(attentionState);
                }
                dot.remove();
                const idx = attentionState.active.indexOf(dot);
                if (idx > -1) attentionState.active.splice(idx, 1);
            }
        }, ATTENTION_TARGET_BASE_MS - (currentDifficulty * ATTENTION_TARGET_DIFF_MS));
    }

    // Schedule next spawn
    gameTimeout(
        () => spawnTarget(ctx),
        ATTENTION_SPAWN_BASE_MS - (currentDifficulty * ATTENTION_SPAWN_DIFF_MS)
    );
}

/**
 * Handle a click on a target or distractor.
 */
export function handleTargetClick(target, ctx) {
    const { attentionState, logTrial } = ctx;
    if (!attentionState) return;
    // Guard: dot already handled by auto-remove timeout
    if (target.dataset.handled === 'true') return;
    target.dataset.handled = 'true';

    const isTarget = target.dataset.isTarget === 'true';
    const reactionTime = Date.now() - parseInt(target.dataset.spawnTime);

    if (isTarget) {
        attentionState.hits++;
    } else {
        attentionState.falsePositives++;
    }

    logTrial({
        trialType: isTarget ? 'attention_hit' : 'attention_false_alarm',
        stimulus: isTarget ? 'target' : 'distractor',
        response: 'click',
        correct: isTarget,
        rt: reactionTime,
        posX: parseInt(target.style.left),
        posY: parseInt(target.style.top),
        targetsShownSoFar: attentionState.targetsShown,
        distractorsShownSoFar: attentionState.distractorsShown
    });

    target.remove();
    const idx = attentionState.active.indexOf(target);
    if (idx > -1) attentionState.active.splice(idx, 1);

    updateAttentionDisplay(attentionState);
}

/**
 * Update the attention stats display.
 */
export function updateAttentionDisplay(attentionState) {
    if (!attentionState || !attentionState.els) return;
    const total = attentionState.hits + attentionState.misses + attentionState.falsePositives;
    const accuracy = total > 0 ? Math.round((attentionState.hits / total) * 100) : 100;

    if (attentionState.els.hits) attentionState.els.hits.textContent = attentionState.hits;
    if (attentionState.els.misses) attentionState.els.misses.textContent = attentionState.misses;
    if (attentionState.els.accuracy) attentionState.els.accuracy.textContent = `${accuracy}%`;
}

/**
 * End the attention task and calculate a d-prime based score.
 */
export function endAttentionTask(ctx) {
    const { attentionState, completeTask } = ctx;

    if (attentionState.hits === 0 && attentionState.falsePositives === 0) {
        completeTask(0);
        return;
    }

    // Log-linear correction (Hautus 1995) avoids extreme z-scores from
    // perfect hit rates or zero false-alarm rates with small sample sizes.
    const hitRate = logLinearRate(attentionState.hits, attentionState.targetsShown);
    const falseAlarmRate = logLinearRate(attentionState.falsePositives, attentionState.distractorsShown);

    const dPrime = Math.min(4, Math.max(-4,
        zScore(hitRate) - zScore(falseAlarmRate)));

    // Recalibrated mapping: d'=0 (chance discrimination) → 25,
    // d'=1 (moderate) → 50, d'=2 (good) → 75, d'≥3 (excellent) → 100.
    // The old mapping (50 + d'*12.5) was too generous at chance level.
    const score = Math.round(Math.max(0, Math.min(100,
        25 + (dPrime * 25))));

    completeTask(score);
}
