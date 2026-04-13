// e2e/tests/extension-loads.spec.ts
// Verifies the extension installs, service worker registers, and content script injects.

import { test, expect } from '../fixtures';

test.describe('Extension Loading', () => {
    test('service worker is registered and active', async ({ context }) => {
        const serviceWorkers = context.serviceWorkers();
        expect(serviceWorkers.length).toBeGreaterThan(0);

        const swUrl = serviceWorkers[0].url();
        expect(swUrl).toContain('background.js');
    });

    test('extension ID is a valid Chrome extension ID', async ({ extensionId }) => {
        // Chrome extension IDs are 32 lowercase letters
        expect(extensionId).toMatch(/^[a-z]{32}$/);
    });

    test('content script injects on claude.ai page', async ({ mockPage }) => {
        // The content script creates #lco-widget-host on the page
        // Give it time to inject (document_start + async init)
        await mockPage.waitForTimeout(2000);

        const host = await mockPage.$('#lco-widget-host');
        expect(host).not.toBeNull();
    });

    test('inject.ts runs and logs initialization', async ({ mockPage }) => {
        // Listen for console messages from inject.ts
        const messages: string[] = [];
        mockPage.on('console', (msg) => {
            if (msg.text().includes('[LCO]')) {
                messages.push(msg.text());
            }
        });

        // Reload to capture all console messages from page load
        await mockPage.reload({ waitUntil: 'domcontentloaded' });
        await mockPage.waitForTimeout(3000);

        const initMsg = messages.find(m => m.includes('Fetch interceptor initialized'));
        expect(initMsg).toBeDefined();
    });
});
