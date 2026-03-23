# Local Context Optimizer

A Chrome extension that intercepts SSE streams from AI platforms (Claude, ChatGPT) and counts every token in and out with 100% accuracy. Currently in prototype phase — logs exact token counts from Claude's API responses to the browser console.

## Development

```bash
bun install
bun run dev
```

Requires Chrome with Developer mode enabled. The dev server opens a persistent Chrome profile automatically.
