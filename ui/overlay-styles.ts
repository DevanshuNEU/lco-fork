// ui/overlay-styles.ts
// CSS injected as a string into the closed Shadow DOM.
// Exported as a TypeScript constant to bypass WXT's CSS import interception.

export const OVERLAY_CSS = `
:host {
  --lco-bg:           rgba(13, 13, 18, 0.82);
  --lco-bg-hover:     rgba(13, 13, 18, 0.94);
  --lco-text:         #e4e4e7;
  --lco-muted:        #52525b;
  --lco-accent:       #a78bfa;
  --lco-bar-fill:     #7c3aed;
  --lco-bar-glow:     rgba(124, 58, 237, 0.45);
  --lco-bar-bg:       rgba(124, 58, 237, 0.14);
  --lco-warn-fill:    #f59e0b;
  --lco-warn-glow:    rgba(245, 158, 11, 0.35);
  --lco-warn-bg:      rgba(245, 158, 11, 0.12);
  --lco-border:       rgba(167, 139, 250, 0.12);
  --lco-border-hover: rgba(167, 139, 250, 0.3);
}

@media (prefers-color-scheme: light) {
  :host {
    --lco-bg:           rgba(255, 255, 255, 0.80);
    --lco-bg-hover:     rgba(255, 255, 255, 0.96);
    --lco-text:         #18181b;
    --lco-muted:        #a1a1aa;
    --lco-accent:       #7c3aed;
    --lco-bar-fill:     #7c3aed;
    --lco-bar-glow:     rgba(124, 58, 237, 0.25);
    --lco-bar-bg:       rgba(124, 58, 237, 0.10);
    --lco-warn-fill:    #d97706;
    --lco-warn-glow:    rgba(217, 119, 6, 0.25);
    --lco-warn-bg:      rgba(217, 119, 6, 0.10);
    --lco-border:       rgba(124, 58, 237, 0.14);
    --lco-border-hover: rgba(124, 58, 237, 0.32);
  }
}

@keyframes lco-enter {
  from { opacity: 0; transform: translateY(10px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}

@keyframes lco-bar-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

.lco-widget {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 2147483647;
  min-width: 210px;
  max-width: 300px;
  padding: 8px 12px;
  background: var(--lco-bg);
  color: var(--lco-text);
  border-radius: 10px;
  font-family: ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, monospace;
  font-size: 11px;
  line-height: 1.65;
  box-shadow:
    0 0 0 1px var(--lco-border),
    0 8px 32px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(14px) saturate(1.8);
  -webkit-backdrop-filter: blur(14px) saturate(1.8);
  animation: lco-enter 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transition: box-shadow 0.18s ease, transform 0.18s ease, background 0.18s ease;
  cursor: default;
  user-select: none;
}

.lco-widget:hover {
  transform: scale(1.015);
  background: var(--lco-bg-hover);
  box-shadow:
    0 0 0 1px var(--lco-border-hover),
    0 12px 40px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.07);
}

.lco-widget.lco-collapsed {
  min-width: 0;
  padding: 6px 10px;
}

/* ── Header ── */

.lco-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
}

.lco-title {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lco-accent);
  opacity: 0.75;
}

.lco-cost-mini {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--lco-accent);
}

/* ── Body ── */

.lco-body {
  margin-top: 5px;
}

.lco-row {
  display: flex;
  align-items: baseline;
  gap: 5px;
  white-space: nowrap;
  overflow: hidden;
}

.lco-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--lco-muted);
  flex-shrink: 0;
}

.lco-value {
  color: var(--lco-text);
  overflow: hidden;
  text-overflow: ellipsis;
  font-variant-numeric: tabular-nums;
}

.lco-accent { color: var(--lco-accent); }

.lco-divider {
  height: 1px;
  background: var(--lco-border);
  margin: 5px 0;
}

/* ── Progress bars ── */

.lco-bar-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0;
}

.lco-bar-track {
  flex: 1;
  height: 3px;
  background: var(--lco-bar-bg);
  border-radius: 2px;
  overflow: hidden;
}

.lco-bar-track--warn {
  background: var(--lco-warn-bg);
}

.lco-bar-fill {
  height: 100%;
  background: var(--lco-bar-fill);
  border-radius: 2px;
  box-shadow: 0 0 6px var(--lco-bar-glow);
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.lco-bar-fill--warn {
  background: var(--lco-warn-fill);
  box-shadow: 0 0 6px var(--lco-warn-glow);
}

.lco-bar-fill.lco-streaming {
  animation: lco-bar-pulse 1.2s ease-in-out infinite;
}

.lco-bar-label {
  font-size: 9px;
  color: var(--lco-muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  min-width: 46px;
  text-align: right;
}

/* ── Health warning ── */

.lco-health {
  margin-top: 4px;
  font-size: 10px;
  color: #fbbf24;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ── Motion-safe fallbacks ── */

@media (prefers-reduced-motion: reduce) {
  .lco-widget               { animation: none; transition: none; }
  .lco-widget:hover         { transform: none; }
  .lco-bar-fill             { transition: none; }
  .lco-bar-fill.lco-streaming { animation: none; }
}
`;
