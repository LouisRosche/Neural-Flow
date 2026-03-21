// games/memory.js — Working Memory game logic

import { MEMORY_DISPLAY_MS, FEEDBACK_DISPLAY_MS } from '../config.js';
import { clearGameArea } from '../ui.js';

/**
 * Create the initial memory game state for a task.
 * @param {number} currentDifficulty
 * @param {number} currentTask
 * @returns {Object} memoryState
 */
export function createMemoryState(currentDifficulty, currentTask) {
    const baseLength = 3;
    const length = baseLength + currentDifficulty + currentTask;
    const sequence = [];

    // Generate sequence (avoid consecutive duplicates)
    for (let i = 0; i < length; i++) {
        let digit;
        do {
            digit = Math.floor(Math.random() * 10);
        } while (i > 0 && digit === sequence[i - 1]);
        sequence.push(digit);
    }

    return {
        sequence,
        userInput: [],
        length,
        showIndex: 0,
        startTime: Date.now(),
        inputStartTime: null,
        lastInputTime: null
    };
}

/**
 * Show the memory sequence animation (one digit at a time).
 * @param {Object} ctx - Context: { memoryState, gameArea, gameTimeout, showMemoryInput }
 */
export function showMemorySequence(ctx) {
    const { memoryState, gameArea, gameTimeout } = ctx;

    clearGameArea(gameArea);

    if (memoryState.showIndex < memoryState.sequence.length) {
        // Show current number with position indicator
        const title = document.createElement('h3');
        title.textContent = 'Remember the sequence';

        const positionIndicator = document.createElement('div');
        positionIndicator.style.cssText = 'display:flex;justify-content:center;gap:8px;margin:20px 0;';

        for (let i = 0; i < memoryState.sequence.length; i++) {
            const dot = document.createElement('div');
            dot.style.cssText = `
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: ${i === memoryState.showIndex ? 'var(--primary)' : 'var(--border)'};
                transition: all 0.3s;
                transform: ${i === memoryState.showIndex ? 'scale(1.5)' : 'scale(1)'};
            `;
            positionIndicator.appendChild(dot);
        }

        const stimulus = document.createElement('div');
        stimulus.className = 'stimulus';
        stimulus.textContent = memoryState.sequence[memoryState.showIndex];

        const counter = document.createElement('div');
        counter.style.cssText = 'text-align:center;color:var(--text-muted);margin-top:20px;';
        counter.textContent = `Position ${memoryState.showIndex + 1} of ${memoryState.sequence.length}`;

        gameArea.appendChild(title);
        gameArea.appendChild(positionIndicator);
        gameArea.appendChild(stimulus);
        gameArea.appendChild(counter);

        memoryState.showIndex++;
        gameTimeout(() => showMemorySequence(ctx), MEMORY_DISPLAY_MS);
    } else {
        // Show input interface
        showMemoryInput(ctx);
    }
}

/**
 * Render the memory input interface (number pad + slots).
 */
export function showMemoryInput(ctx) {
    const { memoryState, gameArea } = ctx;

    if (!memoryState.inputStartTime) {
        memoryState.inputStartTime = Date.now();
    }

    clearGameArea(gameArea);

    const title = document.createElement('h3');
    title.textContent = 'Enter the sequence';
    gameArea.appendChild(title);

    // Input display
    const display = document.createElement('div');
    display.className = 'input-display';

    for (let i = 0; i < memoryState.length; i++) {
        const slot = document.createElement('div');
        slot.className = 'input-slot';
        slot.id = `slot-${i}`;
        if (i < memoryState.userInput.length) {
            slot.textContent = memoryState.userInput[i];
            slot.classList.add('filled');
        }
        display.appendChild(slot);
    }
    gameArea.appendChild(display);

    // Number pad
    const pad = document.createElement('div');
    pad.className = 'number-pad';

    for (let i = 0; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = 'number-btn';
        btn.dataset.num = i;
        btn.textContent = i;
        btn.setAttribute('aria-label', `Digit ${i}`);
        pad.appendChild(btn);
    }
    gameArea.appendChild(pad);

    // Clear button
    const clearBtn = document.createElement('button');
    clearBtn.id = 'clearBtn';
    clearBtn.className = 'btn btn-secondary';
    clearBtn.textContent = 'Clear';
    clearBtn.style.marginTop = '1rem';
    gameArea.appendChild(clearBtn);
}

/**
 * Handle a single digit input in the memory game.
 * @param {number} num - The digit pressed
 * @param {Object} ctx - Context: { memoryState, gameArea, gameTimeout, logTrial, nextTask }
 * @returns {boolean} Whether the sequence is now complete
 */
export function handleMemoryInput(num, ctx) {
    const { memoryState, gameArea, gameTimeout, logTrial, onTaskScored } = ctx;

    if (!memoryState || memoryState.userInput.length >= memoryState.length) return false;

    const position = memoryState.userInput.length;
    const digitRT = Date.now() - (memoryState.lastInputTime || memoryState.inputStartTime || memoryState.startTime);
    memoryState.userInput.push(num);

    const isCorrect = num === memoryState.sequence[position];

    // Trial-level logging
    logTrial({
        trialType: 'memory_digit',
        serialPosition: position,
        sequenceLength: memoryState.length,
        stimulus: memoryState.sequence[position],
        response: num,
        correct: isCorrect,
        rt: digitRT,
        interResponseInterval: memoryState.lastInputTime ? Date.now() - memoryState.lastInputTime : null
    });
    memoryState.lastInputTime = Date.now();

    // Update display with color + symbol feedback
    const slot = document.getElementById(`slot-${position}`);
    if (slot) {
        slot.textContent = num + (isCorrect ? ' \u2713' : ' \u2717');
        slot.classList.add('filled');
        slot.style.background = isCorrect ? 'var(--success)' : 'var(--error)';
        slot.style.borderColor = isCorrect ? 'var(--success)' : 'var(--error)';
        slot.style.color = 'white';
        slot.setAttribute('aria-label', `Digit ${num}, ${isCorrect ? 'correct' : 'incorrect'}`);
    }

    // Check if complete
    if (memoryState.userInput.length >= memoryState.length) {
        let correct = 0;
        for (let i = 0; i < memoryState.length; i++) {
            if (memoryState.userInput[i] === memoryState.sequence[i]) correct++;
        }

        const accuracy = correct / memoryState.length;
        const time = Date.now() - (memoryState.inputStartTime || memoryState.startTime);
        const timeBonus = Math.max(0, 1 - (time / (memoryState.length * 2000)));
        const score = Math.round((accuracy * 90) + (timeBonus * 10));

        onTaskScored(score);

        // Delay before showing feedback so user can see last input
        gameTimeout(() => {
            clearGameArea(gameArea);

            const scoreDisplay = document.createElement('div');
            scoreDisplay.className = 'stimulus';
            scoreDisplay.textContent = `${score}%`;
            scoreDisplay.style.color = score >= 70 ? 'var(--success)' : 'var(--warning)';

            const message = document.createElement('h3');
            message.textContent = score >= 70 ? 'Well done!' : 'Keep practicing!';
            message.style.textAlign = 'center';

            gameArea.appendChild(scoreDisplay);
            gameArea.appendChild(message);

            gameTimeout(() => ctx.nextTask(), FEEDBACK_DISPLAY_MS);
        }, MEMORY_DISPLAY_MS);

        return true;
    } else {
        showMemoryInput(ctx);
        return false;
    }
}

/**
 * Clear user input and re-render the input interface.
 */
export function clearMemoryInput(ctx) {
    ctx.memoryState.userInput = [];
    showMemoryInput(ctx);
}
