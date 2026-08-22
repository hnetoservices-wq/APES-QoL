/**
 * APES QoL Unified Rally Point Scanner
 *
 * First-stage unification layer:
 * - One toolbar launcher and one APES window.
 * - Incomings and Resources tabs.
 * - Reuses the proven parser controls and result views while the shared
 *   Rally Point traversal engine is prepared for a later extraction.
 */

function initUnifiedRallyPointScanner() {
    'use strict';

    const FEATURE_KEY = 'rallyPointParser';
    const PANEL_ID = 'qol-rally-point-scanner';
    const TOGGLE_ID = 'qol-rally-point-toggle-btn';
    const STYLE_ID = 'qol-rally-point-scanner-styles';
    const ACTIVE_TAB_STORAGE_KEY =
        'qol_rallyPointActiveTab';
    const MOVEMENT_TYPE_STORAGE_KEY =
        'qol_rallyPointMovementTypes';

    const DEFAULT_MOVEMENT_TYPES = {
        attack: true,
        siege: true,
        raid: false,
        reinforcement: false
    };

    function isEnabled() {
        if (
            typeof window.isQolEnabled ===
            'function'
        ) {
            return window.isQolEnabled(
                FEATURE_KEY
            ) === true;
        }

        return true;
    }

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style =
            document.createElement('style');

        style.id = STYLE_ID;
        style.textContent = `
            #qol-rp-action-bar,
            #qol-ir-action-bar,
            #qol-wm-toggle-btn,
            #qol-ir-toggle-btn {
                display: none !important;
            }

            #${PANEL_ID} {
                position: fixed !important;
                display: none;
                flex-direction: column !important;
                width: 900px;
                min-width: 620px !important;
                max-width: 96vw !important;
                height: 540px;
                min-height: 390px !important;
                max-height: 92vh !important;
                margin: 0 !important;
                padding: 0 !important;
                border: 3px solid #634d31 !important;
                border-radius: 5px !important;
                background: #f7f5f0 !important;
                box-shadow: 0 10px 30px rgba(0, 0, 0, .5) !important;
                color: #333 !important;
                font-family: Arial, sans-serif !important;
                font-size: 11px !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                resize: both !important;
                z-index: 999999 !important;
            }

            #${PANEL_ID},
            #${PANEL_ID} * {
                box-sizing: border-box !important;
            }

            .qol-rally-scanner-header {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                flex: 0 0 38px !important;
                min-height: 38px !important;
                padding: 6px 10px !important;
                border-bottom: 1px solid #3f2d19 !important;
                background: linear-gradient(to bottom, #6d5436, #543f26) !important;
                color: #f7f5f0 !important;
                cursor: move !important;
                user-select: none !important;
                touch-action: none !important;
            }

            .qol-rally-scanner-title {
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                font-size: 14px !important;
                font-weight: bold !important;
            }

            .qol-rally-scanner-mark {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 22px !important;
                height: 22px !important;
                border: 1px solid rgba(255, 255, 255, .2) !important;
                border-radius: 4px !important;
                background: rgba(0, 0, 0, .18) !important;
                font-size: 13px !important;
            }

            .qol-rally-scanner-close {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 26px !important;
                height: 26px !important;
                border-radius: 4px !important;
                background: rgba(0, 0, 0, .2) !important;
                color: #fff !important;
                cursor: pointer !important;
                font-size: 21px !important;
                font-weight: bold !important;
                line-height: 1 !important;
            }

            .qol-rally-scanner-close:hover {
                background: rgba(255, 255, 255, .16) !important;
            }

            .qol-rally-tabs {
                display: flex !important;
                align-items: stretch !important;
                flex: 0 0 38px !important;
                min-height: 38px !important;
                padding: 0 10px !important;
                border-bottom: 1px solid #cbbda8 !important;
                background: #e8dfcf !important;
            }

            .qol-rally-tab {
                position: relative !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                min-width: 116px !important;
                padding: 0 18px !important;
                border: 0 !important;
                border-left: 1px solid transparent !important;
                border-right: 1px solid transparent !important;
                background: transparent !important;
                color: #6b563d !important;
                font: inherit !important;
                font-size: 11px !important;
                font-weight: bold !important;
                cursor: pointer !important;
                user-select: none !important;
            }

            .qol-rally-tab:hover {
                background: rgba(255, 255, 255, .36) !important;
            }

            .qol-rally-tab.active {
                border-left-color: #cbbda8 !important;
                border-right-color: #cbbda8 !important;
                background: #f7f5f0 !important;
                color: #3f2f1f !important;
            }

            .qol-rally-tab.active::after {
                content: '' !important;
                position: absolute !important;
                right: 14px !important;
                bottom: 0 !important;
                left: 14px !important;
                height: 3px !important;
                background: #9a7a50 !important;
            }

            .qol-rally-scanner-content {
                display: flex !important;
                flex: 1 1 auto !important;
                min-width: 0 !important;
                min-height: 0 !important;
                background: #f7f5f0 !important;
                overflow: hidden !important;
            }

            .qol-rally-tab-panel {
                display: none !important;
                flex: 1 1 auto !important;
                min-width: 0 !important;
                min-height: 0 !important;
                overflow: hidden !important;
            }

            .qol-rally-tab-panel.active {
                display: flex !important;
            }

            .qol-rally-tab-panel > .qol-rp-body,
            .qol-rally-tab-panel > .qol-ir-body {
                width: 100% !important;
                height: 100% !important;
                flex: 1 1 auto !important;
                min-width: 0 !important;
                min-height: 0 !important;
            }

            .qol-rally-loading {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 100% !important;
                min-height: 160px !important;
                color: #7b6a56 !important;
                font-size: 12px !important;
            }

            .qol-rally-movement-picker {
                display: flex !important;
                align-items: center !important;
                gap: 8px 14px !important;
                flex-wrap: wrap !important;
                padding: 8px 10px !important;
                border: 1px solid #d7c9b4 !important;
                border-radius: 4px !important;
                background: #eee7dc !important;
            }

            .qol-rally-movement-picker-title {
                margin-right: 2px !important;
                color: #5a4630 !important;
                font-size: 10px !important;
                font-weight: bold !important;
                text-transform: uppercase !important;
                letter-spacing: .25px !important;
            }

            .qol-rally-movement-option {
                display: inline-flex !important;
                align-items: center !important;
                gap: 5px !important;
                color: #4b3822 !important;
                font-size: 11px !important;
                font-weight: bold !important;
                cursor: pointer !important;
                user-select: none !important;
            }

            .qol-rally-movement-option input {
                width: 14px !important;
                height: 14px !important;
                margin: 0 !important;
                accent-color: #745936 !important;
                cursor: pointer !important;
            }

            .qol-rally-movement-warning {
                display: none !important;
                margin-left: auto !important;
                color: #9a2f2a !important;
                font-size: 10px !important;
                font-weight: bold !important;
            }

            .qol-rally-movement-warning.visible {
                display: inline !important;
            }

            #${TOGGLE_ID} {
                position: fixed !important;
                display: none;
                align-items: center !important;
                justify-content: center !important;
                width: 30px !important;
                height: 30px !important;
                margin: 0 !important;
                padding: 0 !important;
                border: 2px solid #7d6342 !important;
                border-radius: 50% !important;
                background: #ebdcb9 !important;
                box-shadow: 0 2px 4px rgba(0, 0, 0, .22) !important;
                cursor: pointer !important;
                user-select: none !important;
                z-index: 9999 !important;
            }

            #${TOGGLE_ID}:hover {
                transform: scale(1.08) !important;
                background: #f7f5f0 !important;
            }

            #${TOGGLE_ID} svg {
                width: 17px !important;
                height: 17px !important;
                fill: none !important;
                stroke: #7d6342 !important;
                stroke-width: 2 !important;
                stroke-linecap: round !important;
                stroke-linejoin: round !important;
                pointer-events: none !important;
            }

            body.qol-toolbar-collapsed #${TOGGLE_ID} {
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }

            @media (max-width: 760px) {
                #${PANEL_ID} {
                    width: calc(100vw - 20px) !important;
                    min-width: 0 !important;
                    height: min(600px, calc(100vh - 20px)) !important;
                    left: 10px !important;
                }

                .qol-rally-tab {
                    flex: 1 1 50% !important;
                    min-width: 0 !important;
                }

                .qol-rally-movement-warning {
                    width: 100% !important;
                    margin-left: 0 !important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function readMovementTypes() {
        const selectedTypes = {
            ...DEFAULT_MOVEMENT_TYPES
        };

        try {
            const storedValue =
                localStorage.getItem(
                    MOVEMENT_TYPE_STORAGE_KEY
                );

            if (storedValue) {
                const parsedValue =
                    JSON.parse(storedValue);

                Object.keys(selectedTypes)
                    .forEach((type) => {
                        if (
                            typeof parsedValue?.[type] ===
                            'boolean'
                        ) {
                            selectedTypes[type] =
                                parsedValue[type];
                        }
                    });
            }
        } catch (_) {
            // Keep the default selection.
        }

        return selectedTypes;
    }

    function saveMovementTypes(selectedTypes) {
        try {
            localStorage.setItem(
                MOVEMENT_TYPE_STORAGE_KEY,
                JSON.stringify(selectedTypes)
            );
        } catch (_) {
            // The current selection still works for this page session.
        }
    }

    function getActiveTab() {
        try {
            const storedValue =
                localStorage.getItem(
                    ACTIVE_TAB_STORAGE_KEY
                );

            if (
                storedValue === 'resources' ||
                storedValue === 'incomings'
            ) {
                return storedValue;
            }
        } catch (_) {
            // Use the default tab.
        }

        return 'incomings';
    }

    function activateTab(tabName) {
        const panel =
            document.getElementById(PANEL_ID);

        if (!panel) {
            return;
        }

        panel
            .querySelectorAll('[data-qol-rally-tab]')
            .forEach((tab) => {
                const isActive =
                    tab.getAttribute(
                        'data-qol-rally-tab'
                    ) === tabName;

                tab.classList.toggle(
                    'active',
                    isActive
                );
                tab.setAttribute(
                    'aria-selected',
                    isActive ? 'true' : 'false'
                );
            });

        panel
            .querySelectorAll('[data-qol-rally-panel]')
            .forEach((tabPanel) => {
                const isActive =
                    tabPanel.getAttribute(
                        'data-qol-rally-panel'
                    ) === tabName;

                tabPanel.classList.toggle(
                    'active',
                    isActive
                );
                tabPanel.hidden = !isActive;
            });

        try {
            localStorage.setItem(
                ACTIVE_TAB_STORAGE_KEY,
                tabName
            );
        } catch (_) {
            // Tab persistence is optional.
        }
    }

    function updateMovementPickerState(picker) {
        if (!picker) {
            return;
        }

        const selectedTypes = {};

        picker
            .querySelectorAll(
                '[data-qol-rally-movement-type]'
            )
            .forEach((checkbox) => {
                selectedTypes[
                    checkbox.getAttribute(
                        'data-qol-rally-movement-type'
                    )
                ] = checkbox.checked === true;
            });

        saveMovementTypes(selectedTypes);

        const hasSelection =
            Object.values(selectedTypes)
                .some(Boolean);

        const parseButton =
            document.getElementById(
                'qol-btn-merge'
            );

        const warning =
            picker.querySelector(
                '.qol-rally-movement-warning'
            );

        parseButton?.classList.toggle(
            'disabled',
            !hasSelection
        );
        parseButton?.setAttribute(
            'aria-disabled',
            hasSelection ? 'false' : 'true'
        );
        warning?.classList.toggle(
            'visible',
            !hasSelection
        );
    }

    function mountMovementPicker(body) {
        if (
            !body ||
            body.querySelector(
                '.qol-rally-movement-picker'
            )
        ) {
            return;
        }

        const selectedTypes =
            readMovementTypes();
        const picker =
            document.createElement('div');

        picker.className =
            'qol-rally-movement-picker';
        picker.innerHTML = `
            <span class="qol-rally-movement-picker-title">
                Scan for
            </span>
            ${[
                ['attack', 'Attack'],
                ['siege', 'Siege'],
                ['raid', 'Raid'],
                ['reinforcement', 'Reinforcements']
            ].map(([type, label]) => `
                <label class="qol-rally-movement-option">
                    <input
                        type="checkbox"
                        data-qol-rally-movement-type="${type}"
                        ${selectedTypes[type] ? 'checked' : ''}
                    >
                    <span>${label}</span>
                </label>
            `).join('')}
            <span class="qol-rally-movement-warning">
                Select at least one type.
            </span>
        `;

        const controls =
            body.querySelector(
                '.qol-rp-controls'
            );

        body.insertBefore(
            picker,
            controls || null
        );

        picker.addEventListener(
            'change',
            () => {
                updateMovementPickerState(
                    picker
                );
            }
        );

        const parseButton =
            body.querySelector(
                '#qol-btn-merge'
            );

        if (
            parseButton &&
            !parseButton.dataset
                .qolMovementGuard
        ) {
            parseButton.dataset
                .qolMovementGuard = 'true';

            parseButton.addEventListener(
                'click',
                (event) => {
                    const hasSelection =
                        Array.from(
                            picker.querySelectorAll(
                                '[data-qol-rally-movement-type]'
                            )
                        ).some(
                            checkbox =>
                                checkbox.checked
                        );

                    if (!hasSelection) {
                        event.preventDefault();
                        event.stopImmediatePropagation();

                        const status =
                            document.getElementById(
                                'qol-merge-status'
                            );

                        if (status) {
                            status.textContent =
                                'Select at least one incoming movement type.';
                            status.dataset.tone =
                                'error';
                        }
                    }
                },
                true
            );
        }

        updateMovementPickerState(picker);
    }

    function adoptLegacyViews() {
        const panel =
            document.getElementById(PANEL_ID);

        if (!panel) {
            return;
        }

        const mappings = [
            {
                legacyPanelId:
                    'qol-rp-action-bar',
                bodySelector:
                    '.qol-rp-body',
                targetSelector:
                    '[data-qol-rally-panel="incomings"]',
                prepare:
                    mountMovementPicker
            },
            {
                legacyPanelId:
                    'qol-ir-action-bar',
                bodySelector:
                    '.qol-ir-body',
                targetSelector:
                    '[data-qol-rally-panel="resources"]'
            }
        ];

        mappings.forEach((mapping) => {
            const legacyPanel =
                document.getElementById(
                    mapping.legacyPanelId
                );
            const target =
                panel.querySelector(
                    mapping.targetSelector
                );

            legacyPanel?.style.setProperty(
                'display',
                'none',
                'important'
            );

            if (!target) {
                return;
            }

            let body =
                target.querySelector(
                    mapping.bodySelector
                );

            if (!body && legacyPanel) {
                body =
                    legacyPanel.querySelector(
                        mapping.bodySelector
                    );

                if (body) {
                    target
                        .querySelector(
                            '.qol-rally-loading'
                        )
                        ?.remove();
                    target.appendChild(body);
                }
            }

            if (body && mapping.prepare) {
                mapping.prepare(body);
            }
        });

        [
            'qol-wm-toggle-btn',
            'qol-ir-toggle-btn'
        ].forEach((id) => {
            document
                .getElementById(id)
                ?.style.setProperty(
                    'display',
                    'none',
                    'important'
                );
        });
    }

    function makeDraggable(element, handle) {
        handle.addEventListener(
            'pointerdown',
            (event) => {
                if (
                    event.button !== 0 ||
                    event.target.closest(
                        '.qol-rally-scanner-close'
                    )
                ) {
                    return;
                }

                event.preventDefault();

                const rectangle =
                    element.getBoundingClientRect();
                const offsetX =
                    event.clientX - rectangle.left;
                const offsetY =
                    event.clientY - rectangle.top;

                function handlePointerMove(
                    moveEvent
                ) {
                    const maximumLeft =
                        Math.max(
                            10,
                            window.innerWidth -
                                element.offsetWidth -
                                10
                        );
                    const maximumTop =
                        Math.max(
                            10,
                            window.innerHeight -
                                element.offsetHeight -
                                10
                        );
                    const left =
                        Math.max(
                            10,
                            Math.min(
                                moveEvent.clientX -
                                    offsetX,
                                maximumLeft
                            )
                        );
                    const top =
                        Math.max(
                            10,
                            Math.min(
                                moveEvent.clientY -
                                    offsetY,
                                maximumTop
                            )
                        );

                    element.style.setProperty(
                        'left',
                        `${left}px`,
                        'important'
                    );
                    element.style.setProperty(
                        'top',
                        `${top}px`,
                        'important'
                    );
                }

                function handlePointerUp() {
                    window.removeEventListener(
                        'pointermove',
                        handlePointerMove,
                        true
                    );
                    window.removeEventListener(
                        'pointerup',
                        handlePointerUp,
                        true
                    );
                }

                window.addEventListener(
                    'pointermove',
                    handlePointerMove,
                    true
                );
                window.addEventListener(
                    'pointerup',
                    handlePointerUp,
                    true
                );
            }
        );
    }

    function positionPanelUnderButton(panel) {
        const button =
            document.getElementById(TOGGLE_ID);

        if (!button) {
            return;
        }

        const rectangle =
            button.getBoundingClientRect();
        const width =
            panel.offsetWidth || 900;
        const height =
            panel.offsetHeight || 540;
        const maximumLeft =
            Math.max(
                10,
                window.innerWidth - width - 10
            );
        const maximumTop =
            Math.max(
                10,
                window.innerHeight - height - 10
            );
        const left =
            Math.max(
                10,
                Math.min(
                    rectangle.left,
                    maximumLeft
                )
            );
        const top =
            Math.max(
                10,
                Math.min(
                    rectangle.bottom + 20,
                    maximumTop
                )
            );

        panel.style.setProperty(
            'left',
            `${left}px`,
            'important'
        );
        panel.style.setProperty(
            'top',
            `${top}px`,
            'important'
        );
        panel.style.setProperty(
            'right',
            'auto',
            'important'
        );
        panel.style.setProperty(
            'bottom',
            'auto',
            'important'
        );
    }

    function mountPanel() {
        let panel =
            document.getElementById(PANEL_ID);

        if (panel) {
            return panel;
        }

        panel =
            document.createElement('div');
        panel.id = PANEL_ID;
        panel.setAttribute(
            'role',
            'dialog'
        );
        panel.setAttribute(
            'aria-label',
            'Rally Point Scanner'
        );
        panel.innerHTML = `
            <div class="qol-rally-scanner-header">
                <span class="qol-rally-scanner-title">
                    <span class="qol-rally-scanner-mark">⚔</span>
                    Rally Point Scanner
                </span>
                <span
                    class="qol-rally-scanner-close"
                    role="button"
                    tabindex="0"
                    aria-label="Close Rally Point Scanner"
                >&times;</span>
            </div>
            <div
                class="qol-rally-tabs"
                role="tablist"
                aria-label="Rally Point scan types"
            >
                <button
                    type="button"
                    class="qol-rally-tab"
                    data-qol-rally-tab="incomings"
                    role="tab"
                >Incomings</button>
                <button
                    type="button"
                    class="qol-rally-tab"
                    data-qol-rally-tab="resources"
                    role="tab"
                >Resources</button>
            </div>
            <div class="qol-rally-scanner-content">
                <section
                    class="qol-rally-tab-panel"
                    data-qol-rally-panel="incomings"
                    role="tabpanel"
                >
                    <div class="qol-rally-loading">
                        Loading incoming scanner...
                    </div>
                </section>
                <section
                    class="qol-rally-tab-panel"
                    data-qol-rally-panel="resources"
                    role="tabpanel"
                >
                    <div class="qol-rally-loading">
                        Loading resource scanner...
                    </div>
                </section>
            </div>
        `;

        document.body.appendChild(panel);

        const header =
            panel.querySelector(
                '.qol-rally-scanner-header'
            );
        const closeButton =
            panel.querySelector(
                '.qol-rally-scanner-close'
            );

        makeDraggable(panel, header);

        panel
            .querySelectorAll(
                '[data-qol-rally-tab]'
            )
            .forEach((tab) => {
                tab.addEventListener(
                    'click',
                    () => {
                        activateTab(
                            tab.getAttribute(
                                'data-qol-rally-tab'
                            )
                        );
                    }
                );
            });

        const closePanel = () => {
            panel.style.setProperty(
                'display',
                'none',
                'important'
            );
        };

        closeButton.addEventListener(
            'click',
            closePanel
        );
        closeButton.addEventListener(
            'keydown',
            (event) => {
                if (
                    event.key === 'Enter' ||
                    event.key === ' '
                ) {
                    event.preventDefault();
                    closePanel();
                }
            }
        );

        activateTab(getActiveTab());

        return panel;
    }

    function mountToggleButton() {
        let button =
            document.getElementById(TOGGLE_ID);

        if (button) {
            return button;
        }

        button =
            document.createElement('div');
        button.id = TOGGLE_ID;
        button.setAttribute(
            'title',
            'Rally Point Scanner'
        );
        button.setAttribute(
            'role',
            'button'
        );
        button.setAttribute(
            'tabindex',
            '0'
        );
        button.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 4l7 7"></path>
                <path d="M13 13l7 7"></path>
                <path d="M14 4h6v6"></path>
                <path d="M20 4l-8 8"></path>
                <path d="M4 20l5-5"></path>
            </svg>
        `;

        const togglePanel = (event) => {
            event?.preventDefault();
            event?.stopPropagation();

            const panel =
                document.getElementById(PANEL_ID);

            if (!panel) {
                return;
            }

            const isHidden =
                window
                    .getComputedStyle(panel)
                    .display === 'none';

            if (isHidden) {
                window.dispatchEvent(
                    new CustomEvent(
                        'qol_close_others',
                        {
                            detail: {
                                source:
                                    'rallyScanner'
                            }
                        }
                    )
                );

                adoptLegacyViews();
                positionPanelUnderButton(panel);
                panel.style.setProperty(
                    'display',
                    'flex',
                    'important'
                );
            } else {
                panel.style.setProperty(
                    'display',
                    'none',
                    'important'
                );
            }
        };

        button.addEventListener(
            'click',
            togglePanel
        );
        button.addEventListener(
            'keydown',
            (event) => {
                if (
                    event.key === 'Enter' ||
                    event.key === ' '
                ) {
                    togglePanel(event);
                }
            }
        );

        document.body.appendChild(button);

        return button;
    }

    function destroyUI() {
        document
            .getElementById(PANEL_ID)
            ?.remove();
        document
            .getElementById(TOGGLE_ID)
            ?.remove();
    }

    function ensureUI() {
        if (!document.body) {
            return;
        }

        injectStyles();

        if (!isEnabled()) {
            destroyUI();
            return;
        }

        mountPanel();
        mountToggleButton();
        adoptLegacyViews();

        if (
            typeof window
                .qolRepositionAllButtons ===
            'function'
        ) {
            window.qolRepositionAllButtons();
        }
    }

    window.addEventListener(
        'qol_close_others',
        (event) => {
            if (
                event.detail?.source ===
                'rallyScanner'
            ) {
                return;
            }

            document
                .getElementById(PANEL_ID)
                ?.style.setProperty(
                    'display',
                    'none',
                    'important'
                );
        }
    );

    window.addEventListener(
        'qol_setting_changed',
        (event) => {
            if (
                event.detail?.key !==
                FEATURE_KEY
            ) {
                return;
            }

            if (event.detail.enabled) {
                window.setTimeout(
                    ensureUI,
                    0
                );
            } else {
                destroyUI();
            }
        }
    );

    document.addEventListener(
        'keydown',
        (event) => {
            if (event.key !== 'Escape') {
                return;
            }

            document
                .getElementById(PANEL_ID)
                ?.style.setProperty(
                    'display',
                    'none',
                    'important'
                );
        },
        true
    );

    window.addEventListener(
        'resize',
        () => {
            const panel =
                document.getElementById(PANEL_ID);

            if (
                panel &&
                window
                    .getComputedStyle(panel)
                    .display !== 'none'
            ) {
                positionPanelUnderButton(panel);
            }
        }
    );

    if (
        document.readyState === 'loading'
    ) {
        document.addEventListener(
            'DOMContentLoaded',
            ensureUI,
            { once: true }
        );
    } else {
        ensureUI();
    }

    window.setInterval(
        ensureUI,
        1200
    );
}

initUnifiedRallyPointScanner();
