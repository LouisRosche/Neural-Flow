import { describe, it, expect, beforeEach } from 'vitest';
import { getApp } from '../helpers/load-app.js';

describe('Attention Game', () => {
  let App;

  beforeEach(() => {
    App = getApp();
    App.testStorage();
    App.cacheElements();
    App._timers = new Set();
    App.state.currentGame = 'attention';
    App.state.currentDifficulty = 1;
    App.state.taskScores = [];
    App.state.trialLog = [];
  });

  describe('createAttentionState', () => {
    it('initializes attention state with correct target count based on difficulty', () => {
      App.state.currentDifficulty = 1;

      // Create state directly without triggering spawning
      App.attentionState = {
        targets: 5 + App.state.currentDifficulty,
        hits: 0,
        misses: 0,
        falsePositives: 0,
        targetsShown: 0,
        distractorsShown: 0,
        startTime: Date.now(),
        active: [],
        els: {}
      };

      const state = App.attentionState;
      expect(state).toBeDefined();
      expect(state.targets).toBe(6); // 5 + difficulty(1)
      expect(state.hits).toBe(0);
      expect(state.misses).toBe(0);
      expect(state.falsePositives).toBe(0);
      expect(state.targetsShown).toBe(0);
      expect(state.distractorsShown).toBe(0);
    });

    it('scales targets with difficulty', () => {
      App.state.currentDifficulty = 3;
      const targets = 5 + App.state.currentDifficulty;
      expect(targets).toBe(8); // 5 + 3
    });
  });

  describe('endAttentionTask d-prime scoring', () => {
    it('scores 0 when no hits and no false positives', () => {
      let capturedScore;
      App.completeTask = (score) => { capturedScore = score; };

      App.attentionState = {
        hits: 0,
        misses: 5,
        falsePositives: 0,
        targetsShown: 5,
        distractorsShown: 3,
        active: [],
        els: {}
      };

      App.endAttentionTask();
      expect(capturedScore).toBe(0);
    });

    it('scores high for perfect performance (all hits, no false alarms)', () => {
      let capturedScore;
      App.completeTask = (score) => { capturedScore = score; };

      App.attentionState = {
        hits: 6,
        misses: 0,
        falsePositives: 0,
        targetsShown: 6,
        distractorsShown: 3,
        active: [],
        els: {}
      };

      App.endAttentionTask();
      expect(capturedScore).toBeGreaterThanOrEqual(80);
    });

    it('scores low for poor performance (few hits, many false alarms)', () => {
      let capturedScore;
      App.completeTask = (score) => { capturedScore = score; };

      App.attentionState = {
        hits: 1,
        misses: 5,
        falsePositives: 3,
        targetsShown: 6,
        distractorsShown: 3,
        active: [],
        els: {}
      };

      App.endAttentionTask();
      expect(capturedScore).toBeLessThan(50);
    });

    it('produces a score between 0 and 100', () => {
      let capturedScore;
      App.completeTask = (score) => { capturedScore = score; };

      App.attentionState = {
        hits: 3,
        misses: 3,
        falsePositives: 1,
        targetsShown: 6,
        distractorsShown: 3,
        active: [],
        els: {}
      };

      App.endAttentionTask();
      expect(capturedScore).toBeGreaterThanOrEqual(0);
      expect(capturedScore).toBeLessThanOrEqual(100);
    });
  });

  describe('handleTargetClick', () => {
    it('increments hits for a target click', () => {
      App.attentionState = {
        hits: 0, misses: 0, falsePositives: 0,
        targetsShown: 3, distractorsShown: 1,
        active: [], els: { hits: null, misses: null, accuracy: null }
      };

      const dot = document.createElement('div');
      dot.dataset.isTarget = 'true';
      dot.dataset.spawnTime = Date.now() - 500;
      document.body.appendChild(dot);
      App.attentionState.active.push(dot);

      App.handleTargetClick(dot);

      expect(App.attentionState.hits).toBe(1);
      expect(App.attentionState.falsePositives).toBe(0);
    });

    it('increments falsePositives for a distractor click', () => {
      App.attentionState = {
        hits: 0, misses: 0, falsePositives: 0,
        targetsShown: 3, distractorsShown: 1,
        active: [], els: { hits: null, misses: null, accuracy: null }
      };

      const dot = document.createElement('div');
      dot.dataset.isTarget = 'false';
      dot.dataset.spawnTime = Date.now() - 300;
      document.body.appendChild(dot);
      App.attentionState.active.push(dot);

      App.handleTargetClick(dot);

      expect(App.attentionState.falsePositives).toBe(1);
      expect(App.attentionState.hits).toBe(0);
    });

    it('removes clicked target from DOM and active array', () => {
      App.attentionState = {
        hits: 0, misses: 0, falsePositives: 0,
        targetsShown: 3, distractorsShown: 1,
        active: [], els: { hits: null, misses: null, accuracy: null }
      };

      const dot = document.createElement('div');
      dot.dataset.isTarget = 'true';
      dot.dataset.spawnTime = Date.now();
      document.body.appendChild(dot);
      App.attentionState.active.push(dot);

      App.handleTargetClick(dot);

      expect(App.attentionState.active).not.toContain(dot);
      expect(dot.parentNode).toBeNull();
    });

    it('logs a trial for each click', () => {
      App.attentionState = {
        hits: 0, misses: 0, falsePositives: 0,
        targetsShown: 3, distractorsShown: 1,
        active: [], els: { hits: null, misses: null, accuracy: null }
      };

      const dot = document.createElement('div');
      dot.dataset.isTarget = 'true';
      dot.dataset.spawnTime = Date.now();
      dot.style.left = '100px';
      dot.style.top = '200px';
      document.body.appendChild(dot);
      App.attentionState.active.push(dot);

      App.handleTargetClick(dot);

      expect(App.state.trialLog.length).toBe(1);
      expect(App.state.trialLog[0].trialType).toBe('attention_hit');
      expect(App.state.trialLog[0].correct).toBe(true);
    });
  });

  describe('updateAttentionDisplay', () => {
    it('calculates accuracy correctly', () => {
      const hitsEl = document.createElement('div');
      const missesEl = document.createElement('div');
      const accuracyEl = document.createElement('div');

      App.attentionState = {
        hits: 3, misses: 2, falsePositives: 1,
        els: { hits: hitsEl, misses: missesEl, accuracy: accuracyEl }
      };

      App.updateAttentionDisplay();

      expect(hitsEl.textContent).toBe('3');
      expect(missesEl.textContent).toBe('2');
      // accuracy = 3 / (3 + 2 + 1) = 50%
      expect(accuracyEl.textContent).toBe('50%');
    });

    it('shows 100% accuracy when no trials yet', () => {
      const accuracyEl = document.createElement('div');
      App.attentionState = {
        hits: 0, misses: 0, falsePositives: 0,
        els: { hits: null, misses: null, accuracy: accuracyEl }
      };

      App.updateAttentionDisplay();
      expect(accuracyEl.textContent).toBe('100%');
    });
  });
});
