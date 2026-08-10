/**
 * APES QoL Extension
 * Module: Resource Capacity Timer
 *
 * Adds a compact live ETA beside each resource production value:
 * - Positive production: time until storage is full.
 * - Negative production: time until the resource is empty.
 * - Zero production: stable.
 */
(function initResourceCapacityTimer() {
    'use strict';

    const FEATURE_KEY = 'resourceCapacityTimer';
    const STYLE_ID = 'qol-resource-capacity-timer-styles';
    const TIMER_CLASS = 'qol-resource-capacity-eta';
    const REFRESH_MS = 1000;

    const RESOURCES = [
        { key: 'wood', name: 'Wood', storage: 'warehouse' },
        { key: 'clay', name: 'Clay', storage: 'warehouse' },
        { key: 'iron', name: 'Iron', storage: 'warehouse' },
        { key: 'crop', name: 'Crop', storage: 'granary' }
    ];

    let intervalId = null;

    function isEnabled() {
        return typeof window.isQolEnabled === 'function'
            ? window.isQolEnabled(FEATURE_KEY)
            : localStorage.getItem(`qol_${FEATURE_KEY}`) !== 'false';
    }

    function parseSignedInteger(value) {
        const text = String(value ?? '')
            .replace(/\u2212/g, '-')
            .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
            .trim();

        if (!text) return null;

        const negative = /-/.test(text);
        const digits = text.replace(/[^0-9]/g, '');
        if (!digits) return null;

        const number = Number.parseInt(digits, 10);
        return Number.isFinite(number) ? (negative ? -number : number) : null;
    }

    function parseUnsignedInteger(value) {
        const number = parseSignedInteger(value);
        return Number.isFinite(number) ? Math.abs(number) : null;
    }

    function directText(element) {
        if (!element) return '';
        return Array.from(element.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent || '')
            .join(' ')
            .trim();
    }

    function formatCompactDuration(totalSeconds) {
        if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '-';
        if (totalSeconds < 60) return '<1m';

        const totalMinutes = Math.ceil(totalSeconds / 60);
        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const minutes = totalMinutes % 60;

        if (days > 0) {
            return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
        }

        if (hours > 0) {
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }

        return `${minutes}m`;
    }

    function formatLongDuration(totalSeconds) {
        if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return 'unknown';
        if (totalSeconds < 60) return 'less than 1 minute';

        const totalMinutes = Math.ceil(totalSeconds / 60);
        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const minutes = totalMinutes % 60;
        const parts = [];

        if (days) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
        if (hours) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
        if (minutes) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);

        return parts.join(', ') || 'less than 1 minute';
    }

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #resourceBar .${TIMER_CLASS} {
                display: inline !important;
                margin-left: 4px !important;
                font-family: inherit !important;
                font-size: inherit !important;
                font-weight: inherit !important;
                font-style: inherit !important;
                line-height: inherit !important;
                letter-spacing: inherit !important;
                white-space: nowrap !important;
                vertical-align: baseline !important;
                pointer-events: none !important;
            }

            #resourceBar .${TIMER_CLASS}[data-state="full"] {
                color: #6d5436 !important;
            }

            #resourceBar .${TIMER_CLASS}[data-state="empty"] {
                color: #9a3f2d !important;
            }

            #resourceBar .${TIMER_CLASS}[data-state="stable"] {
                color: #7d7468 !important;
            }
        `;
        document.head.appendChild(style);
    }

    function removeTimers() {
        document.querySelectorAll(`#resourceBar .${TIMER_CLASS}`).forEach(element => element.remove());
    }

    function readResource(resource) {
        const stock = document.querySelector(`#resourceBar .stockContainer.${resource.key}`);
        if (!stock) return null;

        const progressbar = stock.querySelector('.progressbar');
        const amountNode = progressbar?.querySelector('.values .amount.wrapper');
        const capacityNode = progressbar?.querySelector('.values .capacity');
        const block = stock.closest('[ng-repeat]') || stock.parentElement;
        const productionNode = block?.querySelector('.production .value');

        if (!progressbar || !productionNode) return null;

        const current = parseUnsignedInteger(amountNode?.textContent)
            ?? parseUnsignedInteger(progressbar.getAttribute('value'));

        const capacity = parseUnsignedInteger(capacityNode?.textContent)
            ?? parseUnsignedInteger(progressbar.getAttribute('max-value'));

        const production = parseSignedInteger(directText(productionNode));

        if (!Number.isFinite(current) || !Number.isFinite(capacity) || !Number.isFinite(production)) {
            return null;
        }

        return {
            ...resource,
            current,
            capacity,
            production,
            productionNode
        };
    }

    function calculateState(data) {
        const { current, capacity, production } = data;

        if (production > 0) {
            if (current >= capacity) {
                return {
                    state: 'full',
                    label: 'Full',
                    title: `${data.name}: ${data.storage} is full.`
                };
            }

            const remaining = Math.max(0, capacity - current);
            const seconds = (remaining / production) * 3600;
            const targetDate = new Date(Date.now() + (seconds * 1000));

            return {
                state: 'full',
                label: `Full ${formatCompactDuration(seconds)}`,
                title: `${data.name}: ${data.storage} full in ${formatLongDuration(seconds)} at the current ${production.toLocaleString('en-US')}/h production. Estimated: ${targetDate.toLocaleString()}.`
            };
        }

        if (production < 0) {
            if (current <= 0) {
                return {
                    state: 'empty',
                    label: 'Empty',
                    title: `${data.name}: storage is empty.`
                };
            }

            const seconds = (current / Math.abs(production)) * 3600;
            const targetDate = new Date(Date.now() + (seconds * 1000));

            return {
                state: 'empty',
                label: `Empty ${formatCompactDuration(seconds)}`,
                title: `${data.name}: empty in ${formatLongDuration(seconds)} at the current ${production.toLocaleString('en-US')}/h production. Estimated: ${targetDate.toLocaleString()}.`
            };
        }

        return {
            state: 'stable',
            label: 'Stable',
            title: `${data.name}: production is 0/h, so the stored amount is stable.`
        };
    }

    function renderResource(data) {
        let timer = data.productionNode.querySelector(`.${TIMER_CLASS}`);
        if (!timer) {
            timer = document.createElement('span');
            timer.className = TIMER_CLASS;
            timer.setAttribute('aria-hidden', 'true');
            data.productionNode.appendChild(timer);
        }

        const state = calculateState(data);
        timer.dataset.state = state.state;
        timer.textContent = `· ${state.label}`;
        timer.title = state.title;
    }

    function refresh() {
        if (!isEnabled()) {
            removeTimers();
            return;
        }

        injectStyles();
        RESOURCES.forEach(resource => {
            const data = readResource(resource);
            if (data) renderResource(data);
        });
    }

    function start() {
        refresh();

        if (intervalId === null) {
            intervalId = window.setInterval(refresh, REFRESH_MS);
        }
    }

    window.addEventListener('qol_setting_changed', event => {
        if (event.detail?.key !== FEATURE_KEY) return;
        if (!event.detail.enabled) removeTimers();
        refresh();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }

    console.log('[APES Resource Capacity Timer] Initialized.');
})();
