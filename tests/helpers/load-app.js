/**
 * Test helper: extracts the App object from index.html's <script> tag
 * and evaluates it in the current jsdom environment, exposing the App object.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_PATH = resolve(__dirname, '../../index.html');

/**
 * Load the full HTML page in a fresh JSDOM and return the App object.
 */
export function loadApp() {
  const html = readFileSync(HTML_PATH, 'utf-8');

  // Extract the script body from the HTML
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) {
    throw new Error('Could not find <script> tag in index.html');
  }
  let scriptBody = scriptMatch[1];

  // Load the full HTML into jsdom so DOM elements exist
  const dom = new JSDOM(html, {
    url: 'http://localhost',
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });

  // The script is an IIFE: (function() { 'use strict'; const App = { ... }; ... })();
  // We need to:
  // 1. Replace `const App` with `window.App` so it's accessible after eval
  // 2. Prevent auto-initialization (App.init())
  // 3. Prevent global event handlers from running

  let modifiedScript = scriptBody;

  // Expose App globally instead of block-scoped const
  modifiedScript = modifiedScript.replace(
    /const App\s*=\s*\{/,
    'window.App = {'
  );

  // Prevent auto-init: replace the DOMContentLoaded/init block
  // Original pattern:
  //   if (document.readyState === 'loading') {
  //       document.addEventListener('DOMContentLoaded', () => App.init());
  //   } else {
  //       App.init();
  //   }
  modifiedScript = modifiedScript.replace(
    /if\s*\(document\.readyState\s*===\s*'loading'\)\s*\{[\s\S]*?App\.init\(\)\s*;?\s*\}/,
    '/* auto-init disabled for testing */'
  );

  // Remove global error handler
  modifiedScript = modifiedScript.replace(
    /window\.addEventListener\(\s*'error'[\s\S]*?\}\s*\)\s*;/,
    '/* global error handler disabled */'
  );

  // Remove pagehide handler
  modifiedScript = modifiedScript.replace(
    /window\.addEventListener\(\s*'pagehide'[\s\S]*?\}\s*\)\s*;/,
    '/* pagehide handler disabled */'
  );

  // Remove unload handler
  modifiedScript = modifiedScript.replace(
    /window\.addEventListener\(\s*'unload'[\s\S]*?\}\s*\)\s*;/,
    '/* unload handler disabled */'
  );

  // Evaluate in the jsdom context
  try {
    dom.window.eval(modifiedScript);
  } catch (e) {
    // Save for debugging
    const tmpPath = resolve(__dirname, '../../.debug-script.js');
    writeFileSync(tmpPath, modifiedScript);
    throw new Error(`Failed to eval modified script: ${e.message}. Debug script saved to ${tmpPath}`);
  }

  if (!dom.window.App) {
    throw new Error('App was not exposed on window after eval');
  }

  return { App: dom.window.App, window: dom.window, dom };
}

/**
 * Get a fresh App with minimal state for pure function testing.
 */
export function getApp() {
  const { App } = loadApp();
  return App;
}
