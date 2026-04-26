// entrypoints/sidepanel/components/SettingsDrawer.tsx
// User preferences live behind the gear icon in the header. Renders as a
// native <dialog> so we get focus trap, Escape-to-close, and inert backdrop
// for free. Two settings ship in this PR: theme and density. Notification
// thresholds, currency, and other coaching-flavored preferences land
// alongside their feature commits in GET-21 / GET-22 / GET-28.

import React, { useEffect, useRef } from 'react';
import { useSettings, type ThemeChoice, type DensityChoice } from '../hooks/useSettings';

interface Props {
    open: boolean;
    onClose: () => void;
}

/**
 * Theme swatches rendered as a radiogroup. Order is intentional:
 *   system -> dawn -> dusk -> void
 * mirrors a brightness gradient from "follow OS" through light to true black.
 */
const THEMES: { id: ThemeChoice; label: string; description: string; previewClass: string }[] = [
    { id: 'system', label: 'system', description: 'Follow your OS', previewClass: 'lco-swatch-preview--system' },
    { id: 'dawn',   label: 'dawn',   description: 'Warm light',     previewClass: 'lco-swatch-preview--dawn'   },
    { id: 'dusk',   label: 'dusk',   description: 'Standard dark',  previewClass: 'lco-swatch-preview--dusk'   },
    { id: 'void',   label: 'void',   description: 'OLED black',     previewClass: 'lco-swatch-preview--void'   },
];

const DENSITIES: { id: DensityChoice; label: string; description: string }[] = [
    { id: 'comfortable', label: 'comfortable', description: 'Generous spacing' },
    { id: 'compact',     label: 'compact',     description: 'Tighter rows'     },
];

export default function SettingsDrawer({ open, onClose }: Props): React.ReactElement | null {
    const { settings, set, ready } = useSettings();
    const dialogRef = useRef<HTMLDialogElement>(null);

    // Show / hide the dialog imperatively so the browser handles focus trap
    // and modal semantics. showModal() throws if already open; we guard by
    // reading the current state.
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            dialog.showModal();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    if (!ready) return null;

    return (
        <dialog
            ref={dialogRef}
            className="lco-settings"
            onClose={onClose}
            aria-label="Saar settings"
        >
            <header className="lco-settings-head">
                <span className="lco-settings-title lco-section">settings</span>
                <button
                    className="lco-settings-close"
                    onClick={onClose}
                    aria-label="Close settings"
                    type="button"
                >
                    {'✕'}
                </button>
            </header>

            <div className="lco-settings-body">
                <section className="lco-settings-block">
                    <span className="lco-label" id="lco-theme-label">theme</span>
                    <div
                        className="lco-swatches"
                        role="radiogroup"
                        aria-labelledby="lco-theme-label"
                    >
                        {THEMES.map((theme) => {
                            const selected = settings.theme === theme.id;
                            return (
                                <button
                                    key={theme.id}
                                    role="radio"
                                    aria-checked={selected}
                                    className={`lco-swatch ${selected ? 'lco-swatch--on' : ''}`}
                                    onClick={() => set({ theme: theme.id })}
                                    type="button"
                                >
                                    <span className={`lco-swatch-preview ${theme.previewClass}`} aria-hidden="true" />
                                    <span className="lco-swatch-label">{theme.label}</span>
                                    <span className="lco-swatch-desc">{theme.description}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="lco-settings-block">
                    <span className="lco-label" id="lco-density-label">density</span>
                    <div
                        className="lco-density-options"
                        role="radiogroup"
                        aria-labelledby="lco-density-label"
                    >
                        {DENSITIES.map((d) => {
                            const selected = settings.density === d.id;
                            return (
                                <button
                                    key={d.id}
                                    role="radio"
                                    aria-checked={selected}
                                    className={`lco-density-option ${selected ? 'lco-density-option--on' : ''}`}
                                    onClick={() => set({ density: d.id })}
                                    type="button"
                                >
                                    <span className="lco-density-label-text">{d.label}</span>
                                    <span className="lco-density-desc">{d.description}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>
        </dialog>
    );
}
