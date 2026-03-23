// entrypoints/background.ts — Service worker (Room 3)
// Phase 1 prototype: stub only. Establishes the file for future Steps 4-7.
// Will contain:
//   - Preload pattern (statePromise at top level)
//   - onMessage listener for TOKEN_BATCH from content script
//   - Pricing lookup + cost calculation
//   - Multi-tab storage with flat tabState_{tabId} keys
//   - Tab cleanup on onRemoved + periodic alarm cleanup

export default defineBackground(() => {
  console.log('[LCO] Service worker started (stub — no active handlers yet)');
});
