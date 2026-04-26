// entrypoints/sidepanel/components/Header.tsx
// Side panel header. Renders the Saar sigil + product name on the left and
// a settings trigger on the right. The sigil is an inline SVG so it scales
// crisply at any pixel ratio and inherits theme colors via currentColor; no
// PNG asset, no extension manifest icon dependency.

import React from 'react';

interface Props {
    /** Invoked when the user clicks the gear. App.tsx wires this to the
     *  SettingsDrawer's open state. */
    onOpenSettings: () => void;
}

export default function Header({ onOpenSettings }: Props) {
    return (
        <header className="lco-dash-header">
            <SaarSigil />
            <div className="lco-dash-header-text">
                <h1 className="lco-dash-title">Saar</h1>
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
 * Sigil mark. Letterpress feel: a square frame with the Saar "S" set in
 * the display face. Pure currentColor so the mark recolors with the theme.
 * 32px to match the previous placeholder; the inner glyph carries the
 * brand recognition while the frame holds the visual weight.
 */
function SaarSigil(): React.ReactElement {
    return (
        <svg
            className="lco-dash-logo"
            width={32}
            height={32}
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Saar"
        >
            {/* Subtle frame: terra cotta at low alpha so the sigil reads as
                placed, not stamped. */}
            <rect
                x="1.5"
                y="1.5"
                width="29"
                height="29"
                rx="6"
                fill="rgba(193, 95, 60, 0.10)"
                stroke="#c15f3c"
                strokeWidth="1.25"
            />
            {/* Glyph: heavy serif S in terra cotta. Centered optically rather
                than mathematically; the S has a top-heavy bowl, so we nudge
                it down by ~0.5px to balance. */}
            <text
                x="16"
                y="22.5"
                textAnchor="middle"
                fontFamily="'Fraunces', 'Newsreader', Georgia, serif"
                fontWeight={900}
                fontSize="20"
                fill="#c15f3c"
                style={{ fontFeatureSettings: '"ss01"' }}
            >
                S
            </text>
        </svg>
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
