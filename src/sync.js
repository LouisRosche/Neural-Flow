// sync.js — Google Sheets sync logic for Neural Flow

import { showFeedback } from './ui.js';

/**
 * Validate a Google Apps Script URL.
 */
export function isValidSheetsUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' &&
            parsed.hostname === 'script.google.com';
    } catch {
        return false;
    }
}

/**
 * Update the sync status indicator element.
 */
export function updateSyncStatus(syncStatusEl, status) {
    if (!syncStatusEl) return;
    syncStatusEl.className = 'sync-status ' + status;
}

/**
 * Sync a game result to Google Sheets.
 *
 * @param {Object} options
 * @param {string} options.sheetsUrl - The Google Apps Script web app URL
 * @param {Object} options.user - The current user object
 * @param {string} options.gameId - The game identifier
 * @param {number} options.score - The game score
 * @param {number} options.currentDifficulty - Current difficulty level
 * @param {number} options.gameStart - Timestamp when game started
 * @param {string} options.integrityChecksum - Integrity status
 * @param {HTMLElement} options.syncStatusEl - The sync status DOM element
 * @param {Array} options.unsyncedResults - Array to store failed sync payloads
 * @param {number} options.maxUnsynced - Max unsynced results to keep
 */
export function syncToSheets(options) {
    const {
        sheetsUrl,
        user,
        gameId,
        score,
        currentDifficulty,
        gameStart,
        integrityChecksum,
        syncStatusEl,
        unsyncedResults,
        maxUnsynced
    } = options;

    if (!sheetsUrl) return;

    if (!isValidSheetsUrl(sheetsUrl)) {
        updateSyncStatus(syncStatusEl, 'disconnected');
        return;
    }

    const userData = user || {};
    const payload = {
        timestamp: new Date().toISOString(),
        student: userData.name || '',
        age: userData.age || '',
        grade: userData.grade || '',
        teacher: userData.teacher || '',
        period: userData.period || '',
        game: gameId,
        score: score,
        difficulty: currentDifficulty,
        duration: Math.round((Date.now() - gameStart) / 1000),
        integrity: integrityChecksum === 'unverified' ? 'unverified' : 'verified'
    };

    updateSyncStatus(syncStatusEl, 'syncing');

    fetch(sheetsUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
    }).then(() => {
        updateSyncStatus(syncStatusEl, 'connected');
    }).catch((err) => {
        console.warn('Sheets sync failed:', err);
        updateSyncStatus(syncStatusEl, 'disconnected');
        showFeedback('Sync failed \u2014 data saved locally', 'warning');
        if (unsyncedResults.length < maxUnsynced) {
            unsyncedResults.push(payload);
        }
    });
}
