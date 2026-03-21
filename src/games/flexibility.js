// games/flexibility.js — Cognitive Flexibility game logic

import { FLEX_RT_NORM_MS } from '../config.js';
import { shuffle, getGradeContent } from '../scoring.js';
import { clearGameArea } from '../ui.js';

/**
 * Create the flexibility game state.
 * @param {number} currentTask
 * @param {number} currentDifficulty
 * @param {string|number} grade - Student's grade level
 * @returns {Object} flexState
 */
export function createFlexState(currentTask, currentDifficulty, grade) {
    const content = getGradeContent(grade);
    const scienceRules = content.rules;
    const rule = scienceRules[currentTask % scienceRules.length];
    const trials = 6 + currentDifficulty;

    // Pre-shuffle items to avoid repeats within a round
    const shuffledItems = shuffle(rule.items);
    const trialItems = [];
    for (let i = 0; i < trials; i++) {
        trialItems.push(shuffledItems[i % shuffledItems.length]);
    }

    return {
        rule,
        trials,
        trialItems,
        current: 0,
        correct: 0,
        reactionTimes: [],
        correctRTs: [],
        startTime: null
    };
}

/**
 * Run a single flexibility trial (render the UI).
 * @param {Object} ctx - Context: { flexState, gameArea, completeTask }
 */
export function runFlexTrial(ctx) {
    const { flexState, gameArea, completeTask } = ctx;
    if (!flexState) return; // Guard: timer callback after game exit

    if (flexState.current >= flexState.trials) {
        const accuracy = flexState.trials > 0 ? flexState.correct / flexState.trials : 0;
        // Use only correct-trial RTs to avoid contamination from incorrect
        // responses (which tend to be either very fast guesses or slow errors).
        const rts = flexState.correctRTs.length > 0 ? flexState.correctRTs : flexState.reactionTimes;
        const avgRT = rts.length > 0
            ? rts.reduce((a, b) => a + b, 0) / rts.length
            : FLEX_RT_NORM_MS;
        const rtScore = Math.max(0, 1 - (avgRT / FLEX_RT_NORM_MS));
        const score = Math.round((accuracy * 70) + (rtScore * 30));

        completeTask(score);
        return;
    }

    const item = flexState.trialItems[flexState.current];

    clearGameArea(gameArea);

    const title = document.createElement('h3');
    title.textContent = `Trial ${flexState.current + 1} of ${flexState.trials}`;

    const ruleLabel = document.createElement('h3');
    ruleLabel.style.color = 'var(--primary)';
    ruleLabel.textContent = flexState.rule.question;

    const stimulus = document.createElement('div');
    stimulus.className = 'stimulus';
    stimulus.style.fontSize = '2.5rem';
    stimulus.textContent = item.stimulus;

    const buttons = document.createElement('div');
    buttons.className = 'response-buttons';

    flexState.rule.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'btn response-btn';
        btn.textContent = option;
        btn.dataset.response = option.toLowerCase();
        btn.dataset.correct = (option.toLowerCase() === item.answer);
        buttons.appendChild(btn);
    });

    gameArea.appendChild(title);
    gameArea.appendChild(ruleLabel);
    gameArea.appendChild(stimulus);
    gameArea.appendChild(buttons);

    flexState.startTime = Date.now();
    flexState.current++;
}

/**
 * Handle a flexibility response button click.
 * @param {string} response - The user's response
 * @param {boolean} isCorrect - Whether the response was correct
 * @param {Object} ctx - Context: { flexState, gameTimeout, logTrial }
 */
export function handleFlexResponse(response, isCorrect, ctx) {
    const { flexState, gameTimeout, logTrial } = ctx;
    const rt = Date.now() - flexState.startTime;
    const trialItem = flexState.trialItems[flexState.current - 1];

    flexState.reactionTimes.push(rt);
    if (isCorrect) {
        flexState.correct++;
        flexState.correctRTs.push(rt);
    }

    logTrial({
        trialType: 'flexibility_classification',
        rule: flexState.rule.key,
        stimulus: trialItem ? trialItem.stimulus : null,
        correctAnswer: trialItem ? trialItem.answer : null,
        response: response,
        correct: isCorrect,
        rt: rt,
        trialNumber: flexState.current,
        totalTrials: flexState.trials
    });

    gameTimeout(() => runFlexTrial(ctx), 500);
}
