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
