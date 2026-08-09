/**
 * APES QoL Extension
 * Module: CP Manager Town Hall Scanner
 *
 * Runs after a successful CP Manager scan.
 * Cycles through every village, looks for a Town Hall, records its level and
 * building location, then restores the village/page where the scan started.
 */

(function initCpTownHallScanner() {
    'use strict';

    const FEATURE_KEY = 'cpManager';
    const PANEL_ID = 'qol-cp-manager-panel';
    const SECTION_ID = 'qol-cp-townhall-section';
    const STYLE_ID = 'qol-cp-townhall-styles';
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

            #${SECTION_ID} .qol-cp-townhall-title {
                padding: 7px 9px !important;
                border-bottom: 1px solid #c7b99e !important;
                background-color: #e9dfcc !important;
                color: #4f3b24 !important;
                font-size: 10px !important;
                font-weight: bold !important;
                text-transform: uppercase !important;
                letter-spacing: 0.3px !important;
            }

            #${SECTION_ID} .qol-cp-townhall-table-wrap {
                max-height: 190px !important;
                overflow-y: auto !important;
            }

            #${SECTION_ID} table {
                width: 100% !important;
                border-collapse: collapse !important;
                table-layout: fixed !important;
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
            }

            #${SECTION_ID} th:nth-child(1),
            #${SECTION_ID} td:nth-child(1) {
                width: 46% !important;
            }

            #${SECTION_ID} th:nth-child(2),
            #${SECTION_ID} td:nth-child(2) {
                width: 32% !important;
            }

            #${SECTION_ID} th:nth-child(3),
            #${SECTION_ID} td:nth-child(3) {
                width: 22% !important;
                text-align: center !important;
            }

            #${SECTION_ID} tbody tr:last-child td {
                border-bottom: 0 !important;
            }

            #${SECTION_ID} .qol-cp-townhall-empty {
                padding: 10px !important;
                color: #7a6a55 !important;
                font-size: 10px !important;
                text-align: center !important;
            }
        `;

        document.head.appendChild(style);
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function parseInteger(value) {
        const match = String(value ?? '').match(/\d+/);
        return match ? Number.parseInt(match[0], 10) : null;
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
        return villageId ? `id:${villageId}` : `name:${getCurrentVillageName()}`;
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
            <div class="qol-cp-townhall-title">Town Hall Detected:</div>
            <div class="qol-cp-townhall-table-wrap">
                <div class="qol-cp-townhall-empty">Waiting for scan.</div>
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

    function setCpStatus(message, tone = 'working') {
        const status = document.querySelector(`#${PANEL_ID} .qol-cp-status`);

        if (!status) {
            return;
        }

        status.textContent = message;
        status.dataset.tone = tone;
    }

    function showScanningSection() {
        const section = ensureSection();

        if (!section) {
            return;
        }

        section.style.setProperty('display', 'block', 'important');
        section.querySelector('.qol-cp-townhall-title').textContent = 'Town Hall Detected:';
        section.querySelector('.qol-cp-townhall-table-wrap').innerHTML = `
            <div class="qol-cp-townhall-empty">Scanning villages for Town Halls...</div>
        `;
    }

    function renderTownHalls(results, scannedCount) {
        const section = ensureSection();

        if (!section) {
            return;
        }

        section.style.setProperty('display', 'block', 'important');
        section.querySelector('.qol-cp-townhall-title').textContent =
            `Town Hall Detected: ${results.length}/${scannedCount} villages`;

        const wrapper = section.querySelector('.qol-cp-townhall-table-wrap');

        if (!results.length) {
            wrapper.innerHTML = `
                <div class="qol-cp-townhall-empty">
                    No Town Halls were detected in the scanned villages.
                </div>
            `;
            return;
        }

        wrapper.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Village Name</th>
                        <th>Town Hall</th>
                        <th>Location</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(item => `
                        <tr>
                            <td title="${escapeHtml(item.villageName)}">${escapeHtml(item.villageName)}</td>
                            <td>${item.level ? `Town Hall ${item.level}` : 'Town Hall'}</td>
                            <td>${item.location ?? '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    function openVillageBase() {
        const currentHash = window.location.hash || '';
        const villageIdMatch = currentHash.match(/(?:^|\/)villId:([^/]+)/);
        const route = ['page:village'];

        if (villageIdMatch) {
            route.push(`villId:${villageIdMatch[1]}`);
        }

        const targetHash = `#/${route.join('/')}`;

        if (window.location.hash !== targetHash) {
            window.location.hash = targetHash;
        }
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

        const eventTypes = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];

        for (const eventType of eventTypes) {
            try {
                const EventClass = eventType.startsWith('pointer') && window.PointerEvent
                    ? window.PointerEvent
                    : window.MouseEvent;

                button.dispatchEvent(new EventClass(eventType, {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                    button: 0,
                    buttons: eventType.includes('down') ? 1 : 0
                }));
            } catch (error) {
                if (eventType === 'click') {
                    button.click();
                }
            }
        }

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

        await sleep(250);
        return true;
    }

    function extractLocation(element) {
        let current = element;

        for (let depth = 0; current && depth < 6; depth += 1, current = current.parentElement) {
            const directAttributes = [
                'data-location-id',
                'location-id',
                'locationid',
                'data-location',
                'location'
            ];

            for (const attribute of directAttributes) {
                const value = current.getAttribute?.(attribute);
                const parsed = parseInteger(value);

                if (Number.isFinite(parsed)) {
                    return parsed;
                }
            }

            const source = [
                current.getAttribute?.('href'),
                current.getAttribute?.('clickable'),
                current.getAttribute?.('ng-click'),
                current.getAttribute?.('onclick'),
                current.className,
                current.outerHTML?.slice(0, 2500)
            ].filter(Boolean).join(' ');

            const patterns = [
                /location:(\d+)/i,
                /locationId["'\s:=]+(\d+)/i,
                /openBuilding\s*\(\s*(\d+)/i,
                /(?:location|slot)[_-]?(\d+)/i
            ];

            for (const pattern of patterns) {
                const match = source.match(pattern);

                if (match) {
                    return Number.parseInt(match[1], 10);
                }
            }
        }

        return null;
    }

    function extractLevel(element) {
        let current = element;

        for (let depth = 0; current && depth < 5; depth += 1, current = current.parentElement) {
            const levelElement = current.querySelector?.(
                '.level, .buildingLevel, [data-level], [data-building-level]'
            );

            const directValues = [
                current.getAttribute?.('data-level'),
                current.getAttribute?.('data-building-level'),
                current.getAttribute?.('level'),
                levelElement?.getAttribute?.('data-level'),
                levelElement?.textContent
            ];

            for (const value of directValues) {
                const parsed = parseInteger(value);

                if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 20) {
                    return parsed;
                }
            }

            const source = [
                current.textContent,
                current.className,
                current.getAttribute?.('title'),
                current.getAttribute?.('aria-label'),
                current.outerHTML?.slice(0, 2500)
            ].filter(Boolean).join(' ');

            const patterns = [
                /(?:level|lvl\.?|lv\.?)\s*[:#-]?\s*(\d{1,2})/i,
                /(?:level|lvl)[_-]?(\d{1,2})/i
            ];

            for (const pattern of patterns) {
                const match = source.match(pattern);

                if (!match) {
                    continue;
                }

                const level = Number.parseInt(match[1], 10);

                if (level >= 1 && level <= 20) {
                    return level;
                }
            }
        }

        return null;
    }

    function elementLooksLikeTownHall(element) {
        if (!element) {
            return false;
        }

        const source = [
            element.textContent,
            element.className,
            element.id,
            element.getAttribute?.('title'),
            element.getAttribute?.('aria-label'),
            element.getAttribute?.('tooltip'),
            element.getAttribute?.('tooltip-translate'),
            element.getAttribute?.('data-name'),
            element.getAttribute?.('data-building-name'),
            element.getAttribute?.('data-gid'),
            element.getAttribute?.('gid'),
            element.getAttribute?.('data-building-id'),
            element.getAttribute?.('building-id'),
            element.getAttribute?.('data-building-type'),
            element.getAttribute?.('building-type'),
            element.outerHTML?.slice(0, 3000)
        ].filter(Boolean).join(' ').toLowerCase();

        if (source.includes('town hall')) {
            return true;
        }

        const numericAttributes = [
            element.getAttribute?.('data-gid'),
            element.getAttribute?.('gid'),
            element.getAttribute?.('data-building-id'),
            element.getAttribute?.('building-id'),
            element.getAttribute?.('data-building-type'),
            element.getAttribute?.('building-type')
        ];

        if (numericAttributes.some(value => String(value).trim() === '24')) {
            return true;
        }

        return /(?:building|gid)[_-]?24(?:\D|$)/i.test(source);
    }

    function findTownHallCandidate() {
        const explicitSelectors = [
            '[title*="Town Hall" i]',
            '[aria-label*="Town Hall" i]',
            '[data-name*="Town Hall" i]',
            '[data-building-name*="Town Hall" i]',
            '[data-gid="24"]',
            '[gid="24"]',
            '[data-building-id="24"]',
            '[building-id="24"]',
            '[data-building-type="24"]',
            '[building-type="24"]',
            '[class*="building24"]',
            '[class*="building_24"]',
            '[class*="gid24"]',
            '[class*="gid_24"]'
        ];

        for (const selector of explicitSelectors) {
            const elements = document.querySelectorAll(selector);

            for (const element of elements) {
                if (element.closest(`#${PANEL_ID}`)) {
                    continue;
                }

                const location = extractLocation(element);

                if (Number.isFinite(location)) {
                    return {
                        element,
                        location,
                        level: extractLevel(element)
                    };
                }
            }
        }

        const buildingElements = document.querySelectorAll([
            '[clickable*="openBuilding"]',
            '[ng-click*="openBuilding"]',
            'a[href*="window:building"]',
            '[data-location-id]',
            '[location-id]',
            '[locationid]'
        ].join(','));

        for (const element of buildingElements) {
            if (element.closest(`#${PANEL_ID}`)) {
                continue;
            }

            if (!elementLooksLikeTownHall(element)) {
                continue;
            }

            const location = extractLocation(element);

            if (Number.isFinite(location)) {
                return {
                    element,
                    location,
                    level: extractLevel(element)
                };
            }
        }

        return null;
    }

    function openBuildingLocation(location) {
        const currentHash = window.location.hash || '';
        const villageIdMatch = currentHash.match(/(?:^|\/)villId:([^/]+)/);
        const route = ['page:village'];

        if (villageIdMatch) {
            route.push(`villId:${villageIdMatch[1]}`);
        }

        route.push(`location:${location}`);
        route.push('window:building');
        window.location.hash = `#/${route.join('/')}`;
    }

    function readOpenedTownHallLevel() {
        const containers = document.querySelectorAll([
            '.buildingView',
            '.windowContent',
            '#windowContent',
            '.contentBox'
        ].join(','));

        for (const container of containers) {
            const text = container.textContent?.replace(/\s+/g, ' ').trim() || '';

            if (!/town hall/i.test(text)) {
                continue;
            }

            const match = text.match(/(?:Town Hall).*?(?:Level|Lvl\.?|Lv\.?)\s*(\d{1,2})/i) ||
                text.match(/(?:Level|Lvl\.?|Lv\.?)\s*(\d{1,2}).*?Town Hall/i);

            if (match) {
                return Number.parseInt(match[1], 10);
            }

            const levelElement = container.querySelector(
                '.level, .buildingLevel, [data-level], [data-building-level]'
            );
            const parsed = parseInteger(
                levelElement?.getAttribute?.('data-level') ||
                levelElement?.textContent
            );

            if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 20) {
                return parsed;
            }
        }

        return null;
    }

    async function detectTownHallInCurrentVillage() {
        openVillageBase();
        await sleep(350);

        const candidate = findTownHallCandidate();

        if (!candidate) {
            return null;
        }

        let level = candidate.level;

        if (!Number.isFinite(level)) {
            openBuildingLocation(candidate.location);
            await sleep(350);
            level = readOpenedTownHallLevel();
        }

        return {
            level: Number.isFinite(level) ? level : null,
            location: candidate.location
        };
    }

    async function restoreByPrevious(hops) {
        for (let index = 0; index < hops; index += 1) {
            if (!await moveVillage('previous')) {
                return false;
            }
        }

        return true;
    }

    async function scanTownHalls() {
        if (isScanning || !isEnabled()) {
            return;
        }

        isScanning = true;
        showScanningSection();

        const originalHash = window.location.hash || '';
        const startingIdentity = getVillageIdentity();
        const visited = new Set();
        const results = [];
        let hops = 0;
        let returnedToStart = false;

        try {
            for (let attempt = 0; attempt < MAX_VILLAGES; attempt += 1) {
                const identity = getVillageIdentity();

                if (visited.has(identity)) {
                    returnedToStart = identity === startingIdentity;
                    break;
                }

                visited.add(identity);

                const villageName = getCurrentVillageName();
                setCpStatus(
                    `Scanning Town Halls: ${villageName} (${visited.size})...`,
                    'working'
                );

                const townHall = await detectTownHallInCurrentVillage();

                if (townHall) {
                    results.push({
                        villageName,
                        level: townHall.level,
                        location: townHall.location
                    });
                }

                openVillageBase();
                await sleep(150);

                if (!await moveVillage('next')) {
                    break;
                }

                hops += 1;

                if (getVillageIdentity() === startingIdentity) {
                    returnedToStart = true;
                    break;
                }
            }

            if (!returnedToStart && hops > 0) {
                setCpStatus('Town Hall scan complete. Returning to the starting village...', 'working');
                await restoreByPrevious(hops);
            }

            if (window.location.hash !== originalHash) {
                window.location.hash = originalHash;
                await sleep(100);
            }

            renderTownHalls(results, visited.size);
            setCpStatus(
                `CP scan complete. Town Halls detected in ${results.length} of ${visited.size} villages.`,
                'success'
            );
        } catch (error) {
            console.error('[APES CP Town Hall Scanner] Scan failed.', error);

            if (!returnedToStart && hops > 0) {
                try {
                    await restoreByPrevious(hops);
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

            renderTownHalls(results, visited.size);
            setCpStatus(
                `CP scan finished, but Town Hall scanning stopped early: ${error?.message || 'unknown error'}`,
                'error'
            );
        } finally {
            isScanning = false;
        }
    }

    async function waitForCpScanAndRun(token) {
        const startedAt = performance.now();
        let sawWorkingState = false;

        while (performance.now() - startedAt < 30000) {
            if (token !== triggerToken) {
                return;
            }

            const panel = document.getElementById(PANEL_ID);
            const status = panel?.querySelector('.qol-cp-status');
            const scanButton = panel?.querySelector('.qol-cp-scan-btn');

            if (!status || !scanButton) {
                await sleep(100);
                continue;
            }

            const disabled = scanButton.classList.contains('disabled');
            const tone = status.dataset.tone;

            if (disabled || tone === 'working') {
                sawWorkingState = true;
            }

            if (sawWorkingState && !disabled && tone === 'success') {
                await scanTownHalls();
                return;
            }

            if (sawWorkingState && !disabled && tone === 'error') {
                return;
            }

            await sleep(100);
        }
    }

    function bindScanButton() {
        const panel = document.getElementById(PANEL_ID);
        const scanButton = panel?.querySelector('.qol-cp-scan-btn');

        if (!scanButton || scanButton.dataset.qolTownHallBound === 'true') {
            return;
        }

        scanButton.dataset.qolTownHallBound = 'true';

        const schedule = event => {
            if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') {
                return;
            }

            triggerToken += 1;
            const token = triggerToken;
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
