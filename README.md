# Local Context Optimizer (LCO)

LCO is a Chrome extension that gives you real-time visibility into your Claude.ai usage. It intercepts the API stream directly in your browser, counts tokens using the same BPE tokenizer Claude uses, estimates cost per message, and displays everything in a non-intrusive frosted-glass overlay — with zero data leaving your machine.

## Features

- **Real-time token counting** — input and output tokens update live as Claude responds, using local BPE tokenization
- **Cost estimation** — per-message and session totals for Opus 4.6, Sonnet 4.6, and Haiku 4.5
- **Context window bar** — see what percentage of the model's context window the current conversation is consuming
- **Message limit tracking** — fills an amber bar as you approach Claude's usage cap (parsed from the API response)
- **Session totals** — cumulative request count, token usage, and cost across the current tab session
- **JIT permissions** — zero scary warnings at install; Claude.ai access is requested on first visit only
- **Collapse/expand** — click the LCO header to minimize to a single-line cost view

## Install

**Chrome Web Store** — coming soon

**Manual (dev install):**

```bash
git clone https://github.com/OpenCodeIntel/lco
cd lco
bun install
bun run build
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select `.output/chrome-mv3`

## How it works

LCO runs across three isolated JavaScript contexts. A fetch interceptor in the page's main world tees every SSE stream from Claude's API and decodes events in the background. A content script validates and bridges the token data over a 5-layer-secured `postMessage` channel. A service worker runs the BPE tokenizer (`js-tiktoken` with Anthropic's Claude vocab), accumulates per-tab state in `chrome.storage.session`, and computes costs — all locally. The overlay renders in a closed Shadow DOM so it never conflicts with Claude's styles.

## Privacy

LCO processes everything locally in your browser.

- No data is transmitted to any external server
- No accounts, no telemetry, no analytics
- Token counts and costs are stored only in `chrome.storage.session`, which is automatically cleared when the browser closes
- The extension does not persist or transmit the content of your prompts
- The BPE tokenizer processes text in-memory only, never written to disk

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Architecture details are in [CLAUDE.md](CLAUDE.md).

## License

MIT — see [LICENSE](LICENSE)
