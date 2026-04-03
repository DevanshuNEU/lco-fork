// tests/unit/format.test.ts
// Tests for shared formatting utilities.

import { describe, it, expect } from 'vitest';
import { formatTokens, formatCost, formatModel, formatRelativeTime } from '../../lib/format';

// ── formatTokens ─────────────────────────────────────────────────────────────

describe('formatTokens', () => {
    it('returns raw number below 1000', () => {
        expect(formatTokens(500)).toBe('500');
        expect(formatTokens(0)).toBe('0');
        expect(formatTokens(999)).toBe('999');
    });

    it('formats thousands as k', () => {
        expect(formatTokens(1000)).toBe('1.0k');
        expect(formatTokens(1500)).toBe('1.5k');
        expect(formatTokens(10000)).toBe('10.0k');
        expect(formatTokens(84500)).toBe('84.5k');
        expect(formatTokens(999999)).toBe('1000.0k');
    });

    it('formats millions as M', () => {
        expect(formatTokens(1000000)).toBe('1.0M');
        expect(formatTokens(2500000)).toBe('2.5M');
    });
});

// ── formatCost ───────────────────────────────────────────────────────────────

describe('formatCost', () => {
    it('returns $0.00* for null (unknown model)', () => {
        expect(formatCost(null)).toBe('$0.00*');
    });

    it('formats with 2 decimal places by default', () => {
        expect(formatCost(0)).toBe('$0.00');
        expect(formatCost(1.5)).toBe('$1.50');
        expect(formatCost(0.1234)).toBe('$0.12');
    });

    it('respects custom decimal places', () => {
        expect(formatCost(0.0073, 4)).toBe('$0.0073');
        expect(formatCost(1.5, 0)).toBe('$2');
    });

    it('handles null with custom decimals', () => {
        expect(formatCost(null, 4)).toBe('$0.00*');
    });
});

// ── formatModel ──────────────────────────────────────────────────────────────

describe('formatModel', () => {
    it('formats claude model identifiers', () => {
        expect(formatModel('claude-sonnet-4-6')).toBe('Sonnet 4.6');
        expect(formatModel('claude-opus-4-6')).toBe('Opus 4.6');
        expect(formatModel('claude-haiku-4-5')).toBe('Haiku 4.5');
    });

    it('handles model IDs with date suffixes', () => {
        expect(formatModel('claude-haiku-4-5-20251001')).toBe('Haiku 4.5');
    });

    it('returns raw string for unknown models', () => {
        expect(formatModel('gpt-4-turbo')).toBe('gpt-4-turbo');
        expect(formatModel('unknown')).toBe('unknown');
        expect(formatModel('')).toBe('');
    });
});

// ── formatRelativeTime ───────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
    const now = new Date('2026-04-03T12:00:00Z').getTime();

    it('returns "just now" for timestamps within 60 seconds', () => {
        expect(formatRelativeTime(now - 30_000, now)).toBe('just now');
        expect(formatRelativeTime(now - 59_000, now)).toBe('just now');
        expect(formatRelativeTime(now, now)).toBe('just now');
    });

    it('returns "just now" for future timestamps', () => {
        expect(formatRelativeTime(now + 60_000, now)).toBe('just now');
    });

    it('returns minutes ago', () => {
        expect(formatRelativeTime(now - 5 * 60_000, now)).toBe('5m ago');
        expect(formatRelativeTime(now - 59 * 60_000, now)).toBe('59m ago');
    });

    it('returns hours ago', () => {
        expect(formatRelativeTime(now - 2 * 3600_000, now)).toBe('2h ago');
        expect(formatRelativeTime(now - 23 * 3600_000, now)).toBe('23h ago');
    });

    it('returns "yesterday" for 24-48 hours ago', () => {
        expect(formatRelativeTime(now - 25 * 3600_000, now)).toBe('yesterday');
        expect(formatRelativeTime(now - 47 * 3600_000, now)).toBe('yesterday');
    });

    it('returns month + day for older timestamps', () => {
        // 3 days ago: Mar 31
        const threeDaysAgo = now - 3 * 86400_000;
        expect(formatRelativeTime(threeDaysAgo, now)).toBe('Mar 31');

        // 30 days ago: Mar 4
        const thirtyDaysAgo = now - 30 * 86400_000;
        expect(formatRelativeTime(thirtyDaysAgo, now)).toBe('Mar 4');
    });
});
