// =====================================================
// FILE: src/app/api/judge/route.ts
// PROJECT: pitch-game
// TASK: T7 — LINE หาพี่เก่ง (DIME x KTC)
// VERSION: T7-v3
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-08-04
// PURPOSE: POST /api/judge — รับ submissionId → ยิง 3 personas parallel → UPDATE scores
//   - Streaming model: ถูกเรียกทันทีหลัง player submit (fire-and-forget)
//   - Idempotent: ถ้า submission.judging_status='done' แล้ว → skip
//   - Resilient: 2/3 personas สำเร็จ → ยังถือว่า done
//   - Failure: 0/3 → mark failed (admin Confirm Reveal handle ต่อ)
//
// Body: { submissionId: string }
// Response: { ok: true, status: 'done' | 'failed', personas_succeeded: number }
//
// CHANGE LOG:
//   T7-v3 (2026-08-04): ส่ง allowReply ให้ callJudge — เปิดช่อง reply เฉพาะพี่เก่ง
//                       (แก้อาการกรรมการอีก 2 คน fail 100% ดู anthropic.ts T7-v4)
//   T7-v2 (2026-08-04): กรรมการคนที่ 2 = "พี่เก่ง" (คอมเมนต์ + fallback text)
//                       ตรรกะคะแนน/การเก็บ reply ไม่เปลี่ยน
//   T7-v1 (2026-08-04): จุดแปลงหน่วยคะแนน 0-100 → 0.0-10.0 อยู่ที่ไฟล์นี้ที่เดียว
//                        - toScore10(): หาร 10 ก่อนเก็บลง jsonb
//                          ทำให้ทุกหน้าจอที่แสดง `/10` + toFixed(1) ใช้ได้เหมือนเดิม
//                        - calcFinalScore: ทศนิยม 1 → 2 ตำแหน่ง (ใช้ตัดสินอันดับ)
//                        - เก็บ scores.creative.reply (ข้อความพี่เก่งตอบกลับ)
//                          + FALLBACK_REPLY ถ้าพี่เก่งไม่ส่ง reply มา
//                        - FALLBACK_COMMENTS เปลี่ยนชื่อกรรมการเป็น T7
//                        - stock → CaseData
//   T5-v2 (2026-05-07): Adapted to Tool Use callJudge signature
//                        - callJudge now returns JudgeResponse directly (no parse step)
//                        - Removed parseJudgeResponse import (no longer exported)
//                        - JudgeResponse imported from anthropic.ts (moved from judge-prompts.ts)
//                        Same 3-persona parallel + 2/3 success threshold logic
//   T3-v1 (2026-05-06): Initial
// =====================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  PERSONA_KEYS,
  SYSTEM_PROMPTS,
  buildUserMessage,
  type PersonaKey,
} from '@/lib/judge-prompts';
import { callJudge, type JudgeResponse } from '@/lib/anthropic';
import type {
  Database,
  SubmissionRow,
  CaseData,
  SubmissionScores,
} from '@/lib/types';

// =====================================================
// Server-side Supabase client (service role)
// =====================================================
// Required env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// =====================================================
// Fallback comments (เมื่อ persona ตัวนึงพังหมด)
// =====================================================
const FALLBACK_COMMENTS: Record<PersonaKey, string> = {
  analyst: 'อาจารย์ติดสอนคลาสถัดไป — รอบนี้กรรมการอีก 2 ท่านตัดสินแทน',
  creative: 'พี่เก่งกำลังยุ่งอยู่ ยังไม่ได้เปิดอ่าน — รอบนี้ฟัง 2 ท่านแทน',
  communicator: 'กรรมการท่านนี้ติดสายอยู่ — อีก 2 ท่านลงคะแนนแทน',
};

// T7 — ใช้เมื่อพี่เก่งตัดสินสำเร็จแต่ไม่ได้ส่ง reply มา (field optional)
// องก์ 1 ของการเฉลยต้องมีข้อความเสมอ ห้ามปล่อยจอว่าง
const FALLBACK_REPLY =
  'พี่อ่านแล้วนะ ขอเก็บไปคิดก่อน เดี๋ยวพี่มาคุยต่อ 🙏';

// =====================================================
// T7 — แปลงสเกลคะแนน 0-100 (จาก AI) → 0.0-10.0 (เก็บลง DB)
// =====================================================
// จุดแปลงหน่วยอยู่ที่นี่ที่เดียว หน้าจอทุกหน้าที่แสดง `/ 10` ไม่ต้องแก้
function toScore10(raw: number): number {
  return Math.round(raw) / 10;
}

// =====================================================
// Run one persona — return null if all retries fail
// =====================================================
async function runPersona(
  persona: PersonaKey,
  userMessage: string
): Promise<JudgeResponse | null> {
  try {
    // T5-v2: callJudge now returns parsed JudgeResponse directly (Tool Use)
    return await callJudge({
      systemPrompt: SYSTEM_PROMPTS[persona],
      userMessage,
      // T7-v4: เปิดช่อง reply เฉพาะพี่เก่ง — กรรมการอีก 2 คนจะไม่เห็นช่องนี้เลย
      allowReply: persona === 'creative',
    });
  } catch (err) {
    console.error(
      `[judge] persona ${persona} failed:`,
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
  // T7: เฉลี่ยจากคะแนนที่แปลงเป็นสเกล 10 แล้ว เก็บ 2 ทศนิยมเพื่อใช้ตัดสินอันดับ
  const sum = valid.reduce((acc, r) => acc + toScore10(r.score), 0);
  return Math.round((sum / valid.length) * 100) / 100;
}

// =====================================================
// POST handler
// =====================================================
export async function POST(request: Request) {
  let body: { submissionId?: string };
  try {
    body = await request.json();
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

  const supabase = getServerSupabase();

  // 1. Fetch submission + game (เพื่อเอา stock data)
  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .maybeSingle();

  if (subError || !submission) {
    return NextResponse.json(
      { ok: false, error: subError?.message ?? 'Submission not found' },
      { status: 404 }
    );
  }

  const sub = submission as SubmissionRow;

  // 2. Idempotency — skip ถ้า done แล้ว (ยกเว้น manual re-judge ที่ admin trigger)
  // เราอนุญาตให้ re-run ถ้า status = 'failed' (admin Re-judge)
  // และ re-run ถ้า status = 'pending' (normal flow)
  // ไม่ re-run ถ้า status = 'in_progress' (กันยิงซ้ำ) หรือ 'done'
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

  // 3. Fetch game stock
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('stock')
    .eq('id', sub.game_id)
    .maybeSingle();

  if (gameError || !game || !game.stock) {
    return NextResponse.json(
      { ok: false, error: 'Game case not configured' },
      { status: 400 }
    );
  }

  const caseData = game.stock as CaseData;

  // 4. Mark in_progress
  const { error: markError } = await supabase
    .from('submissions')
    .update({ judging_status: 'in_progress' })
    .eq('id', submissionId);

  if (markError) {
    console.error('[judge] failed to mark in_progress:', markError.message);
    // ทำต่อก็ได้ — มาที่นี่หมายถึง DB ยังเชื่อมได้แค่ไหน
  }

  // 5. Build user message + run 3 personas in parallel
  const userMessage = buildUserMessage(caseData, sub.pitch);
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

  // 6. Decide final status + scores
  const succeededCount = PERSONA_KEYS.filter((k) => results[k] !== null).length;
  const finalScore = calcFinalScore(results);

  // Build scores object — fill missing personas with fallback comment + 0 score (ไม่นับใน finalScore)
  const scores: SubmissionScores = {
    finalScore,
  };

  for (const key of PERSONA_KEYS) {
    const r = results[key];
    if (r !== null) {
      // T7: แปลง 0-100 → 0.0-10.0 ตรงนี้
      scores[key] = { score: toScore10(r.score), comment: r.comment };
      // T7: เฉพาะ creative (พี่เก่ง) — ข้อความตอบกลับ (องก์ 1 ของการเฉลย)
      if (key === 'creative') {
        scores[key] = {
          ...scores[key],
          reply: r.reply ?? FALLBACK_REPLY,
        };
      }
    } else {
      // Fallback — แสดงให้ user รู้ว่า persona นี้ล่ม
      scores[key] = { score: 0, comment: FALLBACK_COMMENTS[key] };
      if (key === 'creative') {
        scores[key] = { ...scores[key], reply: FALLBACK_REPLY };
      }
    }
  }

  let finalStatus: 'done' | 'failed';

  if (succeededCount === 0) {
    finalStatus = 'failed';
    // ไม่บันทึก scores ตอน failed — ให้ admin Confirm Reveal handle (auto_defaulted)
    const { error: failError } = await supabase
      .from('submissions')
      .update({ judging_status: 'failed' })
      .eq('id', submissionId);

    if (failError) {
      console.error('[judge] failed to mark failed:', failError.message);
    }

    return NextResponse.json({
      ok: true,
      status: 'failed',
      personas_succeeded: 0,
    });
  }

  finalStatus = 'done';

  const { error: doneError } = await supabase
    .from('submissions')
    .update({
      judging_status: 'done',
      scores,
    })
    .eq('id', submissionId);

  if (doneError) {
    console.error('[judge] failed to UPDATE scores:', doneError.message);
    return NextResponse.json(
      { ok: false, error: doneError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    status: finalStatus,
    personas_succeeded: succeededCount,
    final_score: finalScore,
  });
}

// =====================================================
// Allow longer timeout (Vercel default = 10s, judge อาจใช้ 15-25s)
// =====================================================
// On Vercel hobby plan max = 60s. Pro plan = 300s.
// 60s safe สำหรับ Haiku 4.5 + retry 3 ครั้ง + 3 personas parallel
export const maxDuration = 60;
