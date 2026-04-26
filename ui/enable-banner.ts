// ui/enable-banner.ts
// JIT permission banner shown on first visit to claude.ai.
// Appended to <html> (not <body>): Next.js hydrates <body> and wipes foreign
// children. On enable: stores the grant flag and reloads so inject.ts runs at
// document_start. On dismiss: removes the banner without storing; will
// reappear next page load.

export async function showEnableBanner(): Promise<void> {
    if (!document.body) {
        await new Promise<void>(resolve => {
            if (document.readyState !== 'loading') resolve();
            else document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
        });
    }

    // Theme rules live in this stylesheet so the same banner element can adopt
    // light or dark colors via prefers-color-scheme. Layout (position, padding,
    // gap) stays inline on each element below; only colors and focus styles
    // are themable, which keeps the cascade obvious for future maintainers.
    const style = document.createElement('style');
    style.textContent = `
        @keyframes lco-banner-enter {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0);    }
        }
        @media (prefers-reduced-motion: reduce) {
            #lco-enable-banner { animation: none !important; transition: none !important; }
            #lco-enable-banner button { transition: none !important; transform: none !important; }
        }

        /* Default (dark) palette: matches claude.ai's dark chrome. */
        #lco-enable-banner {
            background: rgba(24, 24, 27, 0.88);
            color: #e4e4e7;
            border: 1px solid rgba(255, 255, 255, 0.10);
            box-shadow:
                0 0 0 1px rgba(255, 255, 255, 0.06),
                0 4px 12px rgba(0, 0, 0, 0.08),
                0 20px 60px rgba(0, 0, 0, 0.18);
        }
        #lco-enable-banner .lco-banner-title    { color: #e4e4e7; font-weight: 600; }
        #lco-enable-banner .lco-banner-subtitle { color: #a1a1aa; font-weight: 400; font-size: 11px; }
        #lco-enable-banner .lco-banner-enable   { background: #c15f3c; color: #ffffff; }
        #lco-enable-banner .lco-banner-enable:hover  { background: #a84f2f; }
        #lco-enable-banner .lco-banner-dismiss       { color: #71717a; }
        #lco-enable-banner .lco-banner-dismiss:hover { color: #d4d4d8; }

        /* Light-mode override. claude.ai itself is dark by default but does
           respect this media query, so when a user is on light OS the banner
           is readable rather than a dark blob on a light page. */
        @media (prefers-color-scheme: light) {
            #lco-enable-banner {
                background: rgba(255, 255, 255, 0.92);
                color: #18181b;
                border: 1px solid rgba(0, 0, 0, 0.10);
                box-shadow:
                    0 0 0 1px rgba(0, 0, 0, 0.04),
                    0 4px 12px rgba(0, 0, 0, 0.06),
                    0 20px 60px rgba(0, 0, 0, 0.12);
            }
            #lco-enable-banner .lco-banner-title    { color: #18181b; }
            #lco-enable-banner .lco-banner-subtitle { color: #6b6b6b; }
            #lco-enable-banner .lco-banner-dismiss  { color: #6b6b6b; }
            #lco-enable-banner .lco-banner-dismiss:hover { color: #18181b; }
        }

        /* Keyboard focus rings. Hover-only feedback was the audit finding (L4):
           a tab-only user had no signal that either button was focused. */
        #lco-enable-banner button:focus-visible {
            outline: 2px solid #c15f3c;
            outline-offset: 2px;
        }
    `;
    document.documentElement.appendChild(style);

    const banner = document.createElement('div');
    banner.id = 'lco-enable-banner';
    banner.style.cssText = [
        'position:fixed',
        'bottom:80px',
        'right:16px',
        'z-index:2147483647',
        'display:flex',
        'align-items:center',
        'gap:12px',
        'padding:12px 16px',
        'backdrop-filter:blur(16px) saturate(1.4)',
        '-webkit-backdrop-filter:blur(16px) saturate(1.4)',
        'border-radius:12px',
        'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,system-ui,sans-serif',
        'font-size:13px',
        'pointer-events:all',
        '-webkit-font-smoothing:antialiased',
        'animation:lco-banner-enter 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
    ].join(';');

    // Two-line text block. The thesis lock on 2026-04-19 moved Saar's framing
    // off "token tracker" toward "workflow layer / AI usage coach", so the
    // banner copy follows: declarative title, then a privacy reassurance.
    const textWrap = document.createElement('div');
    textWrap.style.cssText = 'display:flex;flex-direction:column;gap:1px;line-height:1.3';

    const title = document.createElement('span');
    title.className = 'lco-banner-title';
    title.textContent = 'Enable Saar on Claude?';

    const subtitle = document.createElement('span');
    subtitle.className = 'lco-banner-subtitle';
    subtitle.textContent = 'All counting happens in your browser.';

    textWrap.appendChild(title);
    textWrap.appendChild(subtitle);

    const enableBtn = document.createElement('button');
    enableBtn.className = 'lco-banner-enable';
    enableBtn.textContent = 'Enable';
    enableBtn.style.cssText = [
        'border:none',
        'border-radius:6px',
        'padding:5px 14px',
        'font:inherit',
        'font-size:12px',
        'font-weight:600',
        'cursor:pointer',
        'flex-shrink:0',
        'transition:background 0.15s ease,transform 0.1s ease',
    ].join(';');

    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'lco-banner-dismiss';
    dismissBtn.textContent = 'Dismiss';
    dismissBtn.style.cssText = [
        'background:transparent',
        'border:none',
        'padding:5px 8px',
        'font:inherit',
        'font-size:12px',
        'cursor:pointer',
        'flex-shrink:0',
        'transition:color 0.15s ease,transform 0.1s ease',
    ].join(';');

    banner.appendChild(textWrap);
    banner.appendChild(enableBtn);
    banner.appendChild(dismissBtn);
    document.documentElement.appendChild(banner);

    // Press feedback: a tiny scale-down on mousedown gives the buttons weight.
    // Skipped under reduced-motion. Color hover is now handled in CSS, so we
    // no longer attach mouseenter/mouseleave color toggles here.
    const motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (motionOk) {
        enableBtn.addEventListener('mousedown',  () => { enableBtn.style.transform = 'scale(0.97)'; });
        enableBtn.addEventListener('mouseup',    () => { enableBtn.style.transform = ''; });
        enableBtn.addEventListener('mouseleave', () => { enableBtn.style.transform = ''; });
        dismissBtn.addEventListener('mousedown',  () => { dismissBtn.style.transform = 'scale(0.97)'; });
        dismissBtn.addEventListener('mouseup',    () => { dismissBtn.style.transform = ''; });
        dismissBtn.addEventListener('mouseleave', () => { dismissBtn.style.transform = ''; });
    }

    enableBtn.addEventListener('click', async () => {
        await browser.storage.local.set({ lco_enabled_claude: true });
        banner.remove();
        style.remove();
        window.location.reload();
    });

    dismissBtn.addEventListener('click', () => {
        banner.remove();
        style.remove();
    });
}
