// lib/platform-config.ts
// Centralized configuration defining provider endpoints and SSE event hierarchies.
// 
// Architecture Note: This file is intentionally not imported by inject.ts 
// (the Main World interceptor) to ensure strict isolation. It is utilized 
// only by Room 2 (the content script) and Room 3 (the background worker).

export const PROVIDER_CONFIG = {
    claude: {
        // Targets the Claude web UI completions stream.
        // We match via the unique '/chat_conversations/' directory to prevent 
        // broad collisions with generic '/completion' analytucs APIs.
        endpoints: ['/chat_conversations/'],
        sentinels: ['message_start', 'content_block_stop', 'message_delta'],
        terminator: 'message_stop',
    },
    chatgpt: {
        // Target definitions for ChatGPT web GUI
        endpoints: ['/backend-api/conversation'],
        sentinels: ['choices', 'delta'],
        terminator: '[DONE]',
    },
} as const;

export type ProviderName = keyof typeof PROVIDER_CONFIG;
