# Privacy Policy

**Local Context Optimizer (LCO)** — last updated March 2026

## Summary

LCO processes everything locally in your browser. No data is ever sent to any server.

## Data processing

LCO intercepts the SSE stream between your browser and Claude's API to count tokens and estimate cost. This processing happens entirely within your browser using local JavaScript. No content from your conversations is transmitted anywhere outside your machine.

## Data storage

Token counts, cost estimates, and session totals are stored in `chrome.storage.session`. This storage is:

- **Local only** — stored in your browser, never transmitted
- **Session-scoped** — automatically cleared when the browser closes or the extension is removed
- **Non-identifying** — contains only numeric token counts, cost estimates, and the model name

LCO also stores a single boolean flag (`lco_enabled_claude`) in `chrome.storage.local` to remember whether you have enabled tracking for Claude.ai. This flag does not contain any usage data.

## What LCO does NOT do

- Does not transmit any data to any external server
- Does not collect analytics or telemetry
- Does not require an account or login
- Does not store or log the content of your prompts or Claude's responses
- Does not use cookies or any form of cross-site tracking
- Does not share any data with third parties

## BPE tokenization

The token counting uses `js-tiktoken` with Anthropic's Claude BPE vocabulary, running entirely in the browser's service worker. Text passed to the tokenizer is processed in-memory only and is never written to disk or transmitted over the network.

## Contact

For questions or concerns, open an issue at https://github.com/OpenCodeIntel/lco/issues
