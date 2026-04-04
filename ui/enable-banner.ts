// ui/enable-banner.ts
// JIT permission banner shown on first visit to claude.ai.
// Appended to <html> (not <body>): Next.js hydrates <body> and wipes foreign children.
// On enable: stores the grant flag and reloads so inject.ts runs at document_start.
// On dismiss: removes the banner without storing; will reappear next page load.

export async function showEnableBanner(): Promise<void> {
    if (!document.body) {
        await new Promise<void>(resolve => {
            if (document.readyState !== 'loading') resolve();
            else document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
        });
    }

    // Inject entrance animation keyframes.
    const style = document.createElement('style');
    style.textContent = `
        @keyframes lco-banner-enter {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0);    }
        }
        @media (prefers-reduced-motion: reduce) {
            #lco-enable-banner { animation: none !important; }
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
        'background:rgba(24,24,27,0.88)',
        'backdrop-filter:blur(16px) saturate(1.4)',
        '-webkit-backdrop-filter:blur(16px) saturate(1.4)',
        'border:1px solid rgba(255,255,255,0.10)',
        'border-radius:12px',
        'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,system-ui,sans-serif',
        'font-size:13px',
        'color:#e4e4e7',
        'box-shadow:0 0 0 1px rgba(255,255,255,0.06),0 4px 12px rgba(0,0,0,0.08),0 20px 60px rgba(0,0,0,0.18)',
        'pointer-events:all',
        '-webkit-font-smoothing:antialiased',
        'animation:lco-banner-enter 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
    ].join(';');

    const text = document.createElement('span');
    text.textContent = 'Saar \u2014 Enable token tracking for Claude?';

    const enableBtn = document.createElement('button');
    enableBtn.textContent = 'Enable';
    enableBtn.style.cssText = [
        'background:#c15f3c',
        'color:#fff',
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
    dismissBtn.textContent = 'Dismiss';
    dismissBtn.style.cssText = [
        'background:transparent',
        'color:#71717a',
        'border:none',
        'padding:5px 8px',
        'font:inherit',
        'font-size:12px',
        'cursor:pointer',
        'flex-shrink:0',
        'transition:color 0.15s ease,transform 0.1s ease',
    ].join(';');

    banner.appendChild(text);
    banner.appendChild(enableBtn);
    banner.appendChild(dismissBtn);
    document.documentElement.appendChild(banner);

    // Active state: press feedback.
    enableBtn.addEventListener('mousedown', () => { enableBtn.style.transform = 'scale(0.97)'; });
    enableBtn.addEventListener('mouseup', () => { enableBtn.style.transform = ''; });
    enableBtn.addEventListener('mouseleave', () => { enableBtn.style.transform = ''; });
    dismissBtn.addEventListener('mousedown', () => { dismissBtn.style.transform = 'scale(0.97)'; });
    dismissBtn.addEventListener('mouseup', () => { dismissBtn.style.transform = ''; });
    dismissBtn.addEventListener('mouseleave', () => { dismissBtn.style.transform = ''; });

    // Hover states.
    enableBtn.addEventListener('mouseenter', () => { enableBtn.style.background = '#a84f2f'; });
    enableBtn.addEventListener('mouseleave', () => { enableBtn.style.background = '#c15f3c'; });
    dismissBtn.addEventListener('mouseenter', () => { dismissBtn.style.color = '#d4d4d8'; });
    dismissBtn.addEventListener('mouseleave', () => { dismissBtn.style.color = '#71717a'; });

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
