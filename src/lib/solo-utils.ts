// =====================================================
// FILE: src/lib/solo-utils.ts
// PROJECT: pitch-game
// TASK: T6 — Solo Mode
// VERSION: T6-v1
// CREATED: 2026-05-09
// PURPOSE: Pure utility functions for solo mode (relative time formatting,
//          score formatting, FB share URL building, final score computation).
//          No DB, no React, no side effects — fully unit-testable.
//
// CHANGE LOG:
//   T6-v1 (2026-05-09): Initial
// =====================================================

/**
 * Format a Date or ISO string as a Thai-friendly relative time.
 * Examples:
 *   "เมื่อกี้"
 *   "5 นาทีที่แล้ว"
 *   "2 ชั่วโมงที่แล้ว"
 *   "เมื่อวาน"
 *   "3 วันที่แล้ว"
 *   "2 สัปดาห์ที่แล้ว"
 *   "30+ วันที่แล้ว" (older than 30 days)
 */
export function formatRelativeTime(input: Date | string): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const now = Date.now();
  const diffMs = now - date.getTime();

  // Defensive: future timestamps (clock skew) → treat as just now
  if (diffMs < 0) return 'เมื่อกี้';

  const SEC = 1000;
  const MIN = 60 * SEC;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;

  if (diffMs < 30 * SEC) return 'เมื่อกี้';
  if (diffMs < MIN) return `${Math.floor(diffMs / SEC)} วินาทีที่แล้ว`;
  if (diffMs < HOUR) return `${Math.floor(diffMs / MIN)} นาทีที่แล้ว`;
  if (diffMs < DAY) return `${Math.floor(diffMs / HOUR)} ชั่วโมงที่แล้ว`;
  if (diffMs < 2 * DAY) return 'เมื่อวาน';
  if (diffMs < WEEK) return `${Math.floor(diffMs / DAY)} วันที่แล้ว`;
  if (diffMs < 30 * DAY) return `${Math.floor(diffMs / WEEK)} สัปดาห์ที่แล้ว`;
  return '30+ วันที่แล้ว';
}

/**
 * Format final score (number 0-10) as "X.X" with 1 decimal.
 * Returns "—" if score is null/undefined/NaN.
 */
export function formatScore(score: number | null | undefined): string {
  if (score == null || isNaN(score)) return '—';
  return score.toFixed(1);
}

/**
 * Compute average finalScore from 3 persona scores.
 * Returns rounded to 1 decimal. If all 3 missing → null.
 */
export function computeFinalScore(scores: {
  analyst?: { score: number };
  creative?: { score: number };
  communicator?: { score: number };
}): number | null {
  const values: number[] = [];
  if (scores.analyst?.score != null) values.push(scores.analyst.score);
  if (scores.creative?.score != null) values.push(scores.creative.score);
  if (scores.communicator?.score != null) values.push(scores.communicator.score);

  if (values.length === 0) return null;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(avg * 10) / 10;
}

/**
 * Build Facebook Sharer URL.
 * Note: Facebook's `quote` parameter is no longer respected for unowned URLs;
 * the share will use Open Graph tags from the target URL. We still pass `quote`
 * for older clients and as a fallback hint.
 */
export function buildFacebookShareUrl(score: number): string {
  const url = 'https://pitch-game-two.vercel.app/try';
  const text = `ผมได้ ${formatScore(score)}/10 จาก AI Stock Pitch Battle ลองเล่นกันสิ! 🎯`;
  const params = new URLSearchParams({
    u: url,
    quote: text,
  });
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}
