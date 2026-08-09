/**
 * APES QoL Extension
 * Module: CP Scan Screen Lock
 *
 * Mirrors the Watchlist update overlay while CP Manager performs its
 * automated navigation. The CP scanner itself remains the source of truth:
 * while its Scan CP button is disabled, the game screen is locked.
 */
(function initCpScanLock() {
    'use strict';

    const PANEL_ID = 'qol-cp-manager-panel';
    const OVERLAY_ID = 'qol-cp-scan-overlay';
    const POLL_MS = 100;

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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncOverlay, { once: true });
    } else {
        syncOverlay();
    }

    window.setInterval(syncOverlay, POLL_MS);

    window.addEventListener('pagehide', removeOverlay);
    window.addEventListener('beforeunload', removeOverlay);

    console.log('[APES CP Manager] Scan screen lock initialized.');
})();
