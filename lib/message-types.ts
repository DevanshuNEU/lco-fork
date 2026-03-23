// lib/message-types.ts
// Shared TypeScript interfaces used across all three rooms.
// Phase 1 prototype: only stream event types are needed.
// Bridge message types (LCO_V1 namespace) will be added in Step 3.

// ─── SSE Stream Event Types ───────────────────────────────────────────────────

/** Token usage data extracted from Claude's message_start event */
export interface InputTokenCount {
    event: 'input_count';
    inputTokens: number;
    cacheCreateTokens: number;
    cacheReadTokens: number;
    model: string;
}

/** Output token count from Claude's message_delta event */
export interface OutputTokenCount {
    event: 'output_count';
    outputTokens: number;
    stopReason: string | null;
}

/** Visible text chunk from content_block_delta */
export interface TextChunk {
    event: 'text';
    text: string;
}

/** Error injected into the SSE stream by Claude */
export interface StreamError {
    event: 'stream_error';
    error: unknown;
}

/** All possible token batch event types */
export type TokenEvent = InputTokenCount | OutputTokenCount | TextChunk | StreamError;

// ─── Health State ─────────────────────────────────────────────────────────────

/** Tracks SSE stream lifecycle for health check evaluation */
export interface HealthState {
    chunksProcessed: number;
    sawMessageStart: boolean;
    sawContentBlock: boolean;
    stopReason: string | null;
}
