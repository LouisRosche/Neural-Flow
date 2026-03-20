import { describe, it, expect, beforeEach } from 'vitest';
import { getApp } from '../helpers/load-app.js';

describe('Adaptive Difficulty', () => {
  let App;

  beforeEach(() => {
    App = getApp();
  });

  describe('difficulty adjustment in startCurrentTask', () => {
    it('increases difficulty when last score >= ADAPTIVE_UP (80)', () => {
      App.state.currentDifficulty = 2;
      App.state.taskScores = [85];
      App.state.currentGame = 'memory';
      App.state.currentTask = 0;
      App._timers = new Set();

      // Stub DOM-dependent methods
      App.runMemoryTask = () => {};
      App.cacheElements();
      App.startCurrentTask();

      expect(App.state.currentDifficulty).toBe(3);
    });

    it('decreases difficulty when last score < ADAPTIVE_DOWN (50)', () => {
      App.state.currentDifficulty = 3;
      App.state.taskScores = [30];
      App.state.currentGame = 'memory';
      App.state.currentTask = 0;
      App._timers = new Set();

      App.runMemoryTask = () => {};
      App.cacheElements();
      App.startCurrentTask();

      expect(App.state.currentDifficulty).toBe(2);
    });

    it('keeps difficulty unchanged for scores between thresholds', () => {
      App.state.currentDifficulty = 3;
      App.state.taskScores = [65];
      App.state.currentGame = 'memory';
      App.state.currentTask = 0;
      App._timers = new Set();

      App.runMemoryTask = () => {};
      App.cacheElements();
      App.startCurrentTask();

      expect(App.state.currentDifficulty).toBe(3);
    });

    it('caps difficulty at MAX_DIFFICULTY (5)', () => {
      App.state.currentDifficulty = 5;
      App.state.taskScores = [95];
      App.state.currentGame = 'memory';
      App.state.currentTask = 0;
      App._timers = new Set();

      App.runMemoryTask = () => {};
      App.cacheElements();
      App.startCurrentTask();

      expect(App.state.currentDifficulty).toBe(5);
    });

    it('floors difficulty at 1', () => {
      App.state.currentDifficulty = 1;
      App.state.taskScores = [10];
      App.state.currentGame = 'memory';
      App.state.currentTask = 0;
      App._timers = new Set();

      App.runMemoryTask = () => {};
      App.cacheElements();
      App.startCurrentTask();

      expect(App.state.currentDifficulty).toBe(1);
    });

    it('does not adjust on first task (no previous scores)', () => {
      App.state.currentDifficulty = 1;
      App.state.taskScores = [];
      App.state.currentGame = 'memory';
      App.state.currentTask = 0;
      App._timers = new Set();

      App.runMemoryTask = () => {};
      App.cacheElements();
      App.startCurrentTask();

      expect(App.state.currentDifficulty).toBe(1);
    });
  });

  describe('boundary values at ADAPTIVE_UP = 80', () => {
    it('score of exactly 80 triggers increase', () => {
      App.state.currentDifficulty = 2;
      App.state.taskScores = [80];
      App.state.currentGame = 'memory';
      App.state.currentTask = 0;
      App._timers = new Set();
      App.runMemoryTask = () => {};
      App.cacheElements();
      App.startCurrentTask();
      expect(App.state.currentDifficulty).toBe(3);
    });

    it('score of 79 does not trigger increase', () => {
      App.state.currentDifficulty = 2;
      App.state.taskScores = [79];
      App.state.currentGame = 'memory';
      App.state.currentTask = 0;
      App._timers = new Set();
      App.runMemoryTask = () => {};
      App.cacheElements();
      App.startCurrentTask();
      expect(App.state.currentDifficulty).toBe(2);
    });
  });

  describe('boundary values at ADAPTIVE_DOWN = 50', () => {
    it('score of 50 does not trigger decrease', () => {
      App.state.currentDifficulty = 3;
      App.state.taskScores = [50];
      App.state.currentGame = 'memory';
      App.state.currentTask = 0;
      App._timers = new Set();
      App.runMemoryTask = () => {};
      App.cacheElements();
      App.startCurrentTask();
      expect(App.state.currentDifficulty).toBe(3);
    });

    it('score of 49 triggers decrease', () => {
      App.state.currentDifficulty = 3;
      App.state.taskScores = [49];
      App.state.currentGame = 'memory';
      App.state.currentTask = 0;
      App._timers = new Set();
      App.runMemoryTask = () => {};
      App.cacheElements();
      App.startCurrentTask();
      expect(App.state.currentDifficulty).toBe(2);
    });
  });
});
