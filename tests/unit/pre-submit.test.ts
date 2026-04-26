import { describe, it, expect } from 'vitest';
import {
    computePreSubmitEstimate,
    MIN_DRAFT_CHARS,
    MODEL_COMPARE_THRESHOLD_PCT,
    WARNING_ZONE_PCT,
    type PreSubmitInput,
} from '../../lib/pre-submit';
import type { AttachmentBreakdownItem } from '../../lib/attachment-cost';

function makeInput(overrides: Partial<PreSubmitInput> = {}): PreSubmitInput {
    return {
        draftCharCount: 200,
        model: 'claude-sonnet-4-6',
        pctPerInputToken: {
            'claude-sonnet-4-6': 0.01,   // 1% per 100 input tokens
            'claude-opus-4-6': 0.03,     // 3% per 100 input tokens
            'claude-haiku-4-5': 0.002,   // 0.2% per 100 input tokens
        },
        currentSessionPct: 40,
        ...overrides,
    };
}

// ── Threshold and null handling ──────────────────────────────────────────────

describe('threshold and null handling', () => {
    it('returns null when draftCharCount < MIN_DRAFT_CHARS', () => {
        const result = computePreSubmitEstimate(makeInput({ draftCharCount: MIN_DRAFT_CHARS - 1 }));
        expect(result).toBeNull();
    });

    it('returns null for zero-length draft', () => {
        const result = computePreSubmitEstimate(makeInput({ draftCharCount: 0 }));
        expect(result).toBeNull();
    });

    it('returns estimate at exactly MIN_DRAFT_CHARS', () => {
        const result = computePreSubmitEstimate(makeInput({ draftCharCount: MIN_DRAFT_CHARS }));
        expect(result).not.toBeNull();
    });

    it('returns null estimatedSessionPct when pctPerInputToken is null', () => {
        const result = computePreSubmitEstimate(makeInput({ pctPerInputToken: null }));
        expect(result).not.toBeNull();
        expect(result!.estimatedTokens).toBe(50); // 200 / 4
        expect(result!.estimatedSessionPct).toBeNull();
    });

    it('returns null estimatedSessionPct when model missing from pctPerInputToken', () => {
        const result = computePreSubmitEstimate(makeInput({
            model: 'unknown-model',
            pctPerInputToken: { 'claude-sonnet-4-6': 0.01 },
        }));
        expect(result).not.toBeNull();
        expect(result!.estimatedSessionPct).toBeNull();
    });
});

// ── Token estimation ─────────────────────────────────────────────────────────

describe('token estimation', () => {
    it('computes estimatedTokens as chars / 4', () => {
        const result = computePreSubmitEstimate(makeInput({ draftCharCount: 400 }));
        expect(result!.estimatedTokens).toBe(100);
    });

    it('rounds to nearest integer', () => {
        const result = computePreSubmitEstimate(makeInput({ draftCharCount: 201 }));
        expect(result!.estimatedTokens).toBe(50); // 201/4 = 50.25 -> 50
    });

    it('large draft returns proportionally large estimate', () => {
        const result = computePreSubmitEstimate(makeInput({ draftCharCount: 4000 }));
        expect(result!.estimatedTokens).toBe(1000);
    });
});

// ── Session % estimation ─────────────────────────────────────────────────────

describe('session % estimation', () => {
    it('computes estimatedSessionPct from pctPerInputToken', () => {
        // 200 chars -> 50 tokens, rate = 0.01 per token -> 0.5%
        const result = computePreSubmitEstimate(makeInput());
        expect(result!.estimatedSessionPct).toBeCloseTo(0.5, 2);
    });

    it('computes projectedTotalPct = currentSessionPct + estimatedSessionPct', () => {
        const result = computePreSubmitEstimate(makeInput({ currentSessionPct: 40 }));
        // 40% + 0.5% = 40.5%
        expect(result!.projectedTotalPct).toBeCloseTo(40.5, 2);
    });

    it('projectedTotalPct is null when estimatedSessionPct is null', () => {
        const result = computePreSubmitEstimate(makeInput({ pctPerInputToken: null }));
        expect(result!.projectedTotalPct).toBeNull();
    });
});

// ── Model comparisons ────────────────────────────────────────────────────────

describe('model comparisons', () => {
    it('empty when estimatedSessionPct <= MODEL_COMPARE_THRESHOLD_PCT', () => {
        // Small draft: 200 chars -> 50 tokens * 0.01 = 0.5% (below 5%)
        const result = computePreSubmitEstimate(makeInput());
        expect(result!.modelComparisons).toHaveLength(0);
    });

    it('populated when estimatedSessionPct > MODEL_COMPARE_THRESHOLD_PCT', () => {
        // Large draft: 4000 chars -> 1000 tokens * 0.01 = 10% (above 5%)
        const result = computePreSubmitEstimate(makeInput({ draftCharCount: 4000 }));
        expect(result!.modelComparisons.length).toBeGreaterThan(0);
    });

    it('sorted ascending by estimatedPct', () => {
        const result = computePreSubmitEstimate(makeInput({ draftCharCount: 4000 }));
        const pcts = result!.modelComparisons.map(c => c.estimatedPct);
        for (let i = 1; i < pcts.length; i++) {
            expect(pcts[i]).toBeGreaterThanOrEqual(pcts[i - 1]);
        }
    });

    it('includes model labels from classifyModelTier', () => {
        const result = computePreSubmitEstimate(makeInput({ draftCharCount: 4000 }));
        const labels = result!.modelComparisons.map(c => c.label);
        expect(labels).toContain('Haiku');
        expect(labels).toContain('Sonnet');
        expect(labels).toContain('Opus');
    });

    it('computes correct per-model estimates', () => {
        // 4000 chars -> 1000 tokens
        // Haiku: 1000 * 0.002 = 2%, Sonnet: 1000 * 0.01 = 10%, Opus: 1000 * 0.03 = 30%
        const result = computePreSubmitEstimate(makeInput({ draftCharCount: 4000 }));
        const haiku = result!.modelComparisons.find(c => c.label === 'Haiku');
        const sonnet = result!.modelComparisons.find(c => c.label === 'Sonnet');
        const opus = result!.modelComparisons.find(c => c.label === 'Opus');
        expect(haiku!.estimatedPct).toBeCloseTo(2, 1);
        expect(sonnet!.estimatedPct).toBeCloseTo(10, 1);
        expect(opus!.estimatedPct).toBeCloseTo(30, 1);
    });
});

// ── Warning ──────────────────────────────────────────────────────────────────

describe('warning', () => {
    it('no warning when projectedTotalPct < WARNING_ZONE_PCT', () => {
        const result = computePreSubmitEstimate(makeInput({ currentSessionPct: 40 }));
        expect(result!.warning).toBeNull();
    });

    it('warning when projectedTotalPct >= WARNING_ZONE_PCT', () => {
        // 4000 chars -> 1000 tokens * 0.01 = 10%, currentSession = 85%
        // projected = 95% >= 90%
        const result = computePreSubmitEstimate(makeInput({
            draftCharCount: 4000,
            currentSessionPct: 85,
        }));
        expect(result!.warning).not.toBeNull();
        expect(result!.warning).toContain('95%');
    });

    it('warning at exactly WARNING_ZONE_PCT', () => {
        // Need projected = exactly 90%: currentSession = 80%, draft cost = 10%
        const result = computePreSubmitEstimate(makeInput({
            draftCharCount: 4000,
            currentSessionPct: 80,
        }));
        // 1000 tokens * 0.01 = 10%, projected = 90%
        expect(result!.warning).not.toBeNull();
    });

    it('no warning when estimatedSessionPct is null', () => {
        const result = computePreSubmitEstimate(makeInput({
            pctPerInputToken: null,
            currentSessionPct: 95,
        }));
        expect(result!.warning).toBeNull();
    });
});

// ── Attachments: tokens, range, gates, pass-through ─────────────────────────

describe('attachments', () => {
    const breakdownImg = (tokens: number): AttachmentBreakdownItem =>
        ({ kind: 'image', tokens, label: `image (${tokens})` });
    const breakdownPdf = (low: number, high: number): AttachmentBreakdownItem =>
        ({ kind: 'pdf', tokens: low, tokensHigh: high, label: 'PDF range' });

    it('sums attachment tokens (low) into estimatedTokens', () => {
        // 200 chars -> 50 text tokens; image adds 1334 -> 1384 total.
        const result = computePreSubmitEstimate(makeInput({
            attachmentTokensLow: 1334,
            attachmentTokensHigh: 1334,
            attachmentBreakdown: [breakdownImg(1334)],
        }));
        expect(result!.textTokens).toBe(50);
        expect(result!.estimatedTokens).toBe(1384);
        expect(result!.estimatedTokensHigh).toBe(1384);
    });

    it('reflects PDF low/high range in estimatedTokensHigh', () => {
        // 200 chars text + PDF low=15000 high=30000 (10 pages).
        const result = computePreSubmitEstimate(makeInput({
            attachmentTokensLow: 15000,
            attachmentTokensHigh: 30000,
            attachmentBreakdown: [breakdownPdf(15000, 30000)],
            hasPdf: true,
        }));
        expect(result!.estimatedTokens).toBe(50 + 15000);
        expect(result!.estimatedTokensHigh).toBe(50 + 30000);
        expect(result!.hasPdf).toBe(true);
    });

    it('attachments-only draft (text below threshold) still produces an estimate', () => {
        const result = computePreSubmitEstimate(makeInput({
            draftCharCount: 0,
            attachmentTokensLow: 1334,
            attachmentTokensHigh: 1334,
            attachmentBreakdown: [breakdownImg(1334)],
        }));
        expect(result).not.toBeNull();
        expect(result!.textTokens).toBe(0);
        expect(result!.estimatedTokens).toBe(1334);
    });

    it('text below threshold AND no attachments still returns null', () => {
        const result = computePreSubmitEstimate(makeInput({
            draftCharCount: MIN_DRAFT_CHARS - 1,
            attachmentTokensLow: 0,
            attachmentTokensHigh: 0,
            attachmentBreakdown: [],
        }));
        expect(result).toBeNull();
    });

    it('session % uses combined token total', () => {
        // 200 chars (50 tokens) + 1000-token attachment, rate 0.01 -> 10.5%.
        const result = computePreSubmitEstimate(makeInput({
            attachmentTokensLow: 1000,
            attachmentTokensHigh: 1000,
            attachmentBreakdown: [breakdownImg(1000)],
        }));
        expect(result!.estimatedSessionPct).toBeCloseTo(10.5, 1);
        expect(result!.estimatedSessionPctHigh).toBeCloseTo(10.5, 1);
    });

    it('session % high differs from low when PDF range applies', () => {
        // 200 chars (50 tokens) + PDF low=1500 high=3000, rate 0.01.
        const result = computePreSubmitEstimate(makeInput({
            attachmentTokensLow: 1500,
            attachmentTokensHigh: 3000,
            attachmentBreakdown: [breakdownPdf(1500, 3000)],
            hasPdf: true,
        }));
        expect(result!.estimatedSessionPct).toBeCloseTo(15.5, 1);
        expect(result!.estimatedSessionPctHigh).toBeCloseTo(30.5, 1);
    });

    it('breakdown and warnings pass through unchanged', () => {
        const breakdown = [breakdownImg(500), breakdownPdf(7500, 15000)];
        const warnings = ['150 PDF pages exceeds the 100-page limit on this model.'];
        const result = computePreSubmitEstimate(makeInput({
            attachmentTokensLow: 8000,
            attachmentTokensHigh: 15500,
            attachmentBreakdown: breakdown,
            attachmentWarnings: warnings,
            hasPdf: true,
        }));
        expect(result!.attachmentBreakdown).toEqual(breakdown);
        expect(result!.attachmentWarnings).toEqual(warnings);
    });

    it('hasUnknownImage flag passes through', () => {
        const result = computePreSubmitEstimate(makeInput({
            attachmentTokensLow: 0,
            attachmentTokensHigh: 0,
            attachmentBreakdown: [{ kind: 'image', tokens: 0, label: 'image (cost unknown)', unknown: true }],
            hasUnknownImage: true,
        }));
        expect(result!.hasUnknownImage).toBe(true);
    });

    it('warning fires only on LOW projection, not on HIGH spike from PDF', () => {
        // Current session 80%, text 50 tokens (rate 0.01 -> 0.5%), PDF range
        // adds low=1000 (10%) high=2000 (20%). Low projection: 80 + 10.5 = 90.5%
        // (warning expected). High projection: 80 + 20.5 = 100.5%.
        const result = computePreSubmitEstimate(makeInput({
            currentSessionPct: 80,
            attachmentTokensLow: 1000,
            attachmentTokensHigh: 2000,
            attachmentBreakdown: [breakdownPdf(1000, 2000)],
            hasPdf: true,
        }));
        expect(result!.warning).not.toBeNull();
    });

    it('no warning when only HIGH would cross zone, LOW does not', () => {
        // Current session 80%, low=400 (4%) high=2000 (20%). Low projection
        // 80 + 4.5 = 84.5% (no warning). High would be 100.5% but we ignore it.
        const result = computePreSubmitEstimate(makeInput({
            currentSessionPct: 80,
            attachmentTokensLow: 400,
            attachmentTokensHigh: 2000,
            attachmentBreakdown: [breakdownPdf(400, 2000)],
            hasPdf: true,
        }));
        expect(result!.warning).toBeNull();
    });
});

// ── Backwards compatibility (DRAFT_ESTIMATE pre-send fallback) ───────────────

describe('backwards compatibility', () => {
    it('input without attachment fields behaves like before', () => {
        // The inject.ts pre-send fallback only sets draftCharCount, model,
        // pctPerInputToken, currentSessionPct. Make sure that path still works.
        const result = computePreSubmitEstimate({
            draftCharCount: 200,
            model: 'claude-sonnet-4-6',
            pctPerInputToken: { 'claude-sonnet-4-6': 0.01 },
            currentSessionPct: 40,
        });
        expect(result).not.toBeNull();
        expect(result!.estimatedTokens).toBe(50);
        expect(result!.estimatedTokensHigh).toBe(50);
        expect(result!.attachmentBreakdown).toEqual([]);
        expect(result!.attachmentWarnings).toEqual([]);
        expect(result!.hasPdf).toBe(false);
        expect(result!.hasUnknownImage).toBe(false);
    });
});
