// lib/message-types.ts
// Shared interface definitions utilized across all execution contexts.

// -- SSE Stream Event Types --

/** Token usage data extracted from the 'message_start' Claude API event */
export interface InputTokenCount {
    event: 'input_count';
    inputTokens: number;
    cacheCreateTokens: number;
    cacheReadTokens: number;
    model: string;
}

/** Output token counts parsed from the 'message_delta' Claude API event */
export interface OutputTokenCount {
    event: 'output_count';
    outputTokens: number;
    stopReason: string | null;
}

/** Individual textual token blocks resolved during streams */
export interface TextChunk {
    event: 'text';
    text: string;
}

/** Native upstream errors injected into the SSE feed by the provider */
export interface StreamError {
    event: 'stream_error';
    error: unknown;
}

/** Aggregate type for all valid token batch events */
export type TokenEvent = InputTokenCount | OutputTokenCount | TextChunk | StreamError;

// -- Health State Synchronization --

/** Tracks SSE stream lifecycle phases to evaluate connection health */
export interface HealthState {
    chunksProcessed: number;
    sawMessageStart: boolean;
    sawContentBlock: boolean;
    stopReason: string | null;
}
