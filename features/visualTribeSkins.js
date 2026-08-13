/**
 * APES QoL — Visual Tribe Skins: Asset Discovery
 *
 * Phase 1 deliberately does not alter the game UI. It records the image, sprite
 * and CSS-background assets that Travian loads while the player opens buildings
 * and visits villages. The collected catalogue is used to build safe exact
 * building-to-building skin mappings in the next phase.
 */
(() => {
    'use strict';

    const FEATURE_KEY = 'visualTribeSkins';
    const STORAGE_KEY = 'apes_visual_tribe_skin_assets_v1';
    const MAX_ASSETS = 4000;
    const BUILDING_IDS = Array.from({ length: 60 }, (_, index) => index + 1);
    const TRIBE_VARIANTS = ['t00', 't10', 't20', 't30', 't40', 't50'];
    const PROBE_CONCURRENCY = 4;
    const TOOLBAR_BUTTON_ID = 'qol-tribe-skins-toggle-btn';
    const PANEL_ID = 'qol-tribe-skins-panel';
    const observedNodes = new WeakSet();
    let observer = null;
    let scheduled = false;
    let catalogueCache = null;
    let saveTimer = null;
    let probeInProgress = false;
    let latestStatus = 'Ready to collect building artwork from Travian.';

    function enabled() {
        return typeof window.isQolEnabled !== 'function' || window.isQolEnabled(FEATURE_KEY);
    }

    function serverKey() {
        return location.hostname.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    }

    function loadCatalogue() {
        if (catalogueCache) return catalogueCache;
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            catalogueCache = saved && typeof saved === 'object' ? saved : {};
        } catch (_) {
            catalogueCache = {};
        }
        return catalogueCache;
    }

    function saveCatalogue(catalogue) {
        catalogueCache = catalogue;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(catalogueCache));
            } catch (error) {
                console.warn('[APES Visual Tribe Skins] Could not save asset catalogue.', error);
            }
        }, 350);
    }

    function classify(value) {
        const source = String(value || '').toLowerCase();
        if (/gaul|gallier|gaule/.test(source)) return 'gaul';
        if (/teuton|german|germane/.test(source)) return 'teuton';
        if (/roman|romans|romer/.test(source)) return 'roman';
        if (/huns?|hunnen/.test(source)) return 'hun';
        if (/egypt|egyptian|aegypt/.test(source)) return 'egyptian';
        return 'unclassified';
    }

    function normaliseUrl(value) {
        const raw = String(value || '').trim();
        if (!raw || raw === 'none') return '';
        try {
            return new URL(raw.replace(/^url\((['"]?)(.*?)\1\)$/i, '$2'), location.href).href;
        } catch (_) {
            return raw;
        }
    }

    function extractUrls(value) {
        const matches = String(value || '').matchAll(/url\((['"]?)(.*?)\1\)/gi);
        return [...matches].map(match => normaliseUrl(match[2])).filter(Boolean);
    }

    function meaningful(url) {
        return /\.(?:png|jpe?g|gif|webp|svg|avif)(?:[?#].*)?$/i.test(url)
            || /(?:sprite|icon|building|village|tribe|unit|field|asset|image)/i.test(url);
    }

    function addAsset(url, element, source) {
        const resolved = normaliseUrl(url);
        if (!meaningful(resolved)) return;

        const catalogue = loadCatalogue();
        const key = serverKey();
        const server = catalogue[key] || { capturedAt: '', assets: {} };
        const existing = server.assets[resolved] || {
            url: resolved,
            tribes: [],
            sources: [],
            selectors: [],
            firstSeen: new Date().toISOString(),
            lastSeen: ''
        };

        const tribe = classify([
            resolved,
            element?.className,
            element?.id,
            element?.getAttribute?.('data-tribe'),
            document.body?.className
        ].join(' '));

        if (!existing.tribes.includes(tribe)) existing.tribes.push(tribe);
        if (source && !existing.sources.includes(source)) existing.sources.push(source);

        const selector = describe(element);
        if (selector && !existing.selectors.includes(selector) && existing.selectors.length < 12) {
            existing.selectors.push(selector);
        }

        existing.lastSeen = new Date().toISOString();
        server.assets[resolved] = existing;
        server.capturedAt = existing.lastSeen;

        const keys = Object.keys(server.assets);
        if (keys.length > MAX_ASSETS) {
            keys
                .sort((a, b) => Date.parse(server.assets[a].lastSeen) - Date.parse(server.assets[b].lastSeen))
                .slice(0, keys.length - MAX_ASSETS)
                .forEach(oldKey => delete server.assets[oldKey]);
        }

        catalogue[key] = server;
        saveCatalogue(catalogue);
    }

    function setStatus(message) {
        latestStatus = message;
        const status = document.querySelector('#' + PANEL_ID + ' .qol-tribe-skins-status');
        if (status) status.textContent = message;
    }

    function injectToolUi() {
        if (!enabled()) return;

        let button = document.getElementById(TOOLBAR_BUTTON_ID);
        if (!button) {
            button = document.createElement('div');
            button.id = TOOLBAR_BUTTON_ID;
            button.title = 'Visual Tribe Skins';
            button.setAttribute('role', 'button');
            button.setAttribute('tabindex', '0');
            button.setAttribute('aria-label', 'Open Visual Tribe Skins');
            button.textContent = '◈';
            button.style.cssText = 'position:fixed!important;display:none;align-items:center;justify-content:center;width:30px;height:30px;margin:0;padding:0;border:2px solid #7d6342;border-radius:50%;background:#ebdcb9;color:#654c30;box-shadow:0 2px 4px rgba(0,0,0,.22);cursor:pointer;user-select:none;box-sizing:border-box;z-index:9999;font:700 17px Arial,Helvetica,sans-serif;text-shadow:none;';
            const toggle = event => {
                event.preventDefault();
                event.stopPropagation();
                const panel = document.getElementById(PANEL_ID);
                if (!panel) return;
                panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
            };
            button.addEventListener('click', toggle);
            button.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') toggle(event);
            });
            document.body.appendChild(button);
        }

        let panel = document.getElementById(PANEL_ID);
        if (!panel) {
            panel = document.createElement('section');
            panel.id = PANEL_ID;
            panel.innerHTML = `
                <header>
                    <span>Visual Tribe Skins</span>
                    <button type="button" data-close aria-label="Close">×</button>
                </header>
                <div class="qol-tribe-skins-body">
                    <p>Collects Travian’s public building artwork so future tribe skins can replace each building with its exact Roman, Teuton or Gaul equivalent.</p>
                    <button type="button" class="qol-tribe-skins-action" data-build>Build Asset Catalogue</button>
                    <p class="qol-tribe-skins-status"></p>
                    <button type="button" class="qol-tribe-skins-action secondary" data-copy>Copy Asset Catalogue</button>
                </div>
            `;
            panel.style.cssText = 'position:fixed;right:24px;top:74px;z-index:1000001;display:none;flex-direction:column;width:min(360px,calc(100vw - 32px));border:3px solid #634d31;border-radius:5px;background:#f7f5f0;box-shadow:0 10px 30px rgba(0,0,0,.5);overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#332719;text-shadow:none;';
            const header = panel.querySelector('header');
            header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:9px 11px;background:linear-gradient(to bottom,#6d5436,#543f26);color:#f7f5f0;font-size:13px;font-weight:700;';
            const close = panel.querySelector('[data-close]');
            close.style.cssText = 'all:unset;cursor:pointer;padding:0 3px;color:#fff;font-size:21px;line-height:15px;';
            const body = panel.querySelector('.qol-tribe-skins-body');
            body.style.cssText = 'display:flex;flex-direction:column;gap:9px;padding:12px;font-size:10px;line-height:1.45;';
            panel.querySelector('.qol-tribe-skins-body p').style.margin = '0';
            const status = panel.querySelector('.qol-tribe-skins-status');
            status.style.cssText = 'min-height:28px;margin:0;padding:7px 8px;border:1px solid #d6cab8;border-radius:3px;background:#fff;color:#746653;';
            panel.querySelectorAll('.qol-tribe-skins-action').forEach(action => {
                action.style.cssText = 'all:unset;display:flex;align-items:center;justify-content:center;padding:7px 10px;border:1px solid #7d6342;border-radius:3px;background:#7d6342;color:#fff;cursor:pointer;font:700 10px Arial,Helvetica,sans-serif;text-align:center;';
            });
            panel.querySelector('.secondary').style.background = '#ebdcb9';
            panel.querySelector('.secondary').style.color = '#4a3821';
            close.addEventListener('click', () => { panel.style.display = 'none'; });
            panel.querySelector('[data-build]').addEventListener('click', () => discoverBuildingAssets(true));
            panel.querySelector('[data-copy]').addEventListener('click', async event => {
                const copyButton = event.currentTarget;
                try {
                    await navigator.clipboard.writeText(JSON.stringify(getReport(), null, 2));
                    copyButton.textContent = 'Catalogue copied';
                    setTimeout(() => { copyButton.textContent = 'Copy Asset Catalogue'; }, 1800);
                } catch (_) {
                    copyButton.textContent = 'Clipboard blocked';
                }
            });
            document.body.appendChild(panel);
        }
        panel.querySelector('.qol-tribe-skins-status').textContent = latestStatus;
        window.qolRepositionAllButtons?.();
    }

    function getProbeBaseUrl() {
        const server = loadCatalogue()[serverKey()];
        const assetUrls = Object.keys(server?.assets || {});
        const buildingUrl = assetUrls.find(url => /\/layout\/images\/building\/thumb\//i.test(url));
        if (buildingUrl) return buildingUrl.split('/layout/images/building/thumb/')[0] + '/layout/images/building/thumb/';

        const staticUrl = assetUrls.find(url => /static\.kingdoms\.com\/game\/[^/]+\//i.test(url));
        const match = staticUrl?.match(/^(https:\/\/static\.kingdoms\.com\/game\/[^/]+)\//i);
        return match ? match[1] + '/layout/images/building/thumb/' : '';
    }

    function imageExists(url, timeoutMs = 7000) {
        return new Promise(resolve => {
            const image = new Image();
            let settled = false;
            const finish = exists => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                image.onload = null;
                image.onerror = null;
                resolve(exists);
            };
            const timer = setTimeout(() => finish(false), timeoutMs);
            image.onload = () => finish(true);
            image.onerror = () => finish(false);
            image.src = url;
        });
    }

    async function discoverBuildingAssets(force = false) {
        if (probeInProgress || !enabled()) return;

        const catalogue = loadCatalogue();
        const key = serverKey();
        const server = catalogue[key] || { capturedAt: '', assets: {} };
        if (!force && server.buildingProbe?.status === 'complete') {
            setStatus('Building artwork catalogue ready. ' + server.buildingProbe.found + ' files found.');
            return;
        }

        const baseUrl = getProbeBaseUrl();
        if (!baseUrl) {
            setStatus('Open Village View once so APES can find this game world’s asset version.');
            return;
        }

        probeInProgress = true;
        const candidates = [];
        BUILDING_IDS.forEach(buildingId => {
            candidates.push({ url: baseUrl + 'g' + buildingId + '.png', buildingId, variant: 'shared' });
            TRIBE_VARIANTS.forEach(variant => {
                candidates.push({ url: baseUrl + 'g' + buildingId + '_' + variant + '.png', buildingId, variant });
            });
        });

        server.buildingProbe = {
            status: 'running',
            total: candidates.length,
            checked: 0,
            found: 0,
            startedAt: new Date().toISOString(),
            completedAt: null
        };
        catalogue[key] = server;
        saveCatalogue(catalogue);
        setStatus('Collecting tribe building artwork… 0/' + candidates.length);

        let cursor = 0;
        const worker = async () => {
            while (cursor < candidates.length) {
                const candidate = candidates[cursor++];
                const exists = await imageExists(candidate.url);
                server.buildingProbe.checked += 1;
                if (exists) {
                    addAsset(candidate.url, null, 'building-catalogue-probe');
                    server.buildingProbe.found += 1;
                }
                if (server.buildingProbe.checked % 16 === 0 || server.buildingProbe.checked === candidates.length) {
                    server.capturedAt = new Date().toISOString();
                    saveCatalogue(catalogue);
                    setStatus('Collecting tribe building artwork… ' + server.buildingProbe.checked + '/' + candidates.length);
                }
            }
        };

        try {
            await Promise.all(Array.from({ length: PROBE_CONCURRENCY }, worker));
            server.buildingProbe.status = 'complete';
            server.buildingProbe.completedAt = new Date().toISOString();
            server.capturedAt = server.buildingProbe.completedAt;
            saveCatalogue(catalogue);
            setStatus('Building artwork catalogue ready. ' + server.buildingProbe.found + ' files found.');
            console.info('[APES Visual Tribe Skins] Building catalogue complete.', server.buildingProbe);
        } finally {
            probeInProgress = false;
        }
    }

    function describe(element) {
        if (!(element instanceof Element)) return '';
        const tag = element.tagName.toLowerCase();
        const id = element.id ? '#' + element.id : '';
        const classes = [...element.classList].slice(0, 4).map(name => '.' + name).join('');
        return (tag + id + classes).slice(0, 180);
    }

    function inspectElement(element, force = false) {
        if (!(element instanceof Element) || (!force && observedNodes.has(element))) return;
        observedNodes.add(element);

        if (element instanceof HTMLImageElement) {
            addAsset(element.currentSrc || element.src, element, 'img');
            element.srcset.split(',').forEach(part => addAsset(part.trim().split(/\s+/)[0], element, 'img-srcset'));
        }

        ['style', 'data-src', 'data-background', 'data-bg'].forEach(attribute => {
            const value = element.getAttribute(attribute);
            extractUrls(value).forEach(url => addAsset(url, element, attribute));
            if (attribute !== 'style') addAsset(value, element, attribute);
        });

        try {
            const computed = getComputedStyle(element);
            extractUrls(computed.backgroundImage).forEach(url => addAsset(url, element, 'computed-background'));
            extractUrls(computed.content).forEach(url => addAsset(url, element, 'computed-content'));
        } catch (_) {
            // Detached or transient game nodes can reject computed-style reads.
        }
    }

    function inspectTree(root = document) {
        if (!enabled()) return;
        root.querySelectorAll?.('img,[style],[data-src],[data-background],[data-bg]').forEach(inspectElement);
    }

    function inspectPerformanceResources() {
        if (!enabled() || !performance.getEntriesByType) return;
        performance.getEntriesByType('resource').forEach(entry => addAsset(entry.name, null, 'network-resource'));
    }

    function capture(reason = 'manual') {
        if (!enabled()) return getReport();
        inspectTree();
        inspectPerformanceResources();
        const report = getReport();
        console.info('[APES Visual Tribe Skins] Asset capture complete (' + reason + ').', report.summary);
        return report;
    }

    function getReport() {
        const server = loadCatalogue()[serverKey()] || { capturedAt: '', assets: {} };
        const assets = Object.values(server.assets || {});
        const byTribe = assets.reduce((result, asset) => {
            asset.tribes.forEach(tribe => { result[tribe] = (result[tribe] || 0) + 1; });
            return result;
        }, {});

        return {
            server: location.hostname,
            capturedAt: server.capturedAt || null,
            summary: { assets: assets.length, byTribe },
            assets
        };
    }

    async function copyReport() {
        const report = getReport();
        const text = JSON.stringify(report, null, 2);
        try {
            await navigator.clipboard.writeText(text);
            console.info('[APES Visual Tribe Skins] Catalogue copied to clipboard.', report.summary);
        } catch (error) {
            console.warn('[APES Visual Tribe Skins] Clipboard unavailable. Use APES_TRIBE_SKINS.report() instead.', error);
        }
        return report;
    }

    function clear() {
        const catalogue = loadCatalogue();
        delete catalogue[serverKey()];
        saveCatalogue(catalogue);
        console.info('[APES Visual Tribe Skins] Catalogue cleared for ' + location.hostname + '.');
    }

    function start() {
        if (observer || !enabled()) return;
        capture('initial');
        injectToolUi();

        observer = new MutationObserver(mutations => {
            if (!enabled()) return;
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        inspectElement(node);
                        inspectTree(node);
                    }
                });
                if (mutation.type === 'attributes') inspectElement(mutation.target, true);
            });

            if (!scheduled) {
                scheduled = true;
                requestAnimationFrame(() => {
                    scheduled = false;
                    inspectPerformanceResources();
                });
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'src', 'srcset', 'class', 'data-src', 'data-background', 'data-bg']
        });
    }

    window.addEventListener('qol_setting_changed', event => {
        if (event.detail?.key !== FEATURE_KEY) return;
        if (event.detail.enabled) {
            start();
            capture('feature-enabled');
            injectToolUi();
        }
    });

    window.APES_TRIBE_SKINS = Object.freeze({
        capture: () => capture('manual'),
        report: getReport,
        copyReport,
        clear,
        help: 'Open buildings and village views, then run APES_TRIBE_SKINS.copyReport() in DevTools.'
    });

    const begin = () => {
        start();
        console.info('[APES Visual Tribe Skins] Discovery ready. Open buildings and village views, then run APES_TRIBE_SKINS.copyReport().');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', begin, { once: true });
    } else {
        begin();
    }
})();