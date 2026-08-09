/**
 * APES QoL Extension
 * Module: Culture Point Manager
 *
 * First version:
 * - Opens Main Building location 27 for the active village.
 * - Reads the City founding Culture Points requirement.
 * - If the active village is already a city, moves to the next village until
 *   a normal village is found.
 * - Returns to the village that was active before the scan.
 * - Displays current CP, target CP, progress and remaining CP.
 */

(function initCpManagerModule() {
    'use strict';

    const FEATURE_KEY = 'cpManager';
    const TOGGLE_ID = 'qol-cp-toggle-btn';
    const PANEL_ID = 'qol-cp-manager-panel';
    const STYLE_ID = 'qol-cp-manager-styles';
    const MENU_CHECKBOX_ID = 'qol-chk-cp-manager';
    const MAX_VILLAGE_HOPS = 100;
    const BUILDING_LOCATION = 27;

    let scanInProgress = false;
    let toolbarPatchInstalled = false;

    function isEnabled() {
        return typeof window.isQolEnabled === 'function'
            ? window.isQolEnabled(FEATURE_KEY)
            : localStorage.getItem(`qol_${FEATURE_KEY}`) !== 'false';
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function parseInteger(value) {
        const digits = String(value || '').replace(/[^0-9]/g, '');
        return digits ? Number.parseInt(digits, 10) : null;
    }

    function formatNumber(value) {
        if (!Number.isFinite(value)) return '-';
        return value.toLocaleString('en-US');
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getCurrentVillageName() {
        const selectors = [
            '.currentVillageName.dropdown .selectedItem .villageEntry',
            '#villageList .currentVillageName .selectedItem .villageEntry',
            '.currentVillageName .villageEntry'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            const text = element?.textContent?.trim();
            if (text) return text;
        }

        return 'Current village';
    }

    function getVillageIdFromHash() {
        const match = window.location.hash.match(/(?:^|\/)villId:([^/]+)/);
        return match ? match[1] : null;
    }

    function getVillageIdentity() {
        const id = getVillageIdFromHash();
        const name = getCurrentVillageName();
        return id ? `id:${id}` : `name:${name}`;
    }

    function setFeatureEnabled(enabled) {
        try {
            localStorage.setItem(`qol_${FEATURE_KEY}`, String(enabled));
        } catch (error) {
            console.warn('[APES CP Manager] Failed to save feature state.', error);
        }

        window.dispatchEvent(new CustomEvent('qol_setting_changed', {
            detail: {
                key: FEATURE_KEY,
                enabled
            }
        }));
    }

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #${TOGGLE_ID} {
                position: fixed !important;
                width: 30px !important;
                height: 30px !important;
                display: none;
                align-items: center !important;
                justify-content: center !important;
                margin: 0 !important;
                padding: 0 !important;
                border: 2px solid #7d6342 !important;
                border-radius: 50% !important;
                background-color: #ebdcb9 !important;
                background-image: none !important;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
                color: #6b5234 !important;
                cursor: pointer !important;
                user-select: none !important;
                box-sizing: border-box !important;
                font-family: Arial, Helvetica, sans-serif !important;
                font-size: 9px !important;
                font-weight: 800 !important;
                line-height: 1 !important;
                letter-spacing: -0.3px !important;
                transition: transform 0.2s ease, background-color 0.2s ease !important;
                z-index: 9999 !important;
            }

            #${TOGGLE_ID}:hover {
                transform: scale(1.1) !important;
                background-color: #f7f5f0 !important;
            }

            #${TOGGLE_ID}:active {
                transform: scale(1) !important;
            }

            #${TOGGLE_ID}.qol-cp-scanning {
                cursor: wait !important;
                opacity: 0.72 !important;
            }

            body.qol-menu-open #${TOGGLE_ID} {
                filter: blur(3px) !important;
                opacity: 0.35 !important;
                pointer-events: none !important;
            }

            #${PANEL_ID},
            #${PANEL_ID} * {
                box-sizing: border-box !important;
                font-family: Arial, Helvetica, sans-serif !important;
                text-shadow: none !important;
            }

            #${PANEL_ID} {
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                width: min(390px, 92vw) !important;
                margin: 0 !important;
                padding: 0 !important;
                transform: translate(-50%, -50%) !important;
                border: 3px solid #634d31 !important;
                border-radius: 7px !important;
                background: #f7f5f0 !important;
                color: #332719 !important;
                box-shadow: 0 18px 48px rgba(0, 0, 0, 0.48) !important;
                overflow: hidden !important;
                z-index: 1000001 !important;
            }

            #${PANEL_ID} .qol-cp-header {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                min-height: 48px !important;
                padding: 9px 11px 9px 13px !important;
                border-bottom: 1px solid #3f2d19 !important;
                background: linear-gradient(to bottom, #6d5436, #4f3b24) !important;
                color: #fffaf0 !important;
            }

            #${PANEL_ID} .qol-cp-title {
                display: flex !important;
                flex-direction: column !important;
                gap: 1px !important;
            }

            #${PANEL_ID} .qol-cp-title strong {
                color: #fffaf0 !important;
                font-size: 13px !important;
                line-height: 17px !important;
            }

            #${PANEL_ID} .qol-cp-title span {
                color: #d7c8ad !important;
                font-size: 9px !important;
                line-height: 13px !important;
            }

            #${PANEL_ID} .qol-cp-close {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 28px !important;
                height: 28px !important;
                margin: 0 !important;
                padding: 0 !important;
                border: 0 !important;
                border-radius: 5px !important;
                background: rgba(0, 0, 0, 0.2) !important;
                color: #ffffff !important;
                font-size: 21px !important;
                font-weight: 700 !important;
                line-height: 1 !important;
                cursor: pointer !important;
            }

            #${PANEL_ID} .qol-cp-close:hover {
                background: rgba(255, 255, 255, 0.15) !important;
            }

            #${PANEL_ID} .qol-cp-body {
                padding: 14px !important;
                background: #f7f5f0 !important;
            }

            #${PANEL_ID} .qol-cp-status {
                margin: 0 !important;
                padding: 10px 11px !important;
                border: 1px solid #d6cab8 !important;
                border-radius: 5px !important;
                background: #ffffff !important;
                color: #665744 !important;
                font-size: 10px !important;
                line-height: 1.45 !important;
            }

            #${PANEL_ID} .qol-cp-result {
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 8px !important;
                margin-top: 10px !important;
            }

            #${PANEL_ID} .qol-cp-stat {
                padding: 9px 10px !important;
                border: 1px solid #d6cab8 !important;
                border-radius: 5px !important;
                background: #ffffff !important;
            }

            #${PANEL_ID} .qol-cp-stat-label {
                display: block !important;
                margin-bottom: 3px !important;
                color: #7a6a55 !important;
                font-size: 8.5px !important;
                font-weight: 700 !important;
                line-height: 12px !important;
                letter-spacing: 0.35px !important;
                text-transform: uppercase !important;
            }

            #${PANEL_ID} .qol-cp-stat-value {
                display: block !important;
                color: #3f3020 !important;
                font-size: 15px !important;
                font-weight: 800 !important;
                line-height: 19px !important;
            }

            #${PANEL_ID} .qol-cp-progress-wrap {
                margin-top: 10px !important;
                padding: 10px !important;
                border: 1px solid #d6cab8 !important;
                border-radius: 5px !important;
                background: #ffffff !important;
            }

            #${PANEL_ID} .qol-cp-progress-head {
                display: flex !important;
                justify-content: space-between !important;
                gap: 8px !important;
                margin-bottom: 6px !important;
                color: #5e4a33 !important;
                font-size: 9px !important;
                font-weight: 700 !important;
            }

            #${PANEL_ID} .qol-cp-progress-track {
                height: 10px !important;
                border: 1px solid #b9a589 !important;
                border-radius: 8px !important;
                background: #eee8dc !important;
                overflow: hidden !important;
            }

            #${PANEL_ID} .qol-cp-progress-bar {
                height: 100% !important;
                width: 0;
                background: linear-gradient(to bottom, #7ea743, #5f8733) !important;
                transition: width 0.25s ease !important;
            }

            #${PANEL_ID} .qol-cp-meta {
                margin-top: 9px !important;
                color: #7a6a55 !important;
                font-size: 9px !important;
                line-height: 1.45 !important;
            }

            #${PANEL_ID} .qol-cp-error {
                border-color: #c79a86 !important;
                background: #fff8f2 !important;
                color: #8f3f2f !important;
            }
        `;

        document.head.appendChild(style);
    }

    function createPanel() {
        let panel = document.getElementById(PANEL_ID);
        if (panel) return panel;

        panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.display = 'none';
        panel.innerHTML = `
            <div class="qol-cp-header">
                <div class="qol-cp-title">
                    <strong>CP Manager</strong>
                    <span>City founding culture point progress</span>
                </div>
                <button type="button" class="qol-cp-close" aria-label="Close CP Manager">&times;</button>
            </div>
            <div class="qol-cp-body">
                <div class="qol-cp-status">Ready to scan.</div>
                <div class="qol-cp-output"></div>
            </div>
        `;

        panel.querySelector('.qol-cp-close').addEventListener('click', () => {
            panel.style.display = 'none';
        });

        document.body.appendChild(panel);
        return panel;
    }

    function showPanel() {
        const panel = createPanel();
        panel.style.display = 'block';
        return panel;
    }

    function setPanelStatus(message, isError = false) {
        const panel = showPanel();
        const status = panel.querySelector('.qol-cp-status');
        const output = panel.querySelector('.qol-cp-output');

        status.textContent = message;
        status.classList.toggle('qol-cp-error', isError);

        if (isError && output) {
            output.innerHTML = '';
        }
    }

    function renderResult(result) {
        const panel = showPanel();
        const status = panel.querySelector('.qol-cp-status');
        const output = panel.querySelector('.qol-cp-output');

        const progress = result.target > 0
            ? Math.min(100, Math.max(0, (result.current / result.target) * 100))
            : 0;
        const remaining = Math.max(0, result.target - result.current);

        status.classList.remove('qol-cp-error');
        status.textContent = 'Culture point progress found.';

        output.innerHTML = `
            <div class="qol-cp-result">
                <div class="qol-cp-stat">
                    <span class="qol-cp-stat-label">Current CP</span>
                    <span class="qol-cp-stat-value">${formatNumber(result.current)}</span>
                </div>
                <div class="qol-cp-stat">
                    <span class="qol-cp-stat-label">Target CP</span>
                    <span class="qol-cp-stat-value">${formatNumber(result.target)}</span>
                </div>
                <div class="qol-cp-stat">
                    <span class="qol-cp-stat-label">Remaining</span>
                    <span class="qol-cp-stat-value">${formatNumber(remaining)}</span>
                </div>
                <div class="qol-cp-stat">
                    <span class="qol-cp-stat-label">Progress</span>
                    <span class="qol-cp-stat-value">${progress.toFixed(1)}%</span>
                </div>
            </div>
            <div class="qol-cp-progress-wrap">
                <div class="qol-cp-progress-head">
                    <span>${formatNumber(result.current)} / ${formatNumber(result.target)}</span>
                    <span>${progress.toFixed(1)}%</span>
                </div>
                <div class="qol-cp-progress-track">
                    <div class="qol-cp-progress-bar" style="width:${progress.toFixed(2)}%"></div>
                </div>
            </div>
            <div class="qol-cp-meta">
                Read from <strong>${escapeHtml(result.villageName)}</strong>${
                    result.skippedCities > 0
                        ? ` after skipping ${result.skippedCities} ${result.skippedCities === 1 ? 'city' : 'cities'}.`
                        : '.'
                }
            </div>
        `;
    }

    function createToolbarButton() {
        let button = document.getElementById(TOGGLE_ID);
        if (button) return button;

        button = document.createElement('button');
        button.type = 'button';
        button.id = TOGGLE_ID;
        button.title = 'CP Manager';
        button.setAttribute('aria-label', 'Open CP Manager');
        button.textContent = 'CP';

        button.addEventListener('click', () => {
            if (!scanInProgress) {
                scanCulturePoints();
            }
        });

        document.body.appendChild(button);
        return button;
    }

    function getToolbarAnchorButtons() {
        const ids = [
            'qol-cog-btn',
            'qol-help-toggle-btn',
            'qol-ir-toggle-btn',
            'qol-wm-toggle-btn',
            'qol-watchlist-toggle',
            'qol-checklist-toggle-btn',
            'qol-npc-calc-toggle-btn',
            'qol-oasis-toggle-btn'
        ];

        return ids
            .map(id => document.getElementById(id))
            .filter(Boolean)
            .filter(element => {
                const style = window.getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                return style.display !== 'none' && rect.width > 0 && rect.height > 0;
            });
    }

    function repositionToolbarButton() {
        const button = createToolbarButton();

        if (!isEnabled()) {
            button.style.setProperty('display', 'none', 'important');
            return;
        }

        const villageList = document.getElementById('villageList');
        if (!villageList) {
            button.style.setProperty('display', 'none', 'important');
            return;
        }

        const villageRect = villageList.getBoundingClientRect();
        if (villageRect.width <= 0 || villageRect.height <= 0) {
            button.style.setProperty('display', 'none', 'important');
            return;
        }

        const anchors = getToolbarAnchorButtons();
        let left = villageRect.right + 20;

        if (anchors.length) {
            left = Math.max(...anchors.map(element => element.getBoundingClientRect().right)) + 6;
        }

        button.style.setProperty('left', `${left}px`, 'important');
        button.style.setProperty('top', `${villageRect.top + 4}px`, 'important');
        button.style.setProperty('display', 'flex', 'important');
    }

    function patchToolbarRepositioner() {
        if (toolbarPatchInstalled) return;

        const original = window.qolRepositionAllButtons;
        if (typeof original !== 'function') return;

        window.qolRepositionAllButtons = function patchedQolRepositionAllButtons(...args) {
            const result = original.apply(this, args);
            requestAnimationFrame(repositionToolbarButton);
            return result;
        };

        toolbarPatchInstalled = true;
    }

    function ensureSettingsCard() {
        const modal = document.getElementById('qol-modal');
        if (!modal) return;

        let checkbox = modal.querySelector(`#${MENU_CHECKBOX_ID}`);

        if (!checkbox) {
            const grid = modal.querySelector('.qol-feature-grid');
            if (!grid) return;

            const card = document.createElement('article');
            card.className = 'qol-feature-card';
            card.innerHTML = `
                <span class="qol-feature-icon" aria-hidden="true">CP</span>
                <div class="qol-feature-copy">
                    <h3 class="qol-feature-name">CP Manager</h3>
                    <p class="qol-feature-desc">
                        Opens City founding and reads your current culture point progress toward the next city.
                    </p>
                </div>
                <label class="qol-switch" title="Toggle CP Manager">
                    <input type="checkbox" id="${MENU_CHECKBOX_ID}" class="qol-checkbox">
                    <span class="qol-switch-track" aria-hidden="true"></span>
                    <span class="qol-visually-hidden">Toggle CP Manager</span>
                </label>
            `;

            grid.appendChild(card);
            checkbox = card.querySelector(`#${MENU_CHECKBOX_ID}`);

            const coreSection = grid.previousElementSibling;
            const count = coreSection?.querySelector('.qol-section-count');
            if (count) {
                const toolCount = grid.querySelectorAll('.qol-feature-card').length;
                count.textContent = `${toolCount} tools`;
            }
        }

        if (!checkbox.dataset.qolCpBound) {
            checkbox.dataset.qolCpBound = 'true';
            checkbox.addEventListener('change', event => {
                setFeatureEnabled(Boolean(event.target.checked));
            });
        }

        checkbox.checked = isEnabled();
    }

    function findTownBox() {
        return Array.from(document.querySelectorAll('.foundTown.contentBox')).find(box => {
            return /city founding/i.test(box.textContent || '');
        }) || null;
    }

    function readTownState() {
        const box = findTownBox();
        if (!box) return null;

        const table = box.querySelector('.townConditionTable');
        if (!table) return null;

        const cultureCell = table.querySelector('td[ng-if="!village.isTown"]');

        if (cultureCell) {
            const currentElement = cultureCell.querySelector('.currentValue');
            const current = parseInteger(currentElement?.textContent);

            const values = Array.from(cultureCell.querySelectorAll('span'))
                .filter(element => !element.classList.contains('currentValue'))
                .map(element => parseInteger(element.textContent))
                .filter(Number.isFinite);

            const target = values.length ? values[values.length - 1] : null;

            if (Number.isFinite(current) && Number.isFinite(target)) {
                return {
                    type: 'village',
                    current,
                    target,
                    box
                };
            }
        }

        const cityMarker =
            table.classList.contains('town') ||
            Boolean(table.querySelector('td[ng-if="village.isTown"]')) ||
            Boolean(box.querySelector('.buildingDescription span[ng-if="village.isTown"]'));

        if (cityMarker) {
            return {
                type: 'city',
                box
            };
        }

        return null;
    }

    function openCityFoundingWindow() {
        const hash = window.location.hash || '';
        const villageIdMatch = hash.match(/(?:^|\/)villId:([^/]+)/);
        const parts = ['page:village'];

        if (villageIdMatch) {
            parts.push(`villId:${villageIdMatch[1]}`);
        }

        parts.push(`location:${BUILDING_LOCATION}`, 'window:building');
        const nextHash = `#/${parts.join('/')}`;

        if (window.location.hash !== nextHash) {
            window.location.hash = nextHash;
        }
    }

    async function waitForTownState(timeoutMs = 6000) {
        const start = performance.now();

        while (performance.now() - start < timeoutMs) {
            const state = readTownState();
            if (state) return state;
            await sleep(100);
        }

        return null;
    }

    function findVillageNavigationButton(direction) {
        const selectors = [
            `.currentVillageName.dropdown a.navigation.${direction}.clickable`,
            `#villageList a.navigation.${direction}.clickable`,
            `a.navigation.${direction}[clickable="${direction}Village()"]`
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }

        return null;
    }

    function triggerVillageChange(direction) {
        if (typeof window.changeVillage === 'function') {
            window.changeVillage(direction);
            return true;
        }

        if (typeof changeVillage === 'function') {
            changeVillage(direction);
            return true;
        }

        const button = findVillageNavigationButton(direction);
        if (!button) return false;

        button.dispatchEvent(new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        }));

        return true;
    }

    async function waitForVillageChange(previousIdentity, timeoutMs = 5000) {
        const start = performance.now();

        while (performance.now() - start < timeoutMs) {
            await sleep(100);
            const identity = getVillageIdentity();
            if (identity !== previousIdentity) return identity;
        }

        return null;
    }

    async function moveVillage(direction) {
        const before = getVillageIdentity();
        const triggered = triggerVillageChange(direction);
        if (!triggered) return false;

        const changed = await waitForVillageChange(before);
        if (!changed) return false;

        await sleep(150);
        return true;
    }

    async function restoreStartingVillage(hops) {
        for (let index = 0; index < hops; index += 1) {
            const moved = await moveVillage('previous');
            if (!moved) return false;
        }

        return true;
    }

    async function scanCulturePoints() {
        if (scanInProgress || !isEnabled()) return;

        scanInProgress = true;
        const button = createToolbarButton();
        const originalHash = window.location.hash;
        let hops = 0;

        button.classList.add('qol-cp-scanning');
        setPanelStatus('Opening City founding and reading culture points...');

        try {
            openCityFoundingWindow();
            await sleep(200);

            const firstIdentity = getVillageIdentity();
            const visited = new Set();

            for (let attempt = 0; attempt < MAX_VILLAGE_HOPS; attempt += 1) {
                const identity = getVillageIdentity();

                if (visited.has(identity)) {
                    throw new Error('Every available village appears to be a city. No village CP requirement could be read.');
                }

                visited.add(identity);
                openCityFoundingWindow();
                await sleep(200);

                const state = await waitForTownState();
                if (!state) {
                    throw new Error('The City founding section could not be found in Main Building location 27.');
                }

                if (state.type === 'village') {
                    const result = {
                        current: state.current,
                        target: state.target,
                        villageName: getCurrentVillageName(),
                        skippedCities: hops
                    };

                    if (hops > 0) {
                        setPanelStatus('Culture points found. Returning to your starting village...');
                        await restoreStartingVillage(hops);
                    }

                    if (window.location.hash !== originalHash) {
                        window.location.hash = originalHash;
                        await sleep(100);
                    }

                    renderResult(result);
                    return;
                }

                setPanelStatus(`City detected in ${getCurrentVillageName()}. Checking the next village...`);

                const moved = await moveVillage('next');
                if (!moved) {
                    throw new Error('The next-village control could not be used.');
                }

                hops += 1;

                if (getVillageIdentity() === firstIdentity) {
                    throw new Error('Every available village appears to be a city. No village CP requirement could be read.');
                }
            }

            throw new Error('The CP scan stopped after too many village checks.');
        } catch (error) {
            console.error('[APES CP Manager] Scan failed.', error);

            if (hops > 0) {
                try {
                    await restoreStartingVillage(hops);
                } catch (restoreError) {
                    console.warn('[APES CP Manager] Could not restore the starting village.', restoreError);
                }
            }

            if (window.location.hash !== originalHash) {
                window.location.hash = originalHash;
            }

            setPanelStatus(error?.message || 'Could not read culture point progress.', true);
        } finally {
            scanInProgress = false;
            button.classList.remove('qol-cp-scanning');
            requestAnimationFrame(repositionToolbarButton);
        }
    }

    function syncFeatureState() {
        const button = createToolbarButton();

        if (!isEnabled()) {
            button.style.setProperty('display', 'none', 'important');
            const panel = document.getElementById(PANEL_ID);
            if (panel) panel.style.display = 'none';
        } else {
            repositionToolbarButton();
        }

        ensureSettingsCard();
    }

    function initialise() {
        injectStyles();
        createToolbarButton();
        createPanel();
        ensureSettingsCard();
        patchToolbarRepositioner();
        syncFeatureState();

        window.addEventListener('qol_setting_changed', event => {
            if (event.detail?.key === FEATURE_KEY) {
                syncFeatureState();
            }
        });

        window.addEventListener('resize', repositionToolbarButton);
        window.addEventListener('hashchange', () => {
            requestAnimationFrame(repositionToolbarButton);
        });

        const observer = new MutationObserver(() => {
            ensureSettingsCard();
            patchToolbarRepositioner();
            repositionToolbarButton();
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        setInterval(() => {
            patchToolbarRepositioner();
            ensureSettingsCard();
            repositionToolbarButton();
        }, 1500);

        console.log('[APES CP Manager] Initialized.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialise, { once: true });
    } else {
        initialise();
    }
})();