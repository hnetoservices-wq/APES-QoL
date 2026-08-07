/**
 * Travian QoL Extension
 * Module: Page Navigation Keys (1-3, Q/E, Arrows, T/G, Z, X, C, F, V)
 * with Toggle Close & Action Triggers
 */

/**
 * Appends or updates route parameters cleanly without breaking structural order.
 */
function navigateToRoute(routeParam) {
    let currentHash = window.location.hash;

    if (!currentHash.startsWith('#/')) {
        currentHash = '#/';
    }

    let parts = currentHash.substring(2).split('/').filter(Boolean);
    const [targetKey] = routeParam.split(':');

    // Drop subtabs when injecting a primary tab to prevent router collisions.
    if (targetKey === 'tab') {
        parts = parts.filter(part => !part.startsWith('subtab:'));
    } else if (targetKey === 'subtab') {
        parts = parts.filter(part => !part.startsWith('tab:'));
    }

    const existingIndex = parts.findIndex(part => {
        return part.startsWith(`${targetKey}:`);
    });

    if (existingIndex !== -1) {
        parts[existingIndex] = routeParam;
    } else {
        parts.push(routeParam);
    }

    window.location.hash = `#/${parts.filter(Boolean).join('/')}`;
}

/**
 * Opens a village window using one atomic hash update.
 * Travian's router is sensitive to parameter order and several rapid
 * consecutive hash changes, so the destination is assembled first.
 */
function openVillageWindow(
    windowName,
    beforeWindowParams = [],
    afterWindowParams = []
) {
    const currentParts = window.location.hash.startsWith('#/')
        ? window.location.hash.substring(2).split('/').filter(Boolean)
        : [];

    const villageIdPart = currentParts.find(part => {
        return part.startsWith('villId:');
    });

    const nextParts = ['page:village'];

    if (villageIdPart) {
        nextParts.push(villageIdPart);
    }

    nextParts.push(
        ...beforeWindowParams,
        `window:${windowName}`,
        ...afterWindowParams
    );

    window.location.hash = `#/${nextParts.join('/')}`;
}

/**
 * Strips a specific window parameter from the URL hash.
 */
function removeRouteParam(targetWindowName) {
    let currentHash = window.location.hash;

    if (!currentHash.startsWith('#/')) {
        return;
    }

    let parts = currentHash.substring(2).split('/');

    parts = parts.filter(part => {
        return part !== `window:${targetWindowName}` &&
            !part.startsWith('location:') &&
            !part.startsWith('cp:') &&
            !part.startsWith('herotab:') &&
            !part.startsWith('tab:') &&
            !part.startsWith('subtab:');
    });

    window.location.hash = `#/${parts.filter(Boolean).join('/')}`;
}

/**
 * Simulates a native mouse click on an element and its children
 * to force framework event listeners such as AngularJS to trigger.
 */
function clickSidebarElement(elementId) {
    const element = document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    }));

    const icon = element.querySelector('i');

    if (icon) {
        icon.dispatchEvent(new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        }));
    }
}

/**
 * Changes village through Travian's native previous/next village controls.
 */
function changeVillage(direction) {
    const navigationButtons = Array.from(document.querySelectorAll(
        `#villageList .navigation.${direction}`
    ));

    const navigationButton = navigationButtons.find(button => {
        const style = window.getComputedStyle(button);
        const bounds = button.getBoundingClientRect();

        return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            bounds.width > 0 &&
            bounds.height > 0;
    }) || navigationButtons[0];

    if (!navigationButton) {
        console.warn(`[QoL] ${direction} village button not found.`);
        return;
    }

    const bounds = navigationButton.getBoundingClientRect();

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
        navigationButton.dispatchEvent(new PointerEvent('pointerover', {
            ...eventOptions,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true
        }));

        navigationButton.dispatchEvent(new PointerEvent('pointerdown', {
            ...eventOptions,
            buttons: 1,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true
        }));
    }

    navigationButton.dispatchEvent(
        new MouseEvent('mouseover', eventOptions)
    );

    navigationButton.dispatchEvent(new MouseEvent('mousedown', {
        ...eventOptions,
        buttons: 1
    }));

    if (typeof PointerEvent === 'function') {
        navigationButton.dispatchEvent(new PointerEvent('pointerup', {
            ...eventOptions,
            buttons: 0,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true
        }));
    }

    navigationButton.dispatchEvent(
        new MouseEvent('mouseup', eventOptions)
    );

    navigationButton.dispatchEvent(
        new MouseEvent('click', eventOptions)
    );
}

/**
 * Tracks modifier keys even when the outer listener only passes
 * a string code to handleNavigation.
 */
let modifiersActive = false;

window.addEventListener('keydown', (event) => {
    modifiersActive = (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.shiftKey
    );
}, true);

window.addEventListener('keyup', (event) => {
    modifiersActive = (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.shiftKey
    );
}, true);

/**
 * Checks if a specific key action is enabled.
 * Defaults to true if the setting does not exist yet.
 */
function isKeybindEnabled(actionKey) {
    const setting = localStorage.getItem(`qol_keybind_${actionKey}`);

    return setting !== 'false';
}

/**
 * Maps keys to game destinations with toggle-close logic.
 */
function handleNavigation(code) {
    const legacyModifierEvent = window.event;

    if (
        modifiersActive ||
        (
            legacyModifierEvent &&
            (
                legacyModifierEvent.ctrlKey ||
                legacyModifierEvent.altKey ||
                legacyModifierEvent.metaKey ||
                legacyModifierEvent.shiftKey
            )
        )
    ) {
        return;
    }

    const activeElement = document.activeElement;

    if (activeElement) {
        const tagName = activeElement.tagName.toUpperCase();

        if (
            tagName === 'INPUT' ||
            tagName === 'TEXTAREA' ||
            tagName === 'SELECT'
        ) {
            return;
        }

        if (
            activeElement.isContentEditable ||
            activeElement.getAttribute('contenteditable') === 'true'
        ) {
            return;
        }

        const role = activeElement.getAttribute('role');

        if (role === 'textbox' || role === 'searchbox') {
            return;
        }

        if (
            activeElement.closest('.chat') ||
            activeElement.closest('.message') ||
            activeElement.closest('.input')
        ) {
            return;
        }
    }

    const currentHash = window.location.hash;

    switch (code) {
        // 1: Village Center
        case 'Digit1':
        case 'Numpad1':
            if (isKeybindEnabled('village')) {
                window.location.hash = '#/page:village';
            }
            break;

        // 2: Resources
        case 'Digit2':
        case 'Numpad2':
            if (isKeybindEnabled('resources')) {
                window.location.hash = '#/page:resources';
            }
            break;

        // 3: World Map
        case 'Digit3':
        case 'Numpad3':
            if (isKeybindEnabled('map')) {
                window.location.hash = '#/page:map';
            }
            break;

        // Q / Left Arrow: Previous Village
        case 'KeyQ':
        case 'ArrowLeft':
            if (isKeybindEnabled('previousVillage')) {
                changeVillage('previous');
            }
            break;

        // E / Right Arrow: Next Village
        case 'KeyE':
        case 'ArrowRight':
            if (isKeybindEnabled('nextVillage')) {
                changeVillage('next');
            }
            break;

        // T: Rally Point Overview
        case 'KeyT':
            if (isKeybindEnabled('rallyPoint')) {
                const rallyPointIsOpen =
                    currentHash.includes('window:building') &&
                    currentHash.includes('location:32') &&
                    !currentHash.includes('tab:FarmList');

                if (rallyPointIsOpen) {
                    removeRouteParam('building');
                } else {
                    const cpMatch = currentHash.match(/cp:([^/]+)/);
                    const activeCp = cpMatch ? cpMatch[1] : '1';

                    openVillageWindow(
                        'building',
                        ['location:32'],
                        [`cp:${activeCp}`]
                    );
                }
            }
            break;

        // G: Hero Inventory
        case 'KeyG':
            if (isKeybindEnabled('heroInventory')) {
                const inventoryIsOpen =
                    currentHash.includes('window:hero') &&
                    currentHash.includes('herotab:Inventory');

                if (inventoryIsOpen) {
                    removeRouteParam('hero');
                } else {
                    openVillageWindow(
                        'hero',
                        [],
                        ['herotab:Inventory']
                    );
                }
            }
            break;

        // Z: Conversations
        case 'KeyZ':
            if (isKeybindEnabled('conversations')) {
                if (currentHash.includes('window:igm')) {
                    removeRouteParam('igm');
                } else {
                    navigateToRoute('window:igm');
                    clickSidebarElement('jsQuestButtonIgm');
                }
            }
            break;

        // X: Statistics
        case 'KeyX':
            if (isKeybindEnabled('statistics')) {
                if (currentHash.includes('window:statistics')) {
                    removeRouteParam('statistics');
                } else {
                    navigateToRoute('window:statistics');
                    clickSidebarElement('jsQuestButtonStatistics');
                }
            }
            break;

        // C: Quest Book
        case 'KeyC':
            if (isKeybindEnabled('questBook')) {
                if (currentHash.includes('window:questBook')) {
                    removeRouteParam('questBook');
                } else {
                    navigateToRoute('window:questBook');
                    clickSidebarElement('jsQuestButtonQuestbook');
                }
            }
            break;

        // F: Reports
        case 'KeyF':
            if (isKeybindEnabled('reports')) {
                if (currentHash.includes('window:reports')) {
                    removeRouteParam('reports');
                } else {
                    const cpMatch = currentHash.match(/cp:([^/]+)/);
                    const activeCp = cpMatch ? cpMatch[1] : '1';

                    navigateToRoute(`cp:${activeCp}`);
                    navigateToRoute('window:reports');
                }
            }
            break;

        // V: Villages Overview
        case 'KeyV':
            if (isKeybindEnabled('villagesOverview')) {
                if (currentHash.includes('window:villagesOverview')) {
                    removeRouteParam('villagesOverview');
                } else {
                    navigateToRoute('window:villagesOverview');
                }
            }
            break;
    }
}