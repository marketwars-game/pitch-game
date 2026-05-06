// =====================================================
// FILE: src/lib/anthropic.ts
// PROJECT: pitch-game
// TASK: T3 — AI Judge API
// VERSION: T3-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Anthropic SDK client + retry helper
//          - Singleton client (reuse across requests)
//          - Retry with exponential backoff + jitter for 429/529
//          - Honor retry-after header เมื่อมี
//
// CHANGE LOG:
//   T3-v1 (2026-05-06): Initial — locked Haiku 4.5
// =====================================================

import Anthropic from '@anthropic-ai/sdk';

// =====================================================
// Constants
// =====================================================

export const JUDGE_MODEL = 'claude-haiku-4-5-20251001';

export const JUDGE_MAX_TOKENS = 200;
export const JUDGE_TEMPERATURE = 0.7;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_JITTER_MS = 1000;

// =====================================================
// Singleton client
// =====================================================

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (client) return client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  client = new Anthropic({ apiKey });
  return client;
}

// =====================================================
// Sleep helper
// =====================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =====================================================
// Retry classification
// =====================================================

type ErrorWithStatus = { status?: number; statusCode?: number; headers?: Record<string, string> };

function getErrorStatus(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null) return undefined;
  const e = err as ErrorWithStatus;
  return e.status ?? e.statusCode;
}

function getRetryAfterMs(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null) return undefined;
  const e = err as ErrorWithStatus;
  const headers = e.headers;
  if (!headers) return undefined;
  const retryAfter = headers['retry-after'] ?? headers['Retry-After'];
  if (!retryAfter) return undefined;
  const seconds = Number(retryAfter);
  return isFinite(seconds) ? seconds * 1000 : undefined;
}

function isRetryable(err: unknown): boolean {
  const status = getErrorStatus(err);
  // 429 = rate limit, 529 = overloaded, 500/502/503/504 = transient server
  return status === 429 || status === 529 ||
         status === 500 || status === 502 || status === 503 || status === 504;
}

// =====================================================
// Backoff calculator
// =====================================================

function calcDelayMs(attempt: number, retryAfter?: number): number {
  if (retryAfter !== undefined) return retryAfter;
  // Exponential: 1s, 2s, 4s + jitter
  const exp = BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * MAX_JITTER_MS;
  return exp + jitter;
}

// =====================================================
// Call Anthropic with retry
// =====================================================

/**
 * Call Anthropic Messages API + retry on 429/529/5xx
 * - max 3 retries (4 total attempts)
 * - exponential backoff with jitter
 * - honor retry-after header when present
 *
 * Returns the raw text response from the model
 * Throws if all retries exhausted or non-retryable error
 */
export async function callJudge(params: {
  systemPrompt: string;
  userMessage: string;
}): Promise<string> {
  const anthropic = getAnthropicClient();

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: JUDGE_MODEL,
        max_tokens: JUDGE_MAX_TOKENS,
        temperature: JUDGE_TEMPERATURE,
        system: params.systemPrompt,
        messages: [{ role: 'user', content: params.userMessage }],
      });

      // Extract text from content blocks (filter narrows to TextBlock automatically)
      const texts: string[] = [];
      for (const block of response.content) {
        if (block.type === 'text') {
          texts.push(block.text);
        }
      }

      if (texts.length === 0) {
        throw new Error('No text block in response');
      }

      return texts.join('\n');
    } catch (err) {
      lastError = err;

      if (!isRetryable(err) || attempt === MAX_RETRIES) {
        throw err;
      }

      const retryAfter = getRetryAfterMs(err);
      const delayMs = calcDelayMs(attempt, retryAfter);
      await sleep(delayMs);
    }
  }

  throw lastError ?? new Error('Unknown error in callJudge');
}
