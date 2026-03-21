import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createInitialState, testStorage, generateChecksum, verifyChecksum,
  loadState, saveState
} from '../../src/state.js';
import { STORAGE_KEY } from '../../src/config.js';

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

});
