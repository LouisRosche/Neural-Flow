/**
 * Shared test fixture factory.
 *
 * Eliminates duplicated beforeEach boilerplate across test files by providing
 * pre-configured App instances for common testing scenarios.
 */

import { loadApp, getApp } from './load-app.js';

/**
 * Default user fixture used across tests.
 */
const DEFAULT_USER = Object.freeze({
  name: 'Test',
  age: 12,
  grade: 6,
  teacher: 'Dr. Smith',
  period: '3',
});

/**
 * Create a minimally-initialized App (storage + elements + timers).
 * Suitable for pure function tests (scoring, shuffle, CSV, state, etc.).
 *
 * @returns {{ App: object }}
 */
export function setupBase() {
  const App = getApp();
  App.testStorage();
  App.cacheElements();
  App._timers = new Set();
  return { App };
}

/**
 * Create an App configured for a specific game.
 * Includes base setup plus game-related state fields.
 *
 * @param {string} gameId - One of 'memory', 'attention', 'flexibility', 'speed'.
 * @param {{ difficulty?: number, user?: object }} [opts]
 * @returns {{ App: object }}
 */
export function setupGame(gameId, opts = {}) {
  const { App } = setupBase();
  App.state.currentGame = gameId;
  App.state.currentDifficulty = opts.difficulty ?? 1;
  App.state.currentTask = 0;
  App.state.taskScores = [];
  App.state.trialLog = [];
  if (opts.user !== undefined) {
    App.state.user = { ...DEFAULT_USER, ...opts.user };
  }
  return { App };
}

/**
 * Create a fully-initialized App with DOM access (window/document).
 * Uses loadApp() so callers can interact with the jsdom environment.
 *
 * @param {{ gameId?: string, difficulty?: number, user?: object|boolean }} [opts]
 *   - user: true → DEFAULT_USER, object → merged with DEFAULT_USER, omit → no user set
 * @returns {{ App: object, window: object, document: object }}
 */
export function setupFull(opts = {}) {
  const { App, window: win } = loadApp();
  App.testStorage();
  App.cacheElements();
  App._timers = new Set();
  App.state.trialLog = [];
  App.state.history = [];
  App.state.gameScores = {};
  App.state.taskScores = [];

  if (opts.gameId) {
    App.state.currentGame = opts.gameId;
    App.state.currentDifficulty = opts.difficulty ?? 1;
    App.state.currentTask = 0;
  }

  if (opts.user === true) {
    App.state.user = { ...DEFAULT_USER };
  } else if (opts.user && typeof opts.user === 'object') {
    App.state.user = { ...DEFAULT_USER, ...opts.user };
  }

  if (opts.sessionStart !== undefined) {
    App.state.sessionStart = opts.sessionStart;
  } else if (opts.user) {
    App.state.sessionStart = Date.now();
  }

  return { App, window: win, document: win.document };
}

export { DEFAULT_USER };
