/**
 * APES QoL Extension
 * Module: CP Manager Town Hall Scanner
 *
 * Runs after a successful CP Manager scan.
 * Cycles through every owned village and detects Town Hall directly from the
 * rendered village DOM:
 *   Town Hall = img.location.buildingId24
 *   Level     = .buildingLevel inside the same building-location
 *   Location  = buildingImageXX / buildingLocationXX
 *
 * The scan restores the starting village and page when complete.
 */

(function initCpTownHallScanner() {
    'use strict';

    const FEATURE_KEY = 'cpManager';
    const PANEL_ID = 'qol-cp-manager-panel';
    const SECTION_ID = 'qol-cp-townhall-section';
    const STYLE_ID = 'qol-cp-townhall-styles';
    const TOWN_HALL_BUILDING_ID = 24;
    const MAX_VILLAGES = 100;

    let isScanning = false;
    let triggerToken = 0;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function isEnabled() {
        if (typeof window.isQolEnabled === 'function') {
            return window.isQolEnabled(FEATURE_KEY) === true;
        }

        return localStorage.getItem(`qol_${FEATURE_KEY}`) !== 'false';
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
            #${PANEL_ID} {
                max-height: 88vh !important;
            }

            #${PANEL_ID} .qol-cp-body {
                overflow-y: auto !important;
            }

            #${SECTION_ID} {
                display: none;
                margin-top: 1px !important;
                border: 1px solid #c7b99e !important;
                border-radius: 3px !important;
                background-color: #ffffff !important;
                overflow: hidden !important;
            }

            #${SECTION_ID} .qol-cp-townhall-heading {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                gap: 8px !important;
                padding: 7px 9px !important;
                border-bottom: 1px solid #c7b99e !important;
                background-color: #e9dfcc !important;
                color: #4f3b24 !important;
                font-size: 10px !important;
                font-weight: bold !important;
                text-transform: uppercase !important;
                letter-spacing: 0.3px !important;
            }

            #${SECTION_ID} .qol-cp-townhall-count {
                color: #6d5436 !important;
                white-space: nowrap !important;
            }

            #${SECTION_ID} .qol-cp-townhall-table-wrap {
                max-height: 190px !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
            }

            #${SECTION_ID} table {
                width: 100% !important;
                border-collapse: collapse !important;
                table-layout: fixed !important;
                background-color: #ffffff !important;
                font-size: 10px !important;
            }

            #${SECTION_ID} th,
            #${SECTION_ID} td {
                padding: 6px 8px !important;
                border-bottom: 1px solid #e4dccd !important;
                color: #4b3b28 !important;
                text-align: left !important;
                vertical-align: middle !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
            }

            #${SECTION_ID} th {
                position: sticky !important;
                top: 0 !important;
                z-index: 1 !important;
                background-color: #f4eee2 !important;
                color: #6a573d !important;
                font-size: 9px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.25px !important;
            }

            #${SECTION_ID} th:nth-child(1),
            #${SECTION_ID} td:nth-child(1) {
                width: 48% !important;
            }

            #${SECTION_ID} th:nth-child(2),
            #${SECTION_ID} td:nth-child(2) {
                width: 30% !important;
            }

            #${SECTION_ID} th:nth-child(3),
            #${SECTION_ID} td:nth-child(3) {
                width: 22% !important;
                text-align: center !important;
            }

            #${SECTION_ID} tbody tr:last-child td {
                border-bottom: 0 !important;
            }

            #${SECTION_ID} .qol-cp-townhall-village {
                color: #3f3020 !important;
                font-weight: bold !important;
            }

            #${SECTION_ID} .qol-cp-townhall-status,
            #${SECTION_ID} .qol-cp-townhall-empty {
                padding: 9px !important;
                color: #7a6a55 !important;
                font-size: 10px !important;
                line-height: 1.4 !important;
            }

            #${SECTION_ID} .qol-cp-townhall-status[data-tone="working"] {
                color: #8a5a16 !important;
                font-weight: bold !important;
            }

            #${SECTION_ID} .qol-cp-townhall-status[data-tone="error"] {
                color: #a52a2a !important;
                font-weight: bold !important;
            }

            #${SECTION_ID} .qol-cp-townhall-meta {
                padding: 6px 8px !important;
                border-top: 1px solid #e4dccd !important;
                background-color: #fffaf0 !important;
                color: #7a6a55 !important;
                font-size: 9px !important;
                line-height: 1.35 !important;
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
        const villageId = getVillageIdFromHash();
        const villageName = getCurrentVillageName();

        return villageId
            ? `id:${villageId}`
            : `name:${villageName}`;
    }

    function getKnownVillageCount() {
        const names = new Set();

        document.querySelectorAll('#villageList .villageEntry').forEach(element => {
            const text = element.textContent?.replace(/[\r\n]+/g, ' ').trim();

            if (text) {
                names.add(text);
            }
        });

        return names.size;
    }

    function ensureSection() {
        const panel = document.getElementById(PANEL_ID);

        if (!panel) {
            return null;
        }

        let section = document.getElementById(SECTION_ID);

        if (section) {
            return section;
        }

        section = document.createElement('div');
        section.id = SECTION_ID;

        section.innerHTML = `
            <div class="qol-cp-townhall-heading">
                <span>Town Halls Detected</span>
                <span class="qol-cp-townhall-count">0</span>
            </div>

            <div class="qol-cp-townhall-status">
                Waiting for scan.
            </div>
        `;

        const meta = panel.querySelector('.qol-cp-meta');

        if (meta) {
            meta.insertAdjacentElement('beforebegin', section);
        } else {
            panel.querySelector('.qol-cp-body')?.appendChild(section);
        }

        return section;
    }

    function resetSection() {
        const section = ensureSection();

        if (!section) {
            return;
        }

        section.style.setProperty('display', 'block', 'important');

        section.innerHTML = `
            <div class="qol-cp-townhall-heading">
                <span>Town Halls Detected</span>
                <span class="qol-cp-townhall-count">0</span>
            </div>

            <div class="qol-cp-townhall-status" data-tone="working">
                Waiting for the CP scan to finish...
            </div>
        `;
    }

    function setSectionStatus(message, tone = 'working') {
        const section = ensureSection();

        if (!section) {
            return;
        }

        section.style.setProperty('display', 'block', 'important');

        let status = section.querySelector('.qol-cp-townhall-status');

        if (!status) {
            section.innerHTML = `
                <div class="qol-cp-townhall-heading">
                    <span>Town Halls Detected</span>
                    <span class="qol-cp-townhall-count">0</span>
                </div>
                <div class="qol-cp-townhall-status"></div>
            `;
            status = section.querySelector('.qol-cp-townhall-status');
        }

        status.textContent = message;
        status.dataset.tone = tone;
    }

    function renderTownHalls(results, scannedCount) {
        const section = ensureSection();

        if (!section) {
            return;
        }

        const rows = results.map(item => `
            <tr>
                <td
                    class="qol-cp-townhall-village"
                    title="${escapeHtml(item.villageName)}"
                >
                    ${escapeHtml(item.villageName)}
                </td>
                <td>
                    Town Hall ${Number.isFinite(item.level) ? item.level : '?'}
                </td>
                <td>
                    ${Number.isFinite(item.location) ? item.location : '-'}
                </td>
            </tr>
        `).join('');

        section.style.setProperty('display', 'block', 'important');

        section.innerHTML = `
            <div class="qol-cp-townhall-heading">
                <span>Town Halls Detected</span>
                <span class="qol-cp-townhall-count">${results.length}</span>
            </div>

            ${results.length > 0 ? `
                <div class="qol-cp-townhall-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Village Name</th>
                                <th>Town Hall</th>
                                <th>Location</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="qol-cp-townhall-empty">
                    No Town Halls were detected in the scanned villages.
                </div>
            `}

            <div class="qol-cp-townhall-meta">
                Scanned ${scannedCount} ${scannedCount === 1 ? 'village' : 'villages'}.
            </div>
        `;
    }

    function openVillageBase() {
        const villageId = getVillageIdFromHash();
        const targetHash = villageId
            ? `#/page:village/villId:${villageId}`
            : '#/page:village';

        if (window.location.hash !== targetHash) {
            window.location.hash = targetHash;
        }
    }

    async function waitForVillageView(timeoutMs = 6000) {
        const startedAt = performance.now();

        while (performance.now() - startedAt < timeoutMs) {
            const villageView = document.getElementById('villageView');

            if (villageView && villageView.querySelector('building-location')) {
                return villageView;
            }

            await sleep(100);
        }

        return null;
    }

    function readTownHallInCurrentVillage() {
        const villageView = document.getElementById('villageView');

        if (!villageView) {
            return null;
        }

        const image = villageView.querySelector(
            `img.location.buildingId${TOWN_HALL_BUILDING_ID}`
        );

        if (!image) {
            return null;
        }

        const buildingLocation = image.closest('building-location');

        if (!buildingLocation) {
            return null;
        }

        const levelText = buildingLocation.querySelector('.buildingLevel')?.textContent;
        const parsedLevel = Number.parseInt(String(levelText || '').trim(), 10);

        let location = null;

        const imageIdMatch = String(image.id || '').match(/^buildingImage(\d+)$/);

        if (imageIdMatch) {
            location = Number.parseInt(imageIdMatch[1], 10);
        }

        if (!Number.isFinite(location)) {
            const locationClass = Array.from(buildingLocation.classList)
                .find(className => /^buildingLocation\d+$/.test(className));

            if (locationClass) {
                location = Number.parseInt(
                    locationClass.replace('buildingLocation', ''),
                    10
                );
            }
        }

        if (!Number.isFinite(location)) {
            const status = buildingLocation.querySelector('.buildingStatusButton');
            const statusLocationClass = status
                ? Array.from(status.classList)
                    .find(className => /^location_\d+$/.test(className))
                : null;

            if (statusLocationClass) {
                location = Number.parseInt(
                    statusLocationClass.replace('location_', ''),
                    10
                );
            }
        }

        return {
            villageName: getCurrentVillageName(),
            level: Number.isFinite(parsedLevel) ? parsedLevel : null,
            location: Number.isFinite(location) ? location : null
        };
    }

    function getNavigationButton(direction) {
        const buttons = Array.from(document.querySelectorAll(
            `#villageList .navigation.${direction}`
        ));

        return buttons.find(button => {
            const style = window.getComputedStyle(button);
            const bounds = button.getBoundingClientRect();

            return style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                bounds.width > 0 &&
                bounds.height > 0;
        }) || buttons[0] || null;
    }

    function clickVillageNavigation(direction) {
        if (typeof window.changeVillage === 'function') {
            window.changeVillage(direction);
            return true;
        }

        const button = getNavigationButton(direction);

        if (!button) {
            return false;
        }

        const bounds = button.getBoundingClientRect();
        const eventOptions = {
            view: window,
            bubbles: true,
            cancelable: true,
            composed: true,
            button: 0,
            clientX: bounds.left + (bounds.width / 2),
            clientY: bounds.top + (bounds.height / 2)
        };

        if (typeof PointerEvent === 'function') {
            button.dispatchEvent(new PointerEvent('pointerover', {
                ...eventOptions,
                pointerId: 1,
                pointerType: 'mouse',
                isPrimary: true
            }));

            button.dispatchEvent(new PointerEvent('pointerdown', {
                ...eventOptions,
                buttons: 1,
                pointerId: 1,
                pointerType: 'mouse',
                isPrimary: true
            }));
        }

        button.dispatchEvent(new MouseEvent('mouseover', eventOptions));
        button.dispatchEvent(new MouseEvent('mousedown', {
            ...eventOptions,
            buttons: 1
        }));

        if (typeof PointerEvent === 'function') {
            button.dispatchEvent(new PointerEvent('pointerup', {
                ...eventOptions,
                buttons: 0,
                pointerId: 1,
                pointerType: 'mouse',
                isPrimary: true
            }));
        }

        button.dispatchEvent(new MouseEvent('mouseup', eventOptions));
        button.dispatchEvent(new MouseEvent('click', eventOptions));

        return true;
    }

    async function moveVillage(direction, previousIdentity, timeoutMs = 5000) {
        if (!clickVillageNavigation(direction)) {
            return null;
        }

        const startedAt = performance.now();

        while (performance.now() - startedAt < timeoutMs) {
            await sleep(100);

            const identity = getVillageIdentity();

            if (identity !== previousIdentity) {
                await sleep(150);
                return identity;
            }
        }

        return null;
    }

    async function restoreStartingVillage(startingIdentity) {
        if (getVillageIdentity() === startingIdentity) {
            return true;
        }

        for (let attempt = 0; attempt < MAX_VILLAGES; attempt += 1) {
            const previousIdentity = getVillageIdentity();
            const nextIdentity = await moveVillage('previous', previousIdentity);

            if (!nextIdentity) {
                return false;
            }

            if (nextIdentity === startingIdentity) {
                return true;
            }
        }

        return false;
    }

    async function scanTownHalls(token) {
        if (isScanning || !isEnabled() || token !== triggerToken) {
            return;
        }

        isScanning = true;

        const originalHash = window.location.hash || '';
        const results = [];
        const visited = new Set();
        let startingIdentity = null;
        let scannedCount = 0;

        try {
            setSectionStatus('Scanning villages for Town Halls...', 'working');

            openVillageBase();

            if (!await waitForVillageView()) {
                throw new Error('The village view could not be opened for Town Hall scanning.');
            }

            startingIdentity = getVillageIdentity();
            const knownVillageCount = getKnownVillageCount();

            for (let attempt = 0; attempt < MAX_VILLAGES; attempt += 1) {
                if (token !== triggerToken) {
                    return;
                }

                const identity = getVillageIdentity();

                if (visited.has(identity)) {
                    break;
                }

                visited.add(identity);
                scannedCount += 1;

                openVillageBase();

                if (!await waitForVillageView()) {
                    throw new Error(
                        `Village view failed to render while scanning ${getCurrentVillageName()}.`
                    );
                }

                const townHall = readTownHallInCurrentVillage();

                if (townHall) {
                    results.push(townHall);
                }

                setSectionStatus(
                    `Scanning villages for Town Halls... ${scannedCount}${
                        knownVillageCount > 0 ? `/${knownVillageCount}` : ''
                    }`,
                    'working'
                );

                if (knownVillageCount === 1) {
                    break;
                }

                if (knownVillageCount > 0 && scannedCount >= knownVillageCount) {
                    break;
                }

                const nextIdentity = await moveVillage('next', identity);

                if (!nextIdentity || visited.has(nextIdentity)) {
                    break;
                }
            }

            if (startingIdentity && getVillageIdentity() !== startingIdentity) {
                await restoreStartingVillage(startingIdentity);
            }

            if (window.location.hash !== originalHash) {
                window.location.hash = originalHash;
                await sleep(100);
            }

            renderTownHalls(results, scannedCount);
        } catch (error) {
            console.error('[APES CP Town Hall Scanner] Scan failed.', error);

            if (startingIdentity && getVillageIdentity() !== startingIdentity) {
                try {
                    await restoreStartingVillage(startingIdentity);
                } catch (restoreError) {
                    console.warn(
                        '[APES CP Town Hall Scanner] Could not restore starting village.',
                        restoreError
                    );
                }
            }

            if (window.location.hash !== originalHash) {
                window.location.hash = originalHash;
            }

            setSectionStatus(
                error?.message || 'Town Hall scanning failed.',
                'error'
            );
        } finally {
            isScanning = false;
        }
    }

    async function waitForCpScanAndRun(token) {
        const startedAt = performance.now();
        let sawWorkingState = false;

        while (performance.now() - startedAt < 90000) {
            if (token !== triggerToken) {
                return;
            }

            const panel = document.getElementById(PANEL_ID);
            const status = panel?.querySelector('.qol-cp-status');
            const scanButton = panel?.querySelector('.qol-cp-scan-btn');
            const results = panel?.querySelector('.qol-cp-results');

            if (!status || !scanButton) {
                await sleep(100);
                continue;
            }

            const cpScanning = Boolean(
                scanButton.classList.contains('disabled') ||
                /scanning/i.test(scanButton.textContent || '')
            );

            if (cpScanning || status.dataset.tone === 'working') {
                sawWorkingState = true;
            }

            if (
                sawWorkingState &&
                !cpScanning &&
                status.dataset.tone === 'success' &&
                results &&
                results.children.length >= 4
            ) {
                await scanTownHalls(token);
                return;
            }

            if (
                sawWorkingState &&
                !cpScanning &&
                status.dataset.tone === 'error'
            ) {
                setSectionStatus(
                    'Town Hall scan skipped because the CP scan did not complete.',
                    'error'
                );
                return;
            }

            await sleep(100);
        }

        if (token === triggerToken) {
            setSectionStatus(
                'Town Hall scan timed out while waiting for the CP scan.',
                'error'
            );
        }
    }

    function bindScanButton() {
        injectStyles();
        ensureSection();

        const panel = document.getElementById(PANEL_ID);
        const scanButton = panel?.querySelector('.qol-cp-scan-btn');

        if (!scanButton || scanButton.dataset.qolTownHallBound === 'true') {
            return;
        }

        scanButton.dataset.qolTownHallBound = 'true';

        const schedule = event => {
            if (
                event.type === 'keydown' &&
                event.key !== 'Enter' &&
                event.key !== ' '
            ) {
                return;
            }

            const token = ++triggerToken;
            resetSection();
            void waitForCpScanAndRun(token);
        };

        scanButton.addEventListener('click', schedule);
        scanButton.addEventListener('keydown', schedule);
    }

    function ensureIntegration() {
        if (!document.body) {
            return;
        }

        injectStyles();
        ensureSection();
        bindScanButton();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureIntegration, { once: true });
    } else {
        ensureIntegration();
    }

    window.setInterval(ensureIntegration, 1000);

    console.log('[APES CP Town Hall Scanner] Initialized.');
})();
