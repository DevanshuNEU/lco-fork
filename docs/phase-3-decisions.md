# Saar: Phase 3 Decision Log

This file captures the reasoning, scope, and trade-offs behind every Phase 3
decision. Written so anyone reviewing the codebase (or the author in an
interview) can reconstruct the thinking without reading the code.

---

## The pivot: from token counter to AI efficiency coach

### What we had at the end of Phase 2

A working Chrome extension that:
- Intercepts SSE streams on claude.ai
- Counts tokens via local BPE (approximate)
- Calculates estimated dollar cost (approximate)
- Shows a health score (Healthy / Degrading / Critical) from context %
- Has a side panel dashboard with today's stats and conversation history
- Fetches exact session/weekly utilization from Anthropic's usage endpoint

The overlay showed: `~1000 in · ~200 out · $0.0024`

### The problem with "approximate"

BPE token counting only sees the user's latest message text (inject.ts only
captures the current request body). It does not see:
- The full conversation history Claude actually replays on every message
- System prompts
- Tool results
- Any previous turns

This means the token count shown is a fraction of what Claude actually
processes. The cost shown is proportionally wrong. Showing these numbers
as if they are accurate would erode trust the moment a user cross-checks
against their API bill or Anthropic's Settings > Usage page.

An efficiency coach that shows bad data is worse than one that shows nothing.

### What Anthropic actually gives us

The `/api/organizations/{orgId}/usage` endpoint returns exact session
utilization (0-100%) and weekly utilization. This is the same number shown
on claude.ai/settings/limits. It reflects ALL usage across ALL clients
(web, desktop, Claude Code). It is truth.

The strategic decision: **lead with exact data, de-emphasize approximate data.**

Instead of "~1000 in · ~200 out · $0.0024" (approximate, undercounted),
show "3.2% of your session" (exact, from Anthropic). The dollar cost is a
supporting detail, not the headline.

### Why "AI efficiency coach" and not "token counter"

Every other tool in this space (ccusage, Claude-Code-Usage-Monitor, various
Chrome extensions) shows a meter. A number. "You used X tokens."

A meter tells you where you are. A coach tells you what to do about it.

The gap nobody has filled: real-time, contextual, specific coaching delivered
while you are working. Not a blog post about prompt engineering. Not a Reddit
thread about context windows. An actual system that watches your behavior and
says "that message cost you 7% of your session, your average is 2% — here is
why and here is what to do differently."

This is a product positioning decision with technical consequences. It
determines what data we prioritize (exact > approximate), what features we
build next (coaching signals > display features), and how we measure success
(behavior change > engagement).

---

## LCO-34: Delta Tracking Engine

### The problem it solves

To coach, you need a number: how much did that message cost?

Before LCO-34, Saar knew:
- Current session utilization (a running total, not a per-message cost)
- Approximate tokens from BPE (wrong for the reasons above)

To get per-message cost, you need before and after. Snapshot the session %
before the user sends, fetch it again after the response completes, subtract.
The difference is the exact cost of that one message.

### Why this is harder than it sounds

Four engineering challenges:

**1. The "before" snapshot has to happen before the message is sent.**
inject.ts fires in the page's MAIN world on every fetch() call. The content
script receives TOKEN_BATCH messages during streaming. By the time
STREAM_COMPLETE fires, the message has already been sent and processed.
Solution: maintain `lastKnownUtilization` as a persistent variable, updated
every time we successfully fetch the usage endpoint. The value from the
previous fetch IS the before-snapshot for the current message.

**2. fetchAndStoreUsageLimits was fire-and-forget.**
It fetched the usage endpoint and sent the data to the background for storage,
but returned void. To use the after-value for delta computation, it needed to
return the fetched utilization. Changed the return type from `Promise<void>`
to `Promise<number | null>`. This is a non-breaking change: existing callers
that used `.catch(() => {})` still work; new callers chain `.then(u => ...)`.

**3. Session resets produce negative deltas.**
If the 5-hour window resets between the before and after snapshots, the after
value will be lower than the before. A negative delta is meaningless and must
be treated as null. Guard: `utilizationAfter > utilizationBefore` before
computing the delta.

**4. The content script message listener is synchronous.**
`window.addEventListener('message', ...)` callbacks cannot be async at the
top level (MV3 requirement). The delta computation happens inside an async
IIFE launched from the synchronous handler. All turn data is captured into
local variables synchronously before the IIFE runs, because the outer closure
variables (msg, state, convState) are mutable and could change before the
async code resolves.

### The caching insight

Before this change, `fetchAndStoreUsageLimits` was called after every
STREAM_COMPLETE to refresh the budget card. This was already happening.
LCO-34 does not add an extra API call. It reuses the existing call and
captures the returned value. Cost: zero additional network requests.

### What null delta means

A null delta is the correct answer in several cases:
- First message of the session (lastKnownUtilization is null — no prior fetch)
- Fetch failure (network error, 429, etc.)
- Session reset between snapshots (after < before)
- Zero change (duplicate event, impossible in practice but guarded)

Null delta means: record the turn, but do not append to the delta log, and
do not update the overlay's session % display. The overlay stays on the
token/cost view. This is honest. Showing an incorrect delta would be worse.

### The delta log

A separate append-only array (`usageDeltas:{orgId}`) stores one record per
turn where a valid delta was computed. It is separate from the conversation
record for a deliberate reason: it is the input to the Token Economics agent,
which needs to query across all conversations and all models. Embedding deltas
inside per-conversation records would require loading and scanning every
conversation to compute cross-conversation statistics.

Cap: 500 records (~25 KB at ~50 bytes each). Oldest records are pruned when
the cap is exceeded. 500 records at 2-3 turns per conversation is 150-250
conversations of history — sufficient for the Token Economics agent to have
stable median estimates per model.

### Token Economics agent

`lib/token-economics.ts` derives the median tokens consumed per 1% of session
per model. This is the number that makes pre-submit predictions possible
(LCO-35): if you know a model costs ~500 tokens per 1% on average, and the
user's draft is 2000 characters (~500 tokens BPE estimate), you can predict
"this will cost approximately 1% of your session."

Minimum 5 samples per model before reporting a median. Below the threshold,
the Maps simply don't contain the model key. The UI should show "learning your
usage patterns..." rather than a number. This is more honest than showing a
median from 2 data points.

---

## What we deliberately did not build in Phase 3A

**Overlaying the delta on the compose box in real time.** We could watch the
compose box with MutationObserver and estimate the cost as the user types.
This requires: enough delta samples per model, a working BPE estimate for the
draft text, and a compose box DOM selector that does not break on claude.ai
updates. Deferred to LCO-35. The delta tracking engine (this PR) is the
prerequisite.

**Showing model breakdown in the Token Economics display.** The data is there.
The `computeTokenEconomics` Maps are exposed through `useDashboardData`. But
there is no UI component to render them yet. Building the display before the
data is stable (first few messages produce no results) would show empty state
more often than not. Deferred to Phase 3B when the coaching signals use it.

**Retroactively computing deltas for existing conversation history.** Turns
recorded before LCO-34 have `deltaUtilization: undefined`. The overlay and
side panel handle this gracefully: `t.deltaUtilization ?? 0` means pre-LCO-34
turns contribute 0 to the conversation total. No migration needed.

---

## Phase 3 issue map

| Issue | What it builds | Depends on |
|-------|---------------|------------|
| LCO-34 (this PR) | Exact per-message session cost; delta log; Token Economics agent | — |
| LCO-39 | Coaching signals using delta data (burn rate, expensive message, model efficiency) | LCO-34 |
| LCO-35 | Pre-submit cost estimate (show cost before sending) | LCO-34, enough delta samples |
| LCO-36 | Efficiency score per conversation | LCO-34 |
| LCO-40 | Educational layer ("Why?" links, onboarding, weekly report) | LCO-39 |
| LCO-41 | Cross-surface dashboard (web + desktop + Code aggregate) | LCO-34 |

---

## Architecture decisions that will come up in interviews

**"Why not use the BPE token count for coaching?"**

Because it is wrong. inject.ts only captures the current message text, not
the full context Claude receives. In a 30-turn conversation, the actual input
to Claude is the entire conversation history plus the new message. BPE on the
new message alone might be 200 tokens when Claude actually processed 15,000.
Coaching based on a number that is off by 75x would destroy trust immediately.
The session % from Anthropic's endpoint is exact, regardless of conversation
length or model.

**"Why before/after subtraction instead of just reading the delta from the
SSE stream?"**

Claude's SSE stream does not expose per-message utilization in a form that
maps to the 5-hour rolling window. The `message_limit` event (which we do
parse) reflects a different limit — the message cap, not the compute/token
budget. The only reliable source for the 5-hour session % is the
`/api/organizations/{orgId}/usage` endpoint.

**"Two API calls per message seems expensive."**

It is one extra call per message, not two. The "after" fetch was already
happening (to refresh the budget card). LCO-34 does not add a new fetch.
It adds a return value to an existing function.

**"Why store deltas separately from conversation records?"**

Cross-conversation queries. The Token Economics agent needs to compute medians
across hundreds of turns across dozens of conversations, filtered by model.
If deltas were embedded in per-conversation records, computing a median would
require loading every conversation record (potentially megabytes of data) into
memory. The separate delta log is a flat array that can be read in a single
storage.get() call.

**"What happens when the extension is installed for the first time?"**

The first STREAM_COMPLETE has `lastKnownUtilization === null` because
ORGANIZATION_DETECTED fired but the fetch hasn't returned yet (or the user
sent a message before it returned). Delta is null. The turn is recorded
without delta. The overlay shows token/cost. From the second message onward,
assuming ORGANIZATION_DETECTED fired and returned successfully, deltas are
computed normally. This is by design: we never show a fabricated number.

---

## Numbers at the end of Phase 3A (PR #33)

| Metric | Value |
|--------|-------|
| PRs merged | 33 |
| Tests | 613 |
| Test files | 26 |
| New tests in LCO-34 | 28 |
| Agents | 7 (Intelligence, Prompt, Health, Pricing, Memory, Usage Budget, Token Economics) |
| Exact data points per message | 1 (session %) |
| Approximate data points per message | 2 (input tokens, dollar cost — kept as fallback) |
| Extra API calls per message (vs before LCO-34) | 0 |
