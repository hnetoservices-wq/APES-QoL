/**
 * APES QoL Extension
 * Default feature states
 *
 * Advanced features start disabled unless the user has already
 * saved an explicit preference for them.
 */
(() => {
    const DEFAULT_DISABLED_FEATURES = [
        'cpManager',
        'oasisScanner',
        'reportArchive',
        'watchlist'
    ];

    for (const featureKey of DEFAULT_DISABLED_FEATURES) {
        const storageKey = `qol_${featureKey}`;

        try {
            if (localStorage.getItem(storageKey) === null) {
                localStorage.setItem(storageKey, 'false');
            }
        } catch (error) {
            console.warn(`[QoL] Could not initialize default state for ${featureKey}:`, error);
        }
    }
})();
