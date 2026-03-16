import { describe, it, expect, beforeEach } from 'vitest';
import { getApp } from '../helpers/load-app.js';

describe('Grade Content System', () => {
  let App;

  beforeEach(() => {
    App = getApp();
  });

  // All valid grade keys used in the select dropdown
  const ALL_GRADES = ['K', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  describe('Every grade K-12 resolves to valid content', () => {
    ALL_GRADES.forEach(grade => {
      it(`grade "${grade}" resolves to content with rules and formulas`, () => {
        // Set up user state with this grade
        App.state.user = { name: 'Test', age: 10, grade };
        const content = App.getGradeContent();

        expect(content).toBeDefined();
        expect(content).not.toBeNull();
        expect(content.rules).toBeDefined();
        expect(Array.isArray(content.rules)).toBe(true);
        expect(content.rules.length).toBeGreaterThan(0);
        expect(content.formulas).toBeDefined();
        expect(Array.isArray(content.formulas)).toBe(true);
        expect(content.formulas.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Inheritance chain works', () => {
    it('grade 7 inherits from grade 6 (same content)', () => {
      App.state.user = { name: 'Test', age: 12, grade: 7 };
      const content7 = App.getGradeContent();

      App.state.user = { name: 'Test', age: 11, grade: 6 };
      const content6 = App.getGradeContent();

      // They should resolve to the exact same content object
      expect(content7).toBe(content6);
    });

    it('grade 1 inherits from K', () => {
      App.state.user = { name: 'Test', age: 6, grade: 1 };
      const content1 = App.getGradeContent();

      App.state.user = { name: 'Test', age: 5, grade: 'K' };
      const contentK = App.getGradeContent();

      expect(content1).toBe(contentK);
    });

    it('grade 4 inherits from 3', () => {
      App.state.user = { name: 'Test', age: 9, grade: 4 };
      const content4 = App.getGradeContent();

      App.state.user = { name: 'Test', age: 8, grade: 3 };
      const content3 = App.getGradeContent();

      expect(content4).toBe(content3);
    });

    it('grade 10, 11, 12 inherit from 9', () => {
      App.state.user = { name: 'Test', age: 14, grade: 9 };
      const content9 = App.getGradeContent();

      [10, 11, 12].forEach(g => {
        App.state.user = { name: 'Test', age: 15, grade: g };
        const content = App.getGradeContent();
        expect(content).toBe(content9);
      });
    });
  });

  describe('All rules have matching options and items', () => {
    // Collect all base grade content objects (not inherited ones)
    const BASE_GRADES = ['K', 3, 6, 9];

    BASE_GRADES.forEach(grade => {
      it(`grade "${grade}" — each rule has options array and items array`, () => {
        App.state.user = { name: 'Test', age: 10, grade };
        const content = App.getGradeContent();

        content.rules.forEach(rule => {
          expect(rule.key).toBeDefined();
          expect(rule.question).toBeDefined();
          expect(Array.isArray(rule.options)).toBe(true);
          expect(rule.options.length).toBeGreaterThanOrEqual(2);
          expect(Array.isArray(rule.items)).toBe(true);
          expect(rule.items.length).toBeGreaterThan(0);
        });
      });

      it(`grade "${grade}" — every item answer matches one of the rule options (lowercase)`, () => {
        App.state.user = { name: 'Test', age: 10, grade };
        const content = App.getGradeContent();

        content.rules.forEach(rule => {
          const validAnswers = rule.options.map(o => o.toLowerCase());
          rule.items.forEach(item => {
            expect(validAnswers).toContain(item.answer);
          });
        });
      });

      it(`grade "${grade}" — every item has a stimulus string`, () => {
        App.state.user = { name: 'Test', age: 10, grade };
        const content = App.getGradeContent();

        content.rules.forEach(rule => {
          rule.items.forEach(item => {
            expect(typeof item.stimulus).toBe('string');
            expect(item.stimulus.length).toBeGreaterThan(0);
          });
        });
      });
    });
  });

  describe('All formulas arrays are non-empty', () => {
    ALL_GRADES.forEach(grade => {
      it(`grade "${grade}" has at least one formula`, () => {
        App.state.user = { name: 'Test', age: 10, grade };
        const content = App.getGradeContent();
        expect(content.formulas.length).toBeGreaterThan(0);
        content.formulas.forEach(f => {
          expect(typeof f).toBe('string');
          expect(f.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('No grade returns undefined', () => {
    it('fallback to grade 6 when grade is missing/null', () => {
      App.state.user = { name: 'Test', age: 10, grade: null };
      const content = App.getGradeContent();
      expect(content).toBeDefined();
      expect(content.rules).toBeDefined();
    });

    it('fallback to grade 6 when user is null', () => {
      App.state.user = null;
      const content = App.getGradeContent();
      expect(content).toBeDefined();
      expect(content.rules).toBeDefined();
      // Should match grade 6 content
      const grade6 = App.CONFIG.GRADE_CONTENT['6'];
      expect(content).toBe(grade6);
    });

    it('fallback to grade 6 for unrecognized grade', () => {
      App.state.user = { name: 'Test', age: 10, grade: 'X' };
      const content = App.getGradeContent();
      expect(content).toBeDefined();
      expect(content).toBe(App.CONFIG.GRADE_CONTENT['6']);
    });
  });
});
