import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportData } from '../../src/export.js';

// Mock showFeedback
vi.mock('../../src/ui.js', () => ({
  showFeedback: vi.fn()
}));

import { showFeedback } from '../../src/ui.js';

describe('exportData', () => {
  let downloadedFiles;

  beforeEach(() => {
    downloadedFiles = [];
    // Mock URL.createObjectURL and the download mechanism
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = origCreate(tag);
      if (tag === 'a') {
        vi.spyOn(el, 'click').mockImplementation(() => {
          downloadedFiles.push({
            filename: el.download,
            href: el.href
          });
        });
      }
      return el;
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports only summary JSON when trial log is empty', () => {
    const state = {
      user: { name: 'Alice', age: 12, grade: 6 },
      gameScores: { memory: 80, attention: 70 },
      currentDifficulty: 2,
      history: [],
      trialLog: []
    };

    exportData(state);

    // Only 1 file downloaded (summary JSON)
    expect(downloadedFiles).toHaveLength(1);
    expect(downloadedFiles[0].filename).toContain('summary');
    expect(downloadedFiles[0].filename).toContain('alice');
    expect(downloadedFiles[0].filename).toMatch(/\.json$/);

    expect(showFeedback).toHaveBeenCalledWith(
      expect.stringContaining('no trial data'),
      'success'
    );
  });

  it('exports 3 files when trial log has data', () => {
    const state = {
      user: { name: 'Bob Smith', age: 14, grade: 9 },
      gameScores: { memory: 85, attention: 90, flexibility: 75, speed: 80 },
      currentDifficulty: 3,
      history: [],
      trialLog: [
        { game: 'memory', correct: true, rt: 500 },
        { game: 'attention', correct: false, rt: 300 }
      ]
    };

    exportData(state);

    // 3 files: summary JSON, trial CSV, trial JSON
    expect(downloadedFiles).toHaveLength(3);
    expect(downloadedFiles[0].filename).toContain('summary');
    expect(downloadedFiles[1].filename).toContain('trials');
    expect(downloadedFiles[1].filename).toMatch(/\.csv$/);
    expect(downloadedFiles[2].filename).toContain('trials');
    expect(downloadedFiles[2].filename).toMatch(/\.json$/);

    // Slug from name
    expect(downloadedFiles[0].filename).toContain('bob_smith');

    expect(showFeedback).toHaveBeenCalledWith(
      expect.stringContaining('summary + trial-level'),
      'success'
    );
  });

  it('filters history to only include current user sessions', () => {
    const state = {
      user: { name: 'Alice', age: 12, grade: 6 },
      gameScores: { memory: 80 },
      currentDifficulty: 1,
      history: [
        { user: { name: 'Alice' }, scores: { memory: 70 } },
        { user: { name: 'Bob' }, scores: { memory: 60 } },
        { user: { name: 'Alice' }, scores: { attention: 85 } }
      ],
      trialLog: []
    };

    exportData(state);

    expect(downloadedFiles).toHaveLength(1);
  });

  it('handles user with no name gracefully', () => {
    const state = {
      user: null,
      gameScores: { memory: 80 },
      currentDifficulty: 1,
      history: [],
      trialLog: []
    };

    exportData(state);

    expect(downloadedFiles).toHaveLength(1);
    expect(downloadedFiles[0].filename).toContain('unknown');
  });
});
