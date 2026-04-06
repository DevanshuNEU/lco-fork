// tests/unit/set-active-conv.test.ts
// Tests for the SET_ACTIVE_CONV handler in background.ts (lines 286-297).
// Mirrors the handler logic for active conversation tracking in session storage.

import { describe, it, expect, vi } from 'vitest';

// -- Mirrored handler logic from background.ts --

interface SessionStorage {
    set: (items: Record<string, unknown>) => Promise<void>;
    remove: (keys: string[]) => Promise<void>;
}

interface SetActiveConvMessage {
    type: 'SET_ACTIVE_CONV';
    conversationId: string | null;
    organizationId: string | null;
}

/**
 * Mirrors the SET_ACTIVE_CONV handler from background.ts.
 * Writes or clears activeConv_{tabId} and activeOrg_{tabId} in session storage.
 */
function handleSetActiveConv(
    message: SetActiveConvMessage,
    tabId: number | undefined,
    storage: SessionStorage,
): { ok: boolean } {
    if (tabId !== undefined) {
        const convKey = `activeConv_${tabId}`;
        const orgKey = `activeOrg_${tabId}`;
        if (message.conversationId) {
            const setData: Record<string, string> = { [convKey]: message.conversationId };
            if (message.organizationId) {
                setData[orgKey] = message.organizationId;
            } else {
                storage.remove([orgKey]).catch(() => {});
            }
            storage.set(setData).catch(() => { /* non-critical */ });
        } else {
            storage.remove([convKey, orgKey]).catch(() => { /* non-critical */ });
        }
    }
    return { ok: true };
}

// -- Tests --

describe('SET_ACTIVE_CONV handler', () => {
    function makeStorage(): SessionStorage & { _ops: Array<{ op: string; args: unknown }> } {
        const ops: Array<{ op: string; args: unknown }> = [];
        return {
            set: vi.fn(async (items) => { ops.push({ op: 'set', args: items }); }),
            remove: vi.fn(async (keys) => { ops.push({ op: 'remove', args: keys }); }),
            _ops: ops,
        };
    }

    it('writes conversationId to activeConv_{tabId} in session storage', () => {
        const storage = makeStorage();
        handleSetActiveConv(
            { type: 'SET_ACTIVE_CONV', conversationId: 'conv-abc-123', organizationId: null },
            42,
            storage,
        );

        expect(storage.set).toHaveBeenCalledWith({ activeConv_42: 'conv-abc-123' });
    });

    it('removes both activeConv_{tabId} and activeOrg_{tabId} when conversationId is null', () => {
        const storage = makeStorage();
        handleSetActiveConv(
            { type: 'SET_ACTIVE_CONV', conversationId: null, organizationId: null },
            42,
            storage,
        );

        expect(storage.remove).toHaveBeenCalledWith(['activeConv_42', 'activeOrg_42']);
    });

    it('does nothing when tabId is undefined', () => {
        const storage = makeStorage();
        handleSetActiveConv(
            { type: 'SET_ACTIVE_CONV', conversationId: 'conv-abc-123', organizationId: null },
            undefined,
            storage,
        );

        expect(storage.set).not.toHaveBeenCalled();
        expect(storage.remove).not.toHaveBeenCalled();
    });

    it('always returns ok: true', () => {
        const storage = makeStorage();

        const r1 = handleSetActiveConv(
            { type: 'SET_ACTIVE_CONV', conversationId: 'conv-1', organizationId: null },
            1,
            storage,
        );
        expect(r1).toEqual({ ok: true });

        const r2 = handleSetActiveConv(
            { type: 'SET_ACTIVE_CONV', conversationId: null, organizationId: null },
            1,
            storage,
        );
        expect(r2).toEqual({ ok: true });

        const r3 = handleSetActiveConv(
            { type: 'SET_ACTIVE_CONV', conversationId: 'conv-2', organizationId: null },
            undefined,
            storage,
        );
        expect(r3).toEqual({ ok: true });
    });

    it('uses the correct key format for different tab IDs', () => {
        const storage = makeStorage();

        handleSetActiveConv({ type: 'SET_ACTIVE_CONV', conversationId: 'a', organizationId: null }, 1, storage);
        handleSetActiveConv({ type: 'SET_ACTIVE_CONV', conversationId: 'b', organizationId: null }, 999, storage);

        expect(storage.set).toHaveBeenNthCalledWith(1, { activeConv_1: 'a' });
        expect(storage.set).toHaveBeenNthCalledWith(2, { activeConv_999: 'b' });
    });

    it('treats empty string conversationId as falsy (removes both keys)', () => {
        const storage = makeStorage();
        handleSetActiveConv(
            { type: 'SET_ACTIVE_CONV', conversationId: '' as unknown as null, organizationId: null },
            42,
            storage,
        );

        expect(storage.remove).toHaveBeenCalledWith(['activeConv_42', 'activeOrg_42']);
    });

    it('handles storage.set rejection gracefully', async () => {
        const storage = makeStorage();
        (storage.set as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('quota exceeded'));

        const result = handleSetActiveConv(
            { type: 'SET_ACTIVE_CONV', conversationId: 'conv-1', organizationId: null },
            1,
            storage,
        );
        expect(result).toEqual({ ok: true });
    });

    it('handles storage.remove rejection gracefully', async () => {
        const storage = makeStorage();
        (storage.remove as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('quota exceeded'));

        const result = handleSetActiveConv(
            { type: 'SET_ACTIVE_CONV', conversationId: null, organizationId: null },
            1,
            storage,
        );
        expect(result).toEqual({ ok: true });
    });

    // ── organizationId handling ───────────────────────────────────────────────

    it('writes activeOrg_{tabId} alongside activeConv_{tabId} when organizationId is provided', () => {
        const storage = makeStorage();
        handleSetActiveConv(
            {
                type: 'SET_ACTIVE_CONV',
                conversationId: 'conv-abc',
                organizationId: 'org-uuid-123',
            },
            7,
            storage,
        );

        expect(storage.set).toHaveBeenCalledWith({
            activeConv_7: 'conv-abc',
            activeOrg_7: 'org-uuid-123',
        });
    });

    it('removes stale activeOrg_{tabId} when organizationId is null but conversationId is set', () => {
        const storage = makeStorage();
        handleSetActiveConv(
            { type: 'SET_ACTIVE_CONV', conversationId: 'conv-abc', organizationId: null },
            7,
            storage,
        );

        // Conv key is set; stale org key is explicitly removed.
        expect(storage.set).toHaveBeenCalledWith({ activeConv_7: 'conv-abc' });
        expect(storage.remove).toHaveBeenCalledWith(['activeOrg_7']);
    });

    it('removes both keys when conversationId is null regardless of organizationId', () => {
        const storage = makeStorage();
        handleSetActiveConv(
            { type: 'SET_ACTIVE_CONV', conversationId: null, organizationId: 'org-uuid-123' },
            7,
            storage,
        );

        expect(storage.remove).toHaveBeenCalledWith(['activeConv_7', 'activeOrg_7']);
        expect(storage.set).not.toHaveBeenCalled();
    });
});
