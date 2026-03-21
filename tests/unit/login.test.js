import { describe, it, expect, beforeEach } from 'vitest';
import { setupFull } from '../helpers/setup.js';

describe('Login and Grade Handling', () => {
  let App, win;

  beforeEach(() => {
    ({ App, window: win } = setupFull());
  });

  describe('handleLogin grade parsing', () => {
    function setLoginFields(name, age, grade) {
      win.document.getElementById('name').value = name;
      win.document.getElementById('age').value = age;
      win.document.getElementById('grade').value = grade;
    }

    it('preserves grade "K" as string (not parsed to NaN)', () => {
      setLoginFields('Alice', '6', 'K');
      App.showScreen = () => {};
      App.renderGames = () => {};
      App.handleLogin();

      expect(App.state.user).not.toBeNull();
      expect(App.state.user.grade).toBe('K');
      expect(Number.isNaN(App.state.user.grade)).toBe(false);
    });

    it('parses numeric grades correctly', () => {
      setLoginFields('Bob', '12', '6');
      App.showScreen = () => {};
      App.renderGames = () => {};
      App.handleLogin();

      expect(App.state.user.grade).toBe(6);
    });

    it('resolves grade K to K-2 content, not grade 6 fallback', () => {
      setLoginFields('Carol', '6', 'K');
      App.showScreen = () => {};
      App.renderGames = () => {};
      App.handleLogin();

      const content = App.getGradeContent();
      const hasLivingRule = content.rules.some(r => r.key === 'living/nonliving');
      expect(hasLivingRule).toBe(true);
    });

    it('resolves grade 1 to K-2 content via inheritance', () => {
      setLoginFields('Dave', '7', '1');
      App.showScreen = () => {};
      App.renderGames = () => {};
      App.handleLogin();

      const content = App.getGradeContent();
      const hasLivingRule = content.rules.some(r => r.key === 'living/nonliving');
      expect(hasLivingRule).toBe(true);
    });

    it('resolves grade 9 to 9-12 content', () => {
      setLoginFields('Eve', '15', '9');
      App.showScreen = () => {};
      App.renderGames = () => {};
      App.handleLogin();

      const content = App.getGradeContent();
      const hasIonicRule = content.rules.some(r => r.key === 'ionic/covalent');
      expect(hasIonicRule).toBe(true);
    });

    it('rejects empty name', () => {
      setLoginFields('', '12', '6');
      App.handleLogin();
      expect(App.state.user).toBeNull();
    });

    it('rejects name over 50 characters', () => {
      setLoginFields('A'.repeat(51), '12', '6');
      App.handleLogin();
      expect(App.state.user).toBeNull();
    });

    it('rejects age below 6', () => {
      setLoginFields('Test', '5', '6');
      App.handleLogin();
      expect(App.state.user).toBeNull();
    });

    it('rejects age above 18', () => {
      setLoginFields('Test', '19', '6');
      App.handleLogin();
      expect(App.state.user).toBeNull();
    });

    it('rejects empty grade', () => {
      setLoginFields('Test', '12', '');
      App.handleLogin();
      expect(App.state.user).toBeNull();
    });

    it('accepts valid login and sets session start', () => {
      setLoginFields('Test', '12', '6');
      App.showScreen = () => {};
      App.renderGames = () => {};
      App.handleLogin();

      expect(App.state.user).not.toBeNull();
      expect(App.state.sessionStart).toBeGreaterThan(0);
    });
  });
});
