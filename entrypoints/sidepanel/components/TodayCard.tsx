// entrypoints/sidepanel/components/TodayCard.tsx
// Today's aggregate stats as a single dense row matching overlay typography.

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
            <span className="lco-dash-today-label">today</span>
            <span className="lco-dash-today-stats">
                {conversations} conv · {turns} turn{turns !== 1 ? 's' : ''} · {formatTokens(tokens)} tok · {formatCost(cost)}
            </span>
        </div>
    );
}
