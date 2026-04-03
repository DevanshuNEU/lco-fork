// tests/unit/handoff-summary.test.ts
// Tests for the "Start Fresh" handoff summary builder.

import { describe, it, expect } from 'vitest';
import {
    buildHandoffSummary,
    formatTokens,
    formatModel,
    type HandoffContext,
} from '../../lib/handoff-summary';
import type { ConversationRecord } from '../../lib/conversation-store';
import type { HealthScore } from '../../lib/health-score';

function makeConversation(overrides: Partial<ConversationRecord> = {}): ConversationRecord {
    return {
        id: 'test-conv-id',
        startedAt: Date.now() - 3600000,
        lastActiveAt: Date.now(),
        finalized: false,
        turnCount: 15,
        totalInputTokens: 45000,
        totalOutputTokens: 8000,
        peakContextPct: 65,
        lastContextPct: 62,
        model: 'claude-sonnet-4-6',
        estimatedCost: 0.255,
        turns: [],
        _v: 1,
        ...overrides,
    };
}

function makeHealth(level: 'healthy' | 'degrading' | 'critical'): HealthScore {
    const messages: Record<string, string> = {
        healthy: 'Conversation is fresh.',
        degrading: 'Earlier details may be fading.',
        critical: 'Context is nearly full.',
    };
    return {
        level,
        label: level.charAt(0).toUpperCase() + level.slice(1),
        coaching: messages[level],
        contextPct: level === 'critical' ? 88 : level === 'degrading' ? 62 : 20,
    };
}

// ── buildHandoffSummary ───────────────────────────────────────────────────────

describe('buildHandoffSummary', () => {
    it('includes continuation header', () => {
        const result = buildHandoffSummary({
            conversation: makeConversation(),
            health: makeHealth('degrading'),
        });
        expect(result).toContain('[Continuing from a previous conversation]');
    });

    it('includes turn count and token count', () => {
        const result = buildHandoffSummary({
            conversation: makeConversation({ turnCount: 25, totalInputTokens: 100000, totalOutputTokens: 20000 }),
            health: makeHealth('degrading'),
        });
        expect(result).toContain('25 turns');
        expect(result).toContain('120.0k tokens');
    });

    it('includes formatted model name', () => {
        const result = buildHandoffSummary({
            conversation: makeConversation({ model: 'claude-opus-4-6' }),
            health: makeHealth('degrading'),
        });
        expect(result).toContain('Opus 4.6');
    });

    it('explains critical health reason', () => {
        const result = buildHandoffSummary({
            conversation: makeConversation(),
            health: makeHealth('critical'),
        });
        expect(result).toContain('context window was nearly full');
    });

    it('explains degrading health reason', () => {
        const result = buildHandoffSummary({
            conversation: makeConversation(),
            health: makeHealth('degrading'),
        });
        expect(result).toContain('earlier details were fading');
    });

    it('uses neutral reason for healthy', () => {
        const result = buildHandoffSummary({
            conversation: makeConversation(),
            health: makeHealth('healthy'),
        });
        expect(result).toContain('keep things focused');
    });

    it('ends with a prompt for the user to continue', () => {
        const result = buildHandoffSummary({
            conversation: makeConversation(),
            health: makeHealth('degrading'),
        });
        expect(result).toContain('continue from where we left off');
    });

    it('uses singular "turn" for single-turn conversations', () => {
        const result = buildHandoffSummary({
            conversation: makeConversation({ turnCount: 1 }),
            health: makeHealth('degrading'),
        });
        expect(result).toContain('1 turn,');
    });
});

// ── formatTokens ──────────────────────────────────────────────────────────────

describe('formatTokens', () => {
    it('formats small numbers as-is', () => {
        expect(formatTokens(500)).toBe('500');
    });

    it('formats thousands with k suffix', () => {
        expect(formatTokens(1500)).toBe('1.5k');
    });

    it('formats millions with M suffix', () => {
        expect(formatTokens(2500000)).toBe('2.5M');
    });

    it('formats exact thousands cleanly', () => {
        expect(formatTokens(10000)).toBe('10.0k');
    });

    it('formats zero', () => {
        expect(formatTokens(0)).toBe('0');
    });
});

// ── formatModel ───────────────────────────────────────────────────────────────

describe('formatModel', () => {
    it('formats claude-sonnet-4-6 to Sonnet 4.6', () => {
        expect(formatModel('claude-sonnet-4-6')).toBe('Sonnet 4.6');
    });

    it('formats claude-opus-4-6 to Opus 4.6', () => {
        expect(formatModel('claude-opus-4-6')).toBe('Opus 4.6');
    });

    it('formats claude-haiku-4-5 to Haiku 4.5', () => {
        expect(formatModel('claude-haiku-4-5')).toBe('Haiku 4.5');
    });

    it('returns raw string for unrecognized models', () => {
        expect(formatModel('gpt-4-turbo')).toBe('gpt-4-turbo');
    });

    it('handles model names with extra suffixes', () => {
        // claude-haiku-4-5-20251001 should match the first 3 groups
        expect(formatModel('claude-haiku-4-5-20251001')).toBe('Haiku 4.5');
    });
});
