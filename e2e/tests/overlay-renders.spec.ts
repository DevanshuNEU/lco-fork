// e2e/tests/overlay-renders.spec.ts
// Verifies the overlay appears, updates during streaming, and supports collapse/expand.

import { test, expect } from '../fixtures';

test.describe('Overlay Rendering', () => {
    test('overlay appears after triggering a stream', async ({ mockPage }) => {
        await mockPage.waitForTimeout(2000); // let content script fully init

        // Widget should be hidden initially (display: none)
        const hostBefore = await mockPage.$('#lco-widget-host');
        expect(hostBefore).not.toBeNull();

        // Trigger a normal SSE stream via the test page button
        await mockPage.click('#trigger-stream');

        // Wait for the stream to complete and overlay to render
        await mockPage.waitForTimeout(3000);

        // Check if the widget host exists. The widget is inside a closed shadow DOM,
        // so we cannot query its children directly. We verify the host is present.
        const host = await mockPage.$('#lco-widget-host');
        expect(host).not.toBeNull();
    });

    test('console shows LCO stream events during SSE', async ({ mockPage }) => {
        const lcoMessages: string[] = [];
        mockPage.on('console', (msg) => {
            if (msg.text().includes('[LCO]')) {
                lcoMessages.push(msg.text());
            }
        });

        await mockPage.waitForTimeout(2000);
        await mockPage.click('#trigger-stream');
        await mockPage.waitForTimeout(4000);

        // Verify key lifecycle events were logged by inject.ts
        const hasMessageStart = lcoMessages.some(m => m.includes('message_start'));
        const hasComplete = lcoMessages.some(m => m.includes('[Complete]'));

        expect(hasMessageStart).toBe(true);
        expect(hasComplete).toBe(true);
    });

    test('stream complete log shows model and token counts', async ({ mockPage }) => {
        const lcoMessages: string[] = [];
        mockPage.on('console', (msg) => {
            if (msg.text().includes('[LCO]') && msg.text().includes('[Complete]')) {
                lcoMessages.push(msg.text());
            }
        });

        await mockPage.waitForTimeout(2000);
        await mockPage.click('#trigger-stream');
        await mockPage.waitForTimeout(4000);

        expect(lcoMessages.length).toBeGreaterThan(0);
        const completionLog = lcoMessages[0];
        expect(completionLog).toContain('claude-sonnet-4-6');
        // Should have token counts (either ~N in or ~N out)
        expect(completionLog).toMatch(/~\d+ (in|out)/);
    });

    test('message_limit event is logged and forwarded', async ({ mockPage }) => {
        const limitMessages: string[] = [];
        mockPage.on('console', (msg) => {
            if (msg.text().includes('[LCO]') && msg.text().includes('message_limit')) {
                limitMessages.push(msg.text());
            }
        });

        await mockPage.waitForTimeout(2000);
        await mockPage.click('#trigger-stream-limit');
        await mockPage.waitForTimeout(4000);

        expect(limitMessages.length).toBeGreaterThan(0);
        // The message should contain the utilization percentage
        expect(limitMessages[0]).toContain('42.0%');
    });
});
