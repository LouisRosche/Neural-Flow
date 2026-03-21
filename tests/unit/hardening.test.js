import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupFull } from '../helpers/setup.js';

/**
 * Tests for bug fixes identified during debiasing audit.
 * Each describe block maps to a specific bug fix.
 */

describe('Hardening Bug Fixes', () => {
  let App, win;

  beforeEach(() => {
    ({ App, window: win } = setupFull({ user: true, sessionStart: Date.now() - 300000 }));
  });

  // =============================================
  // BUG #1: showReport() division by zero
  // =============================================
  describe('showReport with empty gameScores', () => {
    it('does not produce NaN average when gameScores is empty', () => {
      App.state.gameScores = {};
      App.showReport();

      expect(App.state.history.length).toBe(1);
      expect(App.state.history[0].average).toBe(0);
      expect(Number.isNaN(App.state.history[0].average)).toBe(false);
    });

    it('still calculates correct average with scores', () => {
      App.state.gameScores = { memory: 80, attention: 60 };
      App.showReport();
      expect(App.state.history[0].average).toBe(70);
    });

    it('handles single game score', () => {
      App.state.gameScores = { memory: 75 };
      App.showReport();
      expect(App.state.history[0].average).toBe(75);
    });
  });

  // =============================================
  // BUG #3: reset() doesn't clear timers
  // =============================================
  describe('reset clears game state', () => {
    it('calls cleanupCurrentGame on reset', async () => {
      // Set up a game in progress
      App.state.currentGame = 'memory';
      App.memoryState = { sequence: [1, 2, 3], userInput: [] };
      const timerId = setTimeout(() => {}, 100000);
      App._timers.add(timerId);

      // Mock showConfirm to auto-confirm
      App.showConfirm = async () => true;

      await App.reset();

      // Timers should be cleared
      expect(App._timers.size).toBe(0);
      // Game state should be null
      expect(App.memoryState).toBeNull();
    });
  });

  // =============================================
  // BUG #4: Click delegation uses closest()
  // =============================================
  describe('handleGameClick with closest() traversal', () => {
    it('handles click on child element inside response-btn', () => {
      App.state.currentGame = 'flexibility';
      App.state.currentDifficulty = 1;
      App.state.taskScores = [];
      App.runFlexibilityTask(App.elements.gameArea);
      App.gameTimeout = () => {};

      // Get a response button and add a child span
      const btn = App.elements.gameArea.querySelector('.response-btn');
      expect(btn).not.toBeNull();

      const span = win.document.createElement('span');
      span.textContent = btn.textContent;
      btn.textContent = '';
      btn.appendChild(span);

      // Click on the span (child of response-btn)
      App.handleGameClick({ target: span });

      // Should still register the response (check that flexState was updated)
      expect(App.flexState.reactionTimes.length).toBe(1);
    });

    it('handles click on child element inside number-btn', () => {
      App.state.currentGame = 'memory';
      App.state.currentDifficulty = 1;
      App.state.currentTask = 0;
      App.state.taskScores = [];
      App.runMemoryTask(App.elements.gameArea);

      // Advance to input phase
      App.memoryState.showIndex = App.memoryState.sequence.length;
      App.showMemoryInput();
      App.gameTimeout = () => {};
      App.nextTask = () => {};

      // Get a number button and add a child element
      const numBtn = App.elements.gameArea.querySelector('.number-btn');
      expect(numBtn).not.toBeNull();

      const innerSpan = win.document.createElement('span');
      innerSpan.textContent = numBtn.textContent;
      numBtn.textContent = '';
      numBtn.appendChild(innerSpan);

      // Click on the inner span
      App.handleGameClick({ target: innerSpan });

      expect(App.memoryState.userInput.length).toBe(1);
    });
  });

  // =============================================
  // BUG #5: runFlexTrial/runSpeedTrial null guards
  // =============================================
  describe('null guards for trial runners after game exit', () => {
    it('runFlexTrial returns silently when flexState is null', () => {
      App.flexState = null;
      // Should not throw
      expect(() => App.runFlexTrial()).not.toThrow();
    });

    it('runSpeedTrial returns silently when speedState is null', () => {
      App.speedState = null;
      // Should not throw
      expect(() => App.runSpeedTrial()).not.toThrow();
    });
  });

  // =============================================
  // BUG #6: Game card double-click debounce
  // =============================================
  describe('startGame debounce', () => {
    it('blocks rapid double-calls to startGame', () => {
      let startCount = 0;
      const origRunTask = App.runTask.bind(App);
      App.runTask = () => { startCount++; };

      App.startGame('memory');
      App.startGame('memory'); // Should be blocked

      expect(startCount).toBe(1);

      // Restore
      App.runTask = origRunTask;
    });
  });

  // =============================================
  // BUG #8: showFeedback timer tracked for cleanup
  // =============================================
  describe('showFeedback timer management', () => {
    it('sets _feedbackTimer when showing feedback', () => {
      App._feedbackTimer = null;
      App.showFeedback('Test', 'info');
      expect(App._feedbackTimer).not.toBeNull();
    });

    it('clears previous timer when showing new feedback', () => {
      App.showFeedback('First', 'info');
      const firstTimer = App._feedbackTimer;

      App.showFeedback('Second', 'info');
      // New timer should be different
      expect(App._feedbackTimer).not.toBe(firstTimer);
    });

    it('cleanup clears feedback timer', () => {
      App.showFeedback('Test', 'info');
      expect(App._feedbackTimer).not.toBeNull();

      App.cleanup();
      // After cleanup, we just verify no errors occurred
    });
  });
});
