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
    const BUILDING_LOCATION = 27;
    const MAX_VILLAGE_HOPS = 100;

    let scanInProgress = false;

    function isEnabled() {
        if (typeof window.isQolEnabled === 'function') {
            return window.isQolEnabled(FEATURE_KEY) === true;
        }

        try {
            return localStorage.getItem(`qol_${FEATURE_KEY}`) !== 'false';
        } catch (error) {
            return true;
        }
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
        return Number(value).toLocaleString();
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;

        style.textContent = `
            /*
             * Toolbar button deliberately mirrors the same APES toolbar
             * styling used by menu.js and the other feature modules.
             * It is a DIV rather than a native game BUTTON so Travian does
             * not attach its own button styling/behaviour to it.
             */
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
                cursor: pointer !important;
                user-select: none !important;
                box-sizing: border-box !important;
                transition:
                    transform 0.2s ease,
                    background-color 0.2s ease,
                    opacity 0.2s ease !important;
                z-index: 9999 !important;
            }

            #${TOGGLE_ID}:hover {
                transform: scale(1.1) !important;
                background-color: #f7f5f0 !important;
            }

            #${TOGGLE_ID}:active {
                transform: scale(1) !important;
            }

            #${TOGGLE_ID} svg {
                width: 18px !important;
                height: 18px !important;
                fill: none !important;
                stroke: #7d6342 !important;
                stroke-width: 2 !important;
                stroke-linecap: round !important;
                stroke-linejoin: round !important;
                display: block !important;
                pointer-events: none !important;
            }

            #${TOGGLE_ID}.qol-cp-scanning {
                opacity: 0.55 !important;
                cursor: wait !important;
                pointer-events: none !important;
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
                display: none;
                flex-direction: column !important;
                width: 430px !important;
                max-width: 94vw !important;
                min-height: 220px !important;
                margin: 0 !important;
                padding: 0 !important;
                border: 3px solid #634d31 !important;
                border-radius: 4px !important;
                background-color: #f7f5f0 !important;
                color: #333333 !important;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
                overflow: hidden !important;
                z-index: 999999 !important;
            }

            #${PANEL_ID} .qol-cp-header {
                height: 34px !important;
                padding: 6px 10px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                background: linear-gradient(to bottom, #6d5436, #543f26) !important;
                color: #f7f5f0 !important;
                font-size: 14px !important;
                font-weight: bold !important;
                user-select: none !important;
            }

            #${PANEL_ID} .qol-cp-close {
                cursor: pointer !important;
                color: #ffffff !important;
                font-size: 21px !important;
                font-weight: bold !important;
                line-height: 1 !important;
                padding: 0 5px !important;
                border-radius: 3px !important;
                background-color: rgba(0, 0, 0, 0.2) !important;
                user-select: none !important;
            }

            #${PANEL_ID} .qol-cp-close:hover {
                background-color: rgba(255, 255, 255, 0.16) !important;
            }

            #${PANEL_ID} .qol-cp-body {
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
                padding: 10px !important;
                background-color: #f7f5f0 !important;
            }

            #${PANEL_ID} .qol-cp-status {
                padding: 7px 9px !important;
                background-color: #fff6e5 !important;
                border: 1px solid #d4c2a5 !important;
                border-radius: 4px !important;
                color: #5b4630 !important;
                font-size: 11px !important;
                line-height: 1.4 !important;
            }

            #${PANEL_ID} .qol-cp-status.qol-cp-error {
                background-color: #fff3ef !important;
                border-color: #c99b89 !important;
                color: #a52a2a !important;
                font-weight: bold !important;
            }

            #${PANEL_ID} .qol-cp-result-grid {
                display: grid !important;
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 6px !important;
            }

            #${PANEL_ID} .qol-cp-card {
                min-width: 0 !important;
                padding: 8px 10px !important;
                background-color: #ffffff !important;
                border: 1px solid #c7b99e !important;
                border-radius: 3px !important;
            }

            #${PANEL_ID} .qol-cp-card-label {
                display: block !important;
                margin-bottom: 4px !important;
                color: #6a573d !important;
                font-size: 10px !important;
                font-weight: bold !important;
                text-transform: uppercase !important;
                letter-spacing: 0.3px !important;
            }

            #${PANEL_ID} .qol-cp-card-value {
                display: block !important;
                color: #3f3020 !important;
                font-size: 15px !important;
                font-weight: bold !important;
            }

            #${PANEL_ID} .qol-cp-progress-box {
                padding: 8px 10px !important;
                background-color: #ffffff !important;
                border: 1px solid #c7b99e !important;
                border-radius: 3px !important;
            }

            #${PANEL_ID} .qol-cp-progress-head {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                gap: 10px !important;
                margin-bottom: 6px !important;
                color: #5b4630 !important;
                font-size: 10px !important;
                font-weight: bold !important;
            }

            #${PANEL_ID} .qol-cp-progress-track {
                width: 100% !important;
                height: 10px !important;
                border: 1px solid #bda57e !important;
                border-radius: 6px !important;
                background-color: #e9dfcc !important;
                overflow: hidden !important;
            }

            #${PANEL_ID} .qol-cp-progress-bar {
                height: 100% !important;
                background: linear-gradient(to bottom, #7da544, #5c8038) !important;
            }

            #${PANEL_ID} .qol-cp-meta {
                padding: 7px 9px !important;
                background-color: #ffffff !important;
                border: 1px solid #c7b99e !important;
                border-radius: 3px !important;
                color: #6c5a43 !important;
                font-size: 10px !important;
                line-height: 1.4 !important;
            }
        `;

        document.head.appendChild(style);
    }

    function getCurrentVillageName() {
        const selectors = [
            '.currentVillageName.dropdown .selectedItem .villageEntry',
            '#villageList .currentVillageName .selectedItem .villageEntry',
            '.currentVillageName .villageEntry',
            '.villageEntry.active',
            '.active .villageEntry'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            const text = element?.textContent?.replace(/[\r\n]+/g, ' ').trim();

            if (text) return text;
        }

        return 'Current village';
    }

    function getVillageIdFromHash() {
        const match = (window.location.hash || '').match(/(?:^|\/)villId:([^/]+)/);
        return match ? match[1] : null;
    }

    function getVillageIdentity() {
        const id = getVillageIdFromHash();
        return id ? `id:${id}` : `name:${getCurrentVillageName()}`;
    }

    function createPanel() {
        let panel = document.getElementById(PANEL_ID);
        if (panel) return panel;

        panel = document.createElement('div');
        panel.id = PANEL_ID;

        panel.innerHTML = `
            <div class="qol-cp-header">
                <span>CP Manager</span>
                <span class="qol-cp-close" title="Close">&times;</span>
            </div>

            <div class="qol-cp-body">
                <div class="qol-cp-status">
                    Select the CP toolbar button to scan your culture point progress.
                </div>

                <div class="qol-cp-output"></div>
            </div>
        `;

        panel.querySelector('.qol-cp-close').addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            panel.style.setProperty('display', 'none', 'important');
        });

        document.body.appendChild(panel);
        return panel;
    }

    function positionPanelUnderButton(panel) {
        const toggleButton = document.getElementById(TOGGLE_ID);

        if (!toggleButton) {
            panel.style.setProperty('left', '20px', 'important');
            panel.style.setProperty('top', '80px', 'important');
            return;
        }

        const buttonRect = toggleButton.getBoundingClientRect();
        const panelWidth = panel.offsetWidth || 430;
        const panelHeight = panel.offsetHeight || 260;

        const maximumLeft = Math.max(10, window.innerWidth - panelWidth - 10);
        const maximumTop = Math.max(10, window.innerHeight - panelHeight - 10);

        const left = Math.max(10, Math.min(buttonRect.left, maximumLeft));
        const top = Math.max(10, Math.min(buttonRect.bottom + 20, maximumTop));

        panel.style.setProperty('left', `${left}px`, 'important');
        panel.style.setProperty('top', `${top}px`, 'important');
        panel.style.setProperty('right', 'auto', 'important');
        panel.style.setProperty('bottom', 'auto', 'important');
    }

    function showPanel() {
        const panel = createPanel();
        positionPanelUnderButton(panel);
        panel.style.setProperty('display', 'flex', 'important');
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
            ? Math.max(0, Math.min(100, (result.current / result.target) * 100))
            : 0;

        const remaining = Math.max(0, result.target - result.current);

        status.classList.remove('qol-cp-error');
        status.textContent = 'Culture point progress found.';

        output.innerHTML = `
            <div class="qol-cp-result-grid">
                <div class="qol-cp-card">
                    <span class="qol-cp-card-label">Current CP</span>
                    <span class="qol-cp-card-value">${formatNumber(result.current)}</span>
                </div>

                <div class="qol-cp-card">
                    <span class="qol-cp-card-label">Target CP</span>
                    <span class="qol-cp-card-value">${formatNumber(result.target)}</span>
                </div>

                <div class="qol-cp-card">
                    <span class="qol-cp-card-label">Remaining</span>
                    <span class="qol-cp-card-value">${formatNumber(remaining)}</span>
                </div>

                <div class="qol-cp-card">
                    <span class="qol-cp-card-label">Progress</span>
                    <span class="qol-cp-card-value">${progress.toFixed(1)}%</span>
                </div>
            </div>

            <div class="qol-cp-progress-box">
                <div class="qol-cp-progress-head">
                    <span>${formatNumber(result.current)} / ${formatNumber(result.target)}</span>
                    <span>${progress.toFixed(1)}%</span>
                </div>

                <div class="qol-cp-progress-track">
                    <div
                        class="qol-cp-progress-bar"
                        style="width:${progress.toFixed(2)}% !important;"
                    ></div>
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

    function mountToggleButton() {
        let toggleButton = document.getElementById(TOGGLE_ID);
        if (toggleButton) return toggleButton;

        toggleButton = document.createElement('div');
        toggleButton.id = TOGGLE_ID;
        toggleButton.setAttribute('title', 'CP Manager');
        toggleButton.setAttribute('role', 'button');
        toggleButton.setAttribute('tabindex', '0');
        toggleButton.setAttribute('aria-label', 'Open CP Manager');

        toggleButton.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 19V5"></path>
                <path d="M4 19h16"></path>
                <path d="M7 15l3-4 3 2 4-6"></path>
                <path d="M16 7h3v3"></path>
            </svg>
        `;

        toggleButton.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();

            if (!scanInProgress) {
                scanCulturePoints();
            }
        });

        toggleButton.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;

            event.preventDefault();
            event.stopPropagation();

            if (!scanInProgress) {
                scanCulturePoints();
            }
        });

        document.body.appendChild(toggleButton);
        return toggleButton;
    }

    function positionToggleButton() {
        const toggleButton = document.getElementById(TOGGLE_ID) || mountToggleButton();

        if (!isEnabled()) {
            toggleButton.style.setProperty('display', 'none', 'important');
            return;
        }

        const villageList = document.getElementById('villageList');

        if (!villageList) {
            toggleButton.style.setProperty('display', 'none', 'important');
            return;
        }

        const villageRect = villageList.getBoundingClientRect();

        if (villageRect.width <= 0 || villageRect.height <= 0) {
            toggleButton.style.setProperty('display', 'none', 'important');
            return;
        }

        const toolbarIds = [
            'qol-cog-btn',
            'qol-help-toggle-btn',
            'qol-ir-toggle-btn',
            'qol-wm-toggle-btn',
            'qol-watchlist-toggle',
            'qol-checklist-toggle-btn',
            'qol-npc-calc-toggle-btn',
            'qol-oasis-toggle-btn'
        ];

        const visibleButtons = toolbarIds
            .map(id => document.getElementById(id))
            .filter(Boolean)
            .filter(element => {
                const computed = window.getComputedStyle(element);
                const rect = element.getBoundingClientRect();

                return computed.display !== 'none' &&
                    computed.visibility !== 'hidden' &&
                    rect.width > 0 &&
                    rect.height > 0;
            });

        let left = villageRect.right + 20;

        if (visibleButtons.length > 0) {
            left = Math.max(
                ...visibleButtons.map(element => element.getBoundingClientRect().right)
            ) + 6;
        }

        toggleButton.style.setProperty('position', 'fixed', 'important');
        toggleButton.style.setProperty('left', `${left}px`, 'important');
        toggleButton.style.setProperty('top', `${villageRect.top + 4}px`, 'important');
        toggleButton.style.setProperty('width', '30px', 'important');
        toggleButton.style.setProperty('height', '30px', 'important');
        toggleButton.style.setProperty('display', 'flex', 'important');
        toggleButton.style.setProperty('z-index', '9999', 'important');
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
                    <input
                        type="checkbox"
                        id="${MENU_CHECKBOX_ID}"
                        class="qol-checkbox"
                    >

                    <span class="qol-switch-track" aria-hidden="true"></span>
                    <span class="qol-visually-hidden">Toggle CP Manager</span>
                </label>
            `;

            grid.appendChild(card);
            checkbox = card.querySelector(`#${MENU_CHECKBOX_ID}`);

            const sectionHeading = grid.previousElementSibling;
            const countElement = sectionHeading?.querySelector('.qol-section-count');

            if (countElement) {
                const count = grid.querySelectorAll('.qol-feature-card').length;
                countElement.textContent = `${count} tools`;
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
        return Array.from(document.querySelectorAll('.foundTown.contentBox'))
            .find(box => /city founding/i.test(box.textContent || '')) || null;
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

            const targetCandidates = Array.from(cultureCell.querySelectorAll('span'))
                .filter(element => !element.classList.contains('currentValue'))
                .map(element => parseInteger(element.textContent))
                .filter(Number.isFinite);

            const target = targetCandidates.length > 0
                ? targetCandidates[targetCandidates.length - 1]
                : null;

            if (Number.isFinite(current) && Number.isFinite(target)) {
                return {
                    type: 'village',
                    current,
                    target
                };
            }
        }

        const cityMarker =
            table.classList.contains('town') ||
            Boolean(table.querySelector('td[ng-if="village.isTown"]')) ||
            Boolean(box.querySelector('.buildingDescription span[ng-if="village.isTown"]'));

        if (cityMarker) {
            return {
                type: 'city'
            };
        }

        return null;
    }

    function openCityFoundingWindow() {
        const currentHash = window.location.hash || '';
        const villageIdMatch = currentHash.match(/(?:^|\/)villId:([^/]+)/);
        const route = ['page:village'];

        if (villageIdMatch) {
            route.push(`villId:${villageIdMatch[1]}`);
        }

        route.push(`location:${BUILDING_LOCATION}`);
        route.push('window:building');

        const targetHash = `#/${route.join('/')}`;

        if (window.location.hash !== targetHash) {
            window.location.hash = targetHash;
        }
    }

    async function waitForTownState(timeoutMs = 7000) {
        const startedAt = performance.now();

        while (performance.now() - startedAt < timeoutMs) {
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

    function clickVillageNavigation(direction) {
        const button = findVillageNavigationButton(direction);
        if (!button) return false;

        button.dispatchEvent(new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            composed: true,
            button: 0
        }));

        return true;
    }

    async function waitForVillageChange(previousIdentity, timeoutMs = 5000) {
        const startedAt = performance.now();

        while (performance.now() - startedAt < timeoutMs) {
            await sleep(100);

            const identity = getVillageIdentity();
            if (identity !== previousIdentity) return true;
        }

        return false;
    }

    async function moveVillage(direction) {
        const previousIdentity = getVillageIdentity();

        if (!clickVillageNavigation(direction)) {
            return false;
        }

        const changed = await waitForVillageChange(previousIdentity);

        if (!changed) {
            return false;
        }

        await sleep(200);
        return true;
    }

    async function restoreStartingVillage(hops) {
        for (let index = 0; index < hops; index += 1) {
            const moved = await moveVillage('previous');

            if (!moved) {
                return false;
            }
        }

        return true;
    }

    async function scanCulturePoints() {
        if (scanInProgress || !isEnabled()) return;

        scanInProgress = true;

        const toggleButton = document.getElementById(TOGGLE_ID) || mountToggleButton();
        const originalHash = window.location.hash;
        let hops = 0;

        toggleButton.classList.add('qol-cp-scanning');

        window.dispatchEvent(new CustomEvent('qol_close_others', {
            detail: {
                source: 'cpManager'
            }
        }));

        setPanelStatus('Opening City founding and reading culture points...');

        try {
            openCityFoundingWindow();
            await sleep(250);

            const startingIdentity = getVillageIdentity();
            const visited = new Set();

            for (let attempt = 0; attempt < MAX_VILLAGE_HOPS; attempt += 1) {
                const identity = getVillageIdentity();

                if (visited.has(identity)) {
                    throw new Error(
                        'Every available village appears to be a city. No village CP requirement could be read.'
                    );
                }

                visited.add(identity);

                openCityFoundingWindow();
                await sleep(250);

                const state = await waitForTownState();

                if (!state) {
                    throw new Error(
                        'The City founding section could not be found in Main Building location 27.'
                    );
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

                setPanelStatus(
                    `City detected in ${getCurrentVillageName()}. Checking the next village...`
                );

                const moved = await moveVillage('next');

                if (!moved) {
                    throw new Error('The next-village control could not be used.');
                }

                hops += 1;

                if (getVillageIdentity() === startingIdentity) {
                    throw new Error(
                        'Every available village appears to be a city. No village CP requirement could be read.'
                    );
                }
            }

            throw new Error('The CP scan stopped after too many village checks.');
        } catch (error) {
            console.error('[APES CP Manager] Scan failed.', error);

            if (hops > 0) {
                try {
                    await restoreStartingVillage(hops);
                } catch (restoreError) {
                    console.warn(
                        '[APES CP Manager] Could not restore the starting village.',
                        restoreError
                    );
                }
            }

            if (window.location.hash !== originalHash) {
                window.location.hash = originalHash;
            }

            setPanelStatus(
                error?.message || 'Could not read culture point progress.',
                true
            );
        } finally {
            scanInProgress = false;
            toggleButton.classList.remove('qol-cp-scanning');
            requestAnimationFrame(positionToggleButton);
        }
    }

    function destroyUI() {
        const toggleButton = document.getElementById(TOGGLE_ID);
        const panel = document.getElementById(PANEL_ID);

        if (toggleButton) toggleButton.remove();
        if (panel) panel.remove();

        scanInProgress = false;
    }

    function ensureUI() {
        if (!document.body) return;

        if (!isEnabled()) {
            destroyUI();
            ensureSettingsCard();
            return;
        }

        injectStyles();
        createPanel();
        mountToggleButton();
        ensureSettingsCard();

        if (typeof window.qolRepositionAllButtons === 'function') {
            window.qolRepositionAllButtons();
        }

        requestAnimationFrame(positionToggleButton);
    }

    window.addEventListener('qol_setting_changed', event => {
        if (event.detail?.key === FEATURE_KEY) {
            ensureUI();
        }
    });

    window.addEventListener('qol_close_others', event => {
        if (event.detail?.source === 'cpManager') return;

        const panel = document.getElementById(PANEL_ID);

        if (panel) {
            panel.style.setProperty('display', 'none', 'important');
        }
    });

    window.addEventListener('resize', () => {
        requestAnimationFrame(positionToggleButton);
    });

    window.addEventListener('hashchange', () => {
        requestAnimationFrame(positionToggleButton);
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;

        const panel = document.getElementById(PANEL_ID);

        if (panel && window.getComputedStyle(panel).display !== 'none') {
            panel.style.setProperty('display', 'none', 'important');
        }
    }, true);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureUI, {
            once: true
        });
    } else {
        ensureUI();
    }

    window.setInterval(ensureUI, 1200);

    console.log('[APES CP Manager] Module initialized.');
})();