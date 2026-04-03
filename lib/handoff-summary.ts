// lib/handoff-summary.ts
// Builds a handoff summary from Conversation DNA for the "Start Fresh" flow.
// No DOM refs, no chrome APIs. Pure function.
//
// The summary is a prompt the user pastes into a new chat. When DNA is available,
// it includes the actual topics discussed (extracted from first lines of user prompts).
// When DNA is empty (legacy records), it falls back to metadata-only output.

import type { ConversationRecord, ConversationDNA } from './conversation-store';
import type { HealthScore } from './health-score';

export interface HandoffContext {
    conversation: ConversationRecord;
    health: HealthScore;
}

/**
 * Build a continuation prompt from Conversation DNA + metadata.
 * Returns a string ready to paste into a new chat.
 */
export function buildHandoffSummary(ctx: HandoffContext): string {
    const { conversation, health } = ctx;
    const { turnCount, totalInputTokens, totalOutputTokens, model, dna } = conversation;
    const totalTokens = totalInputTokens + totalOutputTokens;
    const hasDNA = dna && dna.hints.length > 0;

    const lines: string[] = [];

    lines.push('[Continuing from a previous conversation]');
    lines.push('');

    // Session metadata line.
    lines.push(`Previous session: ${turnCount} turn${turnCount === 1 ? '' : 's'}, ~${formatTokens(totalTokens)} tokens on ${formatModel(model)}.`);

    // Why the user started fresh.
    if (health.level === 'critical') {
        lines.push('I started a new chat because the context window was nearly full and responses were degrading.');
    } else if (health.level === 'degrading') {
        lines.push('I started a new chat because the conversation was getting long and earlier details were fading.');
    } else {
        lines.push('I started a new chat to keep things focused.');
    }

    // DNA-powered content: what was actually discussed.
    if (hasDNA) {
        lines.push('');

        // Subject: what started the conversation.
        if (dna.subject) {
            lines.push(`Started with: ${dna.subject}`);
        }

        // Last context: where we left off.
        if (dna.lastContext && dna.lastContext !== dna.subject) {
            lines.push(`Last working on: ${dna.lastContext}`);
        }

        // Topic progression: deduplicated, chronological (oldest first for readability).
        const uniqueHints = deduplicateHints(dna.hints);
        if (uniqueHints.length > 0) {
            lines.push('');
            lines.push('What we covered:');
            // hints are stored newest-first; reverse for chronological order.
            const chronological = [...uniqueHints].reverse();
            for (const hint of chronological) {
                lines.push(`- ${hint}`);
            }
        }
    }

    lines.push('');
    lines.push('Please continue from where we left off. Here is what I need to work on next:');
    lines.push('');

    return lines.join('\n');
}

/**
 * Remove near-duplicate hints (same first 40 chars = same topic).
 * Preserves order (newest first as stored).
 */
function deduplicateHints(hints: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const hint of hints) {
        // 30 chars captures the core topic while ignoring trailing variations.
        // "Debug the token refresh endpoi..." matches both "...returning 401" and "...with cookies"
        const key = hint.slice(0, 30).toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            result.push(hint);
        }
    }
    return result;
}

/** Format token count for human readability. */
function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}

/** Format model name for human readability. */
function formatModel(model: string): string {
    const match = model.match(/claude-(\w+)-(\d+)-(\d+)/i);
    if (match) {
        const name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        return `${name} ${match[2]}.${match[3]}`;
    }
    return model;
}

export { formatTokens, formatModel, deduplicateHints };
