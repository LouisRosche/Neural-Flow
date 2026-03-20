import { describe, it, expect, beforeEach } from 'vitest';
import { getApp } from '../helpers/load-app.js';

describe('State Management', () => {
  let App;

  beforeEach(() => {
    App = getApp();
  });

  describe('testStorage', () => {
    it('detects localStorage availability', () => {
      App.testStorage();
      // jsdom provides localStorage, so it should be available
      expect(App.state.storageAvailable).toBe(true);
    });
  });

  describe('generateChecksum', () => {
    it('returns a number', () => {
      const data = { history: [], timestamp: 12345 };
      const checksum = App.generateChecksum(data);
      expect(typeof checksum).toBe('number');
    });

    it('returns different checksums for different data', () => {
      const c1 = App.generateChecksum({ history: [{ a: 1 }], timestamp: 1000 });
      const c2 = App.generateChecksum({ history: [{ b: 2 }], timestamp: 2000 });
      expect(c1).not.toBe(c2);
    });

    it('returns same checksum for identical data', () => {
      const data = { history: [{ score: 80 }], timestamp: 99999 };
      expect(App.generateChecksum(data)).toBe(App.generateChecksum(data));
    });
  });

  describe('verifyChecksum', () => {
    it('returns true for data with valid checksum', () => {
      const data = { history: [{ a: 1 }], timestamp: 1000 };
      data.checksum = App.generateChecksum(data);
      expect(App.verifyChecksum(data)).toBe(true);
    });

    it('returns false for tampered data', () => {
      const data = { history: [{ a: 1 }], timestamp: 1000 };
      data.checksum = App.generateChecksum(data);
      data.history.push({ a: 2 });
      expect(App.verifyChecksum(data)).toBe(false);
    });

    it('returns false when checksum is missing', () => {
      const data = { history: [], timestamp: 1000 };
      expect(App.verifyChecksum(data)).toBe(false);
    });
  });

  describe('saveState / loadState round-trip', () => {
    it('saves and loads history correctly', () => {
      App.testStorage();
      App.cacheElements();
      App.state.history = [
        { date: '2024-01-01', user: { name: 'Alice' }, scores: { memory: 80 }, average: 80 }
      ];
      App.saveState();

      // Reset history and reload
      App.state.history = [];
      App.loadState();
      expect(App.state.history).toHaveLength(1);
      expect(App.state.history[0].user.name).toBe('Alice');
    });

    it('trims history to 100 entries on save', () => {
      App.testStorage();
      App.cacheElements();
      App.state.history = Array.from({ length: 150 }, (_, i) => ({
        date: `2024-01-${i}`,
        user: { name: 'Test' },
        scores: {},
        average: i
      }));
      App.saveState();
      App.state.history = [];
      App.loadState();
      expect(App.state.history.length).toBeLessThanOrEqual(100);
    });
  });
});
