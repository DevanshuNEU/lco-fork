// entrypoints/background.ts - Service Worker Engine (Room 3)
import { Tiktoken } from 'js-tiktoken/lite';
import claudeJson from '@anthropic-ai/tokenizer/claude.json';

let _tokenizer: Tiktoken | null = null;
let _initPromise: Promise<Tiktoken> | null = null;

// Initialize the tokenizer with Anthropic's BPE vocabulary
async function initTokenizer(): Promise<Tiktoken> {
  if (_tokenizer) return _tokenizer;
  
  const t0 = performance.now();
  _tokenizer = new Tiktoken({
    bpe_ranks: claudeJson.bpe_ranks,
    special_tokens: claudeJson.special_tokens,
    pat_str: claudeJson.pat_str
  });
  const elapsed = performance.now() - t0;
  console.log(`[LCO] Tokenizer cold start: ${elapsed.toFixed(0)}ms`);
  
  return _tokenizer;
}

// Preload Pattern: Fire initialization at the top level so it is ready by the 
// time the worker handles the first message.
_initPromise = initTokenizer();

export default defineBackground({
  type: 'module',
  main: () => {
    console.log('[LCO] Service worker booted; pure-JS tokenizer preloading in background.');

    // Listen for cross-room messaging from the content scripts
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'COUNT_TOKENS' && typeof message.text === 'string') {
        
        // Handle asynchronously because we might still be awaiting the tokenizer initialization
        _initPromise?.then((tok) => {
          const count = tok.encode(message.text).length;
          sendResponse({ count });
        }).catch((err) => {
          console.error('[LCO-ERROR] Tokenizer failed to encode text:', err);
          sendResponse({ count: 0 });
        });
        
        // Returning true keeps the message channel open for the async response
        return true; 
      }
    });
  }
});
