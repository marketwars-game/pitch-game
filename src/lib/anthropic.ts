// =====================================================
// FILE: src/lib/anthropic.ts
// PROJECT: pitch-game
// TASK: T5 — Judge Fix (Tool Use)
// VERSION: T5-v2
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-07
// PURPOSE: Anthropic SDK client + retry helper + Tool Use forced JSON
//   - Singleton client (reuse across requests)
//   - Retry with exponential backoff + jitter for 429/529
//   - Honor retry-after header เมื่อมี
//   - ✨ T5-v2: Tool Use forced (tool_choice='tool') — guarantee JSON shape
//
// CHANGE LOG:
//   T5-v2 (2026-05-07): Migrate to Tool Use to fix "No JSON object found" failures
//                        - Add SUBMIT_JUDGMENT_TOOL schema (score 1-10 + comment)
//                        - tool_choice: {type:'tool', name:'submit_judgment'} (forced)
//                        - max_tokens: 200 → 2048 (Thai tokens use ~3-4x more)
//                        - callJudge now returns parsed JudgeResponse directly
//                        - Log stop_reason warnings + raw response on failures
//                        Root cause from production logs: Haiku returned text without
//                        JSON structure or got truncated at max_tokens=200 mid-JSON.
//                        Tool Use uses constrained generation → 0 parse failures.
//   T3-v1 (2026-05-06): Initial — locked Haiku 4.5
// =====================================================

import Anthropic from '@anthropic-ai/sdk';

// =====================================================
// Constants
// =====================================================
export const JUDGE_MODEL = 'claude-haiku-4-5-20251001';

// T5-v2: Bumped 200 → 2048 — Thai tokens consume ~3-4x more than English
// Tool input includes JSON schema overhead + comment text
// 2048 = safety buffer for "comment ภาษาไทย 1-2 ประโยค + score" with margin
export const JUDGE_MAX_TOKENS = 2048;

export const JUDGE_TEMPERATURE = 0.7;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_JITTER_MS = 1000;

// =====================================================
// Tool Schema — submit_judgment
// =====================================================
// Anthropic's recommended pattern for guaranteed structured output:
// Force model to call this tool → input must match schema → 0 parse failures
// Reference: https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/implement-tool-use
const SUBMIT_JUDGMENT_TOOL: Anthropic.Tool = {
  name: 'submit_judgment',
  description:
    'ส่งคะแนนและคอมเมนต์การตัดสินของกรรมการ — ต้องเรียก tool นี้เท่านั้น ห้ามตอบเป็นข้อความปกติ',
  input_schema: {
    type: 'object',
    properties: {
      score: {
        type: 'integer',
        minimum: 1,
        maximum: 10,
        description: 'คะแนน 1-10 ตามเกณฑ์ของคาแรกเตอร์กรรมการ',
      },
      comment: {
        type: 'string',
        description:
          'คอมเมนต์ภาษาไทย 1-2 ประโยค ตามคาแรกเตอร์ที่กำหนด ห้ามเกิน 2 ประโยค',
      },
    },
    required: ['score', 'comment'],
  },
};

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
type ErrorWithStatus = {
  status?: number;
  statusCode?: number;
  headers?: Record<string, string>;
};

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
  return (
    status === 429 ||
    status === 529 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
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
// JudgeResponse type (parsed)
// =====================================================
export type JudgeResponse = {
  score: number;
  comment: string;
};

// =====================================================
// Validation helpers
// =====================================================
function clampScore(value: unknown): number {
  let n: number;
  if (typeof value === 'number') {
    n = value;
  } else if (typeof value === 'string' && !isNaN(Number(value))) {
    n = Number(value);
  } else {
    throw new Error(`Score is not a number: ${JSON.stringify(value)}`);
  }
  // Clamp 1-10 + round (defensive — schema enforces but belt + suspenders)
  return Math.max(1, Math.min(10, Math.round(n)));
}

function sanitizeComment(value: unknown): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return '(no comment)';
}

// =====================================================
// Call Anthropic with Tool Use + retry
// =====================================================
/**
 * Call Anthropic Messages API with forced tool_use + retry on 429/529/5xx
 * - max 3 retries (4 total attempts)
 * - exponential backoff with jitter
 * - honor retry-after header when present
 * - Forces submit_judgment tool → returns parsed {score, comment}
 *
 * Throws if all retries exhausted, non-retryable error, or schema mismatch
 */
export async function callJudge(params: {
  systemPrompt: string;
  userMessage: string;
}): Promise<JudgeResponse> {
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
        tools: [SUBMIT_JUDGMENT_TOOL],
        tool_choice: { type: 'tool', name: 'submit_judgment' },
      });

      // Defensive: warn if hit max_tokens (model truncated)
      if (response.stop_reason === 'max_tokens') {
        console.warn(
          '[anthropic] stop_reason=max_tokens — increase JUDGE_MAX_TOKENS if seen often'
        );
      }

      // Find the tool_use block (forced tool_choice guarantees it exists)
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      if (!toolUseBlock) {
        // Should never happen with tool_choice forced — log raw for debug
        console.error(
          '[anthropic] no tool_use block found. content:',
          JSON.stringify(response.content).slice(0, 500)
        );
        throw new Error('No tool_use block in response (forced tool_choice failed)');
      }

      if (toolUseBlock.name !== 'submit_judgment') {
        throw new Error(
          `Unexpected tool name: ${toolUseBlock.name} (expected submit_judgment)`
        );
      }

      // SDK pre-parses tool input as JSON object
      const input = toolUseBlock.input as Record<string, unknown>;

      if (
        !input ||
        typeof input !== 'object' ||
        !('score' in input) ||
        !('comment' in input)
      ) {
        throw new Error(
          `Tool input missing required fields: ${JSON.stringify(input).slice(0, 300)}`
        );
      }

      return {
        score: clampScore(input.score),
        comment: sanitizeComment(input.comment),
      };
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
