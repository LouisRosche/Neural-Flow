// app.js — Main orchestrator for Neural Flow (ES module version)

import { CONFIG, GAMES } from './config.js';
import {
    createInitialState, testStorage,
    loadState, saveState
} from './state.js';
import { adaptDifficulty } from './scoring.js';
import {
    cacheElements, showScreen as _showScreen, showFeedback, showConfirm,
    clearGameArea, renderGames, showGameInstructions, clearFeedbackTimer
} from './ui.js';
import { exportData } from './export.js';
import {
    createMemoryState, showMemorySequence, showMemoryInput,
    handleMemoryInput, clearMemoryInput
} from './games/memory.js';
import {
    createAttentionState, buildAttentionUI, spawnTarget,
    handleTargetClick as _handleTargetClick
} from './games/attention.js';
import {
    createFlexState, runFlexTrial, handleFlexResponse
} from './games/flexibility.js';
import {
    createSpeedState, runSpeedTrial, handleSpeedResponse
} from './games/speed.js';

const App = {
    CONFIG,

    // Application state
    state: createInitialState(),

    // DOM element cache
    elements: {},

    // Event listeners registry for cleanup
    listeners: new Map(),

    // Timer registry for cleanup
    _timers: new Set(),

    // Per-game state holders
    memoryState: null,
    attentionState: null,
    flexState: null,
    speedState: null,

    // ========================
    // Initialization
    // ========================

    init() {
        try {
            this.state.storageAvailable = testStorage();
            this.elements = cacheElements();
            this.state.history = loadState(this.state.storageAvailable);
            this.bindEvents();
            this.render();
        } catch (error) {
            this.handleError('Initialization failed', error);
        }
    },

    // ========================
    // Screen management
    // ========================

    showScreen(screenId) {
        _showScreen(this.elements, screenId);
    },

    // ========================
    // Timer management
    // ========================

    gameTimeout(fn, delay) {
        const id = setTimeout(() => {
            this._timers.delete(id);
            fn();
        }, delay);
        this._timers.add(id);
        return id;
    },

    clearTimers() {
        this._timers.forEach(id => clearTimeout(id));
        this._timers.clear();
    },

    // ========================
    // Trial logging
    // ========================

    logTrial(data) {
        this.state.trialLog.push({
            timestamp: Date.now(),
            game: this.state.currentGame,
            task: this.state.currentTask,
            difficulty: this.state.currentDifficulty,
            grade: this.state.user ? this.state.user.grade : null,
            ...data
        });
    },

    // ========================
    // Event binding
    // ========================

    addEventListener(element, event, handler) {
        if (!element) return;
        element.addEventListener(event, handler);
        if (!this.listeners.has(element)) {
            this.listeners.set(element, []);
        }
        this.listeners.get(element).push({ event, handler });
    },

    bindEvents() {
        // Login
        this.addEventListener(this.elements.beginBtn, 'click', () => this.handleLogin());

        // Exit game
        this.addEventListener(this.elements.exitGameBtn, 'click', () => this.exitGame());

        // Export
        this.addEventListener(this.elements.exportBtn, 'click', () => exportData(this.state));

        // Reset
        this.addEventListener(this.elements.resetBtn, 'click', () => this.reset());

        // History
        this.addEventListener(this.elements.historyBtn, 'click', () => this.toggleHistory());

        // Enter key on login form
        this.addEventListener(document.getElementById('loginForm'), 'keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Game area delegation for all game interactions
        this.addEventListener(this.elements.gameArea, 'click', (e) => {
            this.handleGameClick(e);
        });

        // Prevent rapid clicks
        this.addEventListener(document, 'click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.dataset.clicked === 'true') {
                e.preventDefault();
                return false;
            }
            if (e.target.tagName === 'BUTTON') {
                e.target.dataset.clicked = 'true';
                setTimeout(() => delete e.target.dataset.clicked, CONFIG.DEBOUNCE_MS);
            }
        });

    },

    // ========================
    // Game click delegation
    // ========================

    handleGameClick(e) {
        // Use closest() so clicks on child elements still match
        const numberBtn = e.target.closest('.number-btn');
        const responseBtn = e.target.closest('.response-btn');
        const targetDot = e.target.closest('.target');
        const clearBtnEl = e.target.closest('#clearBtn');

        // Number pad buttons
        if (numberBtn) {
            const num = parseInt(numberBtn.dataset.num);
            if (!isNaN(num)) {
                handleMemoryInput(num, this._memoryCtx());
            }
        }

        // Response buttons
        if (responseBtn) {
            if (responseBtn.disabled) return;

            const response = responseBtn.dataset.response;
            const correct = responseBtn.dataset.correct;

            // Disable all response buttons after click
            const allButtons = document.querySelectorAll('.response-btn');
            allButtons.forEach(btn => btn.disabled = true);

            if (this.state.currentGame === 'flexibility') {
                handleFlexResponse(response, correct === 'true', this._flexCtx());
            } else if (this.state.currentGame === 'speed') {
                const startTime = parseInt(responseBtn.dataset.startTime);
                handleSpeedResponse(response, correct === 'true', startTime, responseBtn, this._speedCtx());
            }
            return;
        }

        // Targets in attention game
        if (targetDot) {
            _handleTargetClick(targetDot, this._attentionCtx());
        }

        // Clear button
        if (clearBtnEl) {
            clearMemoryInput(this._memoryCtx());
        }
    },

    // ========================
    // Context builders (pass module dependencies)
    // ========================

    _memoryCtx() {
        return {
            memoryState: this.memoryState,
            gameArea: this.elements.gameArea,
            gameTimeout: (fn, delay) => this.gameTimeout(fn, delay),
            logTrial: (data) => this.logTrial(data),
            nextTask: () => this.nextTask(),
            onTaskScored: (score) => this.state.taskScores.push(score)
        };
    },

    _attentionCtx() {
        return {
            attentionState: this.attentionState,
            currentDifficulty: this.state.currentDifficulty,
            currentGame: this.state.currentGame,
            gameTimeout: (fn, delay) => this.gameTimeout(fn, delay),
            logTrial: (data) => this.logTrial(data),
            completeTask: (score) => this.completeTask(score)
        };
    },

    _flexCtx() {
        return {
            flexState: this.flexState,
            gameArea: this.elements.gameArea,
            gameTimeout: (fn, delay) => this.gameTimeout(fn, delay),
            logTrial: (data) => this.logTrial(data),
            completeTask: (score) => this.completeTask(score)
        };
    },

    _speedCtx() {
        return {
            speedState: this.speedState,
            gameArea: this.elements.gameArea,
            currentDifficulty: this.state.currentDifficulty,
            grade: this.state.user ? this.state.user.grade : '6',
            gameTimeout: (fn, delay) => this.gameTimeout(fn, delay),
            logTrial: (data) => this.logTrial(data),
            completeTask: (score) => this.completeTask(score)
        };
    },

    // ========================
    // Login
    // ========================

    handleLogin() {
        const name = document.getElementById('name').value.trim();
        const age = parseInt(document.getElementById('age').value);
        const grade = document.getElementById('grade').value;
        const teacher = document.getElementById('teacher').value.trim();
        const period = document.getElementById('period').value;

        if (!name || name.length > 50) {
            showFeedback('Please enter a valid name', 'error');
            return;
        }
        if (!age || age < 6 || age > 18) {
            showFeedback('Please enter a valid age (6-18)', 'error');
            return;
        }
        if (!grade) {
            showFeedback('Please select your grade', 'error');
            return;
        }

        this.state.user = { name, age, grade: grade === 'K' ? 'K' : parseInt(grade), teacher, period };
        this.state.sessionStart = Date.now();

        this.showScreen('menu');
        this._renderGames();
        showFeedback(`Welcome, ${name}!`, 'success');
    },

    // ========================
    // Game menu
    // ========================

    _renderGames() {
        renderGames(
            this.elements.gamesGrid,
            this.state.gameScores,
            (gameId) => this.startGame(gameId),
            () => this.showReport(),
            (fn, delay) => this.gameTimeout(fn, delay)
        );
    },

    // ========================
    // Game lifecycle
    // ========================

    startGame(gameId) {
        // Debounce: prevent double-click on game cards
        if (this._startingGame) return;
        this._startingGame = true;
        setTimeout(() => { this._startingGame = false; }, CONFIG.DEBOUNCE_MS);

        try {
            this.state.currentGame = gameId;
            this.state.currentTask = 0;
            this.state.currentDifficulty = 1;
            this.state.taskScores = [];
            this.state.gameStart = Date.now();

            this.showScreen('game');
            this.runTask();
        } catch (error) {
            this.handleError('Could not start game', error);
            this.showScreen('menu');
        }
    },

    runTask() {
        if (this.state.currentTask >= CONFIG.MAX_TASKS) {
            this.endGame();
            return;
        }

        // Update progress
        const progress = Math.round((this.state.currentTask / CONFIG.MAX_TASKS) * 100);
        this.elements.progressBar.style.width = `${progress}%`;
        if (this.elements.progressBarContainer) {
            this.elements.progressBarContainer.setAttribute('aria-valuenow', progress);
        }

        // Clear game area
        clearGameArea(this.elements.gameArea);
        const area = this.elements.gameArea;

        // Show difficulty level indicator
        const difficultyBar = document.createElement('div');
        difficultyBar.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:0.5rem;margin-bottom:1rem;';
        const diffLabel = document.createElement('span');
        diffLabel.style.cssText = 'font-size:0.85rem;color:var(--text-muted);font-weight:500;';
        diffLabel.textContent = 'Difficulty:';
        difficultyBar.appendChild(diffLabel);
        for (let i = 1; i <= CONFIG.MAX_DIFFICULTY; i++) {
            const pip = document.createElement('div');
            pip.style.cssText = `width:12px;height:12px;border-radius:50%;background:${i <= this.state.currentDifficulty ? 'var(--primary)' : 'var(--border)'};transition:all 0.3s;`;
            difficultyBar.appendChild(pip);
        }
        area.appendChild(difficultyBar);

        // Instructions
        const instructions = showGameInstructions(this.state.currentGame);
        if (instructions) {
            area.appendChild(instructions);
        }

        // Ready button
        const readyContainer = document.createElement('div');
        readyContainer.style.cssText = 'text-align:center;margin-top:2rem;';

        const readyBtn = document.createElement('button');
        readyBtn.className = 'btn btn-success';
        readyBtn.textContent = `Start Round ${this.state.currentTask + 1} of ${CONFIG.MAX_TASKS}`;
        readyBtn.onclick = () => {
            readyContainer.remove();
            this.startCurrentTask();
        };

        readyContainer.appendChild(readyBtn);
        area.appendChild(readyContainer);
    },

    startCurrentTask() {
        // Adaptive difficulty adjustment
        if (this.state.taskScores.length > 0) {
            const lastScore = this.state.taskScores[this.state.taskScores.length - 1];
            this.state.currentDifficulty = adaptDifficulty(this.state.currentDifficulty, lastScore);
        }

        const area = this.elements.gameArea;

        switch (this.state.currentGame) {
            case 'memory':
                this.runMemoryTask(area);
                break;
            case 'attention':
                this.runAttentionTask(area);
                break;
            case 'flexibility':
                this.runFlexibilityTask(area);
                break;
            case 'speed':
                this.runSpeedTask(area);
                break;
            default:
                throw new Error('Unknown game type');
        }
    },

    completeTask(score) {
        this.state.taskScores.push(score);
        showFeedback(`Score: ${score}%`, score >= 70 ? 'success' : 'warning');
        this.gameTimeout(() => this.nextTask(), CONFIG.FEEDBACK_DISPLAY_MS);
    },

    nextTask() {
        this.state.currentTask++;
        this.gameTimeout(() => this.runTask(), 100);
    },

    endGame() {
        this.cleanupCurrentGame();

        const scores = this.state.taskScores;
        const average = scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;

        this.state.gameScores[this.state.currentGame] = average;

        this.showScreen('menu');
        this._renderGames();
        showFeedback(`Game complete! Score: ${average}%`, 'success');
    },

    // ========================
    // Individual game runners
    // ========================

    runMemoryTask(area) {
        this.memoryState = createMemoryState(this.state.currentDifficulty, this.state.currentTask);
        showMemorySequence(this._memoryCtx());
    },

    runAttentionTask(area) {
        this.attentionState = createAttentionState(this.state.currentDifficulty);
        buildAttentionUI(area, this.attentionState);
        spawnTarget(this._attentionCtx());
    },

    runFlexibilityTask(area) {
        const grade = this.state.user ? this.state.user.grade : '6';
        this.flexState = createFlexState(this.state.currentTask, this.state.currentDifficulty, grade);
        runFlexTrial(this._flexCtx());
    },

    runSpeedTask(area) {
        this.speedState = createSpeedState(this.state.currentDifficulty);
        runSpeedTrial(this._speedCtx());
    },

    // ========================
    // Cleanup
    // ========================

    cleanupCurrentGame() {
        this.clearTimers();
        this.memoryState = null;
        this.attentionState = null;
        this.flexState = null;
        this.speedState = null;
        if (this.elements.gameArea) {
            clearGameArea(this.elements.gameArea);
        }
    },

    async exitGame() {
        if (this.state.currentTask === 0 || await showConfirm('Exit game? Progress will be lost.', 'Exit Game')) {
            this.cleanupCurrentGame();
            this.state.gameStart = null;
            this.state.currentGame = null;
            this.state.currentTask = 0;
            this.state.taskScores = [];
            this.showScreen('menu');
        }
    },

    // ========================
    // Report
    // ========================

    showReport() {
        const scores = this.state.gameScores;
        const keys = Object.keys(scores);
        const total = Object.values(scores).reduce((a, b) => a + b, 0);
        const average = keys.length > 0 ? Math.round(total / keys.length) : 0;

        // Save to history
        const sessionData = {
            date: new Date().toISOString(),
            user: this.state.user,
            scores: { ...scores },
            average,
            duration: Date.now() - this.state.sessionStart
        };

        this.state.history.push(sessionData);
        saveState(this.state.history, this.state.storageAvailable);

        // Render report info
        const u = this.state.user;
        const infoParts = [u.name, `Age ${u.age}`, `Grade ${u.grade}`];
        if (u.teacher) infoParts.push(u.teacher);
        if (u.period) infoParts.push(`Period ${u.period}`);
        infoParts.push(new Date().toLocaleDateString());
        this.elements.reportInfo.textContent = infoParts.join(' | ');

        // Clear and rebuild scores display
        const scoresContainer = this.elements.reportScores;
        while (scoresContainer.firstChild) {
            scoresContainer.removeChild(scoresContainer.firstChild);
        }

        GAMES.forEach(game => {
            const card = document.createElement('div');
            card.className = 'score-card';

            const icon = document.createElement('div');
            icon.textContent = game.icon;
            icon.style.fontSize = '2rem';

            const value = document.createElement('div');
            value.className = 'score-value';
            value.textContent = `${scores[game.id] || 0}%`;

            const label = document.createElement('div');
            label.className = 'score-label';
            label.textContent = game.name;

            card.appendChild(icon);
            card.appendChild(value);
            card.appendChild(label);
            scoresContainer.appendChild(card);
        });

        this.buildRecommendations(scores, average);
        this.showScreen('report');
    },

    // ========================
    // Recommendations
    // ========================

    buildRecommendations(scores, average) {
        const container = this.elements.recommendations;
        while (container.firstChild) container.removeChild(container.firstChild);

        const getTier = (score) => {
            if (score >= 80) return { key: 'strong', label: 'Strong', css: 'strong' };
            if (score >= 60) return { key: 'developing', label: 'Developing', css: 'developing' };
            return { key: 'needsFocus', label: 'Needs Focus', css: 'needs-focus' };
        };

        const overallTier = getTier(average);

        // Profile summary
        const profile = document.createElement('div');
        profile.className = 'rec-profile';
        const profileScore = document.createElement('div');
        profileScore.className = 'rec-profile-score';
        profileScore.textContent = `${average}%`;
        const profileText = document.createElement('div');
        const profileLabel = document.createElement('div');
        profileLabel.className = 'rec-profile-label';
        profileLabel.textContent = 'Executive Function Profile';
        const profileSub = document.createElement('div');
        profileSub.className = 'rec-profile-sublabel';
        const tierCounts = { strong: 0, developing: 0, needsFocus: 0 };
        GAMES.forEach(g => {
            const s = scores[g.id] || 0;
            tierCounts[getTier(s).key]++;
        });
        const parts = [];
        if (tierCounts.strong > 0) parts.push(`${tierCounts.strong} strong`);
        if (tierCounts.developing > 0) parts.push(`${tierCounts.developing} developing`);
        if (tierCounts.needsFocus > 0) parts.push(`${tierCounts.needsFocus} needs focus`);
        profileSub.textContent = parts.join(', ') + ' \u2014 see how each connects to science learning below';
        profileText.appendChild(profileLabel);
        profileText.appendChild(profileSub);
        profile.appendChild(profileScore);
        profile.appendChild(profileText);
        container.appendChild(profile);

        // Per-game recommendation cards
        const cards = document.createElement('div');
        cards.className = 'rec-cards';

        GAMES.forEach(game => {
            const score = scores[game.id] || 0;
            const tier = getTier(score);
            const rec = CONFIG.RECOMMENDATIONS[game.id];
            if (!rec) return;

            const card = document.createElement('div');
            card.className = 'rec-card';

            const header = document.createElement('div');
            header.className = 'rec-card-header';
            const title = document.createElement('div');
            title.className = 'rec-card-title';
            const iconSpan = document.createElement('span');
            iconSpan.textContent = game.icon;
            title.appendChild(iconSpan);
            title.appendChild(document.createTextNode(game.name));
            const badge = document.createElement('span');
            badge.className = `rec-tier ${tier.css}`;
            badge.textContent = tier.label;
            header.appendChild(title);
            header.appendChild(badge);
            card.appendChild(header);

            const conn = document.createElement('div');
            conn.className = 'rec-connection';
            conn.textContent = rec.scienceConnection;
            card.appendChild(conn);

            const feedback = document.createElement('div');
            feedback.className = 'rec-feedback';
            feedback.textContent = rec.tiers[tier.key];
            card.appendChild(feedback);

            const tipCount = tier.key === 'strong' ? 1 : 2;
            const tipList = document.createElement('ul');
            tipList.className = 'rec-tips';
            rec.tips.slice(0, tipCount).forEach(tip => {
                const li = document.createElement('li');
                li.textContent = tip;
                tipList.appendChild(li);
            });
            card.appendChild(tipList);

            cards.appendChild(card);
        });

        container.appendChild(cards);

        // Synthesis
        const focusAreas = GAMES
            .filter(g => (scores[g.id] || 0) < 60)
            .map(g => g.name.toLowerCase());
        const strengths = GAMES
            .filter(g => (scores[g.id] || 0) >= 80)
            .map(g => g.name.toLowerCase());

        const synthesis = document.createElement('div');
        synthesis.className = 'rec-synthesis';
        const synthTitle = document.createElement('h4');
        synthTitle.textContent = 'Science Study Strategy';
        synthesis.appendChild(synthTitle);

        const synthText = document.createElement('p');
        if (overallTier.key === 'strong') {
            synthText.textContent = 'Your executive function skills are well-developed across the board. ' +
                'Research links these cognitive skills to success in challenging science work \u2014 ' +
                'designing experiments, analyzing datasets, and building arguments from evidence. ' +
                'Keep training to maintain these skills.';
        } else if (focusAreas.length > 0 && strengths.length > 0) {
            synthText.textContent = `Your strengths in ${strengths.join(' and ')} give you a good starting point. ` +
                `Building ${focusAreas.join(' and ')} is often linked to stronger science learning \u2014 ` +
                'try the tips above during your next science class and notice what changes.';
        } else if (focusAreas.length > 0) {
            synthText.textContent = `The areas to focus on are ${focusAreas.join(' and ')}. ` +
                'Research links these skills to science learning, and they tend to improve with practice. ' +
                'Try the tips above during your next science class \u2014 small changes add up.';
        } else {
            synthText.textContent = 'Your executive function skills are developing well. ' +
                'Keep practicing, and try the study tips above during your next science class \u2014 ' +
                'many students find these cognitive skills connect to their science work.';
        }
        synthesis.appendChild(synthText);
        container.appendChild(synthesis);

        container.style.display = 'block';
    },

    // ========================
    // History
    // ========================

    toggleHistory() {
        const section = this.elements.historySection;
        const container = this.elements.historyContainer;
        const isVisible = section.style.display !== 'none';

        if (isVisible) {
            section.style.display = 'none';
            this.elements.historyBtn.textContent = 'View History';
            return;
        }

        while (container.firstChild) container.removeChild(container.firstChild);

        const history = this.state.history;
        if (history.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'history-empty';
            empty.textContent = 'No previous sessions recorded.';
            container.appendChild(empty);
        } else {
            const table = document.createElement('table');
            table.className = 'history-table';

            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['Date', 'Student', 'Memory', 'Attention', 'Flexibility', 'Speed', 'Average'].forEach(h => {
                const th = document.createElement('th');
                th.textContent = h;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            history.slice().reverse().forEach(entry => {
                const tr = document.createElement('tr');
                const date = new Date(entry.date).toLocaleDateString();
                const name = entry.user ? entry.user.name : '\u2014';
                const sc = entry.scores || {};
                [date, name,
                    sc.memory != null ? sc.memory + '%' : '\u2014',
                    sc.attention != null ? sc.attention + '%' : '\u2014',
                    sc.flexibility != null ? sc.flexibility + '%' : '\u2014',
                    sc.speed != null ? sc.speed + '%' : '\u2014',
                    entry.average != null ? entry.average + '%' : '\u2014'
                ].forEach(val => {
                    const td = document.createElement('td');
                    td.textContent = val;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            container.appendChild(table);
        }

        section.style.display = 'block';
        this.elements.historyBtn.textContent = 'Hide History';
    },

    // ========================
    // Reset
    // ========================

    async reset() {
        if (await showConfirm('Start a new session? Current progress will be saved.', 'New Session')) {
            this.cleanupCurrentGame();
            this.state = {
                user: null,
                currentGame: null,
                currentTask: 0,
                currentDifficulty: 1,
                taskScores: [],
                gameScores: {},
                sessionStart: null,
                gameStart: null,
                history: this.state.history,
                storageAvailable: this.state.storageAvailable,
                trialLog: []
            };

            this.showScreen('login');
            document.getElementById('name').value = '';
            document.getElementById('age').value = '';
            document.getElementById('grade').value = '';
            document.getElementById('teacher').value = '';
            document.getElementById('period').value = '';
        }
    },

    // ========================
    // Error handling
    // ========================

    handleError(context, error) {
        console.error(`${context}:`, error);
        if (showFeedback) {
            showFeedback('Something went wrong. Please try again.', 'error');
        }
    },

    // ========================
    // Cleanup
    // ========================

    cleanup() {
        clearFeedbackTimer();
        this.clearTimers();
        this.listeners.forEach((handlers, element) => {
            handlers.forEach(({ event, handler }) => {
                element.removeEventListener(event, handler);
            });
        });
        this.listeners.clear();
    },

    // ========================
    // Initial render
    // ========================

    render() {
        this.showScreen('login');
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showFeedback('An error occurred. Please refresh the page.', 'error');
});

// Cleanup on page teardown (pagehide is more reliable than unload)
window.addEventListener('pagehide', () => {
    if (App.cleanup) App.cleanup();
});
window.addEventListener('unload', () => {
    if (App.cleanup) App.cleanup();
});

export default App;
