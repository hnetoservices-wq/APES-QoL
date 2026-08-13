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
    const observedNodes = new WeakSet();
    let observer = null;
    let scheduled = false;

    function enabled() {
        return typeof window.isQolEnabled !== 'function' || window.isQolEnabled(FEATURE_KEY);
    }

    function serverKey() {
        return location.hostname.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    }

    function loadCatalogue() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            return saved && typeof saved === 'object' ? saved : {};
        } catch (_) {
            return {};
        }
    }

    function saveCatalogue(catalogue) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(catalogue));
        } catch (error) {
            console.warn('[APES Visual Tribe Skins] Could not save asset catalogue.', error);
        }
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

    function describe(element) {
        if (!(element instanceof Element)) return '';
        const tag = element.tagName.toLowerCase();
        const id = element.id ? '#' + element.id : '';
        const classes = [...element.classList].slice(0, 4).map(name => '.' + name).join('');
        return (tag + id + classes).slice(0, 180);
    }

    function inspectElement(element) {
        if (!(element instanceof Element) || observedNodes.has(element)) return;
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

        observer = new MutationObserver(mutations => {
            if (!enabled()) return;
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        inspectElement(node);
                        inspectTree(node);
                    }
                });
                if (mutation.type === 'attributes') inspectElement(mutation.target);
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