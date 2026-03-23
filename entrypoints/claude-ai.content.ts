// entrypoints/claude-ai.content.ts — Content script for claude.ai (Room 2)
// Runs in the extension's isolated world alongside the page.
// Phase 1 prototype: only job is to inject the MAIN world interceptor.
// In future steps, this will also:
//   - Generate and pass session token (Step 3)
//   - Receive postMessage bridge data (Step 3)
//   - Forward data to service worker (Step 3)
//   - Mount Shadow DOM UI overlay (Step 6)

export default defineContentScript({
    matches: ['https://claude.ai/*'],
    runAt: 'document_start', // Must run before ALL page scripts
    async main() {
        console.log('[LCO] Content script loaded on claude.ai');

        // Inject the MAIN world fetch interceptor
        await injectScript('/inject.js', {
            keepInDom: true, // Keep script tag for potential future dataset reads
        });

        console.log('[LCO] MAIN world interceptor injected');
    },
});
