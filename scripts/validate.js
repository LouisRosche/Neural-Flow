#!/usr/bin/env node
/**
 * Local validation script — mirrors CI checks so issues are caught before push.
 * Run: npm run validate
 */
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

let failures = 0;

function check(label, fn) {
  try {
    fn();
    console.log(`  \u2713 ${label}`);
  } catch (e) {
    console.error(`  \u2717 ${label}: ${e.message}`);
    failures++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

// ── HTML Validation ──────────────────────────────────────────────
console.log('\n\u25B6 Validating index.html');

check('index.html exists and is non-empty', () => {
  assert(existsSync('index.html'), 'index.html missing');
  const content = readFileSync('index.html', 'utf8');
  assert(content.length > 0, 'index.html is empty');
});

check('HTML structure', () => {
  const html = readFileSync('index.html', 'utf8');
  assert(html.includes('<!DOCTYPE html>'), 'missing DOCTYPE');
  assert(html.includes('<html'), 'missing <html>');
  assert(html.includes('</html>'), 'missing </html>');
  assert(html.includes('<script>'), 'missing <script>');
});

check('Critical app markers', () => {
  const html = readFileSync('index.html', 'utf8');
  assert(html.includes('const App'), 'App object not found');
  assert(html.includes("'use strict'"), 'strict mode not found');
});

// ── Source Module Validation ─────────────────────────────────────
console.log('\n\u25B6 Validating source modules');

const modules = [
  'src/app.js', 'src/config.js', 'src/state.js', 'src/scoring.js',
  'src/ui.js', 'src/export.js', 'src/sync.js',
  'src/games/memory.js', 'src/games/attention.js',
  'src/games/flexibility.js', 'src/games/speed.js'
];

check('All source modules exist', () => {
  const missing = modules.filter(m => !existsSync(m));
  assert(missing.length === 0, `Missing: ${missing.join(', ')}`);
});

check('JS syntax valid', () => {
  for (const mod of modules) {
    try {
      execSync(`node --check ${mod}`, { stdio: 'pipe' });
    } catch {
      throw new Error(`Syntax error in ${mod}`);
    }
  }
});

// ── Test Infrastructure Validation ───────────────────────────────
console.log('\n\u25B6 Validating test infrastructure');

check('Test helpers exist', () => {
  assert(existsSync('tests/helpers/setup.js'), 'tests/helpers/setup.js missing');
  assert(existsSync('tests/helpers/load-app.js'), 'tests/helpers/load-app.js missing');
});

check('vitest.config.js exists', () => {
  assert(existsSync('vitest.config.js'), 'vitest.config.js missing');
});

// ── Summary ──────────────────────────────────────────────────────
console.log('');
if (failures > 0) {
  console.error(`\u2717 ${failures} validation check(s) failed`);
  process.exit(1);
} else {
  console.log('\u2713 All validation checks passed\n');
}
