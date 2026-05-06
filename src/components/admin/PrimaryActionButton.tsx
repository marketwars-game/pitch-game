// =====================================================
// FILE: src/components/admin/PrimaryActionButton.tsx
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Smart Primary Action button — label + behavior changes per phase
//          - LOBBY: "เริ่มเกม" (disabled if no stock)
//          - WRITING: "ปิดรับ + ไป JUDGING"
//          - JUDGING: "โชว์ Leaderboard" (always enabled, +badge if unresolved)
//          - RESULTS: "เริ่มรอบใหม่"
//
// CHANGE LOG:
//   T2-v1 (2026-05-06): Initial
// =====================================================
'use client';

import type { GamePhase } from '@/lib/types';

export interface PrimaryActionButtonProps {
  phase: GamePhase;
  unresolvedCount: number;
  busy: boolean;
  canStart: boolean; // for LOBBY: needs stock applied
  onClick: () => void | Promise<void>;
}

const PHASE_LABEL: Record<GamePhase, string> = {
  LOBBY: '▶ เริ่มเกม → เปิดให้เขียน Pitch',
  WRITING: '⏹ ปิดรับ + ไป JUDGING',
  JUDGING: '🏆 โชว์ Leaderboard → RESULTS',
  RESULTS: '🔄 เริ่มรอบใหม่ → Round ถัดไป',
};

const PHASE_HINT: Record<GamePhase, string> = {
  LOBBY: 'ตั้งเวลา 4:00 อัตโนมัติ — set writing_ends_at',
  WRITING: 'ปิดเวลาทันที — auto-submit pitch ที่ยังพิมพ์ค้าง',
  JUDGING: 'กดได้ตลอด — ถ้ามี failed/scoring จะมี confirm dialog',
  RESULTS: 'round_number + 1 → กลับ LOBBY · data รอบเก่ายังเก็บไว้',
};

export function PrimaryActionButton({
  phase,
  unresolvedCount,
  busy,
  canStart,
  onClick,
}: PrimaryActionButtonProps) {
  // Disabled rules
  const disabled =
    busy ||
    (phase === 'LOBBY' && !canStart);

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '16px 20px',
          borderRadius: 10,
          border: 'none',
          fontSize: 15,
          fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          minHeight: 52,
          marginTop: 6,
          background: disabled ? '#2a2a2c' : '#5DF591',
          color: disabled ? '#52525B' : '#062b13',
          transition: 'all 0.15s',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {busy ? 'กำลังประมวลผล...' : PHASE_LABEL[phase]}
        {phase === 'JUDGING' && unresolvedCount > 0 && !busy && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              marginLeft: 4,
              padding: '2px 8px',
              borderRadius: 999,
              background: 'rgba(255,92,138,0.20)',
              color: '#FFD0DC',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.3,
            }}
          >
            ⚠️ {unresolvedCount} unresolved
          </span>
        )}
      </button>
      <div
        style={{
          marginTop: 10,
          fontSize: 11,
          color: '#71717A',
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        {PHASE_HINT[phase]}
      </div>
    </>
  );
}
