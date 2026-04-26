// entrypoints/sidepanel/components/ActiveConversation.tsx
// Shows the conversation happening in the current tab.
// Fades gracefully on conversation switch.

import React, { useState, useEffect, useRef } from 'react';
import type { ConversationRecord } from '../../../lib/conversation-store';
import type { HealthScore } from '../../../lib/health-score';
import type { UsageBudgetResult } from '../../../lib/message-types';
import { formatTokens, formatApiRateCost } from '../../../lib/format';
import { getContextWindowSize } from '../../../lib/pricing';
import TurnTicker from './TurnTicker';

interface Props {
    conv: ConversationRecord | null;
    health: HealthScore | null;
    /** Active tier: drives tier-aware cost labeling (≈$X API rate vs $X). */
    budget: UsageBudgetResult | null;
}

export default function ActiveConversation({ conv, health, budget }: Props) {
    const [visible, setVisible] = useState(false);
    const prevConvId = useRef<string | null>(null);

    // Graceful swap: fade + scale out the old card, then pop in the new one.
    // The 250ms delay matches the CSS opacity exit duration so the new content
    // only appears after the old card has fully disappeared. transform + opacity
    // are GPU-composited; no layout or paint for silky 60/120fps.
    // When reduced motion is preferred, skip the delay entirely.
    useEffect(() => {
        if (conv?.id !== prevConvId.current) {
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (reducedMotion) {
                prevConvId.current = conv?.id ?? null;
                setVisible(true);
                return;
            }
            setVisible(false);
            const timer = setTimeout(() => {
                prevConvId.current = conv?.id ?? null;
                setVisible(true);
            }, 250);
            return () => clearTimeout(timer);
        }
        setVisible(true);
    }, [conv?.id]);

    if (!conv) {
        return (
            <div className="lco-dash-active lco-dash-active--empty">
                <p className="lco-dash-placeholder">No active conversation</p>
            </div>
        );
    }

    const subject = conv.dna?.subject || 'New conversation';

    // Compute context % from cumulative tokens, not the stored
    // record.lastContextPct field. The overlay does the same thing for the
    // same reason (see lib/overlay-state.ts:applyRestoredConversation): some
    // older records were written with lastContextPct in fractional units
    // (0.026 instead of 2.6), which renders as a flat zero bar. Tokens are
    // always correct, so we recompute against the model's window each time.
    //
    // getContextWindowSize already falls back to a 200K default for unknown
    // models (see DEFAULT_CONTEXT_WINDOW in lib/pricing.ts), so we trust
    // its return value directly instead of restating the magic number here.
    // Number.isFinite catches the divide-by-zero / NaN cases the helper
    // can theoretically still produce if pricing data is corrupted.
    const ctxWindow = getContextWindowSize(conv.model);
    const usedTokens = conv.totalInputTokens + conv.totalOutputTokens;
    const computedPct = (usedTokens / ctxWindow) * 100;
    const safePct = Number.isFinite(computedPct) ? Math.min(Math.max(computedPct, 0), 100) : 0;

    const healthLevel = health?.level ?? 'healthy';
    const healthLabel = health?.label ?? 'Healthy';

    // Total exact session % consumed by all turns in this conversation.
    // Only turns with a valid delta contribute; pre-LCO-34 turns contribute 0.
    const totalDelta = conv.turns.reduce((sum, t) => sum + (t.deltaUtilization ?? 0), 0);
    const showDelta = totalDelta > 0.01;

    return (
        <div className={`lco-dash-active ${visible ? 'lco-dash-active--visible' : 'lco-dash-active--hidden'}`}>
            <div className="lco-dash-active-header">
                <span className={`lco-dash-health-dot lco-dash-health-dot--${healthLevel}`} />
                <span className="lco-dash-health-label">{healthLabel}</span>
            </div>

            <p className="lco-dash-active-subject">{subject}</p>

            <div className="lco-dash-context-bar-container">
                <div className="lco-dash-context-bar">
                    <div
                        className={`lco-dash-context-fill lco-dash-context-fill--${healthLevel}`}
                        style={{ transform: `scaleX(${safePct / 100})` }}
                    />
                </div>
                <span className="lco-dash-context-label">{Math.round(safePct)}% context</span>
            </div>

            {/* Per-turn ticker. Renders only when at least one tracked turn
                exists in the conversation; otherwise it silently returns
                null and the context bar above carries the full visual. */}
            <TurnTicker turns={conv.turns} />

            <div className="lco-dash-active-stats">
                <span>{conv.turnCount} turn{conv.turnCount === 1 ? '' : 's'}</span>
                <span>{formatTokens(conv.totalInputTokens + conv.totalOutputTokens)} tok</span>
                {showDelta
                    ? <span>{totalDelta.toFixed(1)}% of session</span>
                    : <span>{formatApiRateCost(conv.estimatedCost, budget)}</span>
                }
            </div>
        </div>
    );
}
