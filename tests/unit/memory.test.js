import { describe, it, expect, beforeEach } from 'vitest';
import { getApp } from '../helpers/load-app.js';

describe('Memory Game', () => {
  let App;

  beforeEach(() => {
    App = getApp();
    App.testStorage();
    App.cacheElements();
    App._timers = new Set();
    App.state.currentGame = 'memory';
    App.state.currentDifficulty = 1;
    App.state.currentTask = 0;
    App.state.taskScores = [];
    App.state.trialLog = [];
  });

  describe('createMemoryState (via runMemoryTask)', () => {
    it('creates state with correct sequence length', () => {
      App.runMemoryTask(App.elements.gameArea);

      expect(App.memoryState).toBeDefined();
      // length = 3 + difficulty(1) + task(0) = 4
      expect(App.memoryState.length).toBe(4);
      expect(App.memoryState.sequence.length).toBe(4);
    });

    it('sequence grows with difficulty and task number', () => {
      App.state.currentDifficulty = 3;
      App.state.currentTask = 2;
      App.runMemoryTask(App.elements.gameArea);

      // length = 3 + 3 + 2 = 8
      expect(App.memoryState.length).toBe(8);
    });

    it('sequence contains only digits 0-9', () => {
      App.state.currentDifficulty = 5;
      App.state.currentTask = 2;
      App.runMemoryTask(App.elements.gameArea);

      App.memoryState.sequence.forEach(digit => {
        expect(digit).toBeGreaterThanOrEqual(0);
        expect(digit).toBeLessThanOrEqual(9);
      });
    });

    it('avoids consecutive duplicate digits', () => {
      // Run multiple times to increase chance of catching violations
      for (let run = 0; run < 20; run++) {
        App.state.currentDifficulty = 3;
        App.state.currentTask = 1;
        App.runMemoryTask(App.elements.gameArea);

        const seq = App.memoryState.sequence;
        for (let i = 1; i < seq.length; i++) {
          expect(seq[i]).not.toBe(seq[i - 1]);
        }
      }
    });
  });

  describe('handleMemoryInput', () => {
    it('records user input correctly', () => {
      App.runMemoryTask(App.elements.gameArea);

      // Skip to input phase
      App.memoryState.showIndex = App.memoryState.sequence.length;
      App.showMemoryInput();

      // Prevent next-task timeout
      App.gameTimeout = () => {};
      App.nextTask = () => {};

      App.handleMemoryInput(5);
      expect(App.memoryState.userInput).toEqual([5]);
    });

    it('logs a trial per digit input', () => {
      App.runMemoryTask(App.elements.gameArea);
      App.memoryState.showIndex = App.memoryState.sequence.length;
      App.showMemoryInput();
      App.gameTimeout = () => {};
      App.nextTask = () => {};

      App.handleMemoryInput(3);

      expect(App.state.trialLog.length).toBe(1);
      expect(App.state.trialLog[0].trialType).toBe('memory_digit');
      expect(App.state.trialLog[0].serialPosition).toBe(0);
      expect(App.state.trialLog[0].response).toBe(3);
    });

    it('pushes score to taskScores when sequence complete', () => {
      App.runMemoryTask(App.elements.gameArea);
      App.memoryState.showIndex = App.memoryState.sequence.length;
      App.showMemoryInput();
      App.gameTimeout = () => {};
      App.nextTask = () => {};

      // Enter all digits
      for (let i = 0; i < App.memoryState.length; i++) {
        App.handleMemoryInput(App.memoryState.sequence[i]);
      }

      expect(App.state.taskScores.length).toBe(1);
    });

    it('ignores input when userInput is already at length', () => {
      App.runMemoryTask(App.elements.gameArea);
      App.memoryState.showIndex = App.memoryState.sequence.length;
      App.showMemoryInput();
      App.gameTimeout = () => {};
      App.nextTask = () => {};

      // Fill up
      for (let i = 0; i < App.memoryState.length; i++) {
        App.handleMemoryInput(0);
      }
      const trialsLogged = App.state.trialLog.length;

      // Extra input should be ignored
      App.handleMemoryInput(5);
      expect(App.state.trialLog.length).toBe(trialsLogged);
    });

    it('scores 100 for perfect accuracy with fast time', () => {
      App.runMemoryTask(App.elements.gameArea);
      App.memoryState.showIndex = App.memoryState.sequence.length;
      App.memoryState.inputStartTime = Date.now();
      App.showMemoryInput();
      App.gameTimeout = () => {};
      App.nextTask = () => {};

      // Enter perfect sequence immediately
      for (let i = 0; i < App.memoryState.length; i++) {
        App.handleMemoryInput(App.memoryState.sequence[i]);
      }

      const score = App.state.taskScores[0];
      expect(score).toBeGreaterThanOrEqual(90); // perfect accuracy = 90 base + up to 10 time bonus
    });

    it('scores lower for incorrect digits', () => {
      App.runMemoryTask(App.elements.gameArea);
      App.memoryState.showIndex = App.memoryState.sequence.length;
      App.memoryState.inputStartTime = Date.now();
      App.showMemoryInput();
      App.gameTimeout = () => {};
      App.nextTask = () => {};

      // Enter all wrong digits (each digit +1 mod 10 to avoid matching)
      for (let i = 0; i < App.memoryState.length; i++) {
        const wrongDigit = (App.memoryState.sequence[i] + 1) % 10;
        App.handleMemoryInput(wrongDigit);
      }

      const score = App.state.taskScores[0];
      expect(score).toBeLessThan(45); // 0% accuracy, maybe small time bonus
    });
  });

  describe('clearMemoryInput', () => {
    it('resets user input to empty', () => {
      App.runMemoryTask(App.elements.gameArea);
      App.memoryState.showIndex = App.memoryState.sequence.length;
      App.showMemoryInput();
      App.gameTimeout = () => {};

      App.handleMemoryInput(1);
      App.handleMemoryInput(2);
      expect(App.memoryState.userInput.length).toBe(2);

      App.clearMemoryInput();
      expect(App.memoryState.userInput).toEqual([]);
    });
  });
});
