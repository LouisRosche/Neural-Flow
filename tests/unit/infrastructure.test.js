/**
 * Meta-tests: validate that test infrastructure (load-app helpers, setup
 * factories) stays in sync with the inline script in index.html.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadApp, getApp } from '../helpers/load-app.js';
import { setupBase, setupGame, setupFull } from '../helpers/setup.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = resolve(__dirname, '../../index.html');
const html = readFileSync(HTML_PATH, 'utf-8');

// Extract the inline script body once for structural checks.
const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);
const scriptBody = scriptMatch ? scriptMatch[1] : '';

// ---------------------------------------------------------------------------
// 1. Script Transform Structural Guards
// ---------------------------------------------------------------------------
describe('Script Transform Structural Guards', () => {
  it('index.html contains a <script> block', () => {
    expect(scriptMatch).not.toBeNull();
    expect(scriptBody.length).toBeGreaterThan(0);
  });

  it('has "const App = {" (required transform target)', () => {
    expect(scriptBody).toMatch(/const App\s*=\s*\{/);
  });

  it('has the auto-init block using document.readyState', () => {
    expect(scriptBody).toMatch(/document\.readyState\s*===\s*'loading'/);
  });

  it('has an IIFE wrapper "(function()"', () => {
    expect(scriptBody).toMatch(/\(function\s*\(\)/);
  });

  it("has 'use strict'", () => {
    expect(scriptBody).toMatch(/'use strict'/);
  });
});

// ---------------------------------------------------------------------------
// 2. Setup Factory Shape Validation
// ---------------------------------------------------------------------------
describe('Setup Factory Shape Validation', () => {
  describe('setupBase()', () => {
    it('returns { App } with expected infrastructure properties', () => {
      const result = setupBase();
      expect(result).toHaveProperty('App');

      const { App } = result;
      // testStorage and cacheElements are functions that were already called
      expect(typeof App.testStorage).toBe('function');
      expect(typeof App.cacheElements).toBe('function');
      expect(App.CONFIG).toBeDefined();
      expect(App.state).toBeDefined();
      expect(App.elements).toBeDefined();
    });
  });

  describe('setupGame("memory")', () => {
    it('returns App with game state initialised for memory', () => {
      const { App } = setupGame('memory');
      expect(App.state.currentGame).toBe('memory');
      expect(App.state.currentDifficulty).toBe(1);
      expect(App.state.taskScores).toEqual([]);
      expect(App.state.trialLog).toEqual([]);
    });
  });

  describe('setupFull({ user: true })', () => {
    it('returns { App, window, document } with user set', () => {
      const result = setupFull({ user: true });

      expect(result).toHaveProperty('App');
      expect(result).toHaveProperty('window');
      expect(result).toHaveProperty('document');

      // window should be a jsdom Window
      expect(result.window).toBeDefined();
      expect(typeof result.window.document).toBe('object');

      // document should exist
      expect(result.document).toBeDefined();
      expect(result.document).toBe(result.window.document);

      // user should be populated
      expect(result.App.state.user).toBeDefined();
      expect(result.App.state.user).not.toBeNull();
      expect(result.App.state.user.name).toBe('Test');
    });
  });

  describe('setupFull() without user option', () => {
    it('has App.state.user as null or undefined', () => {
      const { App } = setupFull();
      // user should not be set when no user option is passed
      expect(App.state.user == null).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// 3. Load-App Robustness
// ---------------------------------------------------------------------------
describe('Load-App Robustness', () => {
  it('loadApp() returns an App with core lifecycle methods', () => {
    const { App } = loadApp();
    const requiredMethods = [
      'init',
      'startGame',
      'endGame',
      'runTask',
      'showScreen',
      'handleLogin',
      'showReport',
    ];
    for (const method of requiredMethods) {
      expect(typeof App[method], `App.${method} should be a function`).toBe('function');
    }
  });

  it('getApp() returns an App object with the same core methods', () => {
    const App = getApp();
    const requiredMethods = [
      'init',
      'startGame',
      'endGame',
      'runTask',
      'showScreen',
      'handleLogin',
      'showReport',
    ];
    for (const method of requiredMethods) {
      expect(typeof App[method], `App.${method} should be a function`).toBe('function');
    }
  });

  it('App.CONFIG has expected keys', () => {
    const App = getApp();
    expect(App.CONFIG).toHaveProperty('MAX_TASKS');
    expect(App.CONFIG).toHaveProperty('MAX_DIFFICULTY');
    expect(App.CONFIG).toHaveProperty('GAMES');
    expect(App.CONFIG).toHaveProperty('GRADE_CONTENT');

    // GAMES should be an array of game definitions
    expect(Array.isArray(App.CONFIG.GAMES)).toBe(true);
    expect(App.CONFIG.GAMES.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Method Inventory Parity
// ---------------------------------------------------------------------------
describe('Method Inventory Parity', () => {
  let App;

  // Load once for all parity checks.
  const appHolder = loadApp();
  App = appHolder.App;

  describe('Game runners', () => {
    it.each([
      'runMemoryTask',
      'runAttentionTask',
      'runFlexibilityTask',
      'runSpeedTask',
    ])('%s exists on App', (method) => {
      expect(typeof App[method]).toBe('function');
    });
  });

  describe('Input handlers', () => {
    it.each([
      'handleMemoryInput',
      'handleGameClick',
      'handleTargetClick',
    ])('%s exists on App', (method) => {
      expect(typeof App[method]).toBe('function');
    });
  });

  describe('Lifecycle', () => {
    it.each([
      'startGame',
      'endGame',
      'runTask',
      'nextTask',
      'completeTask',
    ])('%s exists on App', (method) => {
      expect(typeof App[method]).toBe('function');
    });
  });

  describe('UI', () => {
    it.each([
      'showScreen',
      'showReport',
      'showFeedback',
      'renderGames',
      'clearGameArea',
    ])('%s exists on App', (method) => {
      expect(typeof App[method]).toBe('function');
    });
  });

  describe('State', () => {
    it.each([
      'testStorage',
      'cacheElements',
      'bindEvents',
    ])('%s exists on App', (method) => {
      expect(typeof App[method]).toBe('function');
    });
  });

  describe('Scoring helpers', () => {
    it.each([
      'zScore',
      'inverseErf',
    ])('%s exists on App', (method) => {
      expect(typeof App[method]).toBe('function');
    });
  });

});
