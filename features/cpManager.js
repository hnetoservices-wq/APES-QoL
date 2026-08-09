/**
 * APES QoL Extension
 * Module: Culture Point Manager
 *
 * - Opens as a normal APES toolbar panel.
 * - Scanning only starts when the user presses "Scan CP".
 * - Reads current/target CP from Main Building location 27.
 * - Skips city villages until a normal village is found.
 * - Opens Villages Overview -> Culture Points and reads total CP/day.
 * - Celebrations are intentionally not included yet.
 */

(function initCpManagerModule() {
    'use strict';

    const FEATURE_KEY = 'cpManager';
    const PANEL_ID = 'qol-cp-manager-panel';
    const TOGGLE_ID = 'qol-cp-toggle-btn';
    const STYLE_ID = 'qol-cp-manager-styles';
    const MENU_CHECKBOX_ID = 'qol-chk-cp-manager';
    const BUILDING_LOCATION = 27;
    const MAX_VILLAGE_HOPS = 100;

    let isScanning = false;

    function isEnabled() {
        if (typeof window.isQolEnabled === 'function') {
            return window.isQolEnabled(FEATURE_KEY) === true;
        }

        return localStorage.getItem(`qol_${FEATURE_KEY}`) !== 'false';
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function parseInteger(value) {
        const digits = String(value || '').replace(/[^0-9]/g, '');
        return digits ? Number.parseInt(digits, 10) : null;
    }

    function formatNumber(value) {
        return Number.isFinite(value)
            ? Number(value).toLocaleString('en-US')
            : '-';
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
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style = document.createElement('style');
        style.id = STYLE_ID;

        style.textContent = `
            #${TOGGLE_ID} {
                position: fixed !important;
                width: 30px !important;
                height: 30px !important;
                background-color: #ebdcb9 !important;
                border: 2px solid #7d6342 !important;
                border-radius: 50% !important;
                display: none;
                align-items: center !important;
                justify-content: center !important;
                cursor: pointer !important;
                z-index: 9999 !important;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25) !important;
                transition: transform 0.3s ease, background-color 0.2s, filter 0.2s, opacity 0.2s !important;
                box-sizing: border-box !important;
                padding: 0 !important;
                margin: 0 !important;
                user-select: none !important;
            }

            #${TOGGLE_ID}:hover {
                transform: scale(1.1) !important;
                background-color: #f7f5f0 !important;
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
                width: 450px !important;
                max-width: 94vw !important;
                min-height: 250px !important;
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
                background: linear-gradient(to bottom, #6d5436, #543f26) !important;
                color: #f7f5f0 !important;
                font-size: 14px !important;
                font-weight: bold !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
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
                gap: 9px !important;
                padding: 10px !important;
                background-color: #f7f5f0 !important;
            }

            #${PANEL_ID} .qol-cp-description {
                padding: 7px 9px !important;
                background-color: #fff6e5 !important;
                border: 1px solid #d4c2a5 !important;
                border-radius: 4px !important;
                color: #5b4630 !important;
                font-size: 11px !important;
                line-height: 1.4 !important;
            }

            #${PANEL_ID} .qol-cp-controls {
                display: flex !important;
                align-items: center !important;
                gap: 7px !important;
            }

            #${PANEL_ID} .qol-cp-action-btn {
                min-width: 120px !important;
                height: 28px !important;
                padding: 5px 11px !important;
                border: 1px solid #523d24 !important;
                border-radius: 3px !important;
                background: linear-gradient(to bottom, #7d6342, #543f26) !important;
                color: #ffffff !important;
                font-size: 11px !important;
                font-weight: bold !important;
                white-space: nowrap !important;
                cursor: pointer !important;
                user-select: none !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
            }

            #${PANEL_ID} .qol-cp-action-btn:not(.disabled):hover {
                filter: brightness(1.08) !important;
            }

            #${PANEL_ID} .qol-cp-action-btn.disabled {
                opacity: 0.45 !important;
                cursor: default !important;
                pointer-events: none !important;
            }

            #${PANEL_ID} .qol-cp-status {
                flex: 1 1 auto !important;
                min-height: 18px !important;
                color: #6c5a43 !important;
                font-size: 10px !important;
                line-height: 1.35 !important;
            }

            #${PANEL_ID} .qol-cp-status[data-tone="working"] {
                color: #8a5a16 !important;
                font-weight: bold !important;
            }

            #${PANEL_ID} .qol-cp-status[data-tone="success"] {
                color: #4f7328 !important;
                font-weight: bold !important;
            }

            #${PANEL_ID} .qol-cp-status[data-tone="error"] {
                color: #a52a2a !important;
                font-weight: bold !important;
            }

            #${PANEL_ID} .qol-cp-results {
                display: none;
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                gap: 7px !important;
            }

            #${PANEL_ID} .qol-cp-card {
                min-width: 0 !important;
                padding: 8px 10px !important;
                background-color: #ffffff !important;
                border: 1px solid #c7b99e !important;
                border-radius: 3px !important;
            }

            #${PANEL_ID} .qol-cp-card.highlight {
                background-color: #fff6e5 !important;
                border-color: #bda57e !important;
            }

            #${PANEL_ID} .qol-cp-card-label {
                display: block !important;
                margin-bottom: 4px !important;
                color: #6a573d !important;
                font-size: 9px !important;
                font-weight: bold !important;
                text-transform: uppercase !important;
                letter-spacing: 0.3px !important;
            }

            #${PANEL_ID} .qol-cp-card-value {
                display: block !important;
                color: #3f3020 !important;
                font-size: 16px !important;
                font-weight: bold !important;
                font-variant-numeric: tabular-nums !important;
            }

            #${PANEL_ID} .qol-cp-progress-box {
                display: none;
                padding: 8px 10px !important;
                background-color: #ffffff !important;
                border: 1px solid #c7b99e !important;
                border-radius: 3px !important;
            }

            #${PANEL_ID} .qol-cp-progress-head {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                gap: 8px !important;
                margin-bottom: 6px !important;
                color: #5b4630 !important;
                font-size: 10px !important;
                font-weight: bold !important;
            }

            #${PANEL_ID} .qol-cp-progress-track {
                height: 9px !important;
                border: 1px solid #b9a589 !important;
                border-radius: 8px !important;
                background-color: #eee8dc !important;
                overflow: hidden !important;
            }

            #${PANEL_ID} .qol-cp-progress-bar {
                height: 100% !important;
                width: 0;
                background: linear-gradient(to bottom, #7ea743, #5f8733) !important;
            }

            #${PANEL_ID} .qol-cp-meta {
                display: none;
                padding-top: 2px !important;
                color: #7a6a55 !important;
                font-size: 9px !important;
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

            if (text) {
                return text;
            }
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

    function positionPanelUnderButton(panel) {
        const toggleButton = document.getElementById(TOGGLE_ID);

        if (!toggleButton) {
            panel.style.setProperty('left', '20px', 'important');
            panel.style.setProperty('top', '80px', 'important');
            return;
        }

        const buttonRect = toggleButton.getBoundingClientRect();
        const panelWidth = panel.offsetWidth || 450;
        const panelHeight = panel.offsetHeight || 300;

        const maximumLeft = Math.max(10, window.innerWidth - panelWidth - 10);
        const maximumTop = Math.max(10, window.innerHeight - panelHeight - 10);

        const left = Math.max(10, Math.min(buttonRect.left, maximumLeft));
        const top = Math.max(10, Math.min(buttonRect.bottom + 20, maximumTop));

        panel.style.setProperty('left', `${left}px`, 'important');
        panel.style.setProperty('top', `${top}px`, 'important');
        panel.style.setProperty('right', 'auto', 'important');
        panel.style.setProperty('bottom', 'auto', 'important');
    }

    function setStatus(message, tone = 'neutral') {
        const status = document.querySelector(`#${PANEL_ID} .qol-cp-status`);

        if (!status) {
            return;
        }

        status.textContent = message;
        status.dataset.tone = tone;
    }

    function setScanButtonState(disabled, text) {
        const button = document.querySelector(`#${PANEL_ID} .qol-cp-scan-btn`);

        if (!button) {
            return;
        }

        button.classList.toggle('disabled', disabled);
        button.setAttribute('aria-disabled', disabled ? 'true' : 'false');

        if (text) {
            button.textContent = text;
        }
    }

    function renderResult(result) {
        const panel = document.getElementById(PANEL_ID);

        if (!panel) {
            return;
        }

        const results = panel.querySelector('.qol-cp-results');
        const progressBox = panel.querySelector('.qol-cp-progress-box');
        const progressBar = panel.querySelector('.qol-cp-progress-bar');
        const progressHead = panel.querySelector('.qol-cp-progress-head');
        const meta = panel.querySelector('.qol-cp-meta');

        const remaining = Math.max(0, result.target - result.current);
        const progress = result.target > 0
            ? Math.max(0, Math.min(100, (result.current / result.target) * 100))
            : 0;

        results.innerHTML = `
            <div class="qol-cp-card">
                <span class="qol-cp-card-label">Current CP</span>
                <span class="qol-cp-card-value">${formatNumber(result.current)}</span>
            </div>

            <div class="qol-cp-card">
                <span class="qol-cp-card-label">Target CP</span>
                <span class="qol-cp-card-value">${formatNumber(result.target)}</span>
            </div>

            <div class="qol-cp-card">
                <span class="qol-cp-card-label">Remaining CP</span>
                <span class="qol-cp-card-value">${formatNumber(remaining)}</span>
            </div>

            <div class="qol-cp-card highlight">
                <span class="qol-cp-card-label">Total CP / Day</span>
                <span class="qol-cp-card-value">${formatNumber(result.cpPerDay)}</span>
            </div>
        `;

        results.style.setProperty('display', 'grid', 'important');

        progressHead.innerHTML = `
            <span>${formatNumber(result.current)} / ${formatNumber(result.target)}</span>
            <span>${progress.toFixed(1)}%</span>
        `;

        progressBar.style.setProperty('width', `${progress.toFixed(2)}%`, 'important');
        progressBox.style.setProperty('display', 'block', 'important');

        meta.innerHTML = `
            CP requirement read from <strong>${escapeHtml(result.villageName)}</strong>${
                result.skippedCities > 0
                    ? ` after skipping ${result.skippedCities} ${result.skippedCities === 1 ? 'city' : 'cities'}.`
                    : '.'
            }
            Celebrations are not included in CP/day calculations yet.
        `;

        meta.style.setProperty('display', 'block', 'important');
    }

    function resetResults() {
        const panel = document.getElementById(PANEL_ID);

        if (!panel) {
            return;
        }

        const results = panel.querySelector('.qol-cp-results');
        const progressBox = panel.querySelector('.qol-cp-progress-box');
        const meta = panel.querySelector('.qol-cp-meta');

        results.innerHTML = '';
        results.style.setProperty('display', 'none', 'important');
        progressBox.style.setProperty('display', 'none', 'important');
        meta.innerHTML = '';
        meta.style.setProperty('display', 'none', 'important');
    }

    function mountPanel() {
        let panel = document.getElementById(PANEL_ID);

        if (panel) {
            return panel;
        }

        panel = document.createElement('div');
        panel.id = PANEL_ID;

        panel.innerHTML = `
            <div class="qol-cp-header">
                <span>CP Manager</span>
                <span class="qol-cp-close" title="Close">&times;</span>
            </div>

            <div class="qol-cp-body">
                <div class="qol-cp-description">
                    Scan your current culture points, next CP target and total culture point production per day.
                </div>

                <div class="qol-cp-controls">
                    <div class="qol-cp-action-btn qol-cp-scan-btn" role="button" tabindex="0">
                        Scan CP
                    </div>

                    <div class="qol-cp-status" data-tone="neutral">
                        Ready to scan.
                    </div>
                </div>

                <div class="qol-cp-results"></div>

                <div class="qol-cp-progress-box">
                    <div class="qol-cp-progress-head"></div>
                    <div class="qol-cp-progress-track">
                        <div class="qol-cp-progress-bar"></div>
                    </div>
                </div>

                <div class="qol-cp-meta"></div>
            </div>
        `;

        const closeButton = panel.querySelector('.qol-cp-close');
        const scanButton = panel.querySelector('.qol-cp-scan-btn');

        closeButton.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            panel.style.setProperty('display', 'none', 'important');
        });

        const startScan = event => {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }

            if (!isScanning) {
                scanCulturePoints();
            }
        };

        scanButton.addEventListener('click', startScan);
        scanButton.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                startScan(event);
            }
        });

        document.body.appendChild(panel);
        return panel;
    }

    function togglePanel() {
        const panel = mountPanel();
        const hidden = window.getComputedStyle(panel).display === 'none';

        if (!hidden) {
            panel.style.setProperty('display', 'none', 'important');
            return;
        }

        window.dispatchEvent(new CustomEvent('qol_close_others', {
            detail: {
                source: 'cpManager'
            }
        }));

        positionPanelUnderButton(panel);
        panel.style.setProperty('display', 'flex', 'important');
    }

    function mountToggleButton() {
        let toggleButton = document.getElementById(TOGGLE_ID);

        if (toggleButton) {
            return toggleButton;
        }

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

        const activate = event => {
            event.preventDefault();
            event.stopPropagation();
            togglePanel();
        };

        toggleButton.addEventListener('click', activate);
        toggleButton.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                activate(event);
            }
        });

        document.body.appendChild(toggleButton);

        if (typeof window.qolRepositionAllButtons === 'function') {
            window.qolRepositionAllButtons();
        }

        return toggleButton;
    }

    function positionToggleButton() {
        const toggleButton = document.getElementById(TOGGLE_ID) || mountToggleButton();
        const villageList = document.getElementById('villageList');

        if (!isEnabled() || !villageList) {
            toggleButton.style.setProperty('display', 'none', 'important');
            return;
        }

        const villageRect = villageList.getBoundingClientRect();

        if (villageRect.width <= 0 || villageRect.height <= 0) {
            toggleButton.style.setProperty('display', 'none', 'important');
            return;
        }

        const precedingButtonIds = [
            'qol-cog-btn',
            'qol-help-toggle-btn',
            'qol-ir-toggle-btn',
            'qol-wm-toggle-btn',
            'qol-watchlist-toggle',
            'qol-checklist-toggle-btn',
            'qol-npc-calc-toggle-btn',
            'qol-oasis-toggle-btn',
            'qol-report-archive-toggle'
        ];

        let nextLeft = villageRect.right + 20;

        precedingButtonIds.forEach(id => {
            const candidate = document.getElementById(id);

            if (!candidate || window.getComputedStyle(candidate).display === 'none') {
                return;
            }

            const rect = candidate.getBoundingClientRect();

            if (rect.width > 0 && rect.height > 0) {
                nextLeft = Math.max(nextLeft, rect.right + 6);
            }
        });

        toggleButton.style.setProperty('position', 'fixed', 'important');
        toggleButton.style.setProperty('left', `${nextLeft}px`, 'important');
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
        const featureGrid = document.querySelector('#qol-modal .qol-feature-grid');

        if (!featureGrid) {
            return;
        }

        let checkbox = featureGrid.querySelector(`#${MENU_CHECKBOX_ID}`);

        if (!checkbox) {
            const card = document.createElement('article');
            card.className = 'qol-feature-card';

            card.innerHTML = `
                <span class="qol-feature-icon" aria-hidden="true">CP</span>

                <div class="qol-feature-copy">
                    <h3 class="qol-feature-name">CP Manager</h3>

                    <p class="qol-feature-desc">
                        Reads your city-founding CP progress and total culture point production per day.
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

            featureGrid.appendChild(card);
            checkbox = card.querySelector(`#${MENU_CHECKBOX_ID}`);
        }

        checkbox.checked = isEnabled();

        if (checkbox.dataset.qolCpBound !== 'true') {
            checkbox.dataset.qolCpBound = 'true';

            checkbox.addEventListener('change', event => {
                setFeatureEnabled(Boolean(event.target.checked));
            });
        }

        const count = featureGrid.previousElementSibling?.querySelector('.qol-section-count');

        if (count) {
            const total = [...featureGrid.children].filter(child => {
                return child.classList.contains('qol-feature-card');
            }).length;

            count.textContent = `${total} tools`;
        }
    }

    function findTownBox() {
        return Array.from(document.querySelectorAll('.foundTown.contentBox'))
            .find(box => /city founding/i.test(box.textContent || '')) || null;
    }

    function readTownState() {
        const box = findTownBox();

        if (!box) {
            return null;
        }

        const table = box.querySelector('.townConditionTable');

        if (!table) {
            return null;
        }

        const cultureCell = table.querySelector('td[ng-if="!village.isTown"]');

        if (cultureCell) {
            const current = parseInteger(
                cultureCell.querySelector('.currentValue')?.textContent
            );

            const targetCandidates = Array.from(cultureCell.querySelectorAll('span'))
                .filter(element => !element.classList.contains('currentValue'))
                .map(element => parseInteger(element.textContent))
                .filter(Number.isFinite);

            const target = targetCandidates.length
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

        return cityMarker
            ? { type: 'city' }
            : null;
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

        window.location.hash = `#/${route.join('/')}`;
    }

    async function waitForTownState(timeoutMs = 7000) {
        const startedAt = performance.now();

        while (performance.now() - startedAt < timeoutMs) {
            const state = readTownState();

            if (state) {
                return state;
            }

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

            if (element) {
                return element;
            }
        }

        return null;
    }

    function clickVillageNavigation(direction) {
        const button = findVillageNavigationButton(direction);

        if (!button) {
            return false;
        }

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

            if (getVillageIdentity() !== previousIdentity) {
                return true;
            }
        }

        return false;
    }

    async function moveVillage(direction) {
        const previousIdentity = getVillageIdentity();

        if (!clickVillageNavigation(direction)) {
            return false;
        }

        if (!await waitForVillageChange(previousIdentity)) {
            return false;
        }

        await sleep(200);
        return true;
    }

    async function restoreStartingVillage(hops) {
        for (let index = 0; index < hops; index += 1) {
            if (!await moveVillage('previous')) {
                return false;
            }
        }

        return true;
    }

    function openCulturePointsOverview() {
        const currentHash = window.location.hash || '';
        const villageIdMatch = currentHash.match(/(?:^|\/)villId:([^/]+)/);
        const route = ['page:village'];

        if (villageIdMatch) {
            route.push(`villId:${villageIdMatch[1]}`);
        }

        route.push('window:villagesOverview');
        route.push('tab:CulturePoints');

        window.location.hash = `#/${route.join('/')}`;
    }

    function getCulturePointsTable() {
        return (
            document.querySelector(
                '.loadedTab.tabCulturePoints.currentTab .cpOverview table.villagesTable'
            ) ||
            document.querySelector(
                '.loadedTab.tabCulturePoints.activeTab .cpOverview table.villagesTable'
            ) ||
            document.querySelector(
                '.tabContentCulturePoints .loadedTab.tabCulturePoints .cpOverview table.villagesTable'
            ) ||
            document.querySelector(
                '.cpOverview table.villagesTable'
            )
        );
    }

    function readTotalCpPerDay() {
        const table = getCulturePointsTable();

        if (!table) {
            return null;
        }

        const headers = Array.from(table.querySelectorAll('thead th'))
            .map(header => header.textContent.replace(/\s+/g, ' ').trim());

        let cpColumnIndex = headers.findIndex(text => /CPs?\s*\/\s*day/i.test(text));

        if (cpColumnIndex < 0) {
            cpColumnIndex = 1;
        }

        const footerCells = table.querySelectorAll('tfoot tr td');
        const footerValue = parseInteger(footerCells[cpColumnIndex]?.textContent);

        if (Number.isFinite(footerValue)) {
            return footerValue;
        }

        let sum = 0;
        let foundRows = 0;

        table.querySelectorAll('tbody tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            const value = parseInteger(cells[cpColumnIndex]?.textContent);

            if (Number.isFinite(value)) {
                sum += value;
                foundRows += 1;
            }
        });

        return foundRows > 0 ? sum : null;
    }

    async function waitForTotalCpPerDay(timeoutMs = 7000) {
        const startedAt = performance.now();

        while (performance.now() - startedAt < timeoutMs) {
            const total = readTotalCpPerDay();

            if (Number.isFinite(total)) {
                return total;
            }

            await sleep(100);
        }

        return null;
    }

    async function scanCulturePoints() {
        if (isScanning || !isEnabled()) {
            return;
        }

        isScanning = true;

        const originalHash = window.location.hash;
        let hops = 0;
        let requirementResult = null;

        resetResults();
        setScanButtonState(true, 'Scanning...');
        setStatus('Opening Main Building and reading city-founding CP...', 'working');

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
                await sleep(200);

                const state = await waitForTownState();

                if (!state) {
                    throw new Error(
                        'The City founding section could not be found in Main Building location 27.'
                    );
                }

                if (state.type === 'village') {
                    requirementResult = {
                        current: state.current,
                        target: state.target,
                        villageName: getCurrentVillageName(),
                        skippedCities: hops
                    };

                    break;
                }

                setStatus(
                    `City detected in ${getCurrentVillageName()}. Checking the next village...`,
                    'working'
                );

                if (!await moveVillage('next')) {
                    throw new Error('The next-village control could not be used.');
                }

                hops += 1;

                if (getVillageIdentity() === startingIdentity) {
                    throw new Error(
                        'Every available village appears to be a city. No village CP requirement could be read.'
                    );
                }
            }

            if (!requirementResult) {
                throw new Error('Could not determine current and target CP.');
            }

            if (hops > 0) {
                setStatus(
                    'CP requirement found. Returning to the starting village...',
                    'working'
                );

                if (!await restoreStartingVillage(hops)) {
                    throw new Error('Could not return to the village where the scan started.');
                }
            }

            setStatus(
                'Opening Villages Overview and reading total CP/day...',
                'working'
            );

            openCulturePointsOverview();
            await sleep(250);

            const cpPerDay = await waitForTotalCpPerDay();

            if (!Number.isFinite(cpPerDay)) {
                throw new Error(
                    'The Culture Points overview opened, but total CP/day could not be read.'
                );
            }

            const result = {
                ...requirementResult,
                cpPerDay
            };

            if (window.location.hash !== originalHash) {
                window.location.hash = originalHash;
                await sleep(100);
            }

            renderResult(result);
            setStatus('CP scan complete.', 'success');
        } catch (error) {
            console.error('[APES CP Manager] Scan failed.', error);

            if (hops > 0) {
                try {
                    await restoreStartingVillage(hops);
                } catch (restoreError) {
                    console.warn(
                        '[APES CP Manager] Could not restore starting village after failure.',
                        restoreError
                    );
                }
            }

            if (window.location.hash !== originalHash) {
                window.location.hash = originalHash;
            }

            setStatus(
                error?.message || 'Could not scan culture point information.',
                'error'
            );
        } finally {
            isScanning = false;
            setScanButtonState(false, 'Scan CP');
            requestAnimationFrame(positionToggleButton);
        }
    }

    function destroyUI() {
        document.getElementById(PANEL_ID)?.remove();
        document.getElementById(TOGGLE_ID)?.remove();
        isScanning = false;
    }

    function ensureUI() {
        if (!document.body) {
            return;
        }

        ensureSettingsCard();

        if (!isEnabled()) {
            destroyUI();
            return;
        }

        injectStyles();
        mountPanel();
        mountToggleButton();
        positionToggleButton();
    }

    window.addEventListener('qol_setting_changed', event => {
        if (event.detail?.key === FEATURE_KEY) {
            ensureUI();
        }
    });

    window.addEventListener('qol_close_others', event => {
        if (event.detail?.source === 'cpManager') {
            return;
        }

        const panel = document.getElementById(PANEL_ID);

        if (panel) {
            panel.style.setProperty('display', 'none', 'important');
        }
    });

    window.addEventListener('resize', () => {
        positionToggleButton();

        const panel = document.getElementById(PANEL_ID);

        if (panel && window.getComputedStyle(panel).display !== 'none') {
            positionPanelUnderButton(panel);
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') {
            return;
        }

        const panel = document.getElementById(PANEL_ID);

        if (panel && window.getComputedStyle(panel).display !== 'none') {
            panel.style.setProperty('display', 'none', 'important');
        }
    }, true);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureUI, { once: true });
    } else {
        ensureUI();
    }

    window.setInterval(ensureUI, 1200);

    console.log('[APES CP Manager] Initialized.');
})();