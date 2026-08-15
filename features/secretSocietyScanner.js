/**
 * APES QoL — Secret Society Scanner
 * Collects the paginated Secret Society member list into one local APES view.
 */
(() => {
    'use strict';

    const FEATURE_KEY = 'secretSocietyScanner';
    const STORAGE_KEY = 'apes_secret_society_scans_v1';
    const BUTTON_ID = 'qol-ss-scanner-toggle-btn';
    const PANEL_ID = 'qol-ss-scanner-panel';
    const NATIVE_SCAN_ID = 'qol-ss-native-scan';
    const MAX_PAGES = 100;
    let scanInProgress = false;
    let observer = null;

    function enabled() {
        return typeof window.isQolEnabled !== 'function' || window.isQolEnabled(FEATURE_KEY);
    }

    function serverKey() {
        return location.hostname.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    }

    function loadScans() {
        try {
            const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            return Array.isArray(all[serverKey()]) ? all[serverKey()] : [];
        } catch (_) {
            return [];
        }
    }

    function saveScans(scans) {
        try {
            const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            all[serverKey()] = scans;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        } catch (_) {
            // The scanner remains usable for the current page if storage is unavailable.
        }
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function cleanText(value) {
        return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function injectStyles() {
        if (document.getElementById('qol-ss-scanner-styles')) return;
        const style = document.createElement('style');
        style.id = 'qol-ss-scanner-styles';
        style.textContent = [
            '#' + BUTTON_ID + '{position:fixed!important;display:none;align-items:center!important;justify-content:center!important;width:30px!important;min-width:30px!important;max-width:30px!important;height:30px!important;min-height:30px!important;max-height:30px!important;line-height:26px!important;margin:0!important;padding:0!important;border:2px solid #7d6342!important;border-radius:50%!important;background:#ebdcb9!important;box-shadow:0 2px 4px rgba(0,0,0,.2)!important;color:#5a4024!important;font:700 15px Arial,sans-serif!important;cursor:pointer!important;z-index:999991!important;user-select:none!important}',
            '#' + BUTTON_ID + ':hover{background:#fff7e7!important;transform:scale(1.08)!important}',
            '#' + PANEL_ID + '{position:fixed!important;right:18px!important;top:76px!important;z-index:1000002!important;display:none!important;width:680px!important;max-width:calc(100vw - 36px)!important;max-height:calc(100vh - 100px)!important;overflow:hidden!important;border:3px solid #634d31!important;border-radius:7px!important;background:#f7f5f0!important;box-shadow:0 16px 42px rgba(0,0,0,.5)!important;color:#432f1d!important;font-family:Arial,Helvetica,sans-serif!important}',
            '#' + PANEL_ID + '.qol-ss-open{display:flex!important;flex-direction:column!important}',
            '#' + PANEL_ID + ' *{box-sizing:border-box!important;font-family:Arial,Helvetica,sans-serif!important;text-shadow:none!important}',
            '.qol-ss-head{display:flex!important;align-items:center!important;justify-content:space-between!important;min-height:43px!important;padding:0 12px!important;background:linear-gradient(#6d5436,#4f3b24)!important;color:#fffaf0!important;font-size:14px!important;font-weight:700!important}',
            '.qol-ss-close{width:24px!important;height:24px!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:4px!important;background:rgba(0,0,0,.2)!important;cursor:pointer!important;font-size:19px!important}',
            '.qol-ss-body{padding:12px!important;overflow:auto!important}',
            '.qol-ss-tabs{display:flex!important;gap:5px!important;overflow-x:auto!important;margin:0 0 10px!important;padding-bottom:2px!important}',
            '.qol-ss-tab,.qol-ss-action{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:28px!important;padding:5px 10px!important;border:1px solid #a9906d!important;border-radius:4px!important;background:linear-gradient(#fffaf0,#e8d6b6)!important;color:#4d351d!important;font-size:10px!important;font-weight:700!important;cursor:pointer!important;white-space:nowrap!important}',
            '.qol-ss-tab.qol-active,.qol-ss-action{border-color:#564021!important;background:linear-gradient(#7d6342,#5a4328)!important;color:#fff8e9!important}',
            '.qol-ss-toolbar{display:flex!important;align-items:center!important;gap:7px!important;margin-bottom:9px!important}',
            '.qol-ss-search{flex:1!important;min-width:0!important;height:29px!important;padding:5px 8px!important;border:1px solid #bca789!important;border-radius:4px!important;background:#fff!important;color:#422f1e!important;font-size:11px!important}',
            '.qol-ss-summary{margin:0 0 8px!important;color:#735a3b!important;font-size:10px!important}',
            '.qol-ss-empty{padding:28px 16px!important;border:1px dashed #c8b490!important;border-radius:5px!important;background:#fffaf0!important;color:#6e573b!important;text-align:center!important;font-size:12px!important;line-height:1.45!important}',
            '.qol-ss-table-wrap{border:1px solid #cdbb9d!important;border-radius:4px!important;overflow:auto!important;background:#fff!important}',
            '.qol-ss-table{width:100%!important;border-collapse:collapse!important;font-size:10px!important}',
            '.qol-ss-table th{position:sticky!important;top:0!important;padding:7px 6px!important;background:#e5d4b8!important;color:#533b22!important;text-align:left!important;font-size:9px!important;text-transform:uppercase!important;z-index:1!important}',
            '.qol-ss-table td{padding:7px 6px!important;border-top:1px solid #eadfce!important;color:#4d3824!important;white-space:nowrap!important}',
            '.qol-ss-table tr:hover td{background:#fff8e7!important}',
            '.qol-ss-native-scan{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:25px!important;margin:7px 0!important;padding:4px 10px!important;border:1px solid #725634!important;border-radius:4px!important;background:linear-gradient(#f7efd9,#d9c59e)!important;color:#543f26!important;font:700 10px Arial,sans-serif!important;cursor:pointer!important}',
            '.qol-ss-native-scan.qol-ss-working{opacity:.65!important;cursor:wait!important}'
        ].join('');
        document.head.appendChild(style);
    }

    function isSecretSocietiesTabActive() {
        return /tab:SecretSociety/i.test(location.hash || '');
    }

    function getSocietyRoot() {
        if (!isSecretSocietiesTabActive()) return null;
        return document.querySelector('.loadedTab.tabSecretSociety.activeTab .secretSociety, .loadedTab.tabSecretSociety.currentTab .secretSociety, .secretSociety.defaultWindow');
    }

    function getSocietyId(root) {
        const routeMatch = String(location.hash || '').match(/(?:societyId|ssId|groupId):([0-9]+)/i);
        if (routeMatch) return routeMatch[1];

        const activeTab = root?.querySelector('dynamic-tabulation[active-tab]');
        if (activeTab?.getAttribute('active-tab')) return activeTab.getAttribute('active-tab');

        const actionText = root?.querySelector('[clickable*="societyId"]')?.getAttribute('clickable') || '';
        return actionText.match(/societyId['"]?\s*:\s*([0-9]+)/i)?.[1] || '';
    }

    function getMembersTable(root) {
        return root?.querySelector('table.memberList') || null;
    }

    function getSocietyName(root) {
        const activeTab = root?.querySelector('.dynamicTabulation .tab.active .content span');
        const heading = root?.querySelector('h6.headerWithIcon');
        return cleanText(activeTab?.textContent || heading?.childNodes?.[2]?.textContent || heading?.textContent) || 'Secret Society';
    }

    function extractMembers(root) {
        const table = getMembersTable(root);
        if (!table) return [];
        return Array.from(table.querySelectorAll('tbody tr')).map(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(cell => cleanText(cell.textContent));
            const playerCell = row.querySelector('[playername],[player-name],.playerColumn,.name .playerLink');
            const name = row.getAttribute('player-name') || playerCell?.getAttribute('player-name') || playerCell?.getAttribute('playername') || cleanText(playerCell?.textContent) || cells[1] || 'Unknown';
            const playerId = row.getAttribute('player-id') || playerCell?.getAttribute('player-id') || playerCell?.getAttribute('playerid') || '';
            return {
                rank: cells[0] || '',
                name,
                playerId,
                villages: cells[2] || '',
                population: cells[3] || '',
                fealty: cells[4] || '',
                stat1: cells[5] || '',
                stat2: cells[6] || '',
                values: cells
            };
        }).filter(member => member.name && member.name !== 'Unknown');
    }

    function currentPage(root) {
        const page = root.querySelector('.tg-pagination .number.disabled a,.tg-pagination .number .disabled');
        const value = Number(cleanText(page?.textContent));
        return Number.isFinite(value) && value > 0 ? value : 1;
    }

    function pageSignature(root) {
        return extractMembers(root).map(member => member.playerId || member.name).join('|');
    }

    function nextButton(root) {
        return root.querySelector('.tg-pagination .nextPage:not(.disabled)');
    }

    function waitForChange(root, before, timeout = 4500) {
        return new Promise(resolve => {
            const start = Date.now();
            const timer = setInterval(() => {
                if (pageSignature(root) !== before || Date.now() - start >= timeout) {
                    clearInterval(timer);
                    setTimeout(resolve, 130);
                }
            }, 90);
        });
    }

    function clickPage(root, number) {
        const page = Array.from(root.querySelectorAll('.tg-pagination .number')).find(item => cleanText(item.textContent) === String(number) && !item.classList.contains('disabled'));
        page?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    }

    function scanButtonState(text, working) {
        const button = document.getElementById(NATIVE_SCAN_ID);
        if (!button) return;
        button.textContent = text;
        button.classList.toggle('qol-ss-working', Boolean(working));
    }

    async function scanCurrentSociety() {
        const root = getSocietyRoot();
        if (!root || scanInProgress) return;
        scanInProgress = true;
        const originalPage = currentPage(root);
        const societyName = getSocietyName(root);
        const societyId = getSocietyId(root);
        const members = new Map();

        try {
            for (let page = 1; page <= MAX_PAGES; page += 1) {
                scanButtonState('Scanning page ' + page + '…', true);
                extractMembers(root).forEach(member => members.set(member.playerId || member.name, member));
                const next = nextButton(root);
                if (!next) break;
                const before = pageSignature(root);
                next.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                await waitForChange(root, before);
                if (pageSignature(root) === before) break;
            }

            const scan = {
                id: societyId || societyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'secret-society',
                societyId,
                route: location.hash,
                name: societyName,
                scannedAt: Date.now(),
                members: Array.from(members.values()).sort((a, b) => Number.parseInt(a.rank, 10) - Number.parseInt(b.rank, 10))
            };
            const scans = loadScans();
            const index = scans.findIndex(item => item.id === scan.id);
            if (index >= 0) scans[index] = scan;
            else scans.push(scan);
            saveScans(scans);
            renderPanel(scan.id);
            scanButtonState('Scan complete · ' + scan.members.length + ' members', false);
        } finally {
            if (originalPage > 1) clickPage(root, originalPage);
            scanInProgress = false;
            setTimeout(() => scanButtonState('Scan Secret Society', false), 1500);
        }
    }

    function injectNativeScanButton() {
        const existing = document.getElementById(NATIVE_SCAN_ID);
        if (!enabled()) {
            existing?.remove();
            return;
        }

        const root = getSocietyRoot();
        const table = root && getMembersTable(root);
        if (!root || !table) {
            existing?.remove();
            return;
        }
        if (existing) return;
        const button = document.createElement('div');
        button.id = NATIVE_SCAN_ID;
        button.className = 'qol-ss-native-scan';
        button.setAttribute('role', 'button');
        button.setAttribute('tabindex', '0');
        button.textContent = 'Scan Secret Society';
        const activate = event => {
            event.preventDefault();
            scanCurrentSociety();
        };
        button.addEventListener('click', activate);
        button.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') activate(event);
        });
        table.closest('.statisticsTable,.contentBox')?.before(button);
    }

    function showUpdateLock(message) {
        let lock = document.getElementById('qol-ss-update-lock');
        if (!lock) {
            lock = document.createElement('div');
            lock.id = 'qol-ss-update-lock';
            lock.style.cssText = 'position:fixed!important;inset:0!important;z-index:1000003!important;display:flex!important;align-items:center!important;justify-content:center!important;background:rgba(20,16,11,.52)!important;color:#fffaf0!important;font:700 13px Arial,sans-serif!important;text-align:center!important';
            document.body.appendChild(lock);
        }
        lock.textContent = message;
        return lock;
    }

    function waitForSecretSociety(timeout = 8000) {
        return new Promise(resolve => {
            const startedAt = Date.now();
            const timer = setInterval(() => {
                const root = getSocietyRoot();
                if ((root && getMembersTable(root)) || Date.now() - startedAt >= timeout) {
                    clearInterval(timer);
                    resolve(root);
                }
            }, 100);
        });
    }

    async function updateStoredSociety(scan) {
        if (!scan) return;
        const lock = showUpdateLock('Opening Secret Society…');
        try {
            if (scan.route && location.hash !== scan.route) location.hash = scan.route;
            const root = await waitForSecretSociety();
            if (!root) {
                lock.textContent = 'Could not open this Secret Society.';
                setTimeout(() => lock.remove(), 1600);
                return;
            }
            lock.textContent = 'Scanning Secret Society…';
            await scanCurrentSociety();
        } finally {
            lock.remove();
        }
    }

    function renderPanel(selectedId) {
        const panel = document.getElementById(PANEL_ID);
        if (!panel) return;
        const scans = loadScans();
        const selected = scans.find(scan => scan.id === selectedId) || scans[0];
        const tabs = scans.map(scan => '<div class="qol-ss-tab' + (scan.id === selected?.id ? ' qol-active' : '') + '" data-ss-tab="' + escapeHtml(scan.id) + '" role="button" tabindex="0">' + escapeHtml(scan.name) + '</div>').join('');

        if (!selected) {
            panel.querySelector('.qol-ss-body').innerHTML = '<div class="qol-ss-empty">No Secret Society scanned yet.<br>Open a Secret Society, then use <strong>Scan Secret Society</strong> above its member list.</div>';
            return;
        }

        const body = panel.querySelector('.qol-ss-body');
        body.innerHTML = '<div class="qol-ss-tabs">' + tabs + '</div><div class="qol-ss-toolbar"><input class="qol-ss-search" type="search" placeholder="Search members…" aria-label="Search Secret Society members"><div class="qol-ss-action" data-ss-refresh role="button" tabindex="0">Update</div></div><p class="qol-ss-summary">' + selected.members.length + ' members · scanned ' + new Date(selected.scannedAt).toLocaleString() + '</p><div class="qol-ss-table-wrap"><table class="qol-ss-table"><thead><tr><th>#</th><th>Player</th><th>Villages</th><th>Population</th><th>Fealty</th><th>Stat 1</th><th>Stat 2</th></tr></thead><tbody></tbody></table></div>';

        const renderRows = () => {
            const query = cleanText(body.querySelector('.qol-ss-search')?.value).toLowerCase();
            const rows = selected.members.filter(member => Object.values(member).join(' ').toLowerCase().includes(query)).map(member => '<tr><td>' + escapeHtml(member.rank) + '</td><td>' + escapeHtml(member.name) + '</td><td>' + escapeHtml(member.villages) + '</td><td>' + escapeHtml(member.population) + '</td><td>' + escapeHtml(member.fealty) + '</td><td>' + escapeHtml(member.stat1) + '</td><td>' + escapeHtml(member.stat2) + '</td></tr>').join('');
            body.querySelector('tbody').innerHTML = rows || '<tr><td colspan="7">No matching members.</td></tr>';
        };
        renderRows();
        body.querySelector('.qol-ss-search').addEventListener('input', renderRows);
        body.querySelectorAll('[data-ss-tab]').forEach(tab => tab.addEventListener('click', () => renderPanel(tab.dataset.ssTab)));
        body.querySelector('[data-ss-refresh]').addEventListener('click', () => updateStoredSociety(selected));
    }

    function injectPanel() {
        injectStyles();
        let button = document.getElementById(BUTTON_ID);
        if (!button) {
            button = document.createElement('div');
            button.id = BUTTON_ID;
            button.title = 'Secret Society Scanner';
            button.setAttribute('role', 'button');
            button.setAttribute('tabindex', '0');
            button.textContent = '♜';
            const toggle = event => {
                event.preventDefault();
                event.stopPropagation();
                const panel = document.getElementById(PANEL_ID);
                panel.classList.toggle('qol-ss-open');
                if (panel.classList.contains('qol-ss-open')) renderPanel();
            };
            button.addEventListener('click', toggle);
            button.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') toggle(event);
            });
            document.body.appendChild(button);
        }

        if (!document.getElementById(PANEL_ID)) {
            const panel = document.createElement('div');
            panel.id = PANEL_ID;
            panel.innerHTML = '<div class="qol-ss-head"><span>Secret Society Scanner</span><div class="qol-ss-close" role="button" tabindex="0">×</div></div><div class="qol-ss-body"></div>';
            panel.querySelector('.qol-ss-close').addEventListener('click', () => panel.classList.remove('qol-ss-open'));
            document.body.appendChild(panel);
        }
        renderPanel();
        window.qolRepositionAllButtons?.();
    }

    function start() {
        if (!enabled()) return;
        injectPanel();
        injectNativeScanButton();
        if (!observer) {
            observer = new MutationObserver(() => {
                if (!enabled()) return;
                injectNativeScanButton();
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        }
    }

    window.addEventListener('qol_setting_changed', event => {
        if (event.detail?.key !== FEATURE_KEY) return;
        if (event.detail.enabled) {
            document.getElementById(PANEL_ID)?.style.removeProperty('display');
            start();
        } else {
            document.getElementById(PANEL_ID)?.classList.remove('qol-ss-open');
            document.getElementById(PANEL_ID)?.style.setProperty('display', 'none', 'important');
        }
    });

    const begin = () => start();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', begin, { once: true });
    else begin();
})();