// e2e/tests/multi-tab.spec.ts
// Verifies per-tab isolation: each tab has its own overlay state.

import { test, expect } from '../fixtures';

const MOCK_PORT = 3456;

test.describe('Multi-Tab Isolation', () => {
    test('two tabs show independent overlay data', async ({ context }) => {
        // Open two tabs to different "conversations"
        const page1 = await context.newPage();
        const page2 = await context.newPage();

        await page1.goto(`https://claude.ai:${MOCK_PORT}/chat/conv-111`, { waitUntil: 'domcontentloaded' });
        await page2.goto(`https://claude.ai:${MOCK_PORT}/chat/conv-222`, { waitUntil: 'domcontentloaded' });

        await page1.waitForTimeout(2000);
        await page2.waitForTimeout(1000);

        // Capture console messages per tab
        const tab1Messages: string[] = [];
        const tab2Messages: string[] = [];
        page1.on('console', (msg) => {
            if (msg.text().includes('[Complete]')) tab1Messages.push(msg.text());
        });
        page2.on('console', (msg) => {
            if (msg.text().includes('[Complete]')) tab2Messages.push(msg.text());
        });

        // Trigger normal stream in tab 1
        await page1.click('#trigger-stream');

        // Trigger long stream in tab 2
        await page2.click('#trigger-stream-long');

        // Wait for tab 1 to complete (short stream)
        await page1.waitForTimeout(4000);

        expect(tab1Messages.length).toBeGreaterThan(0);

        // Tab 1 should have completed; tab 2 may still be streaming
        // Verify tab 1 got its own completion event
        expect(tab1Messages[0]).toContain('claude-sonnet-4-6');

        // Wait for tab 2 to complete
        await page2.waitForTimeout(12000);
        expect(tab2Messages.length).toBeGreaterThan(0);

        // Both tabs should have their own independent overlay hosts
        const host1 = await page1.$('#lco-widget-host');
        const host2 = await page2.$('#lco-widget-host');
        expect(host1).not.toBeNull();
        expect(host2).not.toBeNull();

        await page1.close();
        await page2.close();
    });

    test('closing one tab does not affect the other', async ({ context }) => {
        const page1 = await context.newPage();
        const page2 = await context.newPage();

        await page1.goto(`https://claude.ai:${MOCK_PORT}/chat/conv-aaa`, { waitUntil: 'domcontentloaded' });
        await page2.goto(`https://claude.ai:${MOCK_PORT}/chat/conv-bbb`, { waitUntil: 'domcontentloaded' });

        await page1.waitForTimeout(2000);
        await page2.waitForTimeout(1000);

        // Trigger stream in both tabs
        await page1.click('#trigger-stream');
        await page2.click('#trigger-stream');
        await page1.waitForTimeout(4000);
        await page2.waitForTimeout(2000);

        // Close tab 1
        await page1.close();

        // Tab 2 should still have its overlay host intact
        const host2 = await page2.$('#lco-widget-host');
        expect(host2).not.toBeNull();

        // Tab 2 can still trigger new streams without error
        const errors: string[] = [];
        page2.on('console', (msg) => {
            if (msg.type() === 'error' && msg.text().includes('Uncaught')) {
                errors.push(msg.text());
            }
        });

        await page2.click('#trigger-stream');
        await page2.waitForTimeout(4000);

        expect(errors.length).toBe(0);

        await page2.close();
    });
});
