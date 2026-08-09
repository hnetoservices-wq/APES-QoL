/**
 * APES QoL Extension
 * Module: Culture Point Prediction
 *
 * Adds a target ETA to CP Manager after a successful CP scan.
 * The estimate uses the current remaining CP and current total CP/day.
 * Celebrations and future CP/day changes are intentionally excluded.
 */

(function initCpPrediction() {
    'use strict';

    const PANEL_ID = 'qol-cp-manager-panel';
    const PREDICTION_ID = 'qol-cp-prediction-card';
    const CHECK_INTERVAL = 500;

    function parseDisplayedNumber(value) {
        const digits = String(value || '').replace(/[^0-9]/g, '');
        return digits ? Number.parseInt(digits, 10) : null;
    }

    function getResultValue(panel, labelText) {
        const cards = Array.from(
            panel.querySelectorAll('.qol-cp-results .qol-cp-card')
        );

        const card = cards.find(candidate => {
            const label = candidate.querySelector('.qol-cp-card-label');
            return label?.textContent?.trim() === labelText;
        });

        if (!card) {
            return null;
        }

        return parseDisplayedNumber(
            card.querySelector('.qol-cp-card-value')?.textContent
        );
    }

    function getOrdinalSuffix(day) {
        const remainder100 = day % 100;

        if (remainder100 >= 11 && remainder100 <= 13) {
            return 'th';
        }

        switch (day % 10) {
            case 1:
                return 'st';
            case 2:
                return 'nd';
            case 3:
                return 'rd';
            default:
                return 'th';
        }
    }

    function formatTargetDate(date) {
        const day = date.getDate();
        const month = date.toLocaleString('en-GB', {
            month: 'long'
        });

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}${getOrdinalSuffix(day)} ${month}, at ${hours}h${minutes}m`;
    }

    function buildPrediction(current, target, cpPerDay) {
        const remaining = Math.max(0, target - current);

        if (remaining <= 0) {
            return 'Next CP target reached';
        }

        if (!Number.isFinite(cpPerDay) || cpPerDay <= 0) {
            return 'Next CP estimate unavailable';
        }

        const exactMinutes = Math.max(
            1,
            Math.ceil((remaining / cpPerDay) * 24 * 60)
        );

        const days = Math.floor(exactMinutes / (24 * 60));
        const hours = Math.floor((exactMinutes % (24 * 60)) / 60);

        const targetDate = new Date(
            Date.now() + exactMinutes * 60 * 1000
        );

        const dayLabel = days === 1 ? 'day' : 'days';
        const hourLabel = hours === 1 ? 'hour' : 'hours';

        return (
            `Next CP in ${days} ${dayLabel}, ${hours} ${hourLabel} ` +
            `on ${formatTargetDate(targetDate)}`
        );
    }

    function ensurePrediction() {
        const panel = document.getElementById(PANEL_ID);

        if (!panel) {
            return;
        }

        const results = panel.querySelector('.qol-cp-results');

        if (!results || results.children.length < 4) {
            document.getElementById(PREDICTION_ID)?.remove();
            return;
        }

        const current = getResultValue(panel, 'Current CP');
        const target = getResultValue(panel, 'Target CP');
        const cpPerDay = getResultValue(panel, 'Total CP / Day');

        if (
            !Number.isFinite(current) ||
            !Number.isFinite(target) ||
            !Number.isFinite(cpPerDay)
        ) {
            return;
        }

        const predictionText = buildPrediction(
            current,
            target,
            cpPerDay
        );

        let predictionCard = document.getElementById(PREDICTION_ID);

        if (!predictionCard) {
            predictionCard = document.createElement('div');
            predictionCard.id = PREDICTION_ID;
            predictionCard.className = 'qol-cp-card highlight';
            predictionCard.style.setProperty(
                'grid-column',
                '1 / -1',
                'important'
            );

            predictionCard.innerHTML = `
                <span class="qol-cp-card-label">Prediction</span>
                <span class="qol-cp-card-value"></span>
            `;

            results.appendChild(predictionCard);
        }

        const value = predictionCard.querySelector('.qol-cp-card-value');

        if (value && value.textContent !== predictionText) {
            value.textContent = predictionText;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            ensurePrediction,
            { once: true }
        );
    } else {
        ensurePrediction();
    }

    window.setInterval(ensurePrediction, CHECK_INTERVAL);

    console.log('[APES CP Prediction] Initialized.');
})();
