// export.js — Export logic for Neural Flow

import { showFeedback } from './ui.js';

/**
 * Trigger a file download. Falls back to a copy-paste modal in sandboxed environments.
 */
export function downloadFile(content, filename, type) {
    try {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        // Fallback for sandboxed environments
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:10px;box-shadow:0 0 20px rgba(0,0,0,0.3);z-index:9999;max-width:90%;max-height:90%;overflow:auto;';
        const heading = document.createElement('h3');
        heading.textContent = 'Copy Your Data';
        modal.appendChild(heading);
        const textarea = document.createElement('textarea');
        textarea.style.cssText = 'width:100%;max-width:400px;height:300px;font-family:monospace;';
        textarea.readOnly = true;
        textarea.value = content;
        modal.appendChild(textarea);
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn';
        closeBtn.textContent = 'Close';
        closeBtn.style.marginTop = '1rem';
        closeBtn.addEventListener('click', () => modal.remove());
        modal.appendChild(closeBtn);
        document.body.appendChild(modal);
        textarea.select();
    }
}

/**
 * Convert trial log array to CSV string.
 */
export function trialLogToCSV(trialLog) {
    if (trialLog.length === 0) return '';
    // Collect all unique keys across all trials
    const allKeys = new Set();
    trialLog.forEach(t => Object.keys(t).forEach(k => allKeys.add(k)));
    const headers = Array.from(allKeys);
    const rows = trialLog.map(trial =>
        headers.map(h => {
            const val = trial[h];
            if (val === null || val === undefined) return '';
            if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                return '"' + val.replace(/"/g, '""') + '"';
            }
            return String(val);
        }).join(',')
    );
    return headers.join(',') + '\n' + rows.join('\n');
}

/**
 * Export all session data: summary JSON, trial CSV, and trial JSON.
 */
export function exportData(state) {
    // Filter history to only include current student's sessions (privacy)
    const currentName = state.user ? state.user.name : null;
    const filteredHistory = currentName
        ? state.history.filter(h => h.user && h.user.name === currentName)
        : [];

    const timestamp = Date.now();
    const studentSlug = (currentName || 'unknown').replace(/\s+/g, '_').toLowerCase();

    // 1. Summary JSON (game-level scores + metadata)
    const summaryData = {
        exportVersion: 2,
        user: state.user,
        session: {
            date: new Date().toISOString(),
            scores: state.gameScores,
            difficulty: state.currentDifficulty,
            integrity: state.integrityChecksum === 'unverified' ? 'unverified' : 'verified'
        },
        history: filteredHistory,
        trialCount: state.trialLog.length
    };
    downloadFile(
        JSON.stringify(summaryData, null, 2),
        `neural-flow-summary-${studentSlug}-${timestamp}.json`,
        'application/json'
    );

    // 2. Trial-level CSV (raw research data)
    if (state.trialLog.length > 0) {
        const csv = trialLogToCSV(state.trialLog);
        downloadFile(
            csv,
            `neural-flow-trials-${studentSlug}-${timestamp}.csv`,
            'text/csv'
        );
    }

    // 3. Trial-level JSON (full fidelity for programmatic analysis)
    if (state.trialLog.length > 0) {
        const trialData = {
            exportVersion: 2,
            user: state.user,
            sessionDate: new Date().toISOString(),
            trials: state.trialLog
        };
        downloadFile(
            JSON.stringify(trialData, null, 2),
            `neural-flow-trials-${studentSlug}-${timestamp}.json`,
            'application/json'
        );
    }

    showFeedback(
        state.trialLog.length > 0
            ? 'Exported: summary + trial-level data (JSON + CSV)'
            : 'Summary data exported (no trial data yet)',
        'success'
    );
}
