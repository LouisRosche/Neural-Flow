// games/speed.js — Processing Speed game logic

import { SPEED_RT_NORM_MS } from '../config.js';
import { shuffle, getGradeContent } from '../scoring.js';
import { clearGameArea } from '../ui.js';

/**
 * Create the speed game state.
 * @param {number} currentDifficulty
 * @returns {Object} speedState
 */
export function createSpeedState(currentDifficulty) {
    const trials = 5 + currentDifficulty;
    return {
        trials,
        current: 0,
        reactionTimes: [],
        correct: 0
    };
}

/**
 * Run a single speed trial (render the UI).
 * @param {Object} ctx - Context: { speedState, gameArea, currentDifficulty, grade, completeTask }
 */
export function runSpeedTrial(ctx) {
    const { speedState, gameArea, currentDifficulty, grade, completeTask } = ctx;
    if (!speedState) return; // Guard: timer callback after game exit

    if (speedState.current >= speedState.trials) {
        const accuracy = speedState.trials > 0 ? speedState.correct / speedState.trials : 0;
        const avgRT = speedState.reactionTimes.length > 0
            ? speedState.reactionTimes.reduce((a, b) => a + b, 0) / speedState.reactionTimes.length
            : SPEED_RT_NORM_MS;
        const rtScore = Math.max(0, 1 - (avgRT / SPEED_RT_NORM_MS));
        const score = Math.round((accuracy * 50) + (rtScore * 50));

        completeTask(score);
        return;
    }

    const content = getGradeContent(grade);
    const patterns = content.formulas.slice(0, 4 + Math.floor(currentDifficulty / 2));
    const correct = patterns[Math.floor(Math.random() * patterns.length)];
    const options = shuffle(patterns);

    // Store patterns on state for trial logging
    speedState.patterns = patterns;

    clearGameArea(gameArea);

    const title = document.createElement('h3');
    title.textContent = 'Match the formula quickly!';

    const stimulus = document.createElement('div');
    stimulus.className = 'stimulus';
    stimulus.textContent = correct;

    const buttons = document.createElement('div');
    buttons.className = 'response-buttons';

    const startTime = Date.now();

    options.forEach(pattern => {
        const btn = document.createElement('button');
        btn.className = 'btn response-btn';
        btn.textContent = pattern;
        btn.dataset.response = pattern;
        btn.dataset.correct = (pattern === correct);
        btn.dataset.startTime = startTime;
        buttons.appendChild(btn);
    });

    gameArea.appendChild(title);
    gameArea.appendChild(stimulus);
    gameArea.appendChild(buttons);

    speedState.current++;
}

/**
 * Handle a speed response button click.
 * @param {string} response - The user's response
 * @param {boolean} isCorrect - Whether the response was correct
 * @param {number} startTime - When the options were shown
 * @param {HTMLElement} buttonEl - The clicked button element
 * @param {Object} ctx - Context: { speedState, gameTimeout, logTrial }
 */
export function handleSpeedResponse(response, isCorrect, startTime, buttonEl, ctx) {
    const { speedState, gameTimeout, logTrial } = ctx;
    const rt = Date.now() - startTime;

    speedState.reactionTimes.push(rt);
    if (isCorrect) speedState.correct++;

    // Trial-level logging
    logTrial({
        trialType: 'speed_match',
        stimulus: buttonEl.closest('.response-buttons')
            ? buttonEl.closest('.response-buttons').previousElementSibling.textContent
            : null,
        response: response,
        correct: isCorrect,
        rt: rt,
        trialNumber: speedState.current,
        totalTrials: speedState.trials,
        optionCount: speedState.patterns ? speedState.patterns.length : null
    });

    gameTimeout(() => runSpeedTrial(ctx), 300);
}
