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

// Single source of truth for the legal enum values. Used both for the
// runtime sanity check on stored values (rejecting garbage written by
// a future migration or another extension) and as the type guard above.
const VALID_THEMES: ReadonlyArray<ThemeChoice> = ['system', 'dawn', 'dusk', 'void'];
const VALID_DENSITIES: ReadonlyArray<DensityChoice> = ['comfortable', 'compact'];

/**
 * Coerces an unknown value (typically the contents of chrome.storage.local
 * for our key) into a Settings object, falling back to DEFAULTS for any
 * field that isn't a recognized enum value. Setting an attribute on
 * documentElement.dataset is not an XSS vector by itself, but unbounded
 * values would let downstream attribute selectors pick up garbage; the
 * enum check stops that at the boundary.
 */
function sanitize(stored: unknown): Settings {
    if (!stored || typeof stored !== 'object') return DEFAULTS;
    const obj = stored as Record<string, unknown>;
    const theme = VALID_THEMES.includes(obj.theme as ThemeChoice)
        ? (obj.theme as ThemeChoice)
        : DEFAULTS.theme;
    const density = VALID_DENSITIES.includes(obj.density as DensityChoice)
        ? (obj.density as DensityChoice)
        : DEFAULTS.density;
    return { theme, density };
}

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
    //
    // The catch matters: without it, a storage read failure (corrupt key,
    // quota probe, extension restart mid-read) would leave `ready` false
    // forever and SettingsDrawer would silently render null. Falling back
    // to DEFAULTS lets the UI come up with sensible values; subsequent
    // writes still go through and may succeed.
    useEffect(() => {
        chrome.storage.local.get(STORAGE_KEY)
            .then((result) => {
                setSettings(sanitize(result[STORAGE_KEY]));
            })
            .catch((err) => {
                console.warn('[LCO] Settings read failed, using defaults:', err);
                setSettings(DEFAULTS);
            })
            .finally(() => {
                setReady(true);
            });
    }, []);

    // Reflect settings onto documentElement so the CSS overrides take effect.
    // Skipped until the first read completes so we don't briefly write the
    // default theme over what the user actually chose.
    //
    // For theme === 'system' we DELETE the attribute rather than set it,
    // so the cascade falls cleanly through to prefers-color-scheme.
    // dashboard.css only has rules for explicit themes ('dawn'/'dusk'/'void');
    // a stray data-theme='system' attribute on documentElement worked only
    // by accident (no rule matched, so the prefers-color-scheme block stayed
    // active). Removing the attribute makes the intent explicit.
    useEffect(() => {
        if (!ready) return;
        if (settings.theme === 'system') {
            delete document.documentElement.dataset.theme;
        } else {
            document.documentElement.dataset.theme = settings.theme;
        }
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
