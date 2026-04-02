# Chrome Web Store Listing — Local Context Optimizer

Reference file for the CWS developer dashboard submission.

---

## Name

Local Context Optimizer

## Short description (132 chars max)

See token count, cost, and context usage live on claude.ai. All counting happens locally — no data ever leaves your browser.

## Full description

Claude strips token counts from its web UI. Every request fires an SSE stream containing your token usage, stop reasons, and context data — and Claude's interface discards all of it before you ever see it.

Local Context Optimizer (LCO) intercepts that stream before the data disappears, counts tokens locally using Anthropic's own BPE vocabulary, and renders what you're spending in a live overlay directly on claude.ai.

**What you see:**
- Token count and estimated cost for every reply, updated live as Claude streams
- Running session total across all conversations in the same tab
- Context window utilization (how full your 200k context is)
- Message limit utilization when applicable
- Smart nudges when context is filling up: warnings at 60%, 75%, and 90%

**How it works:**
LCO intercepts the fetch stream on claude.ai using a secure, sandboxed injected script. Token counting runs entirely inside your browser using a bundled BPE tokenizer — the same vocabulary Anthropic uses. No text, no messages, no personal data ever leaves your machine.

**Privacy:**
- Zero data collection. No analytics, no telemetry, no servers.
- All session data is stored in chrome.storage.session and cleared when your browser closes.
- The content of your conversations is never read or stored.
- Fully open source: github.com/OpenCodeIntel/lco

**Permissions:**
- claude.ai access is optional and requested at runtime — the extension does nothing until you explicitly enable it.
- storage, tabs, scripting, and alarms are used solely for local token counting and session cleanup.

---

## Category

Productivity

## Language

English

## Privacy policy URL

https://lco.opencodeintel.com/privacy

## Homepage URL

https://lco.opencodeintel.com

---

## Review justification notes
(paste into the "Notes for reviewers" field in the CWS dashboard)

This extension intercepts the SSE stream on claude.ai to read token usage
data that Claude's web UI discards. Specifically:

1. A sandboxed IIFE script is injected via chrome.scripting at document_start
   to wrap window.fetch and tee the response stream. The tee is read-only —
   the original stream is passed through to claude.ai unmodified.

2. The injected script communicates with the extension's content script via
   postMessage with a 5-layer security model: origin check, source check,
   namespace (LCO_V1), per-session UUID token, and schema validation. All
   five layers must pass or the message is dropped.

3. Token counting uses js-tiktoken with Anthropic's published claude.json BPE
   vocabulary, bundled inside the extension. No network requests are made for
   tokenization.

4. Session data (token counts, costs) is stored in chrome.storage.session,
   scoped by tabId, and automatically cleared when the browser closes.

5. The host permission for https://claude.ai/* is optional
   (optional_host_permissions) and requested at runtime via JIT prompt.
   The extension is inert until the user explicitly grants access.

No user content (message text, conversation history) is read or stored.
Source code: https://github.com/OpenCodeIntel/lco

---

## Screenshots needed (1280x800 or 640x400)

1. Overlay on claude.ai mid-conversation showing token count + cost
2. Context bar at ~70% with the amber nudge visible
3. Session totals after multiple requests
4. Collapsed overlay (mini cost view)

## Icons

Already in repo: icon/16.png, icon/32.png, icon/48.png, icon/96.png, icon/128.png
