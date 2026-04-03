// entrypoints/sidepanel/components/TodayCard.tsx
// Today's aggregate stats in a 2x2 grid.

import React from 'react';
import type { DailySummary } from '../../../lib/conversation-store';
import { formatTokens, formatCost } from '../../../lib/format';

interface Props {
    summary: DailySummary | null;
}

export default function TodayCard({ summary }: Props) {
    const conversations = summary?.conversationCount ?? 0;
    const turns = summary?.totalTurns ?? 0;
    const tokens = (summary?.totalInputTokens ?? 0) + (summary?.totalOutputTokens ?? 0);
    const cost = summary?.estimatedCost ?? 0;
    const isEmpty = !summary;

    return (
        <div className={`lco-dash-today ${isEmpty ? 'lco-dash-today--empty' : ''}`}>
            <div className="lco-dash-metric">
                <span className="lco-dash-metric-value">{conversations}</span>
                <span className="lco-dash-metric-label">Conversations</span>
            </div>
            <div className="lco-dash-metric">
                <span className="lco-dash-metric-value">{turns}</span>
                <span className="lco-dash-metric-label">Turns</span>
            </div>
            <div className="lco-dash-metric">
                <span className="lco-dash-metric-value">{formatTokens(tokens)}</span>
                <span className="lco-dash-metric-label">Tokens</span>
            </div>
            <div className="lco-dash-metric">
                <span className="lco-dash-metric-value">{formatCost(cost)}</span>
                <span className="lco-dash-metric-label">Cost</span>
            </div>
        </div>
    );
}
