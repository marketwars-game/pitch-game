// =====================================================
// FILE: src/lib/anthropic.ts
// PROJECT: pitch-game
// TASK: T8 — LINE หาพี่มั่น (DIME x SCG)
// VERSION: T8-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-08-20
// PURPOSE: Anthropic SDK client + retry helper + Tool Use forced JSON
//   - Singleton client (reuse across requests)
//   - Retry with exponential backoff + jitter for 429/529
//   - Honor retry-after header เมื่อมี
//   - ✨ T5-v2: Tool Use forced (tool_choice='tool') — guarantee JSON shape
//
// CHANGE LOG:
//   T8-v1 (2026-08-20): tool description + comments เวอร์ชันพี่มั่น (ไม่แตะ logic/retry/model)
//   T7-v4 (2026-08-04): 🔴 FIX — กรรมการ 2 ใน 3 fail ทุกครั้ง
//                        อาการ: Haiku เอาคอมเมนต์ไปใส่ช่อง `reply` แล้วไม่ส่ง `comment`
//                        → validation ตีว่า missing required fields → persona fail
//                        สาเหตุ: schema เดียวใช้ร่วมทุก persona แล้วโชว์ช่อง reply
//                        ให้กรรมการที่ไม่ต้องใช้เห็นด้วย คำกำกับ "เฉพาะพี่เก่ง"
//                        ในคำอธิบายไม่พอที่จะกันโมเดลเลือกช่องผิด
//                        แก้ 2 ชั้น:
//                          1) แยก tool เป็น 2 ตัว — ตัวที่ไม่มีช่อง reply เลย
//                             ใช้กับ analyst/communicator (โมเดลเลือกผิดไม่ได้)
//                          2) fallback: ถ้า comment หายแต่มี reply ให้ใช้ reply แทน
//                             กันไม่ให้ persona fail ซ้ำรอยเดิมในทุกกรณี
//   T7-v3 (2026-08-04): คำอธิบาย field reply/comment ย้ำว่าทำหน้าที่ต่างกัน
//                       reply = แชทล้วน ห้ามพูดถึงคะแนน (ตรรกะไม่เปลี่ยน)
//   T7-v2 (2026-08-04): เปลี่ยนคำอธิบาย field reply — กรรมการคนที่ 2 คือ "พี่เก่ง"
//                       ไม่ใช่ "The Skeptic" (ตรรกะไม่เปลี่ยน)
//   T7-v1 (2026-08-04): สเกลคะแนน 1-10 → 0-100 (แก้ปัญหาคะแนนตันเท่ากันตอนคนเยอะ)
//                        - SUBMIT_JUDGMENT_TOOL: score integer 0-100
//                        - เพิ่ม field `reply` (optional) — ข้อความพี่เก่งตอบกลับ
//                          ใช้เฉพาะ persona creative (พี่เก่ง)
//                        - clampScore: 1-10 → 0-100
//                        - JudgeResponse เพิ่ม reply?: string
//                        หมายเหตุ: /api/judge เป็นผู้หาร 10 ก่อนเก็บลง DB
//                        ค่าที่ไหลออกจากไฟล์นี้ยังเป็นสเกล 0-100
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
const SCORE_PROP = {
  type: 'integer' as const,
  minimum: 0,
  maximum: 100,
  description:
    'คะแนน 0-100 ตามเกณฑ์และช่วงคะแนนของคาแรกเตอร์กรรมการ ' +
    'ห้ามลงท้ายด้วย 0 หรือ 5 — ให้เลขที่เจาะจง เช่น 83, 78, 91, 64',
};

const COMMENT_PROP = {
  type: 'string' as const,
  description:
    'คอมเมนต์ภาษาไทย 1-2 ประโยค ตามคาแรกเตอร์ที่กำหนด ห้ามเกิน 2 ประโยค ' +
    'ช่องนี้บังคับ ต้องส่งเสมอ',
};

/** ใช้กับ analyst / communicator — ไม่มีช่อง reply ให้เลือกผิด */
const SUBMIT_JUDGMENT_TOOL: Anthropic.Tool = {
  name: 'submit_judgment',
  description:
    'ส่งคะแนนและคอมเมนต์การตัดสินของกรรมการ — ต้องเรียก tool นี้เท่านั้น ห้ามตอบเป็นข้อความปกติ',
  input_schema: {
    type: 'object',
    properties: {
      score: SCORE_PROP,
      comment: COMMENT_PROP,
    },
    required: ['score', 'comment'],
  },
};

/** ใช้กับ persona พี่มั่น (creative) เท่านั้น — มีช่อง reply เพิ่ม */
const SUBMIT_JUDGMENT_TOOL_WITH_REPLY: Anthropic.Tool = {
  name: 'submit_judgment',
  description:
    'ส่งคะแนน คอมเมนต์ และข้อความที่พี่มั่นพิมพ์ตอบกลับ — ต้องเรียก tool นี้เท่านั้น',
  input_schema: {
    type: 'object',
    properties: {
      score: SCORE_PROP,
      comment: {
        type: 'string' as const,
        description:
          'เหตุผลของคะแนน 1-2 ประโยค — คนละเรื่องกับ reply ห้ามเขียนซ้ำกัน ช่องนี้บังคับ',
      },
      reply: {
        type: 'string' as const,
        description:
          'ข้อความที่พี่มั่นพิมพ์ตอบกลับในไลน์ 1-2 ประโยค ภาษาพูดล้วน ' +
          'ห้ามพูดถึงคะแนนหรือการตัดสินในช่องนี้',
      },
    },
    required: ['score', 'comment', 'reply'],
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
  score: number;      // T7: สเกล 0-100 (ยังไม่หาร 10 — /api/judge เป็นคนหาร)
  comment: string;
  reply?: string;     // T8: ข้อความพี่มั่นตอบกลับ (เฉพาะ persona creative)
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
  // T7: Clamp 0-100 + round (defensive — schema enforces but belt + suspenders)
  return Math.max(0, Math.min(100, Math.round(n)));
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
  /** true เฉพาะ persona พี่มั่น (creative) — เปิดช่อง reply ใน tool schema */
  allowReply?: boolean;
}): Promise<JudgeResponse> {
  const tool = params.allowReply
    ? SUBMIT_JUDGMENT_TOOL_WITH_REPLY
    : SUBMIT_JUDGMENT_TOOL;
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
        tools: [tool],
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

      if (!input || typeof input !== 'object' || !('score' in input)) {
        throw new Error(
          `Tool input missing score: ${JSON.stringify(input).slice(0, 300)}`
        );
      }

      // T7-v4: กันเคสโมเดลเอาคอมเมนต์ไปใส่ช่อง reply แล้วไม่ส่ง comment
      // (เคยทำให้ analyst/communicator fail 100% ตอนใช้ schema ร่วมกัน)
      if (!('comment' in input) && typeof input.reply === 'string') {
        console.warn(
          '[anthropic] comment missing — ใช้ค่าจาก reply แทน (schema fallback)'
        );
        input.comment = input.reply;
        if (!params.allowReply) delete input.reply;
      }

      if (!('comment' in input)) {
        throw new Error(
          `Tool input missing comment: ${JSON.stringify(input).slice(0, 300)}`
        );
      }

      // T8: reply เป็น optional — มีเฉพาะ persona creative (พี่มั่น)
      const rawReply = input.reply;
      const reply =
        typeof rawReply === 'string' && rawReply.trim().length > 0
          ? rawReply.trim()
          : undefined;

      return {
        score: clampScore(input.score),
        comment: sanitizeComment(input.comment),
        ...(reply ? { reply } : {}),
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
