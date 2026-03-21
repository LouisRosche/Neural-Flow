import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createAttentionState,
  buildAttentionUI,
  spawnTarget,
  handleTargetClick,
  endAttentionTask,
  updateAttentionDisplay
} from '../../src/games/attention.js';

describe('spawnTarget logic', () => {
  let area;
  let state;
  let loggedTrials;
  let completedScore;

  beforeEach(() => {
    vi.useFakeTimers();
    area = document.createElement('div');
    area.id = 'targetArea';
    area.style.width = '500px';
    area.style.height = '400px';
    // jsdom doesn't compute layout — stub offsetWidth/Height
    Object.defineProperty(area, 'offsetWidth', { value: 500 });
    Object.defineProperty(area, 'offsetHeight', { value: 400 });
    document.body.appendChild(area);

    state = createAttentionState(1); // 6 targets
    loggedTrials = [];
    completedScore = null;
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  function makeCtx(overrides = {}) {
    return {
      attentionState: state,
      currentDifficulty: 1,
      currentGame: 'attention',
      gameTimeout: (fn, delay) => setTimeout(fn, delay),
      logTrial: (data) => loggedTrials.push(data),
      completeTask: (score) => { completedScore = score; },
      ...overrides
    };
  }

  it('does nothing when currentGame is not attention', () => {
    buildAttentionUI(area, state);
    const ctx = makeCtx({ currentGame: 'memory' });
    spawnTarget(ctx);
    // No targets should be spawned
    expect(area.querySelectorAll('.target').length).toBe(0);
  });

  it('does nothing when attentionState is null', () => {
    const ctx = makeCtx({ attentionState: null });
    spawnTarget(ctx);
    // No error thrown, no targets spawned
    expect(area.querySelectorAll('.target').length).toBe(0);
  });

  it('does nothing when task is already completed', () => {
    buildAttentionUI(area, state);
    state.completed = true;
    const ctx = makeCtx();
    spawnTarget(ctx);
    expect(state.els.targetArea.querySelectorAll('.target').length).toBe(0);
  });

  it('spawns a target element in the target area', () => {
    buildAttentionUI(area, state);
    // Force Math.random to produce predictable results
    // random > 0.3 => isTarget, random < 0.3 => distractor
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const ctx = makeCtx();
    spawnTarget(ctx);

    const targets = state.els.targetArea.querySelectorAll('.target');
    expect(targets.length).toBe(1);
    expect(targets[0].classList.contains('blue')).toBe(true);
    expect(targets[0].dataset.isTarget).toBe('true');
    expect(state.targetsShown).toBe(1);
  });

  it('spawns distractor (red) when schedule dictates', () => {
    buildAttentionUI(area, state);
    // Advance scheduleIndex to a distractor slot.
    // The schedule interleaves targets and distractors deterministically.
    // Find the first distractor index in the schedule.
    const distractorIdx = state.schedule.findIndex(isTarget => !isTarget);
    expect(distractorIdx).toBeGreaterThanOrEqual(0);

    // Skip ahead to the distractor slot
    state.scheduleIndex = distractorIdx;

    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.5) // x position
      .mockReturnValueOnce(0.5); // y position

    const ctx = makeCtx();
    spawnTarget(ctx);

    const targets = state.els.targetArea.querySelectorAll('.target');
    expect(targets.length).toBe(1);
    expect(targets[0].classList.contains('red')).toBe(true);
    expect(targets[0].dataset.isTarget).toBe('false');
    expect(state.distractorsShown).toBe(1);
  });

  it('sets accessible attributes on spawned targets', () => {
    buildAttentionUI(area, state);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const ctx = makeCtx();
    spawnTarget(ctx);

    const target = state.els.targetArea.querySelector('.target');
    expect(target.getAttribute('role')).toBe('button');
    expect(target.getAttribute('tabindex')).toBe('0');
    expect(target.getAttribute('aria-label')).toContain('Blue target');
  });

  it('auto-removes missed targets after timeout and increments misses', () => {
    buildAttentionUI(area, state);
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // blue target

    const ctx = makeCtx();
    spawnTarget(ctx);

    expect(state.els.targetArea.querySelectorAll('.target').length).toBe(1);
    expect(state.misses).toBe(0);

    // Advance past target timeout (ATTENTION_TARGET_BASE_MS - difficulty * ATTENTION_TARGET_DIFF_MS)
    // defaults: 2000 - 1*200 = 1800ms
    vi.advanceTimersByTime(2000);

    expect(state.misses).toBe(1);
    expect(loggedTrials.length).toBe(1);
    expect(loggedTrials[0].trialType).toBe('attention_miss');
  });

  it('handleTargetClick ignores double-clicks (handled guard)', () => {
    buildAttentionUI(area, state);
    const dot = document.createElement('div');
    dot.className = 'target blue';
    dot.dataset.isTarget = 'true';
    dot.dataset.spawnTime = String(Date.now());
    dot.dataset.handled = 'false';
    dot.style.left = '100px';
    dot.style.top = '100px';
    state.els.targetArea.appendChild(dot);
    state.active.push(dot);

    const ctx = makeCtx();

    // First click
    handleTargetClick(dot, ctx);
    expect(state.hits).toBe(1);

    // Second click (should be ignored)
    handleTargetClick(dot, ctx);
    expect(state.hits).toBe(1); // unchanged
  });

  it('endAttentionTask handles edge case of 0 distractors', () => {
    state.hits = 5;
    state.misses = 1;
    state.falsePositives = 0;
    state.targetsShown = 6;
    state.distractorsShown = 0;

    const ctx = makeCtx();
    endAttentionTask(ctx);

    expect(completedScore).toBeGreaterThanOrEqual(0);
    expect(completedScore).toBeLessThanOrEqual(100);
  });

  it('updateAttentionDisplay handles null els gracefully', () => {
    // Should not throw
    updateAttentionDisplay(null);
    updateAttentionDisplay({ els: null });
    updateAttentionDisplay(undefined);
  });
});
