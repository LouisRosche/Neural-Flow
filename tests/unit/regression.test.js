import { describe, it, expect, beforeEach } from 'vitest';
import { setupFull } from '../helpers/setup.js';
import { adaptDifficulty, zScore, inverseErf, shuffle, getGradeContent } from '../../src/scoring.js';
import { CONFIG, GAMES, GRADE_CONTENT, RECOMMENDATIONS } from '../../src/config.js';
import { trialLogToCSV } from '../../src/export.js';

/**
 * Regression and invariant tests — designed to catch future drift,
 * formula changes, config mutations, and subtle behavioral regressions.
 */

// ============================================================
// SCORING FORMULA INVARIANTS
// ============================================================

describe('Scoring formula invariants', () => {
  describe('adaptDifficulty contracts', () => {
    it('always returns an integer in [1, MAX_DIFFICULTY]', () => {
      for (let d = 1; d <= 5; d++) {
        for (let s = 0; s <= 100; s += 10) {
          const result = adaptDifficulty(d, s);
          expect(result).toBeGreaterThanOrEqual(1);
          expect(result).toBeLessThanOrEqual(CONFIG.MAX_DIFFICULTY);
          expect(Number.isInteger(result)).toBe(true);
        }
      }
    });

    it('never changes by more than 1 step', () => {
      for (let d = 1; d <= 5; d++) {
        for (let s = 0; s <= 100; s += 5) {
          const result = adaptDifficulty(d, s);
          expect(Math.abs(result - d)).toBeLessThanOrEqual(1);
        }
      }
    });

    it('has a clear "stay" band between 50 and 79', () => {
      for (let s = 50; s <= 79; s++) {
        expect(adaptDifficulty(3, s)).toBe(3);
      }
    });
  });

  describe('zScore properties', () => {
    it('zScore(0.5) ≈ 0 (median is zero)', () => {
      expect(Math.abs(zScore(0.5))).toBeLessThan(0.01);
    });

    it('zScore is symmetric: zScore(p) ≈ -zScore(1-p)', () => {
      for (const p of [0.1, 0.2, 0.3, 0.4]) {
        expect(zScore(p)).toBeCloseTo(-zScore(1 - p), 2);
      }
    });

    it('always returns a finite number for any input', () => {
      const inputs = [-100, -1, 0, 0.01, 0.5, 0.99, 1, 2, 100, NaN, Infinity, -Infinity];
      for (const p of inputs) {
        const result = zScore(p);
        // NaN propagates from NaN input through Math.max/min
        if (!Number.isNaN(p)) {
          expect(Number.isFinite(result)).toBe(true);
        }
      }
    });
  });

  describe('shuffle invariants', () => {
    it('preserves array length', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(shuffle(arr).length).toBe(5);
    });

    it('preserves element set (no additions/removals)', () => {
      const arr = [10, 20, 30, 40, 50];
      const result = shuffle(arr);
      expect(result.sort()).toEqual(arr.sort());
    });

    it('does not mutate the original array', () => {
      const arr = [1, 2, 3, 4, 5];
      const copy = [...arr];
      shuffle(arr);
      expect(arr).toEqual(copy);
    });

    it('handles empty array', () => {
      expect(shuffle([])).toEqual([]);
    });

    it('handles single-element array', () => {
      expect(shuffle([42])).toEqual([42]);
    });
  });
});

// ============================================================
// CONFIG INVARIANTS
// ============================================================

describe('Config invariants', () => {
  it('GAMES has exactly 4 entries', () => {
    expect(GAMES.length).toBe(4);
  });

  it('GAMES contains memory, attention, flexibility, speed', () => {
    const ids = GAMES.map(g => g.id);
    expect(ids).toContain('memory');
    expect(ids).toContain('attention');
    expect(ids).toContain('flexibility');
    expect(ids).toContain('speed');
  });

  it('every game has id, name, icon, description', () => {
    GAMES.forEach(game => {
      expect(game.id).toBeTruthy();
      expect(game.name).toBeTruthy();
      expect(game.icon).toBeTruthy();
      expect(game.description).toBeTruthy();
    });
  });

  it('ADAPTIVE_UP > ADAPTIVE_DOWN', () => {
    expect(CONFIG.ADAPTIVE_UP).toBeGreaterThan(CONFIG.ADAPTIVE_DOWN);
  });

  it('MAX_DIFFICULTY >= 1', () => {
    expect(CONFIG.MAX_DIFFICULTY).toBeGreaterThanOrEqual(1);
  });

  it('MAX_TASKS >= 1', () => {
    expect(CONFIG.MAX_TASKS).toBeGreaterThanOrEqual(1);
  });

  it('all timing constants are positive', () => {
    expect(CONFIG.MEMORY_DISPLAY_MS).toBeGreaterThan(0);
    expect(CONFIG.FEEDBACK_DISPLAY_MS).toBeGreaterThan(0);
    expect(CONFIG.DEBOUNCE_MS).toBeGreaterThan(0);
    expect(CONFIG.FLEX_RT_NORM_MS).toBeGreaterThan(0);
    expect(CONFIG.SPEED_RT_NORM_MS).toBeGreaterThan(0);
  });

  it('RECOMMENDATIONS has entries for all 4 games', () => {
    expect(RECOMMENDATIONS.memory).toBeDefined();
    expect(RECOMMENDATIONS.attention).toBeDefined();
    expect(RECOMMENDATIONS.flexibility).toBeDefined();
    expect(RECOMMENDATIONS.speed).toBeDefined();
  });

  it('each recommendation has required fields', () => {
    for (const [, rec] of Object.entries(RECOMMENDATIONS)) {
      expect(rec.scienceConnection).toBeTruthy();
      expect(rec.tiers).toBeDefined();
      expect(rec.tiers.strong).toBeTruthy();
      expect(rec.tiers.developing).toBeTruthy();
      expect(rec.tiers.needsFocus).toBeTruthy();
      expect(Array.isArray(rec.tips)).toBe(true);
      expect(rec.tips.length).toBeGreaterThanOrEqual(2);
    }
  });
});

// ============================================================
// GRADE CONTENT INVARIANTS
// ============================================================

describe('Grade content invariants', () => {
  const ALL_GRADES = ['K', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  it('every grade resolves to valid content', () => {
    ALL_GRADES.forEach(grade => {
      const content = getGradeContent(grade);
      expect(content).toBeDefined();
      expect(content.rules).toBeDefined();
      expect(content.rules.length).toBeGreaterThan(0);
    });
  });

  it('every rule has key, question, options, and items', () => {
    ALL_GRADES.forEach(grade => {
      const content = getGradeContent(grade);
      if (!content.rules) return;
      content.rules.forEach(rule => {
        expect(rule.key).toBeTruthy();
        expect(rule.question).toBeTruthy();
        expect(Array.isArray(rule.options)).toBe(true);
        expect(rule.options.length).toBeGreaterThanOrEqual(2);
        expect(Array.isArray(rule.items)).toBe(true);
        expect(rule.items.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  it('every rule item has stimulus and answer', () => {
    ALL_GRADES.forEach(grade => {
      const content = getGradeContent(grade);
      if (!content.rules) return;
      content.rules.forEach(rule => {
        rule.items.forEach(item => {
          expect(item.stimulus).toBeTruthy();
          expect(item.answer).toBeTruthy();
          // Answer must match one of the options (case-insensitive)
          const lowerOptions = rule.options.map(o => o.toLowerCase());
          expect(lowerOptions).toContain(item.answer.toLowerCase());
        });
      });
    });
  });

  it('grade content has formulas array', () => {
    ALL_GRADES.forEach(grade => {
      const content = getGradeContent(grade);
      expect(content.formulas).toBeDefined();
      expect(Array.isArray(content.formulas)).toBe(true);
      expect(content.formulas.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('inheritance chains resolve without cycles', () => {
    ALL_GRADES.forEach(grade => {
      const raw = GRADE_CONTENT[grade];
      if (!raw || !raw.inherit) return;

      const seen = new Set([String(grade)]);
      let current = raw;
      while (current && current.inherit) {
        expect(seen.has(String(current.inherit))).toBe(false);
        seen.add(String(current.inherit));
        current = GRADE_CONTENT[current.inherit];
      }
    });
  });
});

// ============================================================
// CSV EXPORT INVARIANTS
// ============================================================

describe('CSV export invariants', () => {
  it('CSV header count matches column count in every row', () => {
    const trials = [
      { a: 1, b: 'x', c: true },
      { a: 2, b: 'y', c: false },
      { a: 3, b: 'z', c: true }
    ];
    const csv = trialLogToCSV(trials);
    const lines = csv.split('\n');
    const headerCount = lines[0].split(',').length;

    for (let i = 1; i < lines.length; i++) {
      // Simple count — doesn't handle quoted commas but our test data is clean
      expect(lines[i].split(',').length).toBe(headerCount);
    }
  });

  it('CSV row count = trial count + 1 (header)', () => {
    const n = 50;
    const trials = Array.from({ length: n }, (_, i) => ({ index: i }));
    const csv = trialLogToCSV(trials);
    expect(csv.split('\n').length).toBe(n + 1);
  });
});

// ============================================================
// FULL GAME FLOW REGRESSION
// ============================================================

describe('Full game flow regression', () => {
  let App;

  beforeEach(() => {
    ({ App } = setupFull({ user: { teacher: '', period: '' } }));
  });

  it('memory game: run → input → score → endGame cycle', () => {
    App.state.currentGame = 'memory';
    App.state.currentDifficulty = 1;
    App.state.currentTask = 0;
    App.state.taskScores = [];

    // Run a memory task
    App.runMemoryTask(App.elements.gameArea);
    expect(App.memoryState).toBeDefined();

    // Skip to input
    App.memoryState.showIndex = App.memoryState.sequence.length;
    App.showMemoryInput();
    App.gameTimeout = () => {};
    App.nextTask = () => {};

    // Input perfect sequence
    for (let i = 0; i < App.memoryState.length; i++) {
      App.handleMemoryInput(App.memoryState.sequence[i]);
    }

    expect(App.state.taskScores.length).toBe(1);
    expect(App.state.taskScores[0]).toBeGreaterThanOrEqual(0);
    expect(App.state.taskScores[0]).toBeLessThanOrEqual(100);
  });

  it('flexibility game: run → respond → advance cycle', () => {
    App.state.currentGame = 'flexibility';
    App.state.currentDifficulty = 1;
    App.state.taskScores = [];

    App.runFlexibilityTask(App.elements.gameArea);
    expect(App.flexState).toBeDefined();
    expect(App.flexState.trials).toBeGreaterThanOrEqual(7);

    // Respond correctly to one trial
    App.gameTimeout = () => {};
    const btn = App.elements.gameArea.querySelector('.response-btn[data-correct="true"]');
    expect(btn).not.toBeNull();
    App.handleGameClick({ target: btn });

    expect(App.flexState.correct).toBe(1);
    expect(App.flexState.reactionTimes.length).toBe(1);
  });

  it('speed game: run → respond → advance cycle', () => {
    App.state.currentGame = 'speed';
    App.state.currentDifficulty = 1;
    App.state.taskScores = [];

    App.runSpeedTask(App.elements.gameArea);
    expect(App.speedState).toBeDefined();

    App.gameTimeout = () => {};
    const btn = App.elements.gameArea.querySelector('.response-btn[data-correct="true"]');
    expect(btn).not.toBeNull();
    App.handleGameClick({ target: btn });

    expect(App.speedState.correct).toBe(1);
    expect(App.speedState.reactionTimes.length).toBe(1);
  });

  it('adaptive difficulty increases after high scores', () => {
    const newDiff = adaptDifficulty(1, 90);
    expect(newDiff).toBe(2);
  });

  it('adaptive difficulty decreases after low scores', () => {
    const newDiff = adaptDifficulty(3, 30);
    expect(newDiff).toBe(2);
  });

  it('trial log accumulates entries across inputs', () => {
    App.state.currentGame = 'memory';
    App.state.currentDifficulty = 1;
    App.state.currentTask = 0;
    App.state.taskScores = [];

    App.runMemoryTask(App.elements.gameArea);
    App.memoryState.showIndex = App.memoryState.sequence.length;
    App.showMemoryInput();
    App.gameTimeout = () => {};
    App.nextTask = () => {};

    for (let i = 0; i < App.memoryState.length; i++) {
      App.handleMemoryInput(App.memoryState.sequence[i]);
    }

    expect(App.state.trialLog.length).toBe(App.memoryState.length);
    App.state.trialLog.forEach(trial => {
      expect(trial.trialType).toBe('memory_digit');
      expect(trial.game).toBe('memory');
      expect(trial.timestamp).toBeGreaterThan(0);
    });
  });
});
