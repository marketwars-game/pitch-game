// =====================================================
// FILE: src/lib/ranking.ts
// PROJECT: pitch-game
// TASK: T7 — LINE หาพี่เก่ง (DIME x KTC)
// VERSION: T7-v2
// CREATED: 2026-08-04
// LAST MODIFIED: 2026-08-04
// PURPOSE: ตรรกะเรียงอันดับกลาง — ใช้ร่วมกันทั้งมือถือ / จอใหญ่ / admin
//          ก่อน T7 แต่ละหน้าจอ sort เองด้วย finalScore ล้วน ทำให้คะแนนเท่ากัน
//          แล้วอันดับสลับกันคนละหน้าจอ + ที่ 1 ตันหลายคนตอนผู้เล่นเยอะ
//
// กติกาตัดสินเสมอ (เรียงตามลำดับ):
//   1. finalScore สูงกว่า
//   2. คะแนนจากพี่เก่ง (creative) สูงกว่า — เกมนี้ตัดสินที่ "พี่เก่งกล้าเริ่มไหม"
//   3. คะแนน The Professor (analyst) สูงกว่า
//   4. ส่งก่อน (timestamp น้อยกว่า)
//
// CHANGE LOG:
//   T7-v2 (2026-08-04): คอมเมนต์ — กรรมการคนที่ 2 คือ "พี่เก่ง" (ตรรกะไม่เปลี่ยน)
//   T7-v1 (2026-08-04): Initial
// =====================================================

import type { SubmissionScores } from './types';

// =====================================================
// Types
// =====================================================
export type RankEntry = {
  scores: SubmissionScores | null | undefined;
  /** ISO timestamp ที่ใช้ตัดสินเสมอชั้นสุดท้าย (submitted_at / created_at) */
  submittedAt?: string | null;
};

// =====================================================
// Score accessors
// =====================================================
/**
 * finalScore ที่ใช้เรียงอันดับ — คืน null ถ้ายังไม่มีคะแนน
 * (ยังไม่ตัดสิน / judging ล้มเหลว)
 */
export function getFinalScore(
  scores: SubmissionScores | null | undefined
): number | null {
  const v = scores?.finalScore;
  return typeof v === 'number' && isFinite(v) ? v : null;
}

/**
 * คำนวณ finalScore จากคะแนนกรรมการที่มี — ใช้เป็น fallback
 * ตอน row เก่าไม่มี finalScore เก็บไว้
 * T7: ทศนิยม 2 ตำแหน่ง (เดิม 1)
 */
export function computeFinalScore(
  scores: SubmissionScores | null | undefined
): number | null {
  if (!scores) return null;
  const arr = [
    scores.analyst?.score,
    scores.creative?.score,
    scores.communicator?.score,
  ].filter((n): n is number => typeof n === 'number' && isFinite(n) && n > 0);

  if (arr.length === 0) return null;
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.round(avg * 100) / 100;
}

/** finalScore ที่เก็บไว้ ถ้าไม่มีให้คำนวณจากคะแนนกรรมการ */
export function resolveFinalScore(
  scores: SubmissionScores | null | undefined
): number | null {
  return getFinalScore(scores) ?? computeFinalScore(scores);
}

// =====================================================
// Comparator
// =====================================================
function tieValue(
  scores: SubmissionScores | null | undefined,
  key: 'creative' | 'analyst'
): number {
  const v = scores?.[key]?.score;
  return typeof v === 'number' && isFinite(v) ? v : -1;
}

function timeValue(iso: string | null | undefined): number {
  if (!iso) return Number.MAX_SAFE_INTEGER;
  const t = Date.parse(iso);
  return isFinite(t) ? t : Number.MAX_SAFE_INTEGER;
}

/**
 * เปรียบเทียบ 2 รายการ — ใช้กับ Array.sort() โดยตรง
 * ผลลัพธ์เรียงจากอันดับดีสุดไปแย่สุด
 * รายการที่ยังไม่มีคะแนนไปอยู่ท้ายเสมอ
 */
export function compareRank(a: RankEntry, b: RankEntry): number {
  const sa = resolveFinalScore(a.scores);
  const sb = resolveFinalScore(b.scores);

  // ยังไม่มีคะแนน → ไปท้าย
  if (sa === null && sb === null) return 0;
  if (sa === null) return 1;
  if (sb === null) return -1;

  if (sb !== sa) return sb - sa;

  // 2. คะแนนจากพี่เก่ง (creative)
  const ca = tieValue(a.scores, 'creative');
  const cb = tieValue(b.scores, 'creative');
  if (cb !== ca) return cb - ca;

  // 3. The Professor (analyst)
  const pa = tieValue(a.scores, 'analyst');
  const pb = tieValue(b.scores, 'analyst');
  if (pb !== pa) return pb - pa;

  // 4. ส่งก่อนได้เปรียบ
  return timeValue(a.submittedAt) - timeValue(b.submittedAt);
}

/**
 * สร้าง comparator สำหรับ collection ที่มีรูปร่างต่างกัน
 * เช่น PlayerStatusEnriched ที่ scores ซ่อนอยู่ใน .submission
 */
export function makeRankComparator<T>(
  select: (item: T) => RankEntry
): (a: T, b: T) => number {
  return (a, b) => compareRank(select(a), select(b));
}

/** เรียงสำเนาใหม่ (ไม่แก้ array เดิม) */
export function sortByRank<T>(
  items: readonly T[],
  select: (item: T) => RankEntry
): T[] {
  return [...items].sort(makeRankComparator(select));
}

/**
 * นับว่ามีกี่รายการที่อันดับดีกว่ารายการนี้ → อันดับของเรา = count + 1
 * ใช้ในหน้าผลของผู้เล่น (ไม่ต้อง sort ทั้ง array)
 */
export function computeRankOf(me: RankEntry, all: readonly RankEntry[]): number {
  let better = 0;
  for (const other of all) {
    if (compareRank(other, me) < 0) better++;
  }
  return better + 1;
}

// =====================================================
// Display helpers
// =====================================================
/**
 * T7 (เคาะแล้ว):
 *   - จอที่เอาคะแนนมาเทียบกัน (podium จอใหญ่ / runners / admin Top 3) = 2 ทศนิยม
 *   - คะแนนส่วนตัวบนมือถือ = 1 ทศนิยม
 */
export function formatScoreCompare(value: number | null | undefined): string {
  return typeof value === 'number' && isFinite(value) ? value.toFixed(2) : '—';
}

export function formatScorePersonal(value: number | null | undefined): string {
  return typeof value === 'number' && isFinite(value) ? value.toFixed(1) : '—';
}
