// entrypoints/claude-ai.content.ts - Content script for claude.ai (Room 2)
// Executes within the extension's isolated world, alongside the host page.
// Current responsibilities: 
// 1. Inject the main-world interceptor script.
// 2. Act as a secure cross-world message bridge for token counting.

export default defineContentScript({
    matches: ['https://claude.ai/*'],
    runAt: 'document_start', // Execution must occur before any host page scripts load
    async main() {
        console.log('[LCO] Content script initialized on claude.ai');

        // Inject the main-world fetch interceptor
        await injectScript('/inject.js', {
            keepInDom: true, // Retain script tag for potential future data attribute binding
        });

        console.log('[LCO] Main-world interceptor successfully injected.');

        // Message bridge: Main World (inject.js) <-> Service Worker (background.ts)
        window.addEventListener('message', (event) => {
            if (event.source !== window || !event.data || event.data.type !== 'LCO_TOKEN_REQ') return;
            
            const { id, text } = event.data;
            
            // Forward payload to the background script
            browser.runtime.sendMessage({ type: 'COUNT_TOKENS', text })
                .then((response: any) => {
                    const count = response?.count ?? 0;
                    window.postMessage({ type: 'LCO_TOKEN_RES', id, count }, '*');
                })
                .catch((err: any) => {
                    console.error('[LCO-ERROR] Content script bridge transmission failed:', err);
                    window.postMessage({ type: 'LCO_TOKEN_RES', id, count: 0 }, '*');
                });
        });
    },
});
