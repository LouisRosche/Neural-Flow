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
 * Patterns that must be neutralised before evaluating the inline script.
 * Each entry has a regex, its replacement, and a human-readable label used
 * in validation warnings so failures are easy to diagnose.
 */
const SCRIPT_TRANSFORMS = [
  {
    label: 'Expose App on window',
    pattern: /const App\s*=\s*\{/,
    replacement: 'window.App = {',
    required: true,
  },
  {
    label: 'Disable auto-init',
    pattern: /if\s*\(document\.readyState\s*===\s*'loading'\)\s*\{[\s\S]*?App\.init\(\)\s*;?\s*\}/,
    replacement: '/* auto-init disabled for testing */',
    required: true,
  },
  {
    label: 'Disable global error handler',
    pattern: /window\.addEventListener\(\s*'error'[\s\S]*?\}\s*\)\s*;/,
    replacement: '/* global error handler disabled */',
    required: false,
  },
  {
    label: 'Disable pagehide handler',
    pattern: /window\.addEventListener\(\s*'pagehide'[\s\S]*?\}\s*\)\s*;/,
    replacement: '/* pagehide handler disabled */',
    required: false,
  },
  {
    label: 'Disable unload handler',
    pattern: /window\.addEventListener\(\s*'unload'[\s\S]*?\}\s*\)\s*;/,
    replacement: '/* unload handler disabled */',
    required: false,
  },
  {
    label: 'Disable beforeunload handler',
    pattern: /window\.addEventListener\(\s*'beforeunload'[\s\S]*?\}\s*\)\s*;/,
    replacement: '/* beforeunload handler disabled */',
    required: false,
  },
];

/**
 * Apply all script transforms and return the modified source.
 * Throws if any required transform fails to match.
 */
function applyTransforms(script) {
  let modified = script;
  const warnings = [];

  for (const { label, pattern, replacement, required } of SCRIPT_TRANSFORMS) {
    if (!pattern.test(modified)) {
      if (required) {
        throw new Error(
          `load-app: required transform "${label}" did not match. ` +
          'The inline script structure in index.html may have changed.'
        );
      }
      warnings.push(`load-app: optional transform "${label}" did not match (skipped)`);
      continue;
    }
    modified = modified.replace(pattern, replacement);
  }

  if (warnings.length > 0 && typeof process !== 'undefined' && process.env.DEBUG_LOAD_APP) {
    for (const w of warnings) console.warn(w);
  }

  return modified;
}

/**
 * Load the full HTML page in a fresh JSDOM and return the App object.
 */
export function loadApp() {
  const html = readFileSync(HTML_PATH, 'utf-8');

  // Extract the script body from the HTML.
  // Use a greedy match to handle the last (and largest) <script> block.
  const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);
  if (!scriptMatch) {
    throw new Error('Could not find <script> tag in index.html');
  }
  const scriptBody = scriptMatch[1];

  // Load the full HTML into jsdom so DOM elements exist
  const dom = new JSDOM(html, {
    url: 'http://localhost',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });

  const modifiedScript = applyTransforms(scriptBody);

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
