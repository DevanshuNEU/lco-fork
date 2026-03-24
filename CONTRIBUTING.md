# Contributing to LCO

## Before you start

Read [CLAUDE.md](CLAUDE.md) for the full architecture. Understanding the three-room execution model (MAIN world / content script / service worker) is important before touching any cross-context code.

## Workflow

```
Fork → branch → code → test → PR
```

1. Fork the repo and create a branch:
   ```
   git checkout -b feat/LCO-XXX-short-description
   ```
2. Make your changes. Keep each PR focused on one thing.
3. Before opening a PR, run:
   ```bash
   bun run test      # all tests must pass
   bun run compile   # zero TypeScript errors
   bun run build     # clean build, check .output/chrome-mv3/
   ```
4. Open a PR against `main`.

## Commit format

```
type(scope): description [LCO-XXX]
```

Examples:
```
feat(overlay): add draggable position [LCO-42]
fix(inject): handle fetch URL overload shapes [LCO-17]
test(e2e): manual testing pass [LCO-6]
docs(readme): update install steps
```

Common types: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`

## Key conventions

- **Types first** — all cross-room message types live in `lib/message-types.ts`. Add new message types there, nowhere else.
- **inject.ts is self-contained** — no imports from `lib/` or anywhere else. All constants must be inlined. This file runs in the page's main world and cannot reference `chrome.*`.
- **postMessage security** — always use `window.location.origin` as the target origin, never `'*'`.
- **Unknown models** — `lookupModel()` returns `null` for unknown models. `calculateCost()` returns `null`. The UI must handle null gracefully without crashing.
- **Storage writes** — all `chrome.storage.session` writes go through the service worker. The content script never writes tab state directly.
