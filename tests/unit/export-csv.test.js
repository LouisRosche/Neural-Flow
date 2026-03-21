import { describe, it, expect } from 'vitest';
import { trialLogToCSV } from '../../src/export.js';

describe('trialLogToCSV', () => {
  it('returns empty string for empty array', () => {
    expect(trialLogToCSV([])).toBe('');
  });

  it('creates header row from trial keys', () => {
    const csv = trialLogToCSV([{ a: 1, b: 2 }]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('a,b');
    expect(lines[1]).toBe('1,2');
  });

  it('handles null and undefined values as empty cells', () => {
    const csv = trialLogToCSV([{ a: null, b: undefined, c: 'ok' }]);
    const lines = csv.split('\n');
    expect(lines[1]).toBe(',,ok');
  });

  it('quotes strings containing commas', () => {
    const csv = trialLogToCSV([{ text: 'hello, world' }]);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('"hello, world"');
  });

  it('escapes double quotes inside strings', () => {
    const csv = trialLogToCSV([{ text: 'say "hi"' }]);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('"say ""hi"""');
  });

  it('unions keys across trials with different shapes', () => {
    const csv = trialLogToCSV([
      { a: 1, b: 2 },
      { b: 3, c: 4 }
    ]);
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    expect(headers).toContain('a');
    expect(headers).toContain('b');
    expect(headers).toContain('c');
    // Second row should have empty 'a' cell
    expect(lines.length).toBe(3); // header + 2 data rows
  });

  it('handles boolean values', () => {
    const csv = trialLogToCSV([{ correct: true, missed: false }]);
    expect(csv).toContain('true');
    expect(csv).toContain('false');
  });

  it('handles numeric values including 0', () => {
    const csv = trialLogToCSV([{ score: 0, rt: 500 }]);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('0,500');
  });

  it('handles strings with newlines', () => {
    const csv = trialLogToCSV([{ text: 'line1\nline2' }]);
    // Should not break CSV structure — value converted to string
    expect(csv.split('\n').length).toBeGreaterThanOrEqual(2);
  });

  it('handles large trial logs efficiently', () => {
    const trials = Array.from({ length: 1000 }, (_, i) => ({
      trialType: 'test',
      index: i,
      correct: i % 2 === 0,
      rt: Math.random() * 1000
    }));
    const csv = trialLogToCSV(trials);
    const lines = csv.split('\n');
    expect(lines.length).toBe(1001); // header + 1000 rows
  });

  it('handles trial with only one key', () => {
    const csv = trialLogToCSV([{ score: 85 }]);
    expect(csv).toBe('score\n85');
  });

  it('preserves special characters in non-quoted strings', () => {
    const csv = trialLogToCSV([{ stimulus: 'H₂O' }]);
    expect(csv).toContain('H₂O');
  });
});
