// lib/handoff-summary.ts
// Builds a handoff summary from conversation metadata for the "Start Fresh" flow.
// No DOM refs, no chrome APIs. Pure function.
//
// Phase 2: summary is built from structured metadata (turns, model, tokens, cost).
// Phase 3: Gemini Nano will generate a richer summary from conversation text.
//
// The summary is a prompt the user pastes into a new chat. It tells Claude:
// 1. That this is a continuation of a previous conversation
// 2. How long that conversation was (turns, tokens)
// 3. What model was used
// 4. Why the user is starting fresh (context health)
//
// This gives Claude context about the user's intent without requiring the full
// conversation history. The user can add their own context on top.

import type { ConversationRecord } from './conversation-store';
import type { HealthScore } from './health-score';

export interface HandoffContext {
    conversation: ConversationRecord;
    health: HealthScore;
}

/**
 * Build a continuation prompt from conversation metadata.
 * Returns a string ready to paste into a new chat.
 */
export function buildHandoffSummary(ctx: HandoffContext): string {
    const { conversation, health } = ctx;
    const { turnCount, totalInputTokens, totalOutputTokens, model, estimatedCost } = conversation;
    const totalTokens = totalInputTokens + totalOutputTokens;

    const lines: string[] = [];

    lines.push('[Continuing from a previous conversation]');
    lines.push('');

    // Context about the previous session.
    lines.push(`Previous session: ${turnCount} turn${turnCount === 1 ? '' : 's'}, ~${formatTokens(totalTokens)} tokens on ${formatModel(model)}.`);

    // Why the user started fresh.
    if (health.level === 'critical') {
        lines.push('I started a new chat because the context window was nearly full and responses were degrading.');
    } else if (health.level === 'degrading') {
        lines.push('I started a new chat because the conversation was getting long and earlier details were fading.');
    } else {
        lines.push('I started a new chat to keep things focused.');
    }

    lines.push('');
    lines.push('Please continue from where we left off. Here is what I need to work on next:');
    lines.push('');

    return lines.join('\n');
}

/** Format token count for human readability. */
function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}

/** Format model name for human readability. */
function formatModel(model: string): string {
    // "claude-sonnet-4-6" -> "Sonnet 4.6"
    // "claude-opus-4-6" -> "Opus 4.6"
    // "claude-haiku-4-5" -> "Haiku 4.5"
    const match = model.match(/claude-(\w+)-(\d+)-(\d+)/i);
    if (match) {
        const name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        return `${name} ${match[2]}.${match[3]}`;
    }
    return model;
}

// Export for testing.
export { formatTokens, formatModel };
