// tests/unit/pricing.test.ts
// Verifies the model catalog: context window sizes, cost calculations, and
// the isKnownModel guard used by the overlay to signal unknown-model uncertainty.

import { describe, it, expect } from 'vitest';
import { lookupModel, calculateCost, getContextWindowSize, isKnownModel } from '../../lib/pricing';

// ── lookupModel ───────────────────────────────────────────────────────────────

describe('lookupModel', () => {
    it('returns a record for a fully-versioned model ID', () => {
        const result = lookupModel('claude-sonnet-4-6-20250514');
        expect(result).not.toBeNull();
        expect(result!.inputCostPerToken).toBe(0.000003);
        expect(result!.outputCostPerToken).toBe(0.000015);
        expect(result!.contextWindow).toBe(1_000_000);
    });

    it('returns a record for a short alias', () => {
        const result = lookupModel('claude-sonnet-4-6');
        expect(result).not.toBeNull();
        expect(result!.inputCostPerToken).toBe(0.000003);
    });

    it('returns a record for claude-opus-4-6-20250514', () => {
        const result = lookupModel('claude-opus-4-6-20250514');
        expect(result).not.toBeNull();
        expect(result!.inputCostPerToken).toBe(0.000005);
        expect(result!.outputCostPerToken).toBe(0.000025);
        expect(result!.contextWindow).toBe(1_000_000);
    });

    it('returns a record for claude-haiku-4-5-20251001', () => {
        const result = lookupModel('claude-haiku-4-5-20251001');
        expect(result).not.toBeNull();
        expect(result!.inputCostPerToken).toBe(0.000001);
        expect(result!.outputCostPerToken).toBe(0.000005);
        expect(result!.contextWindow).toBe(200_000);
    });

    it('returns null for an unknown model', () => {
        expect(lookupModel('gpt-4o')).toBeNull();
    });

    it('returns null for an empty string', () => {
        expect(lookupModel('')).toBeNull();
    });

    it('is case-insensitive', () => {
        expect(lookupModel('Claude-Sonnet-4-6')).not.toBeNull();
    });
});

// ── Context window sizes ──────────────────────────────────────────────────────

describe('getContextWindowSize: 1M models', () => {
    // Opus 4.7, Sonnet 4.6, and Opus 4.6 all ship with 1M context windows.
    // This is the critical correctness check: the old value was 200K, which
    // made contextPct show ~5x too high for every active user on these models.
    it('claude-opus-4-7', () => {
        expect(getContextWindowSize('claude-opus-4-7')).toBe(1_000_000);
    });

    it('claude-sonnet-4-6', () => {
        expect(getContextWindowSize('claude-sonnet-4-6')).toBe(1_000_000);
    });

    it('claude-sonnet-4-6-20250514', () => {
        expect(getContextWindowSize('claude-sonnet-4-6-20250514')).toBe(1_000_000);
    });

    it('claude-opus-4-6', () => {
        expect(getContextWindowSize('claude-opus-4-6')).toBe(1_000_000);
    });

    it('claude-opus-4-6-20250514', () => {
        expect(getContextWindowSize('claude-opus-4-6-20250514')).toBe(1_000_000);
    });
});

describe('getContextWindowSize: 200K models', () => {
    it('claude-haiku-4-5', () => {
        expect(getContextWindowSize('claude-haiku-4-5')).toBe(200_000);
    });

    it('claude-haiku-4-5-20251001', () => {
        expect(getContextWindowSize('claude-haiku-4-5-20251001')).toBe(200_000);
    });

    it('claude-sonnet-4-5', () => {
        expect(getContextWindowSize('claude-sonnet-4-5')).toBe(200_000);
    });

    it('claude-opus-4-5', () => {
        expect(getContextWindowSize('claude-opus-4-5')).toBe(200_000);
    });

    it('claude-opus-4-1', () => {
        expect(getContextWindowSize('claude-opus-4-1')).toBe(200_000);
    });

    it('claude-3-haiku-20240307', () => {
        expect(getContextWindowSize('claude-3-haiku-20240307')).toBe(200_000);
    });

    it('falls back to 200K for any unrecognised model string', () => {
        expect(getContextWindowSize('claude-unknown-future-model')).toBe(200_000);
        expect(getContextWindowSize('')).toBe(200_000);
    });
});

// ── isKnownModel ──────────────────────────────────────────────────────────────

describe('isKnownModel', () => {
    it('returns true for every model in the catalog', () => {
        const known = [
            'claude-opus-4-7',
            'claude-sonnet-4-6',
            'claude-sonnet-4-6-20250514',
            'claude-opus-4-6',
            'claude-opus-4-6-20250514',
            'claude-haiku-4-5',
            'claude-haiku-4-5-20251001',
            'claude-sonnet-4-5',
            'claude-sonnet-4-5-20250929',
            'claude-opus-4-5',
            'claude-opus-4-5-20251101',
            'claude-opus-4-1',
            'claude-opus-4-1-20250805',
            'claude-sonnet-4-0',
            'claude-sonnet-4-20250514',
            'claude-opus-4-0',
            'claude-opus-4-20250514',
            'claude-3-haiku-20240307',
        ];
        for (const model of known) {
            expect(isKnownModel(model), `expected ${model} to be known`).toBe(true);
        }
    });

    it('returns false for an unrecognised model string', () => {
        expect(isKnownModel('claude-unknown-future-model')).toBe(false);
    });

    it('returns false for an empty string', () => {
        expect(isKnownModel('')).toBe(false);
    });
});

// ── Cost calculations ─────────────────────────────────────────────────────────

describe('calculateCost', () => {
    it('calculates cost for claude-sonnet-4-6 ($3/$15 per MTok)', () => {
        // 1000 input * 0.000003 + 500 output * 0.000015 = 0.003 + 0.0075 = 0.0105
        expect(calculateCost(1000, 500, 'claude-sonnet-4-6-20250514')).toBeCloseTo(0.0105, 10);
    });

    it('calculates cost for claude-opus-4-6 ($5/$25 per MTok)', () => {
        // 200 input * 0.000005 + 100 output * 0.000025 = 0.001 + 0.0025 = 0.0035
        expect(calculateCost(200, 100, 'claude-opus-4-6-20250514')).toBeCloseTo(0.0035, 10);
    });

    it('calculates cost for claude-opus-4-7 ($5/$25 per MTok)', () => {
        expect(calculateCost(200, 100, 'claude-opus-4-7')).toBeCloseTo(0.0035, 10);
    });

    it('calculates cost for claude-haiku-4-5 ($1/$5 per MTok)', () => {
        // 500 input * 0.000001 + 500 output * 0.000005 = 0.0005 + 0.0025 = 0.003
        expect(calculateCost(500, 500, 'claude-haiku-4-5-20251001')).toBeCloseTo(0.003, 10);
    });

    it('calculates cost for claude-opus-4-1 ($15/$75 per MTok, legacy high-cost)', () => {
        // 1000 input * 0.000015 + 1000 output * 0.000075 = 0.015 + 0.075 = 0.09
        expect(calculateCost(1000, 1000, 'claude-opus-4-1')).toBeCloseTo(0.09, 10);
    });

    it('calculates cost for claude-3-haiku-20240307 ($0.25/$1.25 per MTok)', () => {
        // 1000 input * 0.00000025 + 1000 output * 0.00000125 = 0.00025 + 0.00125 = 0.0015
        expect(calculateCost(1000, 1000, 'claude-3-haiku-20240307')).toBeCloseTo(0.0015, 10);
    });

    it('returns zero when both token counts are zero', () => {
        expect(calculateCost(0, 0, 'claude-sonnet-4-6')).toBe(0);
    });

    it('returns null for an unknown model', () => {
        expect(calculateCost(1000, 500, 'gpt-4o')).toBeNull();
    });

    it('returns null for an empty model string', () => {
        expect(calculateCost(1000, 500, '')).toBeNull();
    });

    it('alias and versioned ID produce identical cost', () => {
        const versioned = calculateCost(1000, 500, 'claude-sonnet-4-6-20250514');
        const alias = calculateCost(1000, 500, 'claude-sonnet-4-6');
        expect(alias).toBe(versioned);
    });

    it('returns null for negative input token count', () => {
        expect(calculateCost(-1, 0, 'claude-opus-4-7')).toBeNull();
    });

    it('returns null for negative output token count', () => {
        expect(calculateCost(0, -1, 'claude-opus-4-7')).toBeNull();
    });
});
