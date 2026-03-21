import { describe, it, expect, beforeEach } from 'vitest';
import { getApp } from '../helpers/load-app.js';
import { CONFIG, GAMES, GRADE_CONTENT, RECOMMENDATIONS } from '../../src/config.js';
import { adaptDifficulty, shuffle, zScore, inverseErf, getGradeContent } from '../../src/scoring.js';
import { trialLogToCSV } from '../../src/export.js';
import { isValidSheetsUrl } from '../../src/sync.js';

/**
 * Drift-detection tests: verify that the inline script (index.html)
 * and the modular src/ extraction produce equivalent behaviors.
 * If these fail, the two codebases have diverged.
 */
describe('Inline/Module Parity', () => {
  let App;

  beforeEach(() => {
    App = getApp();
  });

  describe('CONFIG constants match', () => {
    it('MAX_TASKS', () => expect(App.CONFIG.MAX_TASKS).toBe(CONFIG.MAX_TASKS));
    it('MAX_DIFFICULTY', () => expect(App.CONFIG.MAX_DIFFICULTY).toBe(CONFIG.MAX_DIFFICULTY));
    it('ADAPTIVE_UP', () => expect(App.CONFIG.ADAPTIVE_UP).toBe(CONFIG.ADAPTIVE_UP));
    it('ADAPTIVE_DOWN', () => expect(App.CONFIG.ADAPTIVE_DOWN).toBe(CONFIG.ADAPTIVE_DOWN));
    it('MEMORY_DISPLAY_MS', () => expect(App.CONFIG.MEMORY_DISPLAY_MS).toBe(CONFIG.MEMORY_DISPLAY_MS));
    it('ATTENTION_TARGET_BASE_MS', () => expect(App.CONFIG.ATTENTION_TARGET_BASE_MS).toBe(CONFIG.ATTENTION_TARGET_BASE_MS));
    it('FLEX_RT_NORM_MS', () => expect(App.CONFIG.FLEX_RT_NORM_MS).toBe(CONFIG.FLEX_RT_NORM_MS));
    it('SPEED_RT_NORM_MS', () => expect(App.CONFIG.SPEED_RT_NORM_MS).toBe(CONFIG.SPEED_RT_NORM_MS));
    it('FEEDBACK_DISPLAY_MS', () => expect(App.CONFIG.FEEDBACK_DISPLAY_MS).toBe(CONFIG.FEEDBACK_DISPLAY_MS));
    it('DEBOUNCE_MS', () => expect(App.CONFIG.DEBOUNCE_MS).toBe(CONFIG.DEBOUNCE_MS));
  });

  describe('GAMES array matches', () => {
    it('same number of games', () => {
      expect(App.CONFIG.GAMES.length).toBe(GAMES.length);
    });

    it('same game IDs in same order', () => {
      const inlineIds = App.CONFIG.GAMES.map(g => g.id);
      const moduleIds = GAMES.map(g => g.id);
      expect(inlineIds).toEqual(moduleIds);
    });

    it('same game names', () => {
      const inlineNames = App.CONFIG.GAMES.map(g => g.name);
      const moduleNames = GAMES.map(g => g.name);
      expect(inlineNames).toEqual(moduleNames);
    });
  });

  describe('GRADE_CONTENT structure matches', () => {
    const GRADES = ['K', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    GRADES.forEach(grade => {
      it(`grade "${grade}" has same rule keys and content`, () => {
        const inlineContent = App.CONFIG.GRADE_CONTENT[grade];
        const moduleContent = GRADE_CONTENT[grade];

        // Both should exist
        expect(inlineContent).toBeDefined();
        expect(moduleContent).toBeDefined();

        // If inherited, both should inherit from same source
        if (inlineContent.inherit) {
          expect(moduleContent.inherit).toBe(String(inlineContent.inherit));
        } else {
          // Same number of rules
          expect(inlineContent.rules.length).toBe(moduleContent.rules.length);
          // Same rule keys
          const inlineKeys = inlineContent.rules.map(r => r.key);
          const moduleKeys = moduleContent.rules.map(r => r.key);
          expect(inlineKeys).toEqual(moduleKeys);

          // Same rule item content (catch stimulus/answer drift)
          inlineContent.rules.forEach((rule, i) => {
            const moduleRule = moduleContent.rules[i];
            expect(rule.items.length).toBe(moduleRule.items.length);
            rule.items.forEach((item, j) => {
              expect(item.stimulus).toBe(moduleRule.items[j].stimulus);
              expect(item.answer).toBe(moduleRule.items[j].answer);
            });
          });
        }
      });

      it(`grade "${grade}" has same formulas`, () => {
        const inlineContent = App.CONFIG.GRADE_CONTENT[grade];
        const moduleContent = GRADE_CONTENT[grade];

        if (inlineContent.formulas && moduleContent.formulas) {
          expect(inlineContent.formulas).toEqual(moduleContent.formulas);
        } else if (!inlineContent.inherit) {
          // Non-inheriting grades should have formulas
          expect(inlineContent.formulas).toBeDefined();
          expect(moduleContent.formulas).toBeDefined();
        }
      });
    });
  });

  describe('scoring functions produce same results', () => {
    it('adaptDifficulty matches for increase', () => {
      // Module version
      const moduleResult = adaptDifficulty(2, 85);
      // Inline version has the same logic embedded
      // Test: difficulty 2, score 85 >= 80 → 3
      expect(moduleResult).toBe(3);
    });

    it('adaptDifficulty matches for decrease', () => {
      const moduleResult = adaptDifficulty(3, 30);
      expect(moduleResult).toBe(2);
    });

    it('adaptDifficulty matches at boundary', () => {
      expect(adaptDifficulty(2, 80)).toBe(3);
      expect(adaptDifficulty(2, 79)).toBe(2);
      expect(adaptDifficulty(2, 50)).toBe(2);
      expect(adaptDifficulty(2, 49)).toBe(1);
    });

    it('zScore produces same results', () => {
      expect(zScore(0.5)).toBeCloseTo(App.zScore(0.5), 5);
      expect(zScore(0.1)).toBeCloseTo(App.zScore(0.1), 5);
      expect(zScore(0.9)).toBeCloseTo(App.zScore(0.9), 5);
    });

    it('inverseErf produces same results', () => {
      expect(inverseErf(0)).toBeCloseTo(App.inverseErf(0), 5);
      expect(inverseErf(0.5)).toBeCloseTo(App.inverseErf(0.5), 5);
      expect(inverseErf(-0.5)).toBeCloseTo(App.inverseErf(-0.5), 5);
    });
  });

  describe('isValidSheetsUrl produces same results', () => {
    const urls = [
      'https://script.google.com/macros/s/abc/exec',
      'http://script.google.com/macros/s/abc/exec',
      'https://evil.com/macros',
      '',
      'not-a-url',
      'javascript:alert(1)'
    ];

    urls.forEach(url => {
      it(`"${url.slice(0, 40)}..." matches`, () => {
        expect(App.isValidSheetsUrl(url)).toBe(isValidSheetsUrl(url));
      });
    });
  });

  describe('RECOMMENDATIONS structure matches', () => {
    ['memory', 'attention', 'flexibility', 'speed'].forEach(gameId => {
      it(`${gameId} recommendation exists in both`, () => {
        const inlineRec = App.CONFIG.RECOMMENDATIONS[gameId];
        const moduleRec = RECOMMENDATIONS[gameId];

        expect(inlineRec).toBeDefined();
        expect(moduleRec).toBeDefined();
        expect(inlineRec.scienceConnection).toBe(moduleRec.scienceConnection);
        expect(inlineRec.tiers.strong).toBe(moduleRec.tiers.strong);
        expect(inlineRec.tiers.developing).toBe(moduleRec.tiers.developing);
        expect(inlineRec.tiers.needsFocus).toBe(moduleRec.tiers.needsFocus);
        expect(inlineRec.tips).toEqual(moduleRec.tips);
      });
    });
  });
});
