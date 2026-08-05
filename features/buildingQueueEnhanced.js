/**
 * Travian Kingdoms Building Completion Predictor
 */
function initBuildingQueueEnhancer() {
    const FEATURE_KEY = 'buildingQueueEnhanced';

    function isEnabled() {
        return typeof window.isQolEnabled === 'function' ? window.isQolEnabled(FEATURE_KEY) : true;
    }

    function timeToSeconds(str) {
        if (!str) return 0;
        const parts = str.split(':').map(Number);
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    function secondsToTime(totalSeconds) {
        const h = Math.floor(totalSeconds / 3600) % 24;
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
    }

    function cleanUp() {
        document.querySelectorAll('.qol-predictor').forEach(el => el.remove());
    }

    function updateContent() {
        if (!isEnabled()) {
            cleanUp();
            return;
        }

        const timeSpans = document.querySelectorAll('span[countdown]');
        const serverTimeEl = document.getElementById('servertime');
        const serverStr = serverTimeEl ? serverTimeEl.textContent.trim() : "00:00:00";
        const serverSeconds = timeToSeconds(serverStr);

        const activeParents = new Set();

        timeSpans.forEach(timeSpan => {
            const parent = timeSpan.closest('.detailsTime');
            if (!parent) return;

            activeParents.add(parent);

            let displayElement = parent.querySelector('.qol-predictor');
            if (!displayElement) {
                displayElement = document.createElement('div');
                displayElement.className = 'qol-predictor';
                displayElement.style.cssText = `
                    margin-top: 2px;
                    padding-left: 0px;
                    pointer-events: none;
                    white-space: nowrap;
                    text-align: left;
                `;
                parent.appendChild(displayElement);
            }

            const style = window.getComputedStyle(timeSpan);
            displayElement.style.fontFamily = style.fontFamily;
            displayElement.style.color = style.color;
            displayElement.style.fontSize = style.fontSize;

            const remainingStr = timeSpan.textContent.trim();
            const remainingSeconds = timeToSeconds(remainingStr);
            const rawCompletionSeconds = (serverSeconds + remainingSeconds) % 86400;

            let lockedSeconds = displayElement.dataset.lockedSeconds !== undefined 
                ? Number(displayElement.dataset.lockedSeconds) 
                : null;

            if (lockedSeconds === null) {
                lockedSeconds = rawCompletionSeconds;
            } else {
                let diff = Math.abs(rawCompletionSeconds - lockedSeconds);
                if (diff > 43200) diff = 86400 - diff;

                if (diff > 1) {
                    lockedSeconds = rawCompletionSeconds;
                }
            }

            displayElement.dataset.lockedSeconds = lockedSeconds;
            const completionTime = secondsToTime(lockedSeconds);

            const newText = `✓ Done by ${completionTime}`;
            if (displayElement.textContent !== newText) {
                displayElement.textContent = newText;
            }
        });

        document.querySelectorAll('.qol-predictor').forEach(el => {
            if (!activeParents.has(el.parentNode)) {
                el.remove();
            }
        });
    }

    function loop() {
        updateContent();
        requestAnimationFrame(loop);
    }

    window.addEventListener('qol_setting_changed', (e) => {
        if (e.detail && e.detail.key === FEATURE_KEY) {
            if (!e.detail.enabled) {
                cleanUp();
            }
        }
    });

    loop();
}

initBuildingQueueEnhancer();