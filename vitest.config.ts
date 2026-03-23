import { defineConfig } from 'vitest/config';

// Vitest configuration for the LCO extension.
// The test suite runs in a Node.js environment, mocking the Chrome Extension
// APIs (browser.*, chrome.*) that are only available inside the actual extension runtime.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['lib/**', 'entrypoints/**'],
      exclude: ['entrypoints/inject.ts'], // Self-contained MAIN world script — untestable in Node
    },
  },
});
