// scoring.js — Scoring utilities for Neural Flow

import { ADAPTIVE_UP, ADAPTIVE_DOWN, MAX_DIFFICULTY, GRADE_CONTENT, DIFFICULTY_BONUS_PER_LEVEL } from './config.js';

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
 * Log-linear correction for hit/false-alarm rates (Hautus, 1995).
 * Avoids extreme z-scores from 0% or 100% rates with small samples.
 * @param {number} count - Number of events (hits or false alarms)
 * @param {number} total - Number of opportunities (signal or noise trials)
 * @returns {number} Corrected rate in (0, 1)
 */
export function logLinearRate(count, total) {
    if (total <= 0) return 0.5;
    return (count + 0.5) / (total + 1);
}

/**
 * Additive difficulty bonus: rewards performance at higher difficulty.
 * @param {number} difficulty - Difficulty level (1–5)
 * @returns {number} Bonus points to add to raw score
 */
export function difficultyBonus(difficulty) {
    return (difficulty - 1) * DIFFICULTY_BONUS_PER_LEVEL;
}

/**
 * Compute difficulty-adjusted average from parallel score/difficulty arrays.
 * Each task's raw score receives an additive bonus based on its difficulty,
 * then the adjusted scores are averaged and capped at 100.
 * @param {number[]} scores - Raw task scores (0–100)
 * @param {number[]} difficulties - Difficulty level per task (1–5)
 * @returns {number} Adjusted average (0–100)
 */
export function adjustedAverage(scores, difficulties) {
    if (scores.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < scores.length; i++) {
        const d = difficulties[i] || 1;
        sum += Math.min(100, scores[i] + difficultyBonus(d));
    }
    return Math.round(sum / scores.length);
}

/**
 * Standard Error of Measurement from a set of task scores.
 * Uses the standard error of the mean (SEM = SD / sqrt(N)).
 * @param {number[]} scores
 * @returns {number|null} SEM rounded to nearest integer, or null if < 2 scores
 */
export function computeSEM(scores) {
    if (scores.length < 2) return null;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / (scores.length - 1);
    return Math.round(Math.sqrt(variance / scores.length));
}

/**
 * Chance-corrected accuracy for multiple-choice tasks.
 * Removes the guessing baseline so 0 = chance, 1 = perfect.
 * @param {number} accuracy - Raw accuracy (0–1)
 * @param {number} numChoices - Number of response options
 * @returns {number} Corrected accuracy (0–1), floored at 0
 */
export function chanceCorrect(accuracy, numChoices) {
    if (numChoices <= 1) return accuracy;
    const chance = 1 / numChoices;
    return Math.max(0, (accuracy - chance) / (1 - chance));
}

/**
 * Resolve grade-appropriate content (rules + formulas).
 * Follows the inheritance chain and falls back to grade 6.
 */
export function getGradeContent(grade) {
    let content = GRADE_CONTENT[grade];
    // Follow inheritance chain (with depth limit to prevent cycles)
    const seen = new Set();
    while (content && content.inherit) {
        if (seen.has(content.inherit)) break; // circular reference guard
        seen.add(content.inherit);
        content = GRADE_CONTENT[content.inherit];
    }
    if (!content || !content.rules) {
        content = GRADE_CONTENT['6'];
    }
    return content;
}
