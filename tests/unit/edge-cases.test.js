import { describe, it, expect, beforeEach } from 'vitest';
import { loadApp } from '../helpers/load-app.js';
import { adaptDifficulty, zScore, inverseErf, getGradeContent } from '../../src/scoring.js';
import { GRADE_CONTENT } from '../../src/config.js';

/**
 * Comprehensive edge-case and predictive tests.
 * Covers scoring boundaries, type coercion, malformed state,
 * and other scenarios identified by audit.
 */

// ============================================================
// SCORING FUNCTIONS
// ============================================================

describe('zScore edge cases', () => {
  it('clamps p=0 to 0.01', () => {
    const result = zScore(0);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeLessThan(0);
  });

  it('clamps p=1 to 0.99', () => {
    const result = zScore(1);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeGreaterThan(0);
  });

  it('clamps negative p', () => {
    const result = zScore(-0.5);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeCloseTo(zScore(0), 5);
  });

  it('clamps p > 1', () => {
    const result = zScore(1.5);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeCloseTo(zScore(1), 5);
  });

  it('returns finite for p=0.5 (median)', () => {
    expect(zScore(0.5)).toBeCloseTo(0, 1);
  });

  it('is monotonically increasing from 0.01 to 0.99', () => {
    let prev = zScore(0.01);
    for (let p = 0.1; p <= 0.99; p += 0.1) {
      const current = zScore(p);
      expect(current).toBeGreaterThan(prev);
      prev = current;
    }
  });
});

describe('inverseErf edge cases', () => {
  it('returns 0 for input 0', () => {
    expect(inverseErf(0)).toBeCloseTo(0, 10);
  });

  it('returns finite for x near 1', () => {
    const result = inverseErf(0.99);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeGreaterThan(0);
  });

  it('returns finite for x near -1', () => {
    const result = inverseErf(-0.99);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeLessThan(0);
  });

  it('is antisymmetric: inverseErf(-x) = -inverseErf(x)', () => {
    for (const x of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      expect(inverseErf(-x)).toBeCloseTo(-inverseErf(x), 10);
    }
  });
});

describe('adaptDifficulty edge cases', () => {
  it('handles NaN score (stays unchanged)', () => {
    // NaN >= 80 is false, NaN < 50 is false → returns unchanged
    expect(adaptDifficulty(3, NaN)).toBe(3);
  });

  it('handles negative score (decreases)', () => {
    expect(adaptDifficulty(3, -10)).toBe(2);
  });

  it('handles score > 100 (increases)', () => {
    expect(adaptDifficulty(3, 150)).toBe(4);
  });

  it('handles score of exactly 0', () => {
    expect(adaptDifficulty(3, 0)).toBe(2);
  });

  it('handles score of exactly 100', () => {
    expect(adaptDifficulty(3, 100)).toBe(4);
  });

  it('never goes below 1 even with terrible scores', () => {
    let diff = 5;
    for (let i = 0; i < 20; i++) {
      diff = adaptDifficulty(diff, 0);
    }
    expect(diff).toBe(1);
  });

  it('never exceeds MAX_DIFFICULTY even with perfect scores', () => {
    let diff = 1;
    for (let i = 0; i < 20; i++) {
      diff = adaptDifficulty(diff, 100);
    }
    expect(diff).toBe(5);
  });
});

describe('getGradeContent edge cases', () => {
  it('returns valid content for all standard grades', () => {
    const grades = ['K', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    for (const g of grades) {
      const content = getGradeContent(g);
      expect(content).toBeDefined();
      expect(content.rules).toBeDefined();
      expect(content.rules.length).toBeGreaterThan(0);
    }
  });

  it('falls back to grade 6 for unknown grade', () => {
    const content = getGradeContent('X');
    const grade6 = getGradeContent(6);
    expect(content.rules).toEqual(grade6.rules);
  });

  it('falls back to grade 6 for null', () => {
    const content = getGradeContent(null);
    const grade6 = getGradeContent(6);
    expect(content.rules).toEqual(grade6.rules);
  });

  it('falls back to grade 6 for undefined', () => {
    const content = getGradeContent(undefined);
    const grade6 = getGradeContent(6);
    expect(content.rules).toEqual(grade6.rules);
  });

  it('handles inheritance chain correctly (K → direct content)', () => {
    const content = getGradeContent('K');
    expect(content.rules).toBeDefined();
    // K has its own rules, not inherited
  });

  it('handles inheritance: grade 1 inherits from K', () => {
    const content1 = getGradeContent(1);
    const contentK = getGradeContent('K');
    expect(content1.rules).toEqual(contentK.rules);
  });
});

// ============================================================
// INLINE SCRIPT INTEGRATION TESTS
// ============================================================

describe('Inline script edge cases', () => {
  let App, win;

  beforeEach(() => {
    const result = loadApp();
    App = result.App;
    win = result.window;
    App.testStorage();
    App.cacheElements();
    App._timers = new Set();
    App.state.user = { name: 'Test', age: 12, grade: 6, teacher: '', period: '' };
    App.state.sessionStart = Date.now();
    App.state.trialLog = [];
    App.state.history = [];
    App.state.gameScores = {};
    App.state.taskScores = [];
  });

  // ============================================================
  // D-PRIME SCORING EDGE CASES
  // ============================================================

  describe('endAttentionTask d-prime edge cases', () => {
    it('scores 0 when no targets or distractors interacted', () => {
      App.attentionState = {
        hits: 0, falsePositives: 0, misses: 0,
        targetsShown: 5, distractorsShown: 2, active: [], els: {}
      };
      let scored = null;
      App.completeTask = (s) => { scored = s; };
      App.endAttentionTask();
      expect(scored).toBe(0);
    });

    it('scores high with perfect hit rate and zero false alarms', () => {
      App.attentionState = {
        hits: 5, falsePositives: 0, misses: 0,
        targetsShown: 5, distractorsShown: 2, active: [], els: {}
      };
      let scored = null;
      App.completeTask = (s) => { scored = s; };
      App.endAttentionTask();
      expect(scored).toBeGreaterThanOrEqual(80);
      expect(scored).toBeLessThanOrEqual(100);
    });

    it('scores around 50 with equal hit and false alarm rates', () => {
      App.attentionState = {
        hits: 3, falsePositives: 3, misses: 2,
        targetsShown: 5, distractorsShown: 5, active: [], els: {}
      };
      let scored = null;
      App.completeTask = (s) => { scored = s; };
      App.endAttentionTask();
      // 60% hit rate, 60% FA rate → d' ≈ 0 → score ≈ 50
      expect(scored).toBeGreaterThanOrEqual(40);
      expect(scored).toBeLessThanOrEqual(60);
    });

    it('handles zero distractorsShown without crashing', () => {
      App.attentionState = {
        hits: 3, falsePositives: 0, misses: 2,
        targetsShown: 5, distractorsShown: 0, active: [], els: {}
      };
      let scored = null;
      App.completeTask = (s) => { scored = s; };
      App.endAttentionTask();
      expect(Number.isFinite(scored)).toBe(true);
    });

    it('handles zero targetsShown without crashing', () => {
      App.attentionState = {
        hits: 0, falsePositives: 2, misses: 0,
        targetsShown: 0, distractorsShown: 3, active: [], els: {}
      };
      let scored = null;
      App.completeTask = (s) => { scored = s; };
      App.endAttentionTask();
      // hits=0 and fp>0 skips early return; hitRate=0, faRate>0 → low score
      expect(Number.isFinite(scored)).toBe(true);
    });
  });

  // ============================================================
  // FLEX/SPEED SCORING WITH EMPTY REACTION TIMES
  // ============================================================

  describe('runFlexTrial with empty reactionTimes', () => {
    it('produces a finite score when reactionTimes is empty', () => {
      App.state.currentGame = 'flexibility';
      App.flexState = {
        rule: { key: 'test', question: 'Q?', options: ['A', 'B'], items: [] },
        trials: 3,
        trialItems: [],
        current: 3, // At boundary → triggers scoring
        correct: 0,
        reactionTimes: [], // Empty!
        startTime: Date.now()
      };
      let scored = null;
      App.completeTask = (s) => { scored = s; };
      App.runFlexTrial();
      expect(scored).not.toBeNull();
      expect(Number.isNaN(scored)).toBe(false);
      expect(Number.isFinite(scored)).toBe(true);
    });

    it('produces a finite score when all trials responded', () => {
      App.state.currentGame = 'flexibility';
      App.flexState = {
        rule: { key: 'test', question: 'Q?', options: ['A', 'B'], items: [] },
        trials: 3,
        trialItems: [],
        current: 3,
        correct: 2,
        reactionTimes: [500, 600, 400],
        startTime: Date.now()
      };
      let scored = null;
      App.completeTask = (s) => { scored = s; };
      App.runFlexTrial();
      expect(scored).toBeGreaterThan(0);
      expect(scored).toBeLessThanOrEqual(100);
    });
  });

  describe('runSpeedTrial with empty reactionTimes', () => {
    it('produces a finite score when reactionTimes is empty', () => {
      App.state.currentGame = 'speed';
      App.speedState = {
        trials: 3,
        current: 3,
        correct: 0,
        reactionTimes: [] // Empty!
      };
      let scored = null;
      App.completeTask = (s) => { scored = s; };
      App.runSpeedTrial();
      expect(scored).not.toBeNull();
      expect(Number.isNaN(scored)).toBe(false);
      expect(Number.isFinite(scored)).toBe(true);
    });
  });

  // ============================================================
  // ENDGAME EDGE CASES
  // ============================================================

  describe('endGame edge cases', () => {
    it('handles single taskScore correctly', () => {
      App.state.currentGame = 'memory';
      App.state.taskScores = [75];
      App.endGame();
      expect(App.state.gameScores.memory).toBe(75);
    });

    it('handles all-zero taskScores', () => {
      App.state.currentGame = 'memory';
      App.state.taskScores = [0, 0, 0];
      App.endGame();
      expect(App.state.gameScores.memory).toBe(0);
    });

    it('produces 0 for empty taskScores', () => {
      App.state.currentGame = 'memory';
      App.state.taskScores = [];
      App.endGame();
      expect(App.state.gameScores.memory).toBe(0);
    });
  });

  // ============================================================
  // LOGIN EDGE CASES
  // ============================================================

  describe('handleLogin edge cases', () => {
    function setLoginFields(doc, fields) {
      if (fields.name !== undefined) doc.getElementById('name').value = fields.name;
      if (fields.age !== undefined) doc.getElementById('age').value = fields.age;
      if (fields.grade !== undefined) doc.getElementById('grade').value = fields.grade;
      if (fields.teacher !== undefined) doc.getElementById('teacher').value = fields.teacher;
      if (fields.period !== undefined) doc.getElementById('period').value = fields.period;
    }

    // Reset user to null before each login test
    beforeEach(() => {
      App.state.user = null;
    });

    it('rejects name at exactly 51 characters', () => {
      const doc = win.document;
      setLoginFields(doc, { name: 'A'.repeat(51), age: '12', grade: '6' });
      App.handleLogin();
      expect(App.state.user).toBeNull();
    });

    it('accepts name at exactly 50 characters', () => {
      const doc = win.document;
      setLoginFields(doc, { name: 'A'.repeat(50), age: '12', grade: '6' });
      App.handleLogin();
      expect(App.state.user).not.toBeNull();
      expect(App.state.user.name).toBe('A'.repeat(50));
    });

    it('rejects age 5 (below minimum)', () => {
      const doc = win.document;
      setLoginFields(doc, { name: 'Alice', age: '5', grade: '6' });
      App.handleLogin();
      expect(App.state.user).toBeNull();
    });

    it('accepts age 6 (minimum)', () => {
      const doc = win.document;
      setLoginFields(doc, { name: 'Alice', age: '6', grade: '6' });
      App.handleLogin();
      expect(App.state.user).not.toBeNull();
    });

    it('accepts age 18 (maximum)', () => {
      const doc = win.document;
      setLoginFields(doc, { name: 'Alice', age: '18', grade: '6' });
      App.handleLogin();
      expect(App.state.user).not.toBeNull();
    });

    it('rejects age 19 (above maximum)', () => {
      const doc = win.document;
      setLoginFields(doc, { name: 'Alice', age: '19', grade: '6' });
      App.handleLogin();
      expect(App.state.user).toBeNull();
    });

    it('handles Unicode names correctly', () => {
      const doc = win.document;
      setLoginFields(doc, { name: 'José María', age: '12', grade: '6' });
      App.handleLogin();
      expect(App.state.user.name).toBe('José María');
    });

    it('renders special characters as text, not HTML', () => {
      const doc = win.document;
      setLoginFields(doc, { name: '<script>alert(1)</script>', age: '12', grade: '6' });
      App.handleLogin();
      // Should be stored as literal text
      expect(App.state.user.name).toBe('<script>alert(1)</script>');
    });

    it('allows empty teacher and period fields', () => {
      const doc = win.document;
      setLoginFields(doc, { name: 'Alice', age: '12', grade: '6', teacher: '', period: '' });
      App.handleLogin();
      expect(App.state.user).not.toBeNull();
      expect(App.state.user.teacher).toBe('');
    });
  });

  // ============================================================
  // SHOWSCREEN EDGE CASES
  // ============================================================

  describe('showScreen edge cases', () => {
    it('does not throw for invalid screen name', () => {
      expect(() => App.showScreen('nonexistent')).not.toThrow();
    });

    it('shows login screen correctly', () => {
      App.showScreen('login');
      const loginScreen = win.document.getElementById('loginScreen');
      expect(loginScreen.classList.contains('active')).toBe(true);
    });

    it('hides previous screen when switching', () => {
      App.showScreen('login');
      App.showScreen('menu');
      const loginScreen = win.document.getElementById('loginScreen');
      const menuScreen = win.document.getElementById('menuScreen');
      expect(loginScreen.classList.contains('active')).toBe(false);
      expect(menuScreen.classList.contains('active')).toBe(true);
    });
  });

  // ============================================================
  // REPORT WITH EDGE SCORES
  // ============================================================

  describe('showReport with edge scores', () => {
    it('handles all-zero scores', () => {
      App.state.gameScores = { memory: 0, attention: 0, flexibility: 0, speed: 0 };
      App.showReport();
      expect(App.state.history[0].average).toBe(0);
    });

    it('handles all-100 scores', () => {
      App.state.gameScores = { memory: 100, attention: 100, flexibility: 100, speed: 100 };
      App.showReport();
      expect(App.state.history[0].average).toBe(100);
    });

    it('handles single game score', () => {
      App.state.gameScores = { memory: 73 };
      App.showReport();
      expect(App.state.history[0].average).toBe(73);
    });
  });

  // ============================================================
  // HISTORY EDGE CASES
  // ============================================================

  describe('toggleHistory edge cases', () => {
    it('handles history entries with null user', () => {
      App.state.history = [
        { date: new Date().toISOString(), user: null, scores: { memory: 80 }, average: 80 }
      ];
      App.state.gameScores = { memory: 70 };
      App.showReport();
      expect(() => App.toggleHistory()).not.toThrow();
    });

    it('handles history entries with missing scores', () => {
      App.state.history = [
        { date: new Date().toISOString(), user: { name: 'Bob' }, scores: {}, average: 0 }
      ];
      App.state.gameScores = { memory: 70 };
      App.showReport();
      expect(() => App.toggleHistory()).not.toThrow();
    });
  });

  // ============================================================
  // CLEANUP IDEMPOTENCY
  // ============================================================

  describe('cleanup idempotency', () => {
    it('cleanup can be called multiple times without error', () => {
      expect(() => {
        App.cleanup();
        App.cleanup();
        App.cleanup();
      }).not.toThrow();
    });

    it('clearTimers can be called on empty set', () => {
      App._timers.clear();
      expect(() => App.clearTimers()).not.toThrow();
    });

    it('cleanupCurrentGame with no active game', () => {
      App.memoryState = null;
      App.attentionState = null;
      App.flexState = null;
      App.speedState = null;
      expect(() => App.cleanupCurrentGame()).not.toThrow();
    });
  });

  // ============================================================
  // MEMORY GAME EDGE CASES
  // ============================================================

  describe('memory game edge cases', () => {
    it('handleMemoryInput with null memoryState does not crash', () => {
      App.memoryState = null;
      expect(() => App.handleMemoryInput(5)).not.toThrow();
    });

    it('sequence generation always avoids consecutive duplicates', () => {
      for (let run = 0; run < 50; run++) {
        App.state.currentDifficulty = Math.floor(Math.random() * 5) + 1;
        App.state.currentTask = Math.floor(Math.random() * 3);
        App.runMemoryTask(App.elements.gameArea);

        const seq = App.memoryState.sequence;
        for (let i = 1; i < seq.length; i++) {
          expect(seq[i]).not.toBe(seq[i - 1]);
        }
      }
    });

    it('all sequence digits are 0-9', () => {
      App.state.currentDifficulty = 5;
      App.state.currentTask = 2;
      App.runMemoryTask(App.elements.gameArea);

      App.memoryState.sequence.forEach(digit => {
        expect(digit).toBeGreaterThanOrEqual(0);
        expect(digit).toBeLessThanOrEqual(9);
      });
    });
  });

  // ============================================================
  // FLEXIBILITY GAME GRADE CONTENT
  // ============================================================

  describe('flexibility grade content edge cases', () => {
    it('uses correct content for grade K', () => {
      App.state.user.grade = 'K';
      App.state.currentGame = 'flexibility';
      App.state.currentDifficulty = 1;
      App.runFlexibilityTask(App.elements.gameArea);

      const earlyKeys = ['living/nonliving', 'solid/liquid', 'hot/cold'];
      expect(earlyKeys).toContain(App.flexState.rule.key);
    });

    it('uses correct content for grade 12', () => {
      App.state.user.grade = 12;
      App.state.currentGame = 'flexibility';
      App.state.currentDifficulty = 1;
      App.runFlexibilityTask(App.elements.gameArea);

      // Grade 12 inherits from 9
      const highKeys = ['ionic/covalent', 'acid/base', 'exothermic/endothermic', 'element/compound', 'metal/nonmetal'];
      expect(highKeys).toContain(App.flexState.rule.key);
    });
  });

  // ============================================================
  // EXPORT EDGE CASES
  // ============================================================

  describe('export edge cases', () => {
    it('exportData does not throw with empty trialLog', () => {
      App.state.trialLog = [];
      App.state.gameScores = { memory: 80 };
      expect(() => App.exportData()).not.toThrow();
    });

    it('exportData does not throw with missing gameScores', () => {
      App.state.gameScores = {};
      App.state.trialLog = [];
      expect(() => App.exportData()).not.toThrow();
    });
  });
});
