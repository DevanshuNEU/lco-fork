// tests/integration/account-isolation.test.ts
// Full pipeline integration tests for account isolation.
// Uses the real conversation-store functions with an in-memory mock so no
// chrome APIs are required. Mirrors the pattern from ipc-pipeline.test.ts.

import { describe, it, expect, beforeEach } from 'vitest';
import {
    setStorage,
    recordTurn,
    finalizeConversation,
    getConversation,
    listConversations,
    computeDailySummary,
    type StorageArea,
    type ConversationRecord,
} from '../../lib/conversation-store';

// ── In-memory storage mock ────────────────────────────────────────────────────

function createMockStore(): StorageArea & { _raw: Record<string, unknown> } {
    const data: Record<string, unknown> = {};
    return {
        get: async (keys) => {
            if (keys === null) return { ...data };
            const keyList = typeof keys === 'string' ? [keys] : keys;
            const result: Record<string, unknown> = {};
            for (const k of keyList) {
                if (k in data) result[k] = data[k];
            }
            return result;
        },
        set: async (items) => { Object.assign(data, items); },
        remove: async (keys) => {
            const list = typeof keys === 'string' ? [keys] : keys;
            for (const k of list) delete data[k];
        },
        _raw: data,
    };
}

function makeTurn(overrides: { inputTokens?: number; completedAt?: number } = {}) {
    return {
        inputTokens: overrides.inputTokens ?? 100,
        outputTokens: 50,
        model: 'claude-sonnet-4-6',
        contextPct: 10,
        cost: 0.001 as number | null,
        completedAt: overrides.completedAt ?? Date.now(),
    };
}

function makeLegacyRecord(id: string, inputTokens: number): ConversationRecord {
    return {
        id,
        startedAt: 1000,
        lastActiveAt: 2000,
        finalized: false,
        turnCount: 1,
        totalInputTokens: inputTokens,
        totalOutputTokens: 50,
        peakContextPct: 5,
        lastContextPct: 5,
        model: 'claude-sonnet-4-6',
        estimatedCost: 0.001,
        turns: [],
        dna: { subject: '', lastContext: '', hints: [] },
        _v: 1,
    };
}

// Two distinct org UUIDs used throughout the suite.
const ORG_A = 'aaaaaaaa-0000-4000-8000-aaaaaaaaaaaa';
const ORG_B = 'bbbbbbbb-0000-4000-8000-bbbbbbbbbbbb';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('account isolation: full pipeline', () => {
    let mockStore: ReturnType<typeof createMockStore>;

    beforeEach(() => {
        mockStore = createMockStore();
        setStorage(mockStore);
    });

    it('listConversations and daily summaries are scoped per account', async () => {
        const ts = new Date('2026-04-10T12:00:00').getTime();
        await recordTurn(ORG_A, 'conv-a1', makeTurn({ inputTokens: 500, completedAt: ts }));
        await recordTurn(ORG_A, 'conv-a2', makeTurn({ inputTokens: 300, completedAt: ts }));
        await recordTurn(ORG_B, 'conv-b1', makeTurn({ inputTokens: 800, completedAt: ts }));

        const listA = await listConversations(ORG_A, 10);
        const listB = await listConversations(ORG_B, 10);
        expect(listA).toHaveLength(2);
        expect(listB).toHaveLength(1);
        expect(listA.map(c => c.id)).toEqual(expect.arrayContaining(['conv-a1', 'conv-a2']));
        expect(listB[0].id).toBe('conv-b1');

        const summaryA = await computeDailySummary(ORG_A, '2026-04-10');
        const summaryB = await computeDailySummary(ORG_B, '2026-04-10');
        expect(summaryA.totalInputTokens).toBe(800);   // 500 + 300
        expect(summaryB.totalInputTokens).toBe(800);   // just b1
        expect(summaryA.conversationCount).toBe(2);
        expect(summaryB.conversationCount).toBe(1);
    });

    it('legacy records are visible to both accounts without being migrated', async () => {
        // Simulate pre-isolation data: global convIndex + global conv keys.
        mockStore._raw['convIndex'] = ['legacy-1', 'legacy-2'];
        mockStore._raw['conv:legacy-1'] = makeLegacyRecord('legacy-1', 111);
        mockStore._raw['conv:legacy-2'] = makeLegacyRecord('legacy-2', 222);

        // Both accounts can read the legacy data.
        const listA = await listConversations(ORG_A, 10);
        const listB = await listConversations(ORG_B, 10);
        expect(listA).toHaveLength(2);
        expect(listB).toHaveLength(2);

        // No bulk migration: scoped indexes must not exist.
        expect(mockStore._raw[`convIndex:${ORG_A}`]).toBeUndefined();
        expect(mockStore._raw[`convIndex:${ORG_B}`]).toBeUndefined();
        // Legacy index is untouched.
        expect(mockStore._raw['convIndex']).toEqual(['legacy-1', 'legacy-2']);
    });

    it('same conversation ID across two accounts produces independent records and finalization', async () => {
        const SHARED_ID = 'shared-conv-id';
        await recordTurn(ORG_A, SHARED_ID, makeTurn({ inputTokens: 100 }));
        await recordTurn(ORG_B, SHARED_ID, makeTurn({ inputTokens: 999 }));

        const recA = await getConversation(ORG_A, SHARED_ID);
        const recB = await getConversation(ORG_B, SHARED_ID);
        expect(recA!.totalInputTokens).toBe(100);
        expect(recB!.totalInputTokens).toBe(999);

        // Finalizing ORG_A's record does not affect ORG_B's.
        await finalizeConversation(ORG_A, SHARED_ID);

        const finalA = await getConversation(ORG_A, SHARED_ID);
        const finalB = await getConversation(ORG_B, SHARED_ID);
        expect(finalA!.finalized).toBe(true);
        expect(finalB!.finalized).toBe(false);
    });
});
