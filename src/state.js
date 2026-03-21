// state.js — State management for Neural Flow

import { STORAGE_KEY, CHECKSUM_SALT } from './config.js';

/**
 * Create the initial application state.
 */
export function createInitialState() {
    return {
        user: null,
        currentGame: null,
        currentTask: 0,
        currentDifficulty: 1,
        taskScores: [],
        gameScores: {},
        sessionStart: null,
        gameStart: null,
        history: [],
        storageAvailable: false,
        trialLog: []
    };
}

/**
 * Test whether localStorage is available.
 */
export function testStorage() {
    try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Generate a checksum for data integrity.
 */
export function generateChecksum(data) {
    const str = JSON.stringify(data.history) + data.timestamp + CHECKSUM_SALT;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

/**
 * Verify a checksum on loaded data.
 */
export function verifyChecksum(data) {
    if (!data.checksum) return false;
    const expected = generateChecksum(data);
    return data.checksum === expected;
}

/**
 * Load saved state (history) from localStorage.
 * Returns the history array or empty array.
 */
export function loadState(storageAvailable) {
    if (!storageAvailable) return [];

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            if (verifyChecksum(data)) {
                return data.history || [];
            }
        }
    } catch (error) {
        // Silently fail
    }
    return [];
}

/**
 * Save state (history) to localStorage with checksum.
 */
export function saveState(history, storageAvailable) {
    if (!storageAvailable) return;

    try {
        const data = {
            history: history.slice(-100),
            timestamp: Date.now()
        };
        data.checksum = generateChecksum(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            const trimmed = history.slice(-50);
            try {
                const data = {
                    history: trimmed,
                    timestamp: Date.now()
                };
                data.checksum = generateChecksum(data);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch (e) {
                console.warn('Could not save state even after trimming:', e);
            }
        }
    }
}

