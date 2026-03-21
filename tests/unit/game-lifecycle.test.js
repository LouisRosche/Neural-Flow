import { describe, it, expect, beforeEach } from 'vitest';
import { setupFull } from '../helpers/setup.js';

describe('Game Lifecycle', () => {
  let App;

  beforeEach(() => {
    ({ App } = setupFull({ user: { teacher: '', period: '' } }));
  });

  describe('startGame', () => {
    it('initializes game state correctly', () => {
      App.showScreen = () => {};
      App.runTask = () => {};

      App.startGame('memory');

      expect(App.state.currentGame).toBe('memory');
      expect(App.state.currentTask).toBe(0);
      expect(App.state.currentDifficulty).toBe(1);
      expect(App.state.taskScores).toEqual([]);
      expect(App.state.gameStart).toBeGreaterThan(0);
    });
  });

  describe('endGame', () => {
    it('calculates average score and stores it', () => {
      App.state.currentGame = 'memory';
      App.state.taskScores = [80, 90, 70];
      App.state.gameStart = Date.now() - 5000;

      App.showScreen = () => {};
      App.renderGames = () => {};

      App.endGame();

      expect(App.state.gameScores.memory).toBe(80); // round((80+90+70)/3) = 80
    });

    it('handles empty taskScores gracefully', () => {
      App.state.currentGame = 'attention';
      App.state.taskScores = [];
      App.state.gameStart = Date.now();

      App.showScreen = () => {};
      App.renderGames = () => {};

      App.endGame();

      expect(App.state.gameScores.attention).toBe(0);
    });

    it('clears timers on endGame', () => {
      App.state.currentGame = 'memory';
      App.state.taskScores = [80];
      App.state.gameStart = Date.now();

      App.showScreen = () => {};
      App.renderGames = () => {};

      // Add a timer
      const id = App.gameTimeout(() => {}, 999999);
      expect(App._timers.size).toBe(1);

      App.endGame();

      expect(App._timers.size).toBe(0);
    });
  });

  describe('completeTask + nextTask flow', () => {
    it('advances to next task after completeTask', () => {
      App.state.currentGame = 'memory';
      App.state.currentTask = 0;
      App.state.taskScores = [];

      let timeoutFn = null;
      App.gameTimeout = (fn) => { timeoutFn = fn; };

      App.completeTask(75);

      expect(App.state.taskScores).toEqual([75]);
      expect(timeoutFn).not.toBeNull();
    });

    it('nextTask increments currentTask', () => {
      App.state.currentTask = 1;
      App.gameTimeout = (fn) => fn(); // execute immediately
      App.runTask = () => {};

      App.nextTask();

      expect(App.state.currentTask).toBe(2);
    });
  });

  describe('runTask', () => {
    it('calls endGame when currentTask >= MAX_TASKS', () => {
      App.state.currentTask = App.CONFIG.MAX_TASKS;
      App.state.currentGame = 'memory';
      App.state.taskScores = [80, 90, 70];
      App.state.gameStart = Date.now();


      let endGameCalled = false;
      App.endGame = () => { endGameCalled = true; };

      App.runTask();

      expect(endGameCalled).toBe(true);
    });

    it('shows ready button when currentTask < MAX_TASKS', () => {
      App.state.currentTask = 0;
      App.state.currentGame = 'memory';
      App.state.currentDifficulty = 1;

      App.runTask();

      const readyBtn = App.elements.gameArea.querySelector('.btn-success');
      expect(readyBtn).not.toBeNull();
      expect(readyBtn.textContent).toContain('Start Round 1');
    });
  });

  describe('timer management', () => {
    it('gameTimeout registers timer in _timers set', () => {
      const id = App.gameTimeout(() => {}, 10000);
      expect(App._timers.has(id)).toBe(true);
    });

    it('clearTimers removes all pending timers', () => {
      App.gameTimeout(() => {}, 10000);
      App.gameTimeout(() => {}, 20000);
      expect(App._timers.size).toBe(2);

      App.clearTimers();
      expect(App._timers.size).toBe(0);
    });

    it('timer removes itself from set when it fires', async () => {
      const id = App.gameTimeout(() => {}, 10);
      expect(App._timers.has(id)).toBe(true);

      await new Promise(r => setTimeout(r, 50));
      expect(App._timers.has(id)).toBe(false);
    });
  });

  describe('logTrial', () => {
    it('logs trial data with game metadata', () => {
      App.state.currentGame = 'flexibility';
      App.state.currentTask = 2;
      App.state.currentDifficulty = 3;
      App.state.user = { name: 'Test', age: 12, grade: 6 };

      App.logTrial({ correct: true, rt: 500 });

      expect(App.state.trialLog).toHaveLength(1);
      const trial = App.state.trialLog[0];
      expect(trial.game).toBe('flexibility');
      expect(trial.task).toBe(2);
      expect(trial.difficulty).toBe(3);
      expect(trial.grade).toBe(6);
      expect(trial.correct).toBe(true);
      expect(trial.rt).toBe(500);
      expect(trial.timestamp).toBeDefined();
    });
  });
});
