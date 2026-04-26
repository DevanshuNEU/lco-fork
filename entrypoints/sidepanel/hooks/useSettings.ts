// entrypoints/sidepanel/hooks/useSettings.ts
// Persists user preferences for the side panel and applies them to the
// document. Theme overrides prefers-color-scheme by writing data-theme on
// documentElement; density toggles the spacing scale via data-density.
//
// Storage shape: a single object under `lco_settings` in chrome.storage.local
// so future settings can be added without schema migrations: missing fields
// fall back to DEFAULTS on read, and writes go through `set` which merges.

import { useEffect, useState, useCallback } from 'react';

export type ThemeChoice = 'system' | 'dawn' | 'dusk' | 'void';
export type DensityChoice = 'comfortable' | 'compact';

export interface Settings {
    theme: ThemeChoice;
    density: DensityChoice;
}

const STORAGE_KEY = 'lco_settings';

const DEFAULTS: Settings = {
    theme: 'system',
    density: 'comfortable',
};

/**
 * Read + persist user settings. Applies the chosen theme/density to
 * documentElement.dataset so dashboard.css's :root[data-theme='...'] and
 * :root[data-density='...'] rules take effect. The hook stays minimal on
 * purpose; coaching-related settings (notification thresholds, currency
 * display) belong with their feature commits in GET-21 / GET-22 / GET-28.
 */
export function useSettings(): {
    settings: Settings;
    set: (patch: Partial<Settings>) => void;
    ready: boolean;
} {
    const [settings, setSettings] = useState<Settings>(DEFAULTS);
    const [ready, setReady] = useState(false);

    // Load once on mount. We do not subscribe to chrome.storage.onChanged
    // because the side panel is a single tab; concurrent edits from other
    // surfaces are not a concern in v1.
    useEffect(() => {
        chrome.storage.local.get(STORAGE_KEY).then((result) => {
            const stored = result[STORAGE_KEY];
            if (stored && typeof stored === 'object') {
                setSettings({ ...DEFAULTS, ...stored as Partial<Settings> });
            }
            setReady(true);
        });
    }, []);

    // Reflect settings onto documentElement so the CSS overrides take effect.
    // Skipped until the first read completes so we don't briefly write the
    // default theme over what the user actually chose.
    useEffect(() => {
        if (!ready) return;
        document.documentElement.dataset.theme = settings.theme;
        document.documentElement.dataset.density = settings.density;
    }, [ready, settings.theme, settings.density]);

    const set = useCallback((patch: Partial<Settings>) => {
        setSettings((prev) => {
            const next = { ...prev, ...patch };
            chrome.storage.local.set({ [STORAGE_KEY]: next }).catch(() => {
                // Persistence failure is non-fatal: the in-memory state still
                // applies for this session. A future write attempt may succeed.
            });
            return next;
        });
    }, []);

    return { settings, set, ready };
}
