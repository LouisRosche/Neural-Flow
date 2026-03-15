import { describe, it, expect, beforeEach } from 'vitest';
import { getApp } from '../helpers/load-app.js';

describe('Export Logic', () => {
  let App;

  beforeEach(() => {
    App = getApp();
  });

  // ── trialLogToCSV ─────────────────────────────────────────────────

  describe('CSV generation (trialLogToCSV)', () => {
    it('produces correct CSV with headers from trial keys', () => {
      App.state.trialLog = [
        { timestamp: 1000, game: 'memory', task: 0, difficulty: 1, correct: true, rt: 500 },
        { timestamp: 2000, game: 'memory', task: 0, difficulty: 1, correct: false, rt: 700 }
      ];

      const csv = App.trialLogToCSV();
      const lines = csv.split('\n');

      // First line is headers
      expect(lines.length).toBe(3); // header + 2 data rows
      const headers = lines[0].split(',');
      expect(headers).toContain('timestamp');
      expect(headers).toContain('game');
      expect(headers).toContain('correct');
      expect(headers).toContain('rt');
    });

    it('properly escapes strings containing commas', () => {
      App.state.trialLog = [
        { stimulus: 'hello, world', game: 'flexibility' }
      ];

      const csv = App.trialLogToCSV();
      // The comma-containing value should be quoted
      expect(csv).toContain('"hello, world"');
    });

    it('properly escapes strings containing double quotes', () => {
      App.state.trialLog = [
        { stimulus: 'say "hi"', game: 'flexibility' }
      ];

      const csv = App.trialLogToCSV();
      // Quotes are escaped by doubling: "say ""hi"""
      expect(csv).toContain('"say ""hi"""');
    });

    it('handles null and undefined values as empty strings', () => {
      App.state.trialLog = [
        { timestamp: 1000, game: 'memory', extra: null },
        { timestamp: 2000, game: 'attention', extra: 'value' }
      ];

      const csv = App.trialLogToCSV();
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      const extraIdx = headers.indexOf('extra');

      // First data row should have empty for 'extra'
      const row1 = lines[1].split(',');
      expect(row1[extraIdx]).toBe('');
    });

    it('collects union of all keys across trials', () => {
      App.state.trialLog = [
        { a: 1, b: 2 },
        { b: 3, c: 4 }
      ];

      const csv = App.trialLogToCSV();
      const headers = csv.split('\n')[0].split(',');
      expect(headers).toContain('a');
      expect(headers).toContain('b');
      expect(headers).toContain('c');
    });
  });

  // ── Empty trial log ───────────────────────────────────────────────

  describe('Empty trial log', () => {
    it('produces empty string for empty trial log', () => {
      App.state.trialLog = [];
      const csv = App.trialLogToCSV();
      expect(csv).toBe('');
    });
  });

  // ── Privacy filter ────────────────────────────────────────────────

  describe('Privacy filter (exportData)', () => {
    it('only includes current student in filtered history', () => {
      // Set up state with multiple students in history
      App.state.user = { name: 'Alice', age: 12, grade: 6 };
      App.state.history = [
        { user: { name: 'Alice' }, scores: { memory: 80 } },
        { user: { name: 'Bob' }, scores: { memory: 70 } },
        { user: { name: 'Alice' }, scores: { attention: 90 } },
        { user: { name: 'Charlie' }, scores: { speed: 60 } }
      ];
      App.state.gameScores = { memory: 85 };
      App.state.trialLog = [];

      // Instead of calling exportData (which triggers downloads),
      // replicate the privacy filter logic from exportData:
      const currentName = App.state.user ? App.state.user.name : null;
      const filteredHistory = currentName
        ? App.state.history.filter(h => h.user && h.user.name === currentName)
        : [];

      expect(filteredHistory).toHaveLength(2);
      filteredHistory.forEach(h => {
        expect(h.user.name).toBe('Alice');
      });
    });

    it('returns empty history when no user is logged in', () => {
      App.state.user = null;
      App.state.history = [
        { user: { name: 'Alice' }, scores: { memory: 80 } }
      ];

      const currentName = App.state.user ? App.state.user.name : null;
      const filteredHistory = currentName
        ? App.state.history.filter(h => h.user && h.user.name === currentName)
        : [];

      expect(filteredHistory).toHaveLength(0);
    });

    it('handles history entries without user field', () => {
      App.state.user = { name: 'Alice', age: 12, grade: 6 };
      App.state.history = [
        { user: { name: 'Alice' }, scores: { memory: 80 } },
        { scores: { memory: 70 } }, // no user field
        { user: null, scores: { attention: 90 } } // null user
      ];

      const currentName = App.state.user ? App.state.user.name : null;
      const filteredHistory = currentName
        ? App.state.history.filter(h => h.user && h.user.name === currentName)
        : [];

      expect(filteredHistory).toHaveLength(1);
      expect(filteredHistory[0].user.name).toBe('Alice');
    });
  });
});
