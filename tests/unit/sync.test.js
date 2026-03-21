import { describe, it, expect, beforeEach } from 'vitest';
import { getApp } from '../helpers/load-app.js';

describe('Sync Logic', () => {
  let App;

  beforeEach(() => {
    App = getApp();
  });

  describe('isValidSheetsUrl', () => {
    it('accepts valid Google Apps Script URL', () => {
      expect(App.isValidSheetsUrl('https://script.google.com/macros/s/AKfyc.../exec')).toBe(true);
    });

    it('rejects non-https URL', () => {
      expect(App.isValidSheetsUrl('http://script.google.com/macros/s/abc/exec')).toBe(false);
    });

    it('rejects non-Google domain', () => {
      expect(App.isValidSheetsUrl('https://evil.com/macros/s/abc/exec')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(App.isValidSheetsUrl('')).toBe(false);
    });

    it('rejects malformed URL', () => {
      expect(App.isValidSheetsUrl('not-a-url')).toBe(false);
    });

    it('rejects javascript: protocol', () => {
      expect(App.isValidSheetsUrl('javascript:alert(1)')).toBe(false);
    });

    it('rejects data: protocol', () => {
      expect(App.isValidSheetsUrl('data:text/html,<h1>hi</h1>')).toBe(false);
    });
  });
});
