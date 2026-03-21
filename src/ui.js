// ui.js — DOM helpers for Neural Flow

import { GAMES, GAME_INSTRUCTIONS } from './config.js';

/**
 * Cache all required DOM elements. Returns an elements object.
 */
export function cacheElements() {
    const elements = {
        screens: {
            login: document.getElementById('loginScreen'),
            menu: document.getElementById('menuScreen'),
            game: document.getElementById('gameScreen'),
            report: document.getElementById('reportScreen')
        },
        loginForm: document.getElementById('loginForm'),
        beginBtn: document.getElementById('beginBtn'),
        gamesGrid: document.getElementById('gamesGrid'),
        gameArea: document.getElementById('gameArea'),
        progressBar: document.getElementById('progressBar'),
        reportScores: document.getElementById('reportScores'),
        reportInfo: document.getElementById('reportInfo'),
        exitGameBtn: document.getElementById('exitGameBtn'),
        exportBtn: document.getElementById('exportBtn'),
        resetBtn: document.getElementById('resetBtn'),
        integrityCheck: document.getElementById('integrityCheck'),
        recommendations: document.getElementById('recommendations'),
        settingsBtn: document.getElementById('settingsBtn'),
        settingsModal: document.getElementById('settingsModal'),
        sheetsUrl: document.getElementById('sheetsUrl'),
        saveSettingsBtn: document.getElementById('saveSettingsBtn'),
        closeSettingsBtn: document.getElementById('closeSettingsBtn'),
        syncStatus: document.getElementById('syncStatus'),
        toggleScript: document.getElementById('toggleScript'),
        scriptCode: document.getElementById('scriptCode'),
        historyBtn: document.getElementById('historyBtn'),
        historySection: document.getElementById('historySection'),
        historyContainer: document.getElementById('historyContainer'),
        progressBarContainer: document.getElementById('progressBarContainer')
    };

    // Verify elements exist
    Object.entries(elements).forEach(([key, value]) => {
        if (value === null || value === undefined) {
            console.warn(`Element not found: ${key}`);
        }
    });

    return elements;
}

/**
 * Show a specific screen and hide all others. Manages focus.
 */
export function showScreen(elements, screenId) {
    Object.values(elements.screens).forEach(screen => {
        screen.classList.remove('active');
        screen.setAttribute('aria-hidden', 'true');
    });

    const screen = elements.screens[screenId];
    if (screen) {
        screen.classList.add('active');
        screen.removeAttribute('aria-hidden');
        requestAnimationFrame(() => {
            const focusTarget = screen.querySelector('h2, h3, button, input, [tabindex]');
            if (focusTarget) focusTarget.focus();
        });
    }
}

/**
 * Show a transient feedback toast message.
 */
// Track feedback dismiss timer for cleanup
let _feedbackTimer = null;

export function showFeedback(message, type = 'info') {
    const existing = document.querySelector('.feedback');
    if (existing) existing.remove();

    if (_feedbackTimer) {
        clearTimeout(_feedbackTimer);
        _feedbackTimer = null;
    }

    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.setAttribute('role', 'alert');
    feedback.setAttribute('aria-live', 'assertive');
    feedback.textContent = message;
    document.body.appendChild(feedback);

    _feedbackTimer = setTimeout(() => {
        feedback.style.animation = 'slideIn 0.3s ease reverse';
        _feedbackTimer = setTimeout(() => feedback.remove(), 300);
    }, 3000);
}

export function clearFeedbackTimer() {
    if (_feedbackTimer) {
        clearTimeout(_feedbackTimer);
        _feedbackTimer = null;
    }
}

/**
 * Promise-based confirmation modal (replaces browser confirm()).
 */
export function showConfirm(message, title = 'Confirm') {
    return new Promise(resolve => {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmTitle');
        const msgEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');

        titleEl.textContent = title;
        msgEl.textContent = message;
        modal.classList.add('active');
        okBtn.focus();

        const cleanup = (result) => {
            modal.classList.remove('active');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            resolve(result);
        };
        const onOk = () => cleanup(true);
        const onCancel = () => cleanup(false);

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
    });
}

/**
 * Clear the game area, preserving any .game-instructions panel.
 */
export function clearGameArea(gameArea) {
    if (!gameArea) return;
    const instructions = gameArea.querySelector('.game-instructions');
    while (gameArea.firstChild) {
        gameArea.removeChild(gameArea.firstChild);
    }
    if (instructions) {
        gameArea.appendChild(instructions);
    }
}

/**
 * Render the game selection grid.
 * @param {HTMLElement} grid - The games grid container
 * @param {Object} gameScores - Map of gameId -> score
 * @param {Function} onStartGame - Callback when a game card is clicked
 * @param {Function} onAllComplete - Callback when all games are done
 * @param {Function} gameTimeout - Managed timeout function
 */
export function renderGames(grid, gameScores, onStartGame, onAllComplete, gameTimeout) {
    // Clear existing content
    while (grid.firstChild) {
        grid.removeChild(grid.firstChild);
    }

    GAMES.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';

        if (gameScores[game.id] !== undefined) {
            card.classList.add('completed');
        }

        const icon = document.createElement('div');
        icon.className = 'game-icon';
        icon.textContent = game.icon;

        const title = document.createElement('div');
        title.className = 'game-title';
        title.textContent = game.name;

        const desc = document.createElement('div');
        desc.className = 'game-desc';
        desc.textContent = game.description;

        card.appendChild(icon);
        card.appendChild(title);
        card.appendChild(desc);

        if (gameScores[game.id] !== undefined) {
            const score = document.createElement('div');
            score.className = 'game-score';
            score.textContent = `Score: ${gameScores[game.id]}%`;
            card.appendChild(score);
            card.setAttribute('aria-label', `${game.name} \u2014 completed, score ${gameScores[game.id]}%`);
        } else {
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Start ${game.name}: ${game.description}`);
            card.addEventListener('click', () => onStartGame(game.id));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onStartGame(game.id);
                }
            });
        }

        grid.appendChild(card);
    });

    // Check if all games complete
    if (Object.keys(gameScores).length === GAMES.length) {
        gameTimeout(() => onAllComplete(), 500);
    }
}

/**
 * Build and return an instructions DOM element for a given game type.
 */
export function showGameInstructions(gameType) {
    const instructions = GAME_INSTRUCTIONS[gameType];
    if (!instructions) return null;

    const div = document.createElement('div');
    div.className = 'game-instructions';

    const h4play = document.createElement('h4');
    h4play.textContent = 'How to Play:';
    div.appendChild(h4play);

    const p = document.createElement('p');
    p.textContent = instructions.instruction;
    div.appendChild(p);

    const h4tips = document.createElement('h4');
    h4tips.textContent = 'Tips from Research:';
    div.appendChild(h4tips);

    const ul = document.createElement('ul');
    instructions.tips.forEach(tip => {
        const li = document.createElement('li');
        li.textContent = tip;
        ul.appendChild(li);
    });
    div.appendChild(ul);

    return div;
}
