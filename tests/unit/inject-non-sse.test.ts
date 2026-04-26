// tests/unit/inject-non-sse.test.ts
// Asserts that the fetch interceptor in inject.ts skips tee + decoder when
// the response is not an SSE stream. inject.ts has no exports (it is an IIFE
// injected into claude.ai's main world), so we mirror the gate predicate
// here and exercise it the same way the existing sse-decoder.test.ts mirrors
// decode logic.
//
// The gate decides whether decodeSSEStream should be invoked at all. Before
// this fix, claude.ai 429s and captcha HTML pages were piped through the
// SSE decoder, which silently failed and left the overlay frozen on the
// previous turn until the 120s watchdog tripped.

import { describe, it, expect } from 'vitest';

/**
 * Mirrors the predicate in entrypoints/inject.ts that guards the tee call.
 * If this signature ever drifts, update both places at once.
 */
function shouldTeeAndDecode(response: { status: number; headers: Headers; body: unknown }): boolean {
    const contentType = response.headers.get('content-type') ?? '';
    const isSseStream = response.status === 200 && contentType.includes('event-stream');
    return Boolean(response.body) && isSseStream;
}

function makeResponse(status: number, contentType: string | null, hasBody: boolean = true) {
    const headers = new Headers();
    if (contentType !== null) headers.set('content-type', contentType);
    return { status, headers, body: hasBody ? {} : null };
}

describe('inject.ts non-SSE response gate', () => {
    it('tees a 200 response with text/event-stream + charset', () => {
        expect(shouldTeeAndDecode(makeResponse(200, 'text/event-stream; charset=utf-8'))).toBe(true);
    });

    it('tees a 200 response with bare text/event-stream', () => {
        expect(shouldTeeAndDecode(makeResponse(200, 'text/event-stream'))).toBe(true);
    });

    it('skips tee on a 429 rate-limit response', () => {
        expect(shouldTeeAndDecode(makeResponse(429, 'application/json'))).toBe(false);
    });

    it('skips tee on a 500 server-error response', () => {
        expect(shouldTeeAndDecode(makeResponse(500, 'text/event-stream'))).toBe(false);
    });

    it('skips tee on a 200 response that is captcha/CDN HTML', () => {
        // Cloudflare interstitials and Anthropic's own captcha challenges land
        // on this endpoint with status 200 + text/html. Treating them as SSE
        // is what froze the overlay before this fix.
        expect(shouldTeeAndDecode(makeResponse(200, 'text/html; charset=utf-8'))).toBe(false);
    });

    it('skips tee on a 200 response with no content-type header', () => {
        expect(shouldTeeAndDecode(makeResponse(200, null))).toBe(false);
    });

    it('skips tee when the response body is missing', () => {
        // Defensive: even an SSE-shaped header should not trigger tee if
        // the body is null (some intermediaries strip it).
        expect(shouldTeeAndDecode(makeResponse(200, 'text/event-stream', false))).toBe(false);
    });
});
