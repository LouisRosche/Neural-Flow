import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { downloadFile } from '../../src/export.js';

describe('downloadFile', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a blob download link and clicks it', () => {
    const mockClick = vi.fn();
    const mockCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = mockCreateElement(tag);
      if (tag === 'a') {
        vi.spyOn(el, 'click').mockImplementation(mockClick);
      }
      return el;
    });

    const revokeURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    downloadFile('{"test": 1}', 'test.json', 'application/json');

    expect(mockClick).toHaveBeenCalledOnce();
    expect(revokeURL).toHaveBeenCalledOnce();
  });

  it('sets correct filename and href on download link', () => {
    let capturedAnchor = null;
    const mockCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = mockCreateElement(tag);
      if (tag === 'a') {
        capturedAnchor = el;
        vi.spyOn(el, 'click').mockImplementation(() => {});
      }
      return el;
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    downloadFile('data', 'results.csv', 'text/csv');

    expect(capturedAnchor).not.toBeNull();
    expect(capturedAnchor.download).toBe('results.csv');
    expect(capturedAnchor.href).toContain('blob:');
  });

  it('falls back to copy-paste modal when blob creation throws', () => {
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      throw new Error('Sandboxed');
    });

    downloadFile('fallback data', 'test.json', 'application/json');

    const modal = document.body.querySelector('div');
    expect(modal).not.toBeNull();
    expect(modal.querySelector('h3').textContent).toBe('Copy Your Data');
    expect(modal.querySelector('textarea').value).toBe('fallback data');
    expect(modal.querySelector('textarea').readOnly).toBe(true);
  });

  it('fallback modal close button removes the modal', () => {
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      throw new Error('Sandboxed');
    });

    downloadFile('data', 'test.json', 'application/json');

    const modal = document.body.querySelector('div');
    expect(modal).not.toBeNull();

    modal.querySelector('button').click();

    expect(document.body.querySelector('div')).toBeNull();
  });
});
