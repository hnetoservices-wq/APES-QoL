/**
 * APES QoL Extension
 * Module: Instant Finish Keybind
 *
 * B reveals Travian's active building-queue details and triggers the native
 * instant-finish control when it can be identified safely.
 */
(function initInstantFinishKeybind() {
    'use strict';

    const STORAGE_KEY = 'qol_keybind_instantFinish';
    const MENU_ROW_ID = 'qol-keybind-instant-finish';
    const MENU_CHECKBOX_ID = 'qol-chk-instant-finish';
    const MENU_REFRESH_MS = 1200;

    function isEnabled() {
        try {
            return localStorage.getItem(STORAGE_KEY) !== 'false';
        } catch (_) {
            return true;
        }
    }

    function isUserTyping() {
        const active = document.activeElement;
        if (!active) return false;

        const tag = active.tagName?.toUpperCase();
        return tag === 'INPUT' ||
            tag === 'TEXTAREA' ||
            tag === 'SELECT' ||
            active.isContentEditable ||
            active.getAttribute('contenteditable') === 'true' ||
            active.getAttribute('role') === 'textbox' ||
            active.getAttribute('role') === 'searchbox';
    }

    function isVisible(element) {
        if (!element?.isConnected) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            Number.parseFloat(style.opacity || '1') > 0 &&
            rect.width > 0 &&
            rect.height > 0;
    }

    function eventOptions(element) {
        const rect = element.getBoundingClientRect();
        return {
            view: window,
            bubbles: true,
            cancelable: true,
            composed: true,
            button: 0,
            clientX: rect.left + (rect.width / 2),
            clientY: rect.top + (rect.height / 2)
        };
    }

    function revealQueueDetails(slot) {
        const target = slot.querySelector('.animatedMasterBuilderSlots') || slot;
        const options = eventOptions(target);

        if (typeof PointerEvent === 'function') {
            target.dispatchEvent(new PointerEvent('pointerover', {
                ...options,
                pointerId: 1,
                pointerType: 'mouse',
                isPrimary: true
            }));
            target.dispatchEvent(new PointerEvent('pointerenter', {
                ...options,
                bubbles: false,
                pointerId: 1,
                pointerType: 'mouse',
                isPrimary: true
            }));
        }

        target.dispatchEvent(new MouseEvent('mouseover', options));
        target.dispatchEvent(new MouseEvent('mouseenter', {
            ...options,
            bubbles: false
        }));
        target.dispatchEvent(new MouseEvent('mousemove', options));
    }

    function findActiveBuildingSlot() {
        const selectors = [
            '.queueContainer.usedSlot.queueType1',
            '.queueContainer.usedSlot'
        ];

        for (const selector of selectors) {
            const candidates = Array.from(document.querySelectorAll(selector));
            const visible = candidates.find(isVisible);
            if (visible) return visible;
        }

        return null;
    }

    function getQueueScope(slot) {
        return slot.closest('[ng-include]') ||
            slot.closest('.buildingQueue') ||
            slot.parentElement ||
            document.body;
    }

    function descriptor(element) {
        const names = [
            element.id,
            element.className,
            element.getAttribute('title'),
            element.getAttribute('tooltip'),
            element.getAttribute('tooltip-translate'),
            element.getAttribute('aria-label'),
            element.getAttribute('clickable'),
            element.getAttribute('ng-click'),
            element.getAttribute('on-click'),
            element.getAttribute('on-pointer-up'),
            element.getAttribute('on-pointer-down')
        ];

        const descendant = element.querySelector?.('i,img,span');
        if (descendant) {
            names.push(
                descendant.id,
                descendant.className,
                descendant.getAttribute?.('title'),
                descendant.getAttribute?.('tooltip'),
                descendant.getAttribute?.('tooltip-translate'),
                descendant.getAttribute?.('aria-label')
            );
        }

        return names
            .filter(Boolean)
            .map(value => String(value))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function scoreCandidate(element, slotRect) {
        if (!isVisible(element)) return -10000;

        const rect = element.getBoundingClientRect();
        const text = descriptor(element).toLowerCase();
        let score = 0;

        if (/(instant|finish|complete|finishnow|instantfinish|completenow|speedup|speed-up)/i.test(text)) score += 140;
        if (/(gold|masterbuilder|master builder)/i.test(text)) score += 35;
        if (/(construction|building|build)/i.test(text)) score += 15;

        if (/(cancel|abort|remove|delete|destroy|stop|close|dismiss)/i.test(text)) score -= 220;
        if (/(symbol_x|icon_x|closebutton|cancelbutton)/i.test(text)) score -= 220;

        if (rect.width >= 18 && rect.width <= 60 && rect.height >= 18 && rect.height <= 60) score += 18;
        if (rect.left >= slotRect.left + (slotRect.width * 0.55)) score += 28;

        const style = getComputedStyle(element);
        const bg = style.backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (bg) {
            const [, r, g, b] = bg.map(Number);
            if (r > 170 && g > 130 && b < 130) score += 16;
        }

        return score;
    }

    function collectClickableCandidates(scope) {
        const selector = [
            '[clickable]',
            '[ng-click]',
            '[on-click]',
            '[on-pointer-up]',
            '[on-pointer-down]',
            'button',
            'a',
            '[role="button"]'
        ].join(',');

        return Array.from(scope.querySelectorAll(selector));
    }

    function findInstantFinishControl(slot) {
        const scope = getQueueScope(slot);
        const slotRect = slot.getBoundingClientRect();
        const candidates = collectClickableCandidates(scope)
            .filter(element => element !== slot)
            .map(element => ({
                element,
                score: scoreCandidate(element, slotRect),
                label: descriptor(element)
            }))
            .filter(item => item.score > -100)
            .sort((a, b) => b.score - a.score);

        const semantic = candidates.find(item => item.score >= 100);
        if (semantic) return semantic.element;

        const fallback = candidates.find(item => {
            const rect = item.element.getBoundingClientRect();
            const label = item.label.toLowerCase();
            return item.score >= 35 &&
                rect.left >= slotRect.left + (slotRect.width * 0.55) &&
                !/(cancel|abort|remove|delete|destroy|stop|close|dismiss|symbol_x|icon_x)/i.test(label);
        });

        if (fallback) return fallback.element;

        console.warn('[APES Instant Finish] Instant-finish button could not be identified safely.');
        console.table(candidates.slice(0, 12).map(item => {
            const rect = item.element.getBoundingClientRect();
            return {
                score: item.score,
                label: item.label,
                tag: item.element.tagName,
                left: Math.round(rect.left),
                top: Math.round(rect.top),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            };
        }));

        return null;
    }

    function clickNativeControl(element) {
        const options = eventOptions(element);

        if (typeof PointerEvent === 'function') {
            element.dispatchEvent(new PointerEvent('pointerdown', {
                ...options,
                buttons: 1,
                pointerId: 1,
                pointerType: 'mouse',
                isPrimary: true
            }));
        }

        element.dispatchEvent(new MouseEvent('mousedown', {
            ...options,
            buttons: 1
        }));

        if (typeof PointerEvent === 'function') {
            element.dispatchEvent(new PointerEvent('pointerup', {
                ...options,
                buttons: 0,
                pointerId: 1,
                pointerType: 'mouse',
                isPrimary: true
            }));
        }

        element.dispatchEvent(new MouseEvent('mouseup', options));
        element.dispatchEvent(new MouseEvent('click', options));
    }

    async function triggerInstantFinish() {
        const slot = findActiveBuildingSlot();
        if (!slot) {
            console.warn('[APES Instant Finish] No active building queue slot found.');
            return;
        }

        revealQueueDetails(slot);
        await new Promise(resolve => setTimeout(resolve, 80));

        const button = findInstantFinishControl(slot);
        if (!button) return;

        clickNativeControl(button);
    }

    function refreshKeybindCount(grid) {
        const modal = grid.closest('#qol-modal');
        const heading = modal?.querySelector('.qol-keybind-heading .qol-section-count');
        if (!heading) return;

        const total = grid.querySelectorAll('.qol-keybind-item').length;
        heading.textContent = `${total} shortcuts`;
    }

    function ensureMenuRow() {
        const grid = document.querySelector('#qol-modal .qol-keybind-grid');
        if (!grid || document.getElementById(MENU_ROW_ID)) return;

        const row = document.createElement('div');
        row.id = MENU_ROW_ID;
        row.className = 'qol-keybind-item';
        row.innerHTML = `
            <div class="qol-key-combo"><span class="qol-kbd">B</span></div>
            <span class="qol-keybind-action">Instant Finish Building Queue</span>
            <label class="qol-switch" title="Toggle Instant Finish Building Queue shortcut">
                <input type="checkbox" id="${MENU_CHECKBOX_ID}" class="qol-checkbox">
                <span class="qol-switch-track" aria-hidden="true"></span>
                <span class="qol-visually-hidden">Toggle Instant Finish Building Queue shortcut</span>
            </label>
        `;

        grid.appendChild(row);
        const checkbox = row.querySelector(`#${MENU_CHECKBOX_ID}`);
        checkbox.checked = isEnabled();
        checkbox.addEventListener('change', event => {
            const enabled = Boolean(event.target.checked);
            try {
                localStorage.setItem(STORAGE_KEY, String(enabled));
            } catch (error) {
                console.warn('[APES Instant Finish] Could not save keybind setting.', error);
            }
        });

        refreshKeybindCount(grid);
    }

    window.addEventListener('keydown', event => {
        if (!event.isTrusted || event.code !== 'KeyB') return;
        if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
        if (isUserTyping() || !isEnabled()) return;

        event.preventDefault();
        void triggerInstantFinish();
    }, true);

    ensureMenuRow();
    window.setInterval(ensureMenuRow, MENU_REFRESH_MS);

    console.log('[APES Instant Finish] B keybind initialized.');
})();