/**
 * APES QoL Extension
 * Module: CP Runtime Helpers
 *
 * - Mirrors the Watchlist update overlay while CP Manager performs its
 *   automated navigation.
 * - Keeps the planner's Extra CP / Day display discrete: celebration CP is
 *   granted when a celebration starts, not continuously by the minute.
 */
(function initCpRuntimeHelpers() {
    'use strict';

    const PANEL_ID = 'qol-cp-manager-panel';
    const PLANNER_ID = 'qol-cp-planner-panel';
    const OVERLAY_ID = 'qol-cp-scan-overlay';
    const POLL_MS = 100;
    const DAY_SECONDS = 24 * 60 * 60;

    function getScanButton() {
        return document.querySelector(`#${PANEL_ID} .qol-cp-scan-btn`);
    }

    function getStatusElement() {
        return document.querySelector(`#${PANEL_ID} .qol-cp-status`);
    }

    function isCpScanning() {
        const button = getScanButton();
        if (!button) return false;

        return (
            button.classList.contains('disabled') ||
            button.getAttribute('aria-disabled') === 'true'
        );
    }

    function getStatusText() {
        const text = getStatusElement()?.textContent?.replace(/\s+/g, ' ').trim();
        return text || 'Scanning culture point information...';
    }

    function createOverlay() {
        let overlay = document.getElementById(OVERLAY_ID);
        if (overlay) return overlay;

        overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.setAttribute('role', 'status');
        overlay.setAttribute('aria-live', 'polite');
        overlay.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background-color: rgba(0, 0, 0, 0.7) !important;
            z-index: 2147483646 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: white !important;
            font-family: Arial, sans-serif !important;
            font-size: 15px !important;
            font-weight: bold !important;
            flex-direction: column !important;
            gap: 8px !important;
            text-align: center !important;
            cursor: wait !important;
            user-select: none !important;
            pointer-events: auto !important;
        `;

        const title = document.createElement('div');
        title.textContent = 'Scanning CP...';

        const status = document.createElement('div');
        status.className = 'qol-cp-scan-overlay-status';
        status.style.cssText = `
            max-width: min(520px, 80vw) !important;
            font-size: 11px !important;
            font-weight: normal !important;
            color: #dddddd !important;
            line-height: 1.45 !important;
        `;
        status.textContent = getStatusText();

        const hint = document.createElement('div');
        hint.style.cssText = `
            margin-top: 2px !important;
            font-size: 10px !important;
            font-weight: normal !important;
            color: #aaaaaa !important;
        `;
        hint.textContent = 'Please wait while APES checks your villages and Town Halls.';

        overlay.appendChild(title);
        overlay.appendChild(status);
        overlay.appendChild(hint);
        document.body.appendChild(overlay);

        return overlay;
    }

    function updateOverlay() {
        const overlay = document.getElementById(OVERLAY_ID);
        if (!overlay) return;

        const status = overlay.querySelector('.qol-cp-scan-overlay-status');
        if (status) status.textContent = getStatusText();
    }

    function removeOverlay() {
        document.getElementById(OVERLAY_ID)?.remove();
    }

    function syncOverlay() {
        if (!document.body) return;

        if (isCpScanning()) {
            createOverlay();
            updateOverlay();
        } else {
            removeOverlay();
        }
    }

    function parseDurationSeconds(value) {
        const match = String(value || '').trim().match(/^(\d+):(\d{2}):(\d{2})$/);
        if (!match) return null;

        const hours = Number.parseInt(match[1], 10);
        const minutes = Number.parseInt(match[2], 10);
        const seconds = Number.parseInt(match[3], 10);

        if (
            !Number.isFinite(hours) ||
            !Number.isFinite(minutes) ||
            !Number.isFinite(seconds)
        ) {
            return null;
        }

        return (hours * 3600) + (minutes * 60) + seconds;
    }

    function parseRewardFromCell(cell) {
        const title = String(cell?.title || '');
        const match = title.match(/([\d,.]+)\s+CP\s+(?:per celebration|from one planned celebration)/i);
        if (!match) return null;

        const value = Number.parseInt(match[1].replace(/[^0-9]/g, ''), 10);
        return Number.isFinite(value) ? value : null;
    }

    function formatNumber(value) {
        return Number(value).toLocaleString('en-US', {
            maximumFractionDigits: 0
        });
    }

    function getStartsPer24Hours(durationSeconds) {
        if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0;

        // CP is awarded at the START of a celebration. A 24/7 plan therefore
        // counts every start that can occur inside the next 24-hour cycle,
        // including the first start at t=0.
        return Math.ceil(DAY_SECONDS / durationSeconds);
    }

    function syncPlannerDiscreteCp() {
        const planner = document.getElementById(PLANNER_ID);
        if (!planner || getComputedStyle(planner).display === 'none') return;

        let total247CpPerDay = 0;

        planner.querySelectorAll('.qol-cp-plan-row').forEach(row => {
            const level = Number.parseInt(
                row.querySelector('.qol-cp-level-select')?.value || '0',
                10
            );
            const run247 = Boolean(row.querySelector('.qol-cp-247-check')?.checked);
            const durationCell = row.querySelector('.qol-cp-plan-duration');
            const contributionCell = row.querySelector('.qol-cp-plan-cpday');

            if (!contributionCell || level <= 0) return;

            const reward = parseRewardFromCell(contributionCell);
            if (!Number.isFinite(reward) || reward <= 0) return;

            if (!run247) {
                const oneOffText = formatNumber(reward);
                if (contributionCell.textContent !== oneOffText) {
                    contributionCell.textContent = oneOffText;
                }
                contributionCell.title = `${oneOffText} CP from one planned celebration`;
                return;
            }

            const durationSeconds = parseDurationSeconds(durationCell?.textContent);
            const startsPerDay = getStartsPer24Hours(durationSeconds);
            const extraCpPerDay = reward * startsPerDay;

            total247CpPerDay += extraCpPerDay;

            const extraText = formatNumber(extraCpPerDay);
            const rewardText = formatNumber(reward);

            if (contributionCell.textContent !== extraText) {
                contributionCell.textContent = extraText;
            }

            contributionCell.title = (
                `${rewardText} CP per celebration × ${startsPerDay} ` +
                `${startsPerDay === 1 ? 'start' : 'starts'} in 24h = ` +
                `${extraText} CP/day`
            );
        });

        const totalElement = planner.querySelector('.qol-cp-plan-celebrations');
        if (totalElement) {
            const totalText = formatNumber(total247CpPerDay);
            if (totalElement.textContent !== totalText) {
                totalElement.textContent = totalText;
            }
        }

        const note = planner.querySelector('.qol-cp-plan-note');
        if (note) {
            note.innerHTML = `
                Every village with a selected Town Hall level plans <strong>one</strong>
                selected celebration. Leave <strong>24/7</strong> unticked to count that
                celebration once; tick it to repeat continuously. For 24/7 rows,
                <strong>Extra CP / Day</strong> counts whole celebration starts inside a
                24-hour cycle because CP is granted when each celebration starts; it is
                not prorated by minute. Big Celebration becomes available at Town Hall
                level 10. Town Hall construction/upgrade time and resource costs are not
                included yet.
            `;
        }
    }

    function syncRuntimeHelpers() {
        syncOverlay();
        syncPlannerDiscreteCp();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncRuntimeHelpers, { once: true });
    } else {
        syncRuntimeHelpers();
    }

    window.setInterval(syncRuntimeHelpers, POLL_MS);

    window.addEventListener('pagehide', removeOverlay);
    window.addEventListener('beforeunload', removeOverlay);

    console.log('[APES CP Manager] Runtime helpers initialized.');
})();
