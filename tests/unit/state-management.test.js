import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createInitialState, testStorage, generateChecksum, verifyChecksum,
  loadState, saveState, loadSettings, saveSettings
} from '../../src/state.js';
import { STORAGE_KEY, SETTINGS_KEY } from '../../src/config.js';

describe('State Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ============================================================
  // createInitialState
  // ============================================================

  describe('createInitialState', () => {
    it('returns a fresh state object each call', () => {
      const a = createInitialState();
      const b = createInitialState();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });

    it('has all required fields', () => {
      const state = createInitialState();
      expect(state.user).toBeNull();
      expect(state.currentGame).toBeNull();
      expect(state.currentTask).toBe(0);
      expect(state.currentDifficulty).toBe(1);
      expect(state.taskScores).toEqual([]);
      expect(state.gameScores).toEqual({});
      expect(state.sessionStart).toBeNull();
      expect(state.history).toEqual([]);
      expect(state.trialLog).toEqual([]);
    });
  });

  // ============================================================
  // generateChecksum / verifyChecksum
  // ============================================================

  describe('generateChecksum', () => {
    it('is deterministic for same input', () => {
      const data = { history: [{ score: 80 }], timestamp: 1000 };
      expect(generateChecksum(data)).toBe(generateChecksum(data));
    });

    it('differs for different inputs', () => {
      const a = { history: [{ score: 80 }], timestamp: 1000 };
      const b = { history: [{ score: 90 }], timestamp: 1000 };
      expect(generateChecksum(a)).not.toBe(generateChecksum(b));
    });

    it('differs when timestamp changes', () => {
      const a = { history: [], timestamp: 1000 };
      const b = { history: [], timestamp: 2000 };
      expect(generateChecksum(a)).not.toBe(generateChecksum(b));
    });

    it('handles empty history', () => {
      const data = { history: [], timestamp: 1000 };
      const hash = generateChecksum(data);
      expect(typeof hash).toBe('number');
      expect(Number.isFinite(hash)).toBe(true);
    });

    it('handles large history', () => {
      const history = Array.from({ length: 500 }, (_, i) => ({ score: i, date: `2024-01-${i}` }));
      const data = { history, timestamp: Date.now() };
      const hash = generateChecksum(data);
      expect(typeof hash).toBe('number');
      expect(Number.isFinite(hash)).toBe(true);
    });
  });

  describe('verifyChecksum', () => {
    it('returns true for valid checksum', () => {
      const data = { history: [{ a: 1 }], timestamp: 1000 };
      data.checksum = generateChecksum(data);
      expect(verifyChecksum(data)).toBe(true);
    });

    it('returns false for tampered data', () => {
      const data = { history: [{ a: 1 }], timestamp: 1000 };
      data.checksum = generateChecksum(data);
      data.history.push({ a: 2 }); // tamper
      expect(verifyChecksum(data)).toBe(false);
    });

    it('returns false for missing checksum', () => {
      expect(verifyChecksum({ history: [], timestamp: 1000 })).toBe(false);
    });

    it('returns false for zero checksum', () => {
      expect(verifyChecksum({ history: [], timestamp: 1000, checksum: 0 })).toBe(false);
    });

    it('returns false for wrong checksum', () => {
      expect(verifyChecksum({ history: [], timestamp: 1000, checksum: 99999 })).toBe(false);
    });
  });

  // ============================================================
  // saveState / loadState round-trip
  // ============================================================

  describe('saveState / loadState', () => {
    it('round-trips history through localStorage', () => {
      const history = [
        { date: '2024-01-01', user: { name: 'Alice' }, scores: { memory: 80 }, average: 80 }
      ];
      saveState(history, true);
      const loaded = loadState(true);
      expect(loaded).toEqual(history);
    });

    it('returns empty array when storage unavailable (save)', () => {
      saveState([{ test: 1 }], false);
      const loaded = loadState(true);
      expect(loaded).toEqual([]);
    });

    it('returns empty array when storage unavailable (load)', () => {
      saveState([{ test: 1 }], true);
      const loaded = loadState(false);
      expect(loaded).toEqual([]);
    });

    it('trims to 100 entries on save', () => {
      const history = Array.from({ length: 150 }, (_, i) => ({ id: i }));
      saveState(history, true);
      const loaded = loadState(true);
      expect(loaded.length).toBe(100);
      // Should keep last 100 (indices 50-149)
      expect(loaded[0].id).toBe(50);
    });

    it('returns empty array for corrupted JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not valid json {[}');
      const loaded = loadState(true);
      expect(loaded).toEqual([]);
    });

    it('returns empty array for tampered checksum', () => {
      const data = { history: [{ test: 1 }], timestamp: Date.now() };
      data.checksum = generateChecksum(data);
      data.history.push({ tampered: true });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      const loaded = loadState(true);
      expect(loaded).toEqual([]);
    });

    it('returns empty array for missing key', () => {
      const loaded = loadState(true);
      expect(loaded).toEqual([]);
    });

    it('handles empty history save/load', () => {
      saveState([], true);
      const loaded = loadState(true);
      expect(loaded).toEqual([]);
    });
  });

  // ============================================================
  // loadSettings / saveSettings
  // ============================================================

  describe('loadSettings / saveSettings', () => {
    it('returns default when storage unavailable', () => {
      expect(loadSettings(false)).toEqual({ sheetsUrl: '' });
    });

    it('returns default when nothing saved', () => {
      expect(loadSettings(true)).toEqual({ sheetsUrl: '' });
    });

    it('round-trips settings', () => {
      const settings = { sheetsUrl: 'https://script.google.com/macros/s/abc/exec' };
      saveSettings(settings, true);
      expect(loadSettings(true)).toEqual(settings);
    });

    it('does not save when storage unavailable', () => {
      saveSettings({ sheetsUrl: 'test' }, false);
      expect(loadSettings(true)).toEqual({ sheetsUrl: '' });
    });

    it('handles corrupted settings JSON', () => {
      localStorage.setItem(SETTINGS_KEY, '{invalid json');
      expect(loadSettings(true)).toEqual({ sheetsUrl: '' });
    });
  });
});
