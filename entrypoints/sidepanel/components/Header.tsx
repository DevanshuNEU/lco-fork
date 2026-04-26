// entrypoints/sidepanel/components/Header.tsx
// Side panel header. Wordmark on the left, gear on the right.
//
// Logo is intentionally absent. Devanshu is designing the real mark and we
// don't want to ship a placeholder sigil that competes with the eventual
// custom letterform (the AA-merger concept). Until then the wordmark itself
// carries the brand: thin geometric all-caps with generous tracking, set in
// the user's system display sans so we ship zero webfont weight in this PR.

import React from 'react';

interface Props {
    /** Invoked when the user clicks the gear. App.tsx wires this to the
     *  SettingsDrawer's open state. */
    onOpenSettings: () => void;
}

export default function Header({ onOpenSettings }: Props) {
    return (
        <header className="lco-dash-header">
            <div className="lco-dash-header-text">
                <h1 className="lco-dash-title">SAAR</h1>
                <p className="lco-dash-subtitle">AI Usage Coach</p>
            </div>
            <button
                className="lco-dash-header-gear"
                onClick={onOpenSettings}
                aria-label="Open settings"
                type="button"
            >
                <GearIcon />
            </button>
        </header>
    );
}

/**
 * 18px gear glyph. Crisper outline than the typical 16px Material gear,
 * sits at a comfortable size against the 24px Saar wordmark. Uses
 * currentColor so it picks up muted text by default and accent on hover
 * (rules in dashboard.css).
 */
function GearIcon(): React.ReactElement {
    return (
        <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
            />
            <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
            />
        </svg>
    );
}
