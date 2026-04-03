// entrypoints/sidepanel/components/CollapsibleSection.tsx
// Reusable collapsible section wrapper with persisted state.

import React, { useState, useEffect, useRef, type ReactNode } from 'react';

interface Props {
    title: string;
    storageKey: string;
    defaultOpen?: boolean;
    children: ReactNode;
}

export default function CollapsibleSection({ title, storageKey, defaultOpen = true, children }: Props) {
    const [open, setOpen] = useState(defaultOpen);
    const [initialized, setInitialized] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Restore collapsed state from storage on mount.
    useEffect(() => {
        const fullKey = `lco_collapse_${storageKey}`;
        chrome.storage.local.get(fullKey).then((result) => {
            if (typeof result[fullKey] === 'boolean') {
                setOpen(result[fullKey] as boolean);
            }
            setInitialized(true);
        });
    }, [storageKey]);

    function toggle() {
        const next = !open;
        setOpen(next);
        chrome.storage.local.set({ [`lco_collapse_${storageKey}`]: next });
    }

    // Don't render until we've read the persisted state (prevents flash).
    if (!initialized) return null;

    return (
        <section className="lco-dash-section">
            <button
                className="lco-dash-section-header"
                onClick={toggle}
                aria-expanded={open}
            >
                <span className={`lco-dash-arrow ${open ? 'lco-dash-arrow--open' : ''}`}>
                    {'\u25B6'}
                </span>
                <span className="lco-dash-section-title">{title}</span>
            </button>
            <div
                ref={contentRef}
                className={`lco-dash-section-body ${open ? 'lco-dash-section-body--open' : ''}`}
            >
                <div className="lco-dash-section-inner">
                    {children}
                </div>
            </div>
        </section>
    );
}
