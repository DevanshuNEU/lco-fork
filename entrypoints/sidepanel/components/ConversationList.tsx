// entrypoints/sidepanel/components/ConversationList.tsx
// Scrollable list of recent conversations.

import React from 'react';
import type { ConversationRecord } from '../../../lib/conversation-store';
import { formatCost, formatModel, formatRelativeTime } from '../../../lib/format';

interface Props {
    conversations: ConversationRecord[];
}

export default function ConversationList({ conversations }: Props) {
    if (conversations.length === 0) {
        return (
            <div className="lco-dash-convlist lco-dash-convlist--empty">
                <p className="lco-dash-placeholder">No conversations yet. Start chatting on claude.ai.</p>
            </div>
        );
    }

    return (
        <div className="lco-dash-convlist">
            {conversations.map((conv, index) => (
                <ConversationItem key={conv.id} conv={conv} index={index} />
            ))}
        </div>
    );
}

function ConversationItem({ conv, index }: { conv: ConversationRecord; index: number }) {
    const subject = conv.dna?.subject || 'Untitled';
    const model = formatModel(conv.model);
    const time = formatRelativeTime(conv.lastActiveAt);

    return (
        <div
            className="lco-dash-conv-item"
            style={{ animationDelay: `${index * 30}ms` }}
        >
            <div className="lco-dash-conv-top">
                <span className="lco-dash-conv-subject">{subject}</span>
                <span className="lco-dash-conv-time">{time}</span>
            </div>
            <div className="lco-dash-conv-bottom">
                <span className="lco-dash-conv-model">{model}</span>
                <span className="lco-dash-conv-turns">
                    {conv.turnCount} turn{conv.turnCount === 1 ? '' : 's'}
                </span>
                <span className="lco-dash-conv-cost">{formatCost(conv.estimatedCost)}</span>
            </div>
        </div>
    );
}
