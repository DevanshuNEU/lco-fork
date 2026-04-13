// e2e/tests/sse-interception.spec.ts
// Verifies the fetch interceptor handles all SSE stream scenarios correctly.

import { test, expect } from '../fixtures';

test.describe('SSE Interception', () => {
    test('normal stream: all events parsed, completion logged', async ({ mockPage }) => {
        const messages: string[] = [];
        mockPage.on('console', (msg) => {
            if (msg.text().includes('[LCO]')) messages.push(msg.text());
        });

        await mockPage.waitForTimeout(2000);
        await mockPage.click('#trigger-stream');
        await mockPage.waitForTimeout(4000);

        const hasStart = messages.some(m => m.includes('message_start'));
        const hasStopReason = messages.some(m => m.includes('stop_reason: end_turn'));
        const hasComplete = messages.some(m => m.includes('[Complete]'));
        const hasStreamEnd = messages.some(m => m.includes('stream confirmed complete'));

        expect(hasStart).toBe(true);
        expect(hasStopReason).toBe(true);
        expect(hasStreamEnd).toBe(true);
        expect(hasComplete).toBe(true);
    });

    test('long stream (1000 deltas): no crash, counts accumulate', async ({ mockPage }) => {
        const completeMessages: string[] = [];
        mockPage.on('console', (msg) => {
            if (msg.text().includes('[LCO]') && msg.text().includes('[Complete]')) {
                completeMessages.push(msg.text());
            }
        });

        await mockPage.waitForTimeout(2000);
        await mockPage.click('#trigger-stream-long');
        // Long stream: 1000 deltas at 5ms each = ~5s + overhead
        await mockPage.waitForTimeout(12000);

        expect(completeMessages.length).toBeGreaterThan(0);
        // Token count should be significant (1000 deltas of "WordN " each)
        const match = completeMessages[0].match(/~(\d+) out/);
        expect(match).not.toBeNull();
        if (match) {
            const outTokens = parseInt(match[1], 10);
            // 1000 deltas of ~6 chars each = ~6000 chars / 4 = ~1500 tokens (chars/4 estimate)
            // BPE may differ but should be > 100
            expect(outTokens).toBeGreaterThan(100);
        }
    });

    test('error stream (500): extension does not crash', async ({ mockPage }) => {
        const errors: string[] = [];
        const lcoMessages: string[] = [];
        mockPage.on('console', (msg) => {
            if (msg.type() === 'error') errors.push(msg.text());
            if (msg.text().includes('[LCO]')) lcoMessages.push(msg.text());
        });

        await mockPage.waitForTimeout(2000);

        // Trigger error scenario - the mock returns 500 with no body stream
        await mockPage.evaluate(() => {
            (window as any).triggerStream('error');
        });
        await mockPage.waitForTimeout(3000);

        // The page's own log should show the error status
        const logContent = await mockPage.$eval('#log', el => el.textContent);
        expect(logContent).toContain('500');

        // No [LCO-ERROR] messages that indicate a crash (uncaught exceptions)
        const crashes = errors.filter(e => e.includes('Uncaught') || e.includes('unhandled'));
        expect(crashes.length).toBe(0);
    });

    test('rate limit (429): extension does not break', async ({ mockPage }) => {
        const errors: string[] = [];
        mockPage.on('console', (msg) => {
            if (msg.type() === 'error' && msg.text().includes('Uncaught')) {
                errors.push(msg.text());
            }
        });

        await mockPage.waitForTimeout(2000);

        await mockPage.evaluate(() => {
            (window as any).triggerStream('ratelimit');
        });
        await mockPage.waitForTimeout(3000);

        const logContent = await mockPage.$eval('#log', el => el.textContent);
        expect(logContent).toContain('429');

        // No uncaught exceptions
        expect(errors.length).toBe(0);
    });

    test('malformed stream: extension recovers gracefully', async ({ mockPage }) => {
        const debugMessages: string[] = [];
        const completeMessages: string[] = [];
        mockPage.on('console', (msg) => {
            if (msg.text().includes('Skipped malformed JSON')) {
                debugMessages.push(msg.text());
            }
            if (msg.text().includes('[Complete]')) {
                completeMessages.push(msg.text());
            }
        });

        await mockPage.waitForTimeout(2000);
        await mockPage.click('#trigger-stream-malformed');
        await mockPage.waitForTimeout(4000);

        // Should have logged the malformed JSON skip
        expect(debugMessages.length).toBeGreaterThan(0);

        // Stream should still complete successfully despite the bad event
        expect(completeMessages.length).toBeGreaterThan(0);
    });
});
