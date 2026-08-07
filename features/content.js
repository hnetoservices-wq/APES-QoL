function isMapPage() {
    return window.location.hash.includes('/page:map');
}

function isUserTyping() {
    const activeEl = document.activeElement;

    return !!(activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        activeEl.isContentEditable ||
        activeEl.closest('[contenteditable="true"]')
    ));
}

function initializeKeybinds() {
    console.log('Travian QoL Extension: Modular Keybinds Initialized.');

    window.addEventListener('keydown', (event) => {
        if (isUserTyping()) {
            return;
        }

        const code = event.code;

        // 1. Map movement (WASD)
        if (isMapPage() && isMapKey(code)) {
            handleMapMovement(event);
            return;
        }

        // Synthetic arrow events created by mapKeys.js must reach Travian's
        // map controls, but they must not trigger our village shortcuts.
        if (!event.isTrusted) {
            return;
        }

        // 2. Map hover hotkey (only active on the map page)
        if (isMapPage() && code === 'KeyR') {
            event.preventDefault();
            handleHoverSendTroops();
            return;
        }

        // 3. Navigation shortcuts
        const navKeys = [
            'Digit1',
            'Numpad1',
            'Digit2',
            'Numpad2',
            'Digit3',
            'Numpad3',
            'KeyQ',
            'ArrowLeft',
            'KeyE',
            'ArrowRight',
            'KeyT',
            'KeyG',
            'KeyZ',
            'KeyX',
            'KeyC',
            'KeyF',
            'KeyV'
        ];

        if (navKeys.includes(code)) {
            event.preventDefault();
            handleNavigation(code);
        }
    }, true);

    window.addEventListener('keyup', (event) => {
        if (isUserTyping()) {
            return;
        }

        if (isMapPage() && isMapKey(event.code)) {
            handleMapMovement(event);
        }
    }, true);
}

initializeKeybinds();