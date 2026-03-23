import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  webExt: {
    chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],
    // Persistent profile — keeps claude.ai cookies across dev restarts
    // First run: navigate to chrome://extensions/ and enable Developer mode
  },
  manifest: {
    name: 'Local Context Optimizer',
    description: 'Real-time token counting and cost tracking for AI platforms',
    permissions: ['storage', 'tabs', 'scripting'],
    optional_host_permissions: [
      'https://claude.ai/*',
      'https://chat.openai.com/*',
    ],
    host_permissions: [],
    web_accessible_resources: [
      {
        resources: ['inject.js'],
        matches: ['https://claude.ai/*', 'https://chat.openai.com/*'],
      },
    ],
  },
});
