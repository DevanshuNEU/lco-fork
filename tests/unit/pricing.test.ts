// tests/unit/pricing.test.ts
// Unit tests for the pricing engine: model lookup, cost calculation, context window.

import { describe, it, expect } from 'vitest';
import { lookupModel, calculateCost, getContextWindowSize } from '../../lib/pricing';

describe('lookupModel', () => {
    it('returns pricing for a fully-versioned model ID', () => {
        const result = lookupModel('claude-sonnet-4-6-20250514');
        expect(result).not.toBeNull();
        expect(result!.inputCostPerToken).toBe(0.000003);
        expect(result!.outputCostPerToken).toBe(0.000015);
        expect(result!.contextWindow).toBe(200_000);
    });

    it('returns pricing for a short alias', () => {
        const result = lookupModel('claude-sonnet-4-6');
        expect(result).not.toBeNull();
        expect(result!.inputCostPerToken).toBe(0.000003);
    });

    it('returns pricing for claude-opus-4-6-20250514', () => {
        const result = lookupModel('claude-opus-4-6-20250514');
        expect(result).not.toBeNull();
        expect(result!.inputCostPerToken).toBe(0.000005);
        expect(result!.outputCostPerToken).toBe(0.000025);
    });

    it('returns pricing for claude-haiku-4-5-20251001', () => {
        const result = lookupModel('claude-haiku-4-5-20251001');
        expect(result).not.toBeNull();
        expect(result!.inputCostPerToken).toBe(0.000001);
        expect(result!.outputCostPerToken).toBe(0.000005);
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

describe('calculateCost', () => {
    it('calculates cost correctly for sonnet', () => {
        // 1000 input * $0.000003 + 500 output * $0.000015 = $0.003 + $0.0075 = $0.0105
        const cost = calculateCost(1000, 500, 'claude-sonnet-4-6-20250514');
        expect(cost).toBeCloseTo(0.0105, 10);
    });

    it('calculates cost correctly for opus', () => {
        // 200 input * $0.000005 + 100 output * $0.000025 = $0.001 + $0.0025 = $0.0035
        const cost = calculateCost(200, 100, 'claude-opus-4-6-20250514');
        expect(cost).toBeCloseTo(0.0035, 10);
    });

    it('calculates cost correctly for haiku', () => {
        // 500 input * $0.000001 + 500 output * $0.000005 = $0.0005 + $0.0025 = $0.003
        const cost = calculateCost(500, 500, 'claude-haiku-4-5-20251001');
        expect(cost).toBeCloseTo(0.003, 10);
    });

    it('returns zero cost when both token counts are zero', () => {
        expect(calculateCost(0, 0, 'claude-sonnet-4-6')).toBe(0);
    });

    it('returns null for an unknown model', () => {
        expect(calculateCost(1000, 500, 'gpt-4o')).toBeNull();
    });

    it('returns null for an empty model string', () => {
        expect(calculateCost(1000, 500, '')).toBeNull();
    });

    it('works with the short alias the same as the versioned ID', () => {
        const versioned = calculateCost(1000, 500, 'claude-sonnet-4-6-20250514');
        const alias = calculateCost(1000, 500, 'claude-sonnet-4-6');
        expect(alias).toBe(versioned);
    });
});

describe('getContextWindowSize', () => {
    it('returns 200000 for known claude models', () => {
        expect(getContextWindowSize('claude-sonnet-4-6-20250514')).toBe(200_000);
        expect(getContextWindowSize('claude-opus-4-6')).toBe(200_000);
        expect(getContextWindowSize('claude-haiku-4-5')).toBe(200_000);
    });

    it('returns 200000 as default for an unknown model', () => {
        expect(getContextWindowSize('unknown-model-xyz')).toBe(200_000);
    });

    it('returns 200000 as default for an empty string', () => {
        expect(getContextWindowSize('')).toBe(200_000);
    });
});
