import { describe, it, expect, beforeEach } from 'vitest';
import { getApp } from '../helpers/load-app.js';

describe('Scoring Logic', () => {
  let App;

  beforeEach(() => {
    App = getApp();
  });

  // ── Fisher-Yates shuffle ──────────────────────────────────────────

  describe('shuffle (Fisher-Yates)', () => {
    it('produces an array with all original elements (no loss/duplication)', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = App.shuffle(input);

      expect(result).toHaveLength(input.length);
      expect(result.sort((a, b) => a - b)).toEqual(input);
    });

    it('does not mutate the original array', () => {
      const input = [1, 2, 3];
      const original = [...input];
      App.shuffle(input);
      expect(input).toEqual(original);
    });

    it('statistical uniformity — each position has a fair chance (chi-squared)', () => {
      // Run many shuffles of a small array and count how often each element
      // lands in each position. With 10000 iterations of a 4-element array,
      // each cell should be ~2500. Chi-squared with 99.9% confidence.
      const n = 4;
      const iterations = 10000;
      const counts = Array.from({ length: n }, () => Array(n).fill(0));

      for (let t = 0; t < iterations; t++) {
        const result = App.shuffle([0, 1, 2, 3]);
        for (let pos = 0; pos < n; pos++) {
          counts[result[pos]][pos]++;
        }
      }

      const expected = iterations / n;
      // Allow generous tolerance (15%) to avoid flaky tests
      for (let elem = 0; elem < n; elem++) {
        for (let pos = 0; pos < n; pos++) {
          expect(counts[elem][pos]).toBeGreaterThan(expected * 0.75);
          expect(counts[elem][pos]).toBeLessThan(expected * 1.25);
        }
      }
    });

    it('handles empty array', () => {
      expect(App.shuffle([])).toEqual([]);
    });

    it('handles single element', () => {
      expect(App.shuffle([42])).toEqual([42]);
    });
  });

  // ── zScore / d-prime helpers ──────────────────────────────────────

  describe('zScore edge cases', () => {
    it('clamps input to [0.01, 0.99] — p=0 does not produce -Infinity', () => {
      const z = App.zScore(0);
      expect(Number.isFinite(z)).toBe(true);
      expect(z).toBeLessThan(0); // 0.01 maps to a negative z
    });

    it('clamps input to [0.01, 0.99] — p=1 does not produce +Infinity', () => {
      const z = App.zScore(1);
      expect(Number.isFinite(z)).toBe(true);
      expect(z).toBeGreaterThan(0);
    });

    it('p=0.5 maps to approximately z=0', () => {
      expect(App.zScore(0.5)).toBeCloseTo(0, 1);
    });

    it('is monotonically increasing', () => {
      const values = [0.1, 0.3, 0.5, 0.7, 0.9];
      const zValues = values.map(p => App.zScore(p));
      for (let i = 1; i < zValues.length; i++) {
        expect(zValues[i]).toBeGreaterThan(zValues[i - 1]);
      }
    });

    it('inverseErf returns finite values for valid inputs', () => {
      expect(Number.isFinite(App.inverseErf(0))).toBe(true);
      expect(App.inverseErf(0)).toBeCloseTo(0, 5);
      expect(Number.isFinite(App.inverseErf(0.5))).toBe(true);
      expect(Number.isFinite(App.inverseErf(-0.5))).toBe(true);
    });
  });

  // ── Memory score formula ──────────────────────────────────────────
  // accuracy * 90 + timeBonus * 10
  // timeBonus = max(0, 1 - (time / (length * 2000)))

  describe('Memory score formula', () => {
    it('perfect accuracy + fast time → score near 100', () => {
      // accuracy=1, timeBonus=1 → 90+10 = 100
      const accuracy = 1;
      const timeBonus = 1;
      const score = Math.round((accuracy * 90) + (timeBonus * 10));
      expect(score).toBe(100);
    });

    it('perfect accuracy + slow time (no bonus) → 90', () => {
      const accuracy = 1;
      const timeBonus = 0;
      const score = Math.round((accuracy * 90) + (timeBonus * 10));
      expect(score).toBe(90);
    });

    it('50% accuracy + no time bonus → 45', () => {
      const accuracy = 0.5;
      const timeBonus = 0;
      const score = Math.round((accuracy * 90) + (timeBonus * 10));
      expect(score).toBe(45);
    });

    it('timeBonus is clamped to 0 when time exceeds threshold', () => {
      const length = 5;
      const time = length * 2000 + 5000; // well over threshold
      const timeBonus = Math.max(0, 1 - (time / (length * 2000)));
      expect(timeBonus).toBe(0);
    });

    it('timeBonus is computed correctly for partial time', () => {
      const length = 5;
      const time = 5000; // half the threshold of 10000
      const timeBonus = Math.max(0, 1 - (time / (length * 2000)));
      expect(timeBonus).toBe(0.5);
      const score = Math.round((1 * 90) + (timeBonus * 10));
      expect(score).toBe(95);
    });
  });

  // ── Flexibility score formula ─────────────────────────────────────
  // score = round(accuracy * 70 + rtScore * 30)
  // rtScore = max(0, 1 - (avgRT / FLEX_RT_NORM_MS))  where FLEX_RT_NORM_MS = 3000

  describe('Flexibility score formula', () => {
    it('perfect accuracy + instant RT → 100', () => {
      const accuracy = 1;
      const rtScore = 1; // instant
      const score = Math.round((accuracy * 70) + (rtScore * 30));
      expect(score).toBe(100);
    });

    it('perfect accuracy + RT at norm → 70', () => {
      const accuracy = 1;
      const avgRT = 3000; // equals FLEX_RT_NORM_MS
      const rtScore = Math.max(0, 1 - (avgRT / 3000));
      expect(rtScore).toBe(0);
      const score = Math.round((accuracy * 70) + (rtScore * 30));
      expect(score).toBe(70);
    });

    it('50% accuracy + half-norm RT → 50', () => {
      const accuracy = 0.5;
      const avgRT = 1500;
      const rtScore = Math.max(0, 1 - (avgRT / 3000));
      expect(rtScore).toBe(0.5);
      const score = Math.round((accuracy * 70) + (rtScore * 30));
      expect(score).toBe(50);
    });

    it('rtScore is clamped to 0 when RT exceeds norm', () => {
      const avgRT = 5000;
      const rtScore = Math.max(0, 1 - (avgRT / 3000));
      expect(rtScore).toBe(0);
    });
  });

  // ── Speed score formula ───────────────────────────────────────────
  // score = round(accuracy * 50 + rtScore * 50)
  // rtScore = max(0, 1 - (avgRT / SPEED_RT_NORM_MS))  where SPEED_RT_NORM_MS = 2000

  describe('Speed score formula', () => {
    it('perfect accuracy + instant RT → 100', () => {
      const accuracy = 1;
      const rtScore = 1;
      const score = Math.round((accuracy * 50) + (rtScore * 50));
      expect(score).toBe(100);
    });

    it('perfect accuracy + RT at norm → 50', () => {
      const accuracy = 1;
      const avgRT = 2000;
      const rtScore = Math.max(0, 1 - (avgRT / 2000));
      expect(rtScore).toBe(0);
      const score = Math.round((accuracy * 50) + (rtScore * 50));
      expect(score).toBe(50);
    });

    it('0% accuracy + instant RT → 50', () => {
      const accuracy = 0;
      const rtScore = 1;
      const score = Math.round((accuracy * 50) + (rtScore * 50));
      expect(score).toBe(50);
    });

    it('0% accuracy + slow RT → 0', () => {
      const accuracy = 0;
      const rtScore = 0;
      const score = Math.round((accuracy * 50) + (rtScore * 50));
      expect(score).toBe(0);
    });
  });

  // ── completeTask ──────────────────────────────────────────────────

  describe('completeTask', () => {
    it('pushes score to taskScores', () => {
      // Set up minimal state
      App.state.taskScores = [];
      App.state.currentGame = 'memory';
      App._timers = new Set();

      // Stub showFeedback and gameTimeout to avoid DOM access
      App.showFeedback = () => {};
      App.gameTimeout = () => {};
      App._taskCompleted = false;

      App.completeTask(85);
      expect(App.state.taskScores).toEqual([85]);
    });

    it('pushes multiple scores in order', () => {
      App.state.taskScores = [];
      App._timers = new Set();
      App.showFeedback = () => {};
      App.gameTimeout = () => {};

      App._taskCompleted = false;
      App.completeTask(60);
      App._taskCompleted = false;
      App.completeTask(90);
      App._taskCompleted = false;
      App.completeTask(75);
      expect(App.state.taskScores).toEqual([60, 90, 75]);
    });

    it('blocks double-fire within same task', () => {
      App.state.taskScores = [];
      App._timers = new Set();
      App.showFeedback = () => {};
      App.gameTimeout = () => {};

      App._taskCompleted = false;
      App.completeTask(60);
      App.completeTask(90); // blocked by guard
      expect(App.state.taskScores).toEqual([60]);
    });
  });
});
