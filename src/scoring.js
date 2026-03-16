// scoring.js — Scoring utilities for Neural Flow

import { ADAPTIVE_UP, ADAPTIVE_DOWN, MAX_DIFFICULTY, GRADE_CONTENT } from './config.js';

/**
 * Inverse error function approximation (for z-score / d-prime).
 */
export function inverseErf(x) {
    const a = 0.147;
    const s = Math.sign(x);
    x = Math.abs(x);
    const b = 2 / (Math.PI * a) + Math.log(1 - x * x) / 2;
    const c = Math.log(1 - x * x) / a;
    return s * Math.sqrt(Math.sqrt(b * b - c) - b);
}

/**
 * Convert a probability to a z-score (probit).
 * Clamps p to [0.01, 0.99] to avoid infinities.
 */
export function zScore(p) {
    p = Math.max(0.01, Math.min(0.99, p));
    return Math.sqrt(2) * inverseErf(2 * p - 1);
}

/**
 * Fisher-Yates shuffle (unbiased). Returns a new array.
 */
export function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Adjust difficulty based on last task score.
 * Returns the new difficulty value.
 */
export function adaptDifficulty(currentDifficulty, lastScore) {
    if (lastScore >= ADAPTIVE_UP) {
        return Math.min(currentDifficulty + 1, MAX_DIFFICULTY);
    } else if (lastScore < ADAPTIVE_DOWN) {
        return Math.max(currentDifficulty - 1, 1);
    }
    return currentDifficulty;
}

/**
 * Resolve grade-appropriate content (rules + formulas).
 * Follows the inheritance chain and falls back to grade 6.
 */
export function getGradeContent(grade) {
    let content = GRADE_CONTENT[grade];
    while (content && content.inherit) {
        content = GRADE_CONTENT[content.inherit];
    }
    if (!content || !content.rules) {
        content = GRADE_CONTENT['6'];
    }
    return content;
}
