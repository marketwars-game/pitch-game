// =====================================================
// FILE: src/app/api/judge-solo/route.ts
// PROJECT: pitch-game
// TASK: T6 — Solo Mode
// VERSION: T6-v3
// CREATED: 2026-05-09
// PURPOSE: POST /api/judge-solo — รับ submissionId → ยิง 3 personas parallel
//          → UPDATE solo_submissions row scores
//          - Streaming model: ถูกเรียกทันทีหลัง /try submit (fire-and-forget)
//          - Idempotent: ถ้า judging_status='done' → skip
//          - Resilient: 1+/3 personas สำเร็จ → still mark done with fallback
//          - Failure: 0/3 → mark failed
//
// Mirrors /api/judge T5-v2 exactly — same Tool Use callJudge pattern,
// same fallback comments, same finalScore averaging.
//
// CHANGE LOG:
//   T6-v3 (2026-05-09): Refactor to mirror real /api/judge T5-v2:
//                       - callJudge returns JudgeResponse (Tool Use, no parse step)
//                       - runPersona catches errors, returns null on fail
//                       - PERSONA_KEYS loop for clarity
//                       - FALLBACK_COMMENTS for failed personas (with score 0)
//   T6-v2 (2026-05-09): Wrong — used non-existent parseJudgeResponse
//   T6-v1 (2026-05-09): Wrong — JUDGE_PROMPTS / 3-arg callJudge (legacy guess)
// =====================================================

import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import {
  PERSONA_KEYS,
  SYSTEM_PROMPTS,
  buildUserMessage,
  type PersonaKey,
} from '@/lib/judge-prompts';
import { callJudge, type JudgeResponse } from '@/lib/anthropic';
import { STOCK_PRESETS } from '@/lib/stock-data';
import type { SubmissionScores } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RequestBody = {
  submissionId?: string;
};

// =====================================================
// Fallback comments (when a persona's API calls all fail)
// Same wording as /api/judge T5-v2 for consistency.
// =====================================================
const FALLBACK_COMMENTS: Record<PersonaKey, string> = {
  analyst: 'พี่ Analyst ขออนุญาตเข้าห้องน้ำสักครู่ — กรรมการอีก 2 ท่านตัดสินแทน',
  creative: 'พี่ Creative ติดวาดรูปอยู่ครับ — รอบนี้ฟัง 2 ท่านแทน',
  communicator: 'พี่ Communicator ติดสาย call สำคัญ — กรรมการอีก 2 ท่านลงคะแนนแทน',
};

// =====================================================
// Run one persona — return null if all retries fail
// =====================================================
async function runPersona(
  persona: PersonaKey,
  userMessage: string
): Promise<JudgeResponse | null> {
  try {
    return await callJudge({
      systemPrompt: SYSTEM_PROMPTS[persona],
      userMessage,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[judge-solo] persona ${persona} failed:`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

// =====================================================
// Calculate finalScore = avg of successful personas
// =====================================================
function calcFinalScore(
  results: Record<PersonaKey, JudgeResponse | null>
): number {
  const valid = PERSONA_KEYS.map((k) => results[k]).filter(
    (r): r is JudgeResponse => r !== null
  );
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, r) => acc + r.score, 0);
  return Math.round((sum / valid.length) * 10) / 10;
}

// =====================================================
// POST handler
// =====================================================
export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const submissionId = body.submissionId;
  if (!submissionId || typeof submissionId !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'Missing submissionId' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  // 1. Fetch solo submission
  const { data: sub, error: readErr } = await supabase
    .from('solo_submissions')
    .select('id, pitch, stock_ticker, judging_status')
    .eq('id', submissionId)
    .maybeSingle();

  if (readErr || !sub) {
    return NextResponse.json(
      { ok: false, error: readErr?.message ?? 'Submission not found' },
      { status: 404 }
    );
  }

  // 2. Idempotency
  if (sub.judging_status === 'done') {
    return NextResponse.json({
      ok: true,
      status: 'done',
      skipped: true,
      reason: 'already done',
    });
  }
  if (sub.judging_status === 'in_progress') {
    return NextResponse.json({
      ok: true,
      status: 'in_progress',
      skipped: true,
      reason: 'already in progress',
    });
  }

  // 3. Resolve stock context (PLTR locked for solo mode)
  const stockTicker = sub.stock_ticker || 'PLTR';
  const stock = STOCK_PRESETS[stockTicker] ?? STOCK_PRESETS.PLTR;
  if (!stock) {
    return NextResponse.json(
      { ok: false, error: 'Stock preset not found' },
      { status: 500 }
    );
  }

  // 4. Mark in_progress
  const { error: markError } = await supabase
    .from('solo_submissions')
    .update({ judging_status: 'in_progress' })
    .eq('id', submissionId);

  if (markError) {
    // eslint-disable-next-line no-console
    console.error('[judge-solo] failed to mark in_progress:', markError.message);
    // continue anyway
  }

  // 5. Build user message + run 3 personas in parallel
  const pitchText = sub.pitch || '(ผู้เล่นไม่ได้เขียน pitch)';
  const userMessage = buildUserMessage(stock, pitchText);

  const [analystResult, creativeResult, communicatorResult] = await Promise.all([
    runPersona('analyst', userMessage),
    runPersona('creative', userMessage),
    runPersona('communicator', userMessage),
  ]);

  const results: Record<PersonaKey, JudgeResponse | null> = {
    analyst: analystResult,
    creative: creativeResult,
    communicator: communicatorResult,
  };

  // 6. Decide final status
  const succeededCount = PERSONA_KEYS.filter((k) => results[k] !== null).length;
  const finalScore = calcFinalScore(results);

  // Build scores object — fill missing personas with fallback comment + 0 score
  const scores: SubmissionScores = {
    finalScore,
  };
  for (const key of PERSONA_KEYS) {
    const r = results[key];
    if (r !== null) {
      scores[key] = { score: r.score, comment: r.comment };
    } else {
      scores[key] = { score: 0, comment: FALLBACK_COMMENTS[key] };
    }
  }

  if (succeededCount === 0) {
    // All 3 personas failed — mark failed without scores
    const { error: failError } = await supabase
      .from('solo_submissions')
      .update({ judging_status: 'failed' })
      .eq('id', submissionId);

    if (failError) {
      // eslint-disable-next-line no-console
      console.error('[judge-solo] failed to mark failed:', failError.message);
    }

    return NextResponse.json({
      ok: true,
      status: 'failed',
      personas_succeeded: 0,
    });
  }

  // 7. Persist done with scores
  const { error: doneError } = await supabase
    .from('solo_submissions')
    .update({
      judging_status: 'done',
      scores,
    })
    .eq('id', submissionId);

  if (doneError) {
    // eslint-disable-next-line no-console
    console.error('[judge-solo] failed to UPDATE scores:', doneError.message);
    return NextResponse.json(
      { ok: false, error: doneError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    status: 'done',
    personas_succeeded: succeededCount,
    final_score: finalScore,
  });
}
