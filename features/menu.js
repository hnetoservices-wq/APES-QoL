/**
APES QoL Extension
Unified Settings Menu
 */

window.isQolEnabled = function(key) {
    try {
        const value = localStorage.getItem(`qol_${key}`);
        return value !== 'false';
    } catch (e) {
        return true;
    }
};

window.getQolTheme = function() {
    return 'default';
};

window.applyQolTheme = function(theme) {
    document.body.removeAttribute('data-qol-theme');
};

window.applyQolTheme();

const QOL_MENU_STYLE_ID = 'qol-menu-styles';

function injectQolMenuStyles() {
    if (document.getElementById(QOL_MENU_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = QOL_MENU_STYLE_ID;
    style.textContent = `
        #qol-cog-btn {
            position: fixed !important;
            width: 30px !important;
            height: 30px !important;
            display: none;
            align-items: center !important;
            justify-content: center !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 2px solid #7d6342 !important;
            border-radius: 50% !important;
            background-color: #ebdcb9 !important;
            background-image: none !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
            cursor: pointer !important;
            user-select: none !important;
            box-sizing: border-box !important;
            transition:
                transform 0.2s ease,
                background-color 0.2s ease !important;
        }

        #qol-cog-btn:hover {
            transform: scale(1.1) !important;
            background-color: #f7f5f0 !important;
        }

        #qol-cog-btn:active {
            transform: scale(1) !important;
        }

        #qol-cog-btn:focus-visible {
            outline: 2px solid #f3d79e !important;
            outline-offset: 2px !important;
        }

        #qol-cog-btn svg {
            width: 16px !important;
            height: 16px !important;
            fill: #7d6342 !important;
            pointer-events: none !important;
        }

        #qol-modal-overlay {
            position: fixed !important;
            inset: 0 !important;
            display: none;
            align-items: center !important;
            justify-content: center !important;
            padding: 24px !important;
            background-color: rgba(18, 16, 13, 0.76) !important;
            background-image: none !important;
            box-sizing: border-box !important;
            isolation: isolate !important;
            overscroll-behavior: contain !important;
            animation: none !important;
            transition: none !important;
            z-index: 1000000 !important;
        }

        #qol-modal,
        #qol-modal * {
            box-sizing: border-box !important;
            font-family: Arial, Helvetica, sans-serif !important;
            text-shadow: none !important;
        }

        #qol-modal {
            display: flex !important;
            flex-direction: column !important;
            width: min(920px, 94vw) !important;
            max-height: min(820px, 90vh) !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 3px solid #634d31 !important;
            border-radius: 7px !important;
            background: #f7f5f0 !important;
            color: #332719 !important;
            box-shadow:
                0 24px 64px rgba(0, 0, 0, 0.52),
                0 0 0 1px rgba(255, 255, 255, 0.14) inset !important;
            overflow: hidden !important;
            animation: qolMenuPanelIn 0.19s ease-out !important;
        }

        #qol-modal .qol-modal-header {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            flex: 0 0 auto !important;
            min-height: 66px !important;
            margin: 0 !important;
            padding: 10px 12px 10px 14px !important;
            border: 0 !important;
            border-bottom: 1px solid #3f2d19 !important;
            border-radius: 0 !important;
            background:
                linear-gradient(
                    135deg,
                    rgba(255, 255, 255, 0.07),
                    transparent 46%
                ),
                linear-gradient(
                    to bottom,
                    #6d5436,
                    #4f3b24
                ) !important;
            color: #f8f0df !important;
        }

        #qol-modal .qol-modal-title-group {
            display: flex !important;
            align-items: center !important;
            min-width: 0 !important;
            gap: 11px !important;
        }

        #qol-modal .qol-brand-mark {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex: 0 0 40px !important;
            width: 40px !important;
            height: 40px !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 8px !important;
            background: rgba(24, 15, 8, 0.24) !important;
            box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.09),
                0 2px 6px rgba(0, 0, 0, 0.2) !important;
            font-size: 23px !important;
            line-height: 1 !important;
        }

        #qol-modal .qol-title-copy {
            display: flex !important;
            flex-direction: column !important;
            min-width: 0 !important;
            gap: 2px !important;
        }

        #qol-modal .qol-title-line {
            display: flex !important;
            align-items: center !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
        }

        #qol-modal .qol-modal-title {
            color: #fffaf0 !important;
            font-size: 15px !important;
            font-weight: 700 !important;
            line-height: 20px !important;
            letter-spacing: 0.1px !important;
        }

        #qol-modal .qol-version-badge {
            display: inline-flex !important;
            align-items: center !important;
            min-height: 18px !important;
            padding: 1px 7px !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 10px !important;
            background: rgba(0, 0, 0, 0.18) !important;
            color: #e9dcc3 !important;
            font-size: 9px !important;
            font-weight: 700 !important;
            line-height: 14px !important;
            letter-spacing: 0.45px !important;
            text-transform: uppercase !important;
        }

        #qol-modal .qol-modal-subtitle {
            color: #d7c8ad !important;
            font-size: 10px !important;
            line-height: 15px !important;
        }

        #qol-modal .qol-modal-close {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex: 0 0 30px !important;
            width: 30px !important;
            height: 30px !important;
            margin-left: 12px !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 5px !important;
            background: rgba(0, 0, 0, 0.2) !important;
            color: #ffffff !important;
            font-size: 23px !important;
            font-weight: 700 !important;
            line-height: 1 !important;
            cursor: pointer !important;
            user-select: none !important;
            transition:
                background-color 0.15s ease,
                transform 0.15s ease !important;
        }

        #qol-modal .qol-modal-close:hover {
            background: rgba(255, 255, 255, 0.15) !important;
            transform: scale(1.04) !important;
        }

        #qol-modal .qol-modal-close:focus-visible {
            outline: 2px solid #f3d79e !important;
            outline-offset: 2px !important;
        }

        #qol-modal .qol-modal-body {
            display: block !important;
            flex: 1 1 auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 16px !important;
            background:
                radial-gradient(
                    circle at top right,
                    rgba(125, 99, 66, 0.07),
                    transparent 31%
                ),
                #f7f5f0 !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            scrollbar-color: #aa987b #eee8dc !important;
            scrollbar-width: thin !important;
        }

        #qol-modal .qol-modal-body::-webkit-scrollbar {
            width: 9px !important;
        }

        #qol-modal .qol-modal-body::-webkit-scrollbar-track {
            background: #eee8dc !important;
        }

        #qol-modal .qol-modal-body::-webkit-scrollbar-thumb {
            border: 2px solid #eee8dc !important;
            border-radius: 8px !important;
            background: #aa987b !important;
        }

        #qol-modal .qol-section-heading {
            display: flex !important;
            align-items: flex-end !important;
            justify-content: space-between !important;
            gap: 14px !important;
            margin: 0 0 9px !important;
        }

        #qol-modal .qol-section-heading:not(:first-child) {
            margin-top: 20px !important;
        }

        #qol-modal .qol-section-title-group {
            display: flex !important;
            flex-direction: column !important;
            min-width: 0 !important;
            gap: 2px !important;
        }

        #qol-modal .qol-section-title {
            margin: 0 !important;
            color: #4f3b24 !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            line-height: 18px !important;
        }

        #qol-modal .qol-section-caption {
            color: #7a6a55 !important;
            font-size: 10px !important;
            line-height: 15px !important;
        }

        #qol-modal .qol-section-count {
            flex: 0 0 auto !important;
            padding: 2px 8px !important;
            border: 1px solid #d4c2a5 !important;
            border-radius: 10px !important;
            background: #fffaf0 !important;
            color: #6d5436 !important;
            font-size: 9px !important;
            font-weight: 700 !important;
            line-height: 14px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.3px !important;
        }

        #qol-modal .qol-feature-grid {
            display: grid !important;
            grid-template-columns:
                repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        #qol-modal .qol-feature-card {
            position: relative !important;
            display: grid !important;
            grid-template-columns:
                34px minmax(0, 1fr) 40px !important;
            align-items: start !important;
            gap: 9px !important;
            min-height: 89px !important;
            margin: 0 !important;
            padding: 11px !important;
            border: 1px solid #d6cab8 !important;
            border-radius: 5px !important;
            background: #ffffff !important;
            box-shadow:
                0 1px 2px rgba(72, 51, 29, 0.06) !important;
            overflow: hidden !important;
            transition:
                border-color 0.15s ease,
                box-shadow 0.15s ease,
                transform 0.15s ease !important;
        }

        #qol-modal .qol-feature-card::after {
            content: '' !important;
            position: absolute !important;
            inset: 0 auto 0 0 !important;
            width: 3px !important;
            background: #8a704e !important;
            opacity: 0 !important;
            transition: opacity 0.15s ease !important;
        }

        #qol-modal .qol-feature-card:hover {
            border-color: #b9a589 !important;
            box-shadow:
                0 4px 12px rgba(72, 51, 29, 0.11) !important;
            transform: translateY(-1px) !important;
        }

        #qol-modal .qol-feature-card:hover::after {
            opacity: 1 !important;
        }

        #qol-modal .qol-feature-icon {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 34px !important;
            height: 34px !important;
            border: 1px solid #d7c7ad !important;
            border-radius: 6px !important;
            background:
                linear-gradient(
                    to bottom,
                    #fffaf0,
                    #eee5d6
                ) !important;
            color: #654c30 !important;
            font-size: 16px !important;
            font-weight: 700 !important;
            line-height: 1 !important;
        }

        #qol-modal .qol-feature-copy {
            display: flex !important;
            flex-direction: column !important;
            min-width: 0 !important;
            gap: 3px !important;
        }

        #qol-modal .qol-feature-name {
            margin: 0 !important;
            color: #3f3020 !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            line-height: 16px !important;
        }

        #qol-modal .qol-feature-desc {
            margin: 0 !important;
            color: #746653 !important;
            font-size: 9.5px !important;
            line-height: 1.42 !important;
        }

        #qol-modal .qol-switch {
            position: relative !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            align-self: start !important;
            width: 40px !important;
            height: 24px !important;
            margin: 4px 0 0 !important;
            cursor: pointer !important;
            user-select: none !important;
        }

        #qol-modal .qol-checkbox {
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            margin: 0 !important;
            padding: 0 !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }

        #qol-modal .qol-switch-track {
            position: relative !important;
            display: block !important;
            width: 36px !important;
            height: 20px !important;
            border: 1px solid #a9977c !important;
            border-radius: 12px !important;
            background: #d8cdbb !important;
            box-shadow:
                inset 0 1px 2px rgba(73, 53, 32, 0.16) !important;
            transition:
                background-color 0.16s ease,
                border-color 0.16s ease !important;
        }

        #qol-modal .qol-switch-track::after {
            content: '' !important;
            position: absolute !important;
            top: 2px !important;
            left: 2px !important;
            width: 14px !important;
            height: 14px !important;
            border-radius: 50% !important;
            background: #ffffff !important;
            box-shadow:
                0 1px 3px rgba(45, 30, 16, 0.32) !important;
            transition: transform 0.16s ease !important;
        }

        #qol-modal .qol-checkbox:checked +
        .qol-switch-track {
            border-color: #4f6e25 !important;
            background: #6f9b34 !important;
        }

        #qol-modal .qol-checkbox:checked +
        .qol-switch-track::after {
            transform: translateX(16px) !important;
        }

        #qol-modal .qol-checkbox:focus-visible +
        .qol-switch-track {
            outline: 2px solid #8e6f45 !important;
            outline-offset: 2px !important;
        }

        #qol-modal .qol-keybind-grid {
            display: grid !important;
            grid-template-columns:
                repeat(3, minmax(0, 1fr)) !important;
            gap: 7px !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        #qol-modal .qol-keybind-item {
            display: grid !important;
            grid-template-columns:
                minmax(56px, auto)
                minmax(0, 1fr)
                40px !important;
            align-items: center !important;
            gap: 8px !important;
            min-height: 48px !important;
            margin: 0 !important;
            padding: 7px 8px !important;
            border: 1px solid #d9cebd !important;
            border-radius: 4px !important;
            background: #ffffff !important;
            transition:
                background-color 0.15s ease,
                border-color 0.15s ease !important;
        }

        #qol-modal .qol-keybind-item:hover {
            border-color: #baa88c !important;
            background: #fffaf0 !important;
        }

        #qol-modal .qol-key-combo {
            display: flex !important;
            align-items: center !important;
            flex-wrap: wrap !important;
            gap: 3px !important;
            min-width: 0 !important;
        }

        #qol-modal .qol-kbd {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-width: 23px !important;
            height: 23px !important;
            padding: 0 5px !important;
            border: 1px solid #9c8668 !important;
            border-bottom-width: 2px !important;
            border-radius: 4px !important;
            background:
                linear-gradient(
                    to bottom,
                    #fffefb,
                    #eee5d7
                ) !important;
            color: #4c3822 !important;
            box-shadow:
                0 1px 1px rgba(67, 46, 25, 0.12) !important;
            font-family:
                Consolas,
                Monaco,
                monospace !important;
            font-size: 10px !important;
            font-weight: 700 !important;
            line-height: 1 !important;
        }

        #qol-modal .qol-keybind-action {
            min-width: 0 !important;
            color: #554733 !important;
            font-size: 9.5px !important;
            font-weight: 600 !important;
            line-height: 1.35 !important;
        }

        #qol-modal .qol-keybind-item .qol-switch {
            margin-top: 0 !important;
        }

        #qol-modal .qol-fixed-state {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 40px !important;
            min-height: 19px !important;
            padding: 1px 5px !important;
            border: 1px solid #d0c4b1 !important;
            border-radius: 9px !important;
            background: #f1ece3 !important;
            color: #81725e !important;
            font-size: 8px !important;
            font-weight: 700 !important;
            line-height: 13px !important;
            text-align: center !important;
            text-transform: uppercase !important;
            letter-spacing: 0.25px !important;
        }

        #qol-modal .qol-modal-footer {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            flex: 0 0 auto !important;
            min-height: 36px !important;
            margin: 0 !important;
            padding: 7px 14px !important;
            border: 0 !important;
            border-top: 1px solid #d8ccba !important;
            background: #eee8dc !important;
            color: #71634f !important;
            font-size: 9px !important;
            line-height: 14px !important;
        }

        #qol-modal .qol-footer-left {
            display: inline-flex !important;
            align-items: center !important;
            flex-wrap: wrap !important;
            gap: 10px !important;
            min-width: 0 !important;
        }

        #qol-modal .qol-save-note {
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
        }

        #qol-modal .qol-save-dot {
            width: 7px !important;
            height: 7px !important;
            border-radius: 50% !important;
            background: #6f9b34 !important;
            box-shadow:
                0 0 0 2px
                rgba(111, 155, 52, 0.14) !important;
        }

        #qol-modal .qol-footer-hint {
            color: #8b7a62 !important;
        }

        #qol-modal .qol-clear-cache-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 24px !important;
            margin: 0 !important;
            padding: 3px 9px !important;
            border: 1px solid #b97856 !important;
            border-radius: 4px !important;
            background: #fff8f2 !important;
            color: #8f3f2f !important;
            box-shadow:
                0 1px 1px
                rgba(91, 50, 34, 0.06) !important;
            font-size: 9px !important;
            font-weight: 700 !important;
            line-height: 14px !important;
            cursor: pointer !important;
            user-select: none !important;
            transition:
                background-color 0.15s ease,
                border-color 0.15s ease,
                transform 0.15s ease !important;
        }

        #qol-modal .qol-clear-cache-btn:hover {
            border-color: #9c5438 !important;
            background: #f9e9de !important;
            transform: translateY(-1px) !important;
        }

        #qol-modal .qol-clear-cache-btn:focus-visible {
            outline: 2px solid #b97856 !important;
            outline-offset: 2px !important;
        }

        #qol-modal-overlay .qol-cache-dialog-layer {
            position: fixed !important;
            inset: 0 !important;
            display: none !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 24px !important;
            background: rgba(18, 16, 13, 0.62) !important;
            z-index: 1000002 !important;
        }

        #qol-modal-overlay
        .qol-cache-dialog-layer.qol-open {
            display: flex !important;
        }

        #qol-modal-overlay .qol-cache-dialog,
        #qol-modal-overlay .qol-cache-dialog * {
            box-sizing: border-box !important;
            font-family:
                Arial,
                Helvetica,
                sans-serif !important;
            text-shadow: none !important;
        }

        #qol-modal-overlay .qol-cache-dialog {
            width: min(430px, 92vw) !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 2px solid #634d31 !important;
            border-radius: 6px !important;
            background: #f7f5f0 !important;
            color: #3f3020 !important;
            box-shadow:
                0 18px 48px
                rgba(0, 0, 0, 0.46) !important;
            overflow: hidden !important;
            animation:
                qolMenuPanelIn 0.16s
                ease-out !important;
        }

        #qol-modal-overlay
        .qol-cache-dialog-header {
            margin: 0 !important;
            padding: 12px 14px !important;
            border-bottom: 1px solid #3f2d19 !important;
            background:
                linear-gradient(
                    to bottom,
                    #6d5436,
                    #4f3b24
                ) !important;
            color: #fffaf0 !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            line-height: 18px !important;
        }

        #qol-modal-overlay
        .qol-cache-dialog-body {
            margin: 0 !important;
            padding: 14px !important;
            color: #665744 !important;
            font-size: 10px !important;
            line-height: 1.55 !important;
        }

        #qol-modal-overlay
        .qol-cache-dialog-body strong {
            color: #3f3020 !important;
        }

        #qol-modal-overlay
        .qol-cache-dialog-status {
            min-height: 16px !important;
            margin-top: 8px !important;
            color: #8f3f2f !important;
            font-size: 9px !important;
            font-weight: 700 !important;
            line-height: 14px !important;
        }

        #qol-modal-overlay
        .qol-cache-dialog-actions {
            display: flex !important;
            align-items: center !important;
            justify-content: flex-end !important;
            gap: 8px !important;
            margin: 0 !important;
            padding: 10px 14px !important;
            border-top: 1px solid #d8ccba !important;
            background: #eee8dc !important;
        }

        #qol-modal-overlay
        .qol-cache-dialog-action {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 28px !important;
            margin: 0 !important;
            padding: 5px 12px !important;
            border: 1px solid #aa987b !important;
            border-radius: 4px !important;
            background: #fffaf0 !important;
            color: #5e4a33 !important;
            font-size: 9px !important;
            font-weight: 700 !important;
            line-height: 14px !important;
            cursor: pointer !important;
            user-select: none !important;
        }

        #qol-modal-overlay
        .qol-cache-dialog-action:hover {
            border-color: #806745 !important;
            background: #ffffff !important;
        }

        #qol-modal-overlay
        .qol-cache-dialog-action.qol-danger {
            border-color: #9c5438 !important;
            background: #9b4d36 !important;
            color: #ffffff !important;
        }

        #qol-modal-overlay
        .qol-cache-dialog-action.qol-danger:hover {
            border-color: #7f3d2c !important;
            background: #873f2d !important;
        }

        #qol-modal-overlay
        .qol-cache-dialog-action:focus-visible {
            outline: 2px solid #8e6f45 !important;
            outline-offset: 2px !important;
        }

        #qol-modal-overlay
        .qol-cache-dialog-action[
            aria-disabled="true"
        ] {
            opacity: 0.58 !important;
            cursor: wait !important;
            pointer-events: none !important;
        }

        #qol-modal .qol-visually-hidden {
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            margin: -1px !important;
            padding: 0 !important;
            border: 0 !important;
            overflow: hidden !important;
            clip: rect(0 0 0 0) !important;
            white-space: nowrap !important;
        }

        @keyframes qolMenuPanelIn {
            from {
                opacity: 0;
                transform:
                    translateY(8px)
                    scale(0.985);
            }

            to {
                opacity: 1;
                transform:
                    translateY(0)
                    scale(1);
            }
        }

        @media (max-width: 820px) {
            #qol-modal-overlay {
                padding: 12px !important;
            }

            #qol-modal {
                width: 96vw !important;
                max-height: 94vh !important;
            }

            #qol-modal .qol-feature-grid {
                grid-template-columns:
                    1fr !important;
            }

            #qol-modal .qol-keybind-grid {
                grid-template-columns:
                    repeat(
                        2,
                        minmax(0, 1fr)
                    ) !important;
            }
        }

        @media (max-width: 560px) {
            #qol-modal .qol-modal-header {
                min-height: 58px !important;
                padding: 9px 10px !important;
            }

            #qol-modal .qol-brand-mark {
                display: none !important;
            }

            #qol-modal .qol-modal-subtitle,
            #qol-modal .qol-footer-hint {
                display: none !important;
            }

            #qol-modal .qol-modal-body {
                padding: 11px !important;
            }

            #qol-modal .qol-keybind-grid {
                grid-template-columns:
                    1fr !important;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            #qol-modal,
            #qol-modal *,
            #qol-cog-btn {
                animation: none !important;
                transition: none !important;
            }
        }
    `;

    document.head.appendChild(style);
}

let autoDismissActive = true;

setTimeout(() => {
    autoDismissActive = false;
}, 3000);

function cleanWelcomeScreenUrl() {
    if (!autoDismissActive) return;

    const url = window.location.href;

    if (url.includes('window:welcomeScreen')) {
        const cleanUrl = url
            .replace(
                /([;&?])window:welcomeScreen([;&?]?)/g,
                (match, p1, p2) => {
                    if (
                        p1 === '?' ||
                        p1 === '&'
                    ) {
                        return (
                            p1 === '?' &&
                            p2 === '&'
                        )
                            ? '?'
                            : '';
                    }

                    return ';';
                }
            )
            .replace(/;#/g, '#')
            .replace(/;+/g, ';')
            .replace(/;$/, '')
            .replace(/#$/, '');

        if (cleanUrl !== url) {
            window.history.replaceState(
                null,
                '',
                cleanUrl
            );
        }
    }
}

function dismissWelcomeScreenDOM() {
    if (!autoDismissActive) return false;

    const candidateHeaders =
        document.querySelectorAll(
            '.dialog, ' +
            '.modal, ' +
            '.window, ' +
            '.popup, ' +
            'header, ' +
            'h1, h2, h3, h4, ' +
            '[class*="welcome"]'
        );

    for (const el of candidateHeaders) {
        if (
            el.textContent &&
            el.textContent.includes(
                'Welcome back'
            )
        ) {
            const container =
                el.closest(
                    '.dialog, ' +
                    '.modal, ' +
                    '.window, ' +
                    '.popup, ' +
                    'div'
                ) ||
                el.parentElement;

            if (container) {
                const closeBtn =
                    container.querySelector(
                        '.close, ' +
                        '.closeWindow, ' +
                        '.button.close, ' +
                        '[clickable*="close"], ' +
                        'button, ' +
                        'a.clickable, ' +
                        '.x, i'
                    );

                if (closeBtn) {
                    closeBtn.click();
                    autoDismissActive = false;
                    return true;
                }
            }
        }
    }

    return false;
}

const menuConfigMap = {
    'qol-chk-rally-parser':
        'rallyPointParser',

    'qol-chk-send-troops':
        'sendTroopsEnhanced',

    'qol-chk-building-queue':
        'buildingQueueEnhanced',

    'qol-chk-igm-enhanced':
        'igmEnhanced',

    'qol-chk-chat-silencer':
        'chatSilencer',

    'qol-chk-incoming-resources':
        'incomingResources',

    'qol-chk-watchlist':
        'watchlist',

    'qol-chk-checklists':
        'checklists',

    'qol-chk-npc-calc':
        'npcCalculator',

    'qol-chk-oasis-scanner':
        'oasisScanner',

    'qol-chk-auction-house-scanner':
        'auctionHouseScanner',

    'qol-chk-village':
        'keybind_village',

    'qol-chk-resources':
        'keybind_resources',

    'qol-chk-map':
        'keybind_map',

    'qol-chk-previous-village':
        'keybind_previousVillage',

    'qol-chk-next-village':
        'keybind_nextVillage',

    'qol-chk-rally':
        'keybind_rallyPoint',

    'qol-chk-hero':
        'keybind_heroInventory',

    'qol-chk-convos':
        'keybind_conversations',

    'qol-chk-stats':
        'keybind_statistics',

    'qol-chk-quests':
        'keybind_questBook',

    'qol-chk-reports':
        'keybind_reports',

    'qol-chk-overview':
        'keybind_villagesOverview'
};

const QOL_STORAGE_PREFIXES = [
    'qol_',
    'apes_',
    'restos_qol_'
];

const QOL_PREFERENCE_STORAGE_KEYS =
    new Set([
        ...Object.values(
            menuConfigMap
        ).map(key => {
            return `qol_${key}`;
        }),

        'qol_reportArchive',
        'qol_theme'
    ]);

function isQolStorageKey(key) {
    const normalizedKey =
        String(key || '')
            .toLowerCase();

    return QOL_STORAGE_PREFIXES.some(
        prefix => {
            return normalizedKey
                .startsWith(prefix);
        }
    );
}

function isQolPreferenceStorageKey(key) {
    return (
        QOL_PREFERENCE_STORAGE_KEYS
            .has(key) ||
        /^qol_keybind_/i.test(key)
    );
}

function clearQolWebStorage(storage) {
    if (!storage) return 0;

    const keysToRemove = [];

    for (
        let index = 0;
        index < storage.length;
        index += 1
    ) {
        const key =
            storage.key(index);

        if (
            key &&
            isQolStorageKey(key) &&
            !isQolPreferenceStorageKey(key)
        ) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => {
        storage.removeItem(key);
    });

    return keysToRemove.length;
}

function isCurrentServerQolExtensionKey(
    key
) {
    if (!isQolStorageKey(key)) {
        return false;
    }

    const normalizedKey =
        String(key).toLowerCase();

    const hostname =
        window.location.hostname
            .toLowerCase();

    const worldCode =
        hostname.split('.')[0];

    if (
        normalizedKey.includes(hostname)
    ) {
        return true;
    }

    const escapedWorldCode =
        worldCode.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
        );

    return new RegExp(
        `(^|[_:.-])${escapedWorldCode}` +
        `([_:.-]|$)`,
        'i'
    ).test(normalizedKey);
}

function clearQolExtensionStorage() {
    return new Promise(resolve => {
        if (
            typeof chrome ===
                'undefined' ||
            !chrome.storage?.local ||
            typeof chrome.storage.local
                .get !== 'function' ||
            typeof chrome.storage.local
                .remove !== 'function'
        ) {
            resolve(0);
            return;
        }

        chrome.storage.local.get(
            null,
            storedItems => {
                if (
                    chrome.runtime
                        ?.lastError
                ) {
                    console.warn(
                        '[QoL] Extension ' +
                        'cache read failed:',
                        chrome.runtime
                            .lastError
                    );

                    resolve(0);
                    return;
                }

                const keysToRemove =
                    Object.keys(
                        storedItems || {}
                    ).filter(
                        isCurrentServerQolExtensionKey
                    );

                if (
                    !keysToRemove.length
                ) {
                    resolve(0);
                    return;
                }

                chrome.storage.local.remove(
                    keysToRemove,
                    () => {
                        if (
                            chrome.runtime
                                ?.lastError
                        ) {
                            console.warn(
                                '[QoL] Extension ' +
                                'cache removal ' +
                                'failed:',
                                chrome.runtime
                                    .lastError
                            );

                            resolve(0);
                            return;
                        }

                        resolve(
                            keysToRemove
                                .length
                        );
                    }
                );
            }
        );
    });
}

async function clearQolCacheForCurrentServer() {
    let clearedEntries = 0;

    try {
        clearedEntries +=
            clearQolWebStorage(
                localStorage
            );
    } catch (error) {
        console.warn(
            '[QoL] Local cache ' +
            'removal failed:',
            error
        );
    }

    try {
        clearedEntries +=
            clearQolWebStorage(
                sessionStorage
            );
    } catch (error) {
        console.warn(
            '[QoL] Session cache ' +
            'removal failed:',
            error
        );
    }

    clearedEntries +=
        await clearQolExtensionStorage();

    window.dispatchEvent(
        new CustomEvent(
            'qol_cache_cleared',
            {
                detail: {
                    hostname:
                        window.location
                            .hostname,

                    clearedEntries
                }
            }
        )
    );

    return clearedEntries;
}

function bindMenuControls(
    modalContainer
) {
    Object.entries(
        menuConfigMap
    ).forEach(
        ([
            elementId,
            storageKey
        ]) => {
            const checkbox =
                modalContainer
                    .querySelector(
                        `#${elementId}`
                    );

            if (!checkbox) return;

            checkbox.checked =
                window.isQolEnabled(
                    storageKey
                );

            checkbox.addEventListener(
                'change',
                event => {
                    const isChecked =
                        event.target
                            .checked;

                    try {
                        localStorage
                            .setItem(
                                `qol_${storageKey}`,
                                isChecked
                            );

                        if (
                            storageKey
                                .startsWith(
                                    'keybind_'
                                )
                        ) {
                            const oldKey =
                                storageKey
                                    .replace(
                                        'keybind_',
                                        ''
                                    );

                            localStorage
                                .setItem(
                                    `qol_keybind_${oldKey}`,
                                    isChecked
                                );
                        }
                    } catch (error) {
                        console.warn(
                            '[QoL] Storage ' +
                            'write failed:',
                            error
                        );
                    }

                    window.dispatchEvent(
                        new CustomEvent(
                            'qol_setting_changed',
                            {
                                detail: {
                                    key:
                                        storageKey,

                                    enabled:
                                        isChecked
                                }
                            }
                        )
                    );
                }
            );
        }
    );
}

let isRepositionScheduled = false;

function scheduleReposition() {
    if (isRepositionScheduled) return;

    isRepositionScheduled = true;

    requestAnimationFrame(() => {
        window.qolRepositionAllButtons();
        isRepositionScheduled = false;
    });
}

window.qolRepositionAllButtons =
    function() {
        const villageList =
            document.getElementById(
                'villageList'
            );

        const toolbarIds = [
            'qol-cog-btn',
            'qol-ir-toggle-btn',
            'qol-wm-toggle-btn',
            'qol-watchlist-toggle',
            'qol-checklist-toggle-btn',
            'qol-npc-calc-toggle-btn',
            'qol-oasis-toggle-btn'
        ];

        if (!villageList) {
            toolbarIds.forEach(id => {
                const element =
                    document.getElementById(
                        id
                    );

                if (element) {
                    element.style
                        .setProperty(
                            'display',
                            'none',
                            'important'
                        );
                }
            });

            return;
        }

        const rect =
            villageList
                .getBoundingClientRect();

        if (
            rect.width <= 0 ||
            rect.height <= 0
        ) {
            toolbarIds.forEach(id => {
                const element =
                    document.getElementById(
                        id
                    );

                if (element) {
                    element.style
                        .setProperty(
                            'display',
                            'none',
                            'important'
                        );
                }
            });

            return;
        }

        const buttonSize = 30;
        const gap = 6;

        let currentLeft =
            rect.right + 20;

        const topPosition =
            rect.top + 4;

        const config = [
            {
                id:
                    'qol-cog-btn',
                enabled:
                    true
            },
            {
                id:
                    'qol-help-toggle-btn',
                enabled:
                    true
            },
            {
                id:
                    'qol-ir-toggle-btn',
                enabled:
                    window.isQolEnabled(
                        'incomingResources'
                    )
            },
            {
                id:
                    'qol-wm-toggle-btn',
                enabled:
                    window.isQolEnabled(
                        'rallyPointParser'
                    )
            },
            {
                id:
                    'qol-watchlist-toggle',
                enabled:
                    window.isQolEnabled(
                        'watchlist'
                    )
            },
            {
                id:
                    'qol-checklist-toggle-btn',
                enabled:
                    window.isQolEnabled(
                        'checklists'
                    )
            },
            {
                id:
                    'qol-npc-calc-toggle-btn',
                enabled:
                    window.isQolEnabled(
                        'npcCalculator'
                    )
            },
            {
                id:
                    'qol-oasis-toggle-btn',
                enabled:
                    window.isQolEnabled(
                        'oasisScanner'
                    )
            }
        ];

        config.forEach(item => {
            const button =
                document.getElementById(
                    item.id
                );

            if (!button) return;

            if (!item.enabled) {
                button.style.setProperty(
                    'display',
                    'none',
                    'important'
                );

                return;
            }

            button.style.setProperty(
                'position',
                'fixed',
                'important'
            );

            button.style.setProperty(
                'z-index',
                '9999',
                'important'
            );

            button.style.setProperty(
                'left',
                `${currentLeft}px`,
                'important'
            );

            button.style.setProperty(
                'top',
                `${topPosition}px`,
                'important'
            );

            button.style.setProperty(
                'width',
                `${buttonSize}px`,
                'important'
            );

            button.style.setProperty(
                'height',
                `${buttonSize}px`,
                'important'
            );

            button.style.setProperty(
                'display',
                'flex',
                'important'
            );

            currentLeft +=
                buttonSize + gap;
        });
    };

function setupQolMenu() {
    injectQolMenuStyles();

    if (
        document.getElementById(
            'qol-cog-btn'
        )
    ) {
        return;
    }

    const cogBtn =
        document.createElement('div');

    cogBtn.id = 'qol-cog-btn';
    cogBtn.title =
        'APES QoL Settings';

    cogBtn.setAttribute(
        'role',
        'button'
    );

    cogBtn.setAttribute(
        'tabindex',
        '0'
    );

    cogBtn.setAttribute(
        'aria-label',
        'Open APES QoL settings'
    );

    cogBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.63 3.6-3.6 3.6z"/>
        </svg>
    `;

    let overlay =
        document.getElementById(
            'qol-modal-overlay'
        );

    if (!overlay) {
        overlay =
            document.createElement(
                'div'
            );

        overlay.id =
            'qol-modal-overlay';

        overlay.innerHTML = `
            <div
                id="qol-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="qol-menu-title"
            >
                <div class="qol-modal-header">
                    <div class="qol-modal-title-group">
                        <span
                            class="qol-brand-mark"
                            aria-hidden="true"
                        >🦧</span>

                        <div class="qol-title-copy">
                            <div class="qol-title-line">
                                <span
                                    class="qol-modal-title"
                                    id="qol-menu-title"
                                >
                                    APES QoL Settings
                                </span>

                                <span class="qol-version-badge">
                                    v1.3
                                </span>
                            </div>

                            <span class="qol-modal-subtitle">
                                Choose the tools and shortcuts
                                that fit the way you play.
                            </span>
                        </div>
                    </div>

                    <div
                        class="qol-modal-close"
                        role="button"
                        tabindex="0"
                        aria-label="Close settings"
                    >&times;</div>
                </div>

                <div class="qol-modal-body">
                    <div class="qol-section-heading">
                        <div class="qol-section-title-group">
                            <h2 class="qol-section-title">
                                Core Features
                            </h2>

                            <span class="qol-section-caption">
                                Turn individual APES tools on or off.
                            </span>
                        </div>

                        <span class="qol-section-count">
                            11 tools
                        </span>
                    </div>

                    <div class="qol-feature-grid">
                        <article class="qol-feature-card">
                            <span
                                class="qol-feature-icon"
                                aria-hidden="true"
                            >⚔</span>

                            <div class="qol-feature-copy">
                                <h3 class="qol-feature-name">
                                    Rally Point Parser
                                </h3>

                                <p class="qol-feature-desc">
                                    Parses attacks and sieges in your
                                    Rally Point and creates share-ready
                                    TK Format text.
                                </p>
                            </div>

                            <label
                                class="qol-switch"
                                title="Toggle Rally Point Parser"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-rally-parser"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Rally Point Parser
                                </span>
                            </label>
                        </article>

                        <article class="qol-feature-card">
                            <span
                                class="qol-feature-icon"
                                aria-hidden="true"
                            >➤</span>

                            <div class="qol-feature-copy">
                                <h3 class="qol-feature-name">
                                    Send Troops Enhanced
                                </h3>

                                <p class="qol-feature-desc">
                                    Keeps Continue, Back and Send fixed
                                    at the top while you prepare
                                    multiple attacks.
                                </p>
                            </div>

                            <label
                                class="qol-switch"
                                title="Toggle Send Troops Enhanced"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-send-troops"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Send Troops Enhanced
                                </span>
                            </label>
                        </article>

                        <article class="qol-feature-card">
                            <span
                                class="qol-feature-icon"
                                aria-hidden="true"
                            >⌂</span>

                            <div class="qol-feature-copy">
                                <h3 class="qol-feature-name">
                                    Building Queue Enhanced
                                </h3>

                                <p class="qol-feature-desc">
                                    Shows the exact clock time when a
                                    construction queue item will finish.
                                </p>
                            </div>

                            <label
                                class="qol-switch"
                                title="Toggle Building Queue Enhanced"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-building-queue"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Building Queue Enhanced
                                </span>
                            </label>
                        </article>

                        <article class="qol-feature-card">
                            <span
                                class="qol-feature-icon"
                                aria-hidden="true"
                            >✉</span>

                            <div class="qol-feature-copy">
                                <h3 class="qol-feature-name">
                                    IGM Enhanced
                                </h3>

                                <p class="qol-feature-desc">
                                    Adds folders, filters and
                                    organization tools to your
                                    in-game conversations.
                                </p>
                            </div>

                            <label
                                class="qol-switch"
                                title="Toggle IGM Enhanced"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-igm-enhanced"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle IGM Enhanced
                                </span>
                            </label>
                        </article>

                        <article class="qol-feature-card">
                            <span
                                class="qol-feature-icon"
                                aria-hidden="true"
                            >◉</span>

                            <div class="qol-feature-copy">
                                <h3 class="qol-feature-name">
                                    Chat Silencer
                                </h3>

                                <p class="qol-feature-desc">
                                    Hides chat notification bubbles to
                                    keep the game screen free of
                                    visual clutter.
                                </p>
                            </div>

                            <label
                                class="qol-switch"
                                title="Toggle Chat Silencer"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-chat-silencer"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Chat Silencer
                                </span>
                            </label>
                        </article>

                        <article class="qol-feature-card">
                            <span
                                class="qol-feature-icon"
                                aria-hidden="true"
                            >⇣</span>

                            <div class="qol-feature-copy">
                                <h3 class="qol-feature-name">
                                    Incoming Resources
                                </h3>

                                <p class="qol-feature-desc">
                                    Tracks resources approaching the
                                    active village from raids, trades
                                    and treasures.
                                </p>
                            </div>

                            <label
                                class="qol-switch"
                                title="Toggle Incoming Resources"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-incoming-resources"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Incoming Resources
                                </span>
                            </label>
                        </article>

                        <article class="qol-feature-card">
                            <span
                                class="qol-feature-icon"
                                aria-hidden="true"
                            >◎</span>

                            <div class="qol-feature-copy">
                                <h3 class="qol-feature-name">
                                    Watchlist
                                </h3>

                                <p class="qol-feature-desc">
                                    Saves players for quick access to
                                    their profile, hero and related
                                    information.
                                </p>
                            </div>

                            <label
                                class="qol-switch"
                                title="Toggle Watchlist"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-watchlist"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Watchlist
                                </span>
                            </label>
                        </article>

                        <article class="qol-feature-card">
                            <span
                                class="qol-feature-icon"
                                aria-hidden="true"
                            >✓</span>

                            <div class="qol-feature-copy">
                                <h3 class="qol-feature-name">
                                    Checklists
                                </h3>

                                <p class="qol-feature-desc">
                                    Provides built-in and custom
                                    checklists for daily tasks and
                                    personal game goals.
                                </p>
                            </div>

                            <label
                                class="qol-switch"
                                title="Toggle Checklists"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-checklists"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Checklists
                                </span>
                            </label>
                        </article>

                        <article class="qol-feature-card">
                            <span
                                class="qol-feature-icon"
                                aria-hidden="true"
                            >◇</span>

                            <div class="qol-feature-copy">
                                <h3 class="qol-feature-name">
                                    NPC Calculator
                                </h3>

                                <p class="qol-feature-desc">
                                    Calculates the resource split
                                    needed to train troops while
                                    minimizing NPC gold cost.
                                </p>
                            </div>

                            <label
                                class="qol-switch"
                                title="Toggle NPC Calculator"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-npc-calc"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle NPC Calculator
                                </span>
                            </label>
                        </article>

                        <article class="qol-feature-card">
                            <span
                                class="qol-feature-icon"
                                aria-hidden="true"
                            >⌖</span>

                            <div class="qol-feature-copy">
                                <h3 class="qol-feature-name">
                                    Oasis Scanner
                                </h3>

                                <p class="qol-feature-desc">
                                    Records visited oasis and cropper
                                    tiles and creates a formatted
                                    coordinate list.
                                </p>
                            </div>

                            <label
                                class="qol-switch"
                                title="Toggle Oasis Scanner"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-oasis-scanner"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Oasis Scanner
                                </span>
                            </label>
                        </article>

                        <article class="qol-feature-card">
                            <span
                                class="qol-feature-icon"
                                aria-hidden="true"
                            >⚖</span>

                            <div class="qol-feature-copy">
                                <h3 class="qol-feature-name">
                                    Auction House Scanner
                                </h3>

                                <p class="qol-feature-desc">
                                    Adds item selectors to the Auction
                                    House and displays every matching
                                    listing from all pages together.
                                </p>
                            </div>

                            <label
                                class="qol-switch"
                                title="Toggle Auction House Scanner"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-auction-house-scanner"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Auction House Scanner
                                </span>
                            </label>
                        </article>
                    </div>

                    <div class="qol-section-heading">
                        <div class="qol-section-title-group">
                            <h2 class="qol-section-title">
                                Keybind Shortcuts
                            </h2>

                            <span class="qol-section-caption">
                                Keep only the keyboard navigation
                                you actually use.
                            </span>
                        </div>

                        <span class="qol-section-count">
                            14 shortcuts
                        </span>
                    </div>

                    <div class="qol-keybind-grid">
                        <div class="qol-keybind-item">
                            <div class="qol-key-combo">
                                <span class="qol-kbd">W</span>
                                <span class="qol-kbd">A</span>
                                <span class="qol-kbd">S</span>
                                <span class="qol-kbd">D</span>
                            </div>

                            <span class="qol-keybind-action">
                                Map Navigation (2x Speed)
                            </span>

                            <span class="qol-fixed-state">
                                Fixed
                            </span>
                        </div>

                        <div class="qol-keybind-item">
                            <div class="qol-key-combo">
                                <span class="qol-kbd">1</span>
                            </div>

                            <span class="qol-keybind-action">
                                Village View
                            </span>

                            <label
                                class="qol-switch"
                                title="Toggle Village View shortcut"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-village"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Village View shortcut
                                </span>
                            </label>
                        </div>

                        <div class="qol-keybind-item">
                            <div class="qol-key-combo">
                                <span class="qol-kbd">2</span>
                            </div>

                            <span class="qol-keybind-action">
                                Resource Fields
                            </span>

                            <label
                                class="qol-switch"
                                title="Toggle Resource Fields shortcut"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-resources"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Resource Fields shortcut
                                </span>
                            </label>
                        </div>

                        <div class="qol-keybind-item">
                            <div class="qol-key-combo">
                                <span class="qol-kbd">3</span>
                            </div>

                            <span class="qol-keybind-action">
                                World Map
                            </span>

                            <label
                                class="qol-switch"
                                title="Toggle World Map shortcut"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-map"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle World Map shortcut
                                </span>
                            </label>
                        </div>

                        <div class="qol-keybind-item">
                            <div class="qol-key-combo">
                                <span class="qol-kbd">Q</span>
                                <span class="qol-kbd">←</span>
                            </div>

                            <span class="qol-keybind-action">
                                Previous Village
                            </span>

                            <label
                                class="qol-switch"
                                title="Toggle Previous Village shortcuts"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-previous-village"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Previous Village shortcuts
                                </span>
                            </label>
                        </div>

                        <div class="qol-keybind-item">
                            <div class="qol-key-combo">
                                <span class="qol-kbd">E</span>
                                <span class="qol-kbd">→</span>
                            </div>

                            <span class="qol-keybind-action">
                                Next Village
                            </span>

                            <label
                                class="qol-switch"
                                title="Toggle Next Village shortcuts"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-next-village"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Next Village shortcuts
                                </span>
                            </label>
                        </div>

                        <div class="qol-keybind-item">
                            <div class="qol-key-combo">
                                <span class="qol-kbd">T</span>
                            </div>

                            <span class="qol-keybind-action">
                                Rally Point
                            </span>

                            <label
                                class="qol-switch"
                                title="Toggle Rally Point shortcut"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-rally"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Rally Point shortcut
                                </span>
                            </label>
                        </div>

                        <div class="qol-keybind-item">
                            <div class="qol-key-combo">
                                <span class="qol-kbd">G</span>
                            </div>

                            <span class="qol-keybind-action">
                                Hero Inventory
                            </span>

                            <label
                                class="qol-switch"
                                title="Toggle Hero Inventory shortcut"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-hero"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Hero Inventory shortcut
                                </span>
                            </label>
                        </div>

                        <div class="qol-keybind-item">
                            <div class="qol-key-combo">
                                <span class="qol-kbd">R</span>
                            </div>

                            <span class="qol-keybind-action">
                                Send Troops to Hovered Tile
                            </span>

                            <span class="qol-fixed-state">
                                Fixed
                            </span>
                        </div>

                        <div class="qol-keybind-item">
                            <div class="qol-key-combo">
                                <span class="qol-kbd">Z</span>
                            </div>

                            <span class="qol-keybind-action">
                                Open Chat Window
                            </span>

                            <label
                                class="qol-switch"
                                title="Toggle Chat shortcut"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-convos"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Chat shortcut
                                </span>
                            </label>
                        </div>

                        <div class="qol-keybind-item">
                            <div class="qol-key-combo">
                                <span class="qol-kbd">X</span>
                            </div>

                            <span class="qol-keybind-action">
                                Statistics
                            </span>

                            <label
                                class="qol-switch"
                                title="Toggle Statistics shortcut"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-stats"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Statistics shortcut
                                </span>
                            </label>
                        </div>

                        <div class="qol-keybind-item">
                            <div class="qol-key-combo">
                                <span class="qol-kbd">C</span>
                            </div>

                            <span class="qol-keybind-action">
                                Quest Book
                            </span>

                            <label
                                class="qol-switch"
                                title="Toggle Quest Book shortcut"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-quests"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Quest Book shortcut
                                </span>
                            </label>
                        </div>

                        <div class="qol-keybind-item">
                            <div class="qol-key-combo">
                                <span class="qol-kbd">F</span>
                            </div>

                            <span class="qol-keybind-action">
                                Reports
                            </span>

                            <label
                                class="qol-switch"
                                title="Toggle Reports shortcut"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-reports"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Reports shortcut
                                </span>
                            </label>
                        </div>

                        <div class="qol-keybind-item">
                            <div class="qol-key-combo">
                                <span class="qol-kbd">V</span>
                            </div>

                            <span class="qol-keybind-action">
                                Villages Overview
                            </span>

                            <label
                                class="qol-switch"
                                title="Toggle Villages Overview shortcut"
                            >
                                <input
                                    type="checkbox"
                                    id="qol-chk-overview"
                                    class="qol-checkbox"
                                >

                                <span
                                    class="qol-switch-track"
                                    aria-hidden="true"
                                ></span>

                                <span class="qol-visually-hidden">
                                    Toggle Villages Overview shortcut
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="qol-modal-footer">
                    <div class="qol-footer-left">
                        <span class="qol-save-note">
                            <span
                                class="qol-save-dot"
                                aria-hidden="true"
                            ></span>

                            Changes are saved automatically
                        </span>

                        <div
                            class="qol-clear-cache-btn"
                            role="button"
                            tabindex="0"
                        >
                            Clear Cache
                        </div>
                    </div>

                    <span class="qol-footer-hint">
                        Press Esc or click outside to close
                    </span>
                </div>
            </div>

            <div
                class="qol-cache-dialog-layer"
                aria-hidden="true"
            >
                <div
                    class="qol-cache-dialog"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="qol-cache-dialog-title"
                    aria-describedby="qol-cache-dialog-description"
                >
                    <div
                        class="qol-cache-dialog-header"
                        id="qol-cache-dialog-title"
                    >
                        Clear APES Cache?
                    </div>

                    <div
                        class="qol-cache-dialog-body"
                        id="qol-cache-dialog-description"
                    >
                        This removes APES data saved for
                        <strong>
                            ${window.location.hostname}
                        </strong>,
                        including data left behind by an older round
                        on the same server address.

                        <br><br>

                        Saved watchlists, checklist data, scanner
                        results and archived reports for this server
                        may be deleted.
                        <strong>This cannot be undone.</strong>

                        <br><br>

                        Feature and keybind preferences will be kept.
                        The page will reload when the cache has been
                        cleared.

                        <div
                            class="qol-cache-dialog-status"
                            aria-live="polite"
                        ></div>
                    </div>

                    <div class="qol-cache-dialog-actions">
                        <div
                            class="
                                qol-cache-dialog-action
                                qol-cache-cancel
                            "
                            role="button"
                            tabindex="0"
                        >
                            Cancel
                        </div>

                        <div
                            class="
                                qol-cache-dialog-action
                                qol-danger
                                qol-cache-confirm
                            "
                            role="button"
                            tabindex="0"
                        >
                            Clear &amp; Reload
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(
            overlay
        );

        bindMenuControls(overlay);

        const cacheDialog =
            overlay.querySelector(
                '.qol-cache-dialog-layer'
            );

        const clearCacheBtn =
            overlay.querySelector(
                '.qol-clear-cache-btn'
            );

        const cacheCancelBtn =
            overlay.querySelector(
                '.qol-cache-cancel'
            );

        const cacheConfirmBtn =
            overlay.querySelector(
                '.qol-cache-confirm'
            );

        const cacheStatus =
            overlay.querySelector(
                '.qol-cache-dialog-status'
            );

        const bindActionControl = (
            element,
            action
        ) => {
            element.addEventListener(
                'click',
                event => {
                    event.preventDefault();
                    event.stopPropagation();
                    action();
                }
            );

            element.addEventListener(
                'keydown',
                event => {
                    if (
                        event.key ===
                            'Enter' ||
                        event.key ===
                            ' '
                    ) {
                        event.preventDefault();
                        event.stopPropagation();
                        action();
                    }
                }
            );
        };

        const openCacheDialog = () => {
            cacheStatus.textContent = '';

            cacheConfirmBtn.setAttribute(
                'aria-disabled',
                'false'
            );

            cacheConfirmBtn.textContent =
                'Clear & Reload';

            cacheDialog.classList.add(
                'qol-open'
            );

            cacheDialog.setAttribute(
                'aria-hidden',
                'false'
            );

            cacheCancelBtn.focus();
        };

        const closeCacheDialog = () => {
            if (
                cacheConfirmBtn
                    .getAttribute(
                        'aria-disabled'
                    ) === 'true'
            ) {
                return;
            }

            cacheDialog.classList.remove(
                'qol-open'
            );

            cacheDialog.setAttribute(
                'aria-hidden',
                'true'
            );

            clearCacheBtn.focus();
        };

        const confirmCacheClear =
            async () => {
                if (
                    cacheConfirmBtn
                        .getAttribute(
                            'aria-disabled'
                        ) === 'true'
                ) {
                    return;
                }

                cacheConfirmBtn
                    .setAttribute(
                        'aria-disabled',
                        'true'
                    );

                cacheConfirmBtn
                    .textContent =
                    'Clearing...';

                cacheStatus.textContent =
                    'Removing APES data ' +
                    'for this server...';

                try {
                    const clearedEntries =
                        await clearQolCacheForCurrentServer();

                    cacheStatus.textContent =
                        clearedEntries === 1
                            ? (
                                '1 saved cache entry ' +
                                'removed. Reloading...'
                            )
                            : (
                                `${clearedEntries} ` +
                                'saved cache entries ' +
                                'removed. Reloading...'
                            );

                    setTimeout(() => {
                        window.location
                            .reload();
                    }, 650);
                } catch (error) {
                    console.error(
                        '[QoL] Cache clear failed:',
                        error
                    );

                    cacheStatus.textContent =
                        'The cache could not be ' +
                        'fully cleared. Please ' +
                        'try again.';

                    cacheConfirmBtn
                        .setAttribute(
                            'aria-disabled',
                            'false'
                        );

                    cacheConfirmBtn
                        .textContent =
                        'Try Again';
                }
            };

        bindActionControl(
            clearCacheBtn,
            openCacheDialog
        );

        bindActionControl(
            cacheCancelBtn,
            closeCacheDialog
        );

        bindActionControl(
            cacheConfirmBtn,
            confirmCacheClear
        );

        cacheDialog.addEventListener(
            'click',
            event => {
                if (
                    event.target ===
                    cacheDialog
                ) {
                    closeCacheDialog();
                }

                event.stopPropagation();
            }
        );

        const openModal = () => {
            window.dispatchEvent(
                new CustomEvent(
                    'qol_close_others',
                    {
                        detail: {
                            source:
                                'menu'
                        }
                    }
                )
            );

            overlay.style.setProperty(
                'display',
                'flex',
                'important'
            );
        };

        const closeModal = () => {
            overlay.style.setProperty(
                'display',
                'none',
                'important'
            );
        };

        const closeBtn =
            overlay.querySelector(
                '.qol-modal-close'
            );

        closeBtn.addEventListener(
            'click',
            event => {
                event.preventDefault();
                event.stopPropagation();
                closeModal();
            }
        );

        closeBtn.addEventListener(
            'keydown',
            event => {
                if (
                    event.key === 'Enter' ||
                    event.key === ' '
                ) {
                    event.preventDefault();
                    event.stopPropagation();
                    closeModal();
                }
            }
        );

        overlay.addEventListener(
            'click',
            event => {
                if (
                    event.target ===
                    overlay
                ) {
                    closeModal();
                }

                event.stopPropagation();
            }
        );

        window.addEventListener(
            'keydown',
            event => {
                if (
                    event.key !==
                    'Escape'
                ) {
                    return;
                }

                if (
                    cacheDialog
                        .classList
                        .contains(
                            'qol-open'
                        )
                ) {
                    closeCacheDialog();

                    event
                        .stopImmediatePropagation();

                    return;
                }

                if (
                    overlay.style
                        .display ===
                    'flex'
                ) {
                    closeModal();

                    event
                        .stopImmediatePropagation();
                }
            },
            true
        );

        cogBtn.addEventListener(
            'click',
            event => {
                event.preventDefault();
                event.stopPropagation();
                openModal();
            }
        );

        cogBtn.addEventListener(
            'keydown',
            event => {
                if (
                    event.key === 'Enter' ||
                    event.key === ' '
                ) {
                    event.preventDefault();
                    event.stopPropagation();
                    openModal();
                }
            }
        );
    }

    document.body.appendChild(cogBtn);
    scheduleReposition();
}

function initQolUI() {
    cleanWelcomeScreenUrl();

    window.addEventListener(
        'qol_setting_changed',
        event => {
            if (
                [
                    'rallyPointParser',
                    'incomingResources',
                    'watchlist',
                    'checklists',
                    'npcCalculator',
                    'oasisScanner'
                ].includes(
                    event.detail.key
                )
            ) {
                scheduleReposition();
            }
        }
    );

    const observer =
        new MutationObserver(() => {
            if (autoDismissActive) {
                cleanWelcomeScreenUrl();
                dismissWelcomeScreenDOM();
            }

            const villageList =
                document.getElementById(
                    'villageList'
                );

            const cogBtn =
                document.getElementById(
                    'qol-cog-btn'
                );

            if (villageList) {
                if (!cogBtn) {
                    setupQolMenu();
                } else {
                    scheduleReposition();
                }
            } else if (cogBtn) {
                cogBtn.style.display =
                    'none';
            }
        });

    observer.observe(
        document.body,
        {
            childList: true,
            subtree: true
        }
    );

    const villageList =
        document.getElementById(
            'villageList'
        );

    if (villageList) {
        setupQolMenu();

        if (window.ResizeObserver) {
            const resizeObserver =
                new ResizeObserver(() => {
                    scheduleReposition();
                });

            resizeObserver.observe(
                villageList
            );
        }
    }

    window.addEventListener(
        'resize',
        scheduleReposition
    );

    window.addEventListener(
        'scroll',
        scheduleReposition
    );
}

cleanWelcomeScreenUrl();

if (
    document.readyState ===
    'loading'
) {
    document.addEventListener(
        'DOMContentLoaded',
        initQolUI
    );
} else {
    initQolUI();
}