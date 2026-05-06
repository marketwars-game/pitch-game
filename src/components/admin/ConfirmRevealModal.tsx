// =====================================================
// FILE: src/components/admin/ConfirmRevealModal.tsx
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Confirm dialog when admin reveals results with unresolved players
//          Shows list of failed/scoring/submitted players that will be auto-defaulted
//          Confirm → revealResults(submissionIds) → status='done', score 0/10
//
// CHANGE LOG:
//   T2-v1 (2026-05-06): Initial
// =====================================================
'use client';

import { useEffect } from 'react';
import type { PlayerStatus, PlayerStatusEnriched } from '@/lib/types';

export interface ConfirmRevealModalProps {
  unresolvedPlayers: PlayerStatusEnriched[];
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

const STATUS_LABEL: Record<PlayerStatus, string> = {
  writing: 'writing',
  submitted: 'submitted',
  scoring: 'scoring',
  scored: 'scored',
  failed: 'failed',
};

const STATUS_COLOR: Record<PlayerStatus, string> = {
  writing: '#FFD93D',
  submitted: '#3B7DFF',
  scoring: '#8B5CF6',
  scored: '#5DF591',
  failed: '#FF5C8A',
};

export function ConfirmRevealModal({
  unresolvedPlayers,
  busy,
  onCancel,
  onConfirm,
}: ConfirmRevealModalProps) {
  // ESC closes (only when not busy)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel, busy]);

  const count = unresolvedPlayers.length;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, Inter, "SF Pro Display", "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          background: '#1c1c1e',
          border: '1px solid rgba(255,255,255,0.16)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 520,
          maxHeight: '90%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          color: '#fff',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '22px 22px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              flexShrink: 0,
              background: 'rgba(255,92,138,0.14)',
              border: '1px solid #FF5C8A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}
          >
            ⚠️
          </div>
          <div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: '#fff',
                marginBottom: 4,
                letterSpacing: -0.2,
              }}
            >
              ยังมี {count} player ที่ยังไม่ได้คะแนน
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#71717A',
                lineHeight: 1.5,
              }}
            >
              ถ้าดำเนินต่อ ผู้เล่นที่ยังไม่ได้คะแนนจะได้ default{' '}
              <strong style={{ color: '#FF5C8A' }}>0/10</strong> + comment
              &ldquo;AI ตัดสินไม่สำเร็จ — ใส่ default&rdquo;
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 22px', overflowY: 'auto' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#71717A',
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              marginBottom: 8,
            }}
          >
            Players ที่จะ auto-default
          </div>
          <div
            style={{
              background: '#2a2a2c',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '4px 0',
              marginBottom: 14,
            }}
          >
            {unresolvedPlayers.map((p, idx) => (
              <div
                key={p.player.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 10,
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderBottom:
                    idx < unresolvedPlayers.length - 1
                      ? '1px solid rgba(255,255,255,0.08)'
                      : 'none',
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    color: '#fff',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      color: '#71717A',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {idx + 1}.
                  </span>
                  {p.player.nickname}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    padding: '3px 9px',
                    borderRadius: 999,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    background: 'rgba(255,255,255,0.04)',
                    color: STATUS_COLOR[p.status],
                    border: `1px solid ${STATUS_COLOR[p.status]}`,
                  }}
                >
                  {STATUS_LABEL[p.status]}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              background:
                'rgba(59,125,255,0.06)',
              borderLeft: '3px solid #3B7DFF',
              padding: '10px 12px',
              borderRadius: 6,
              fontSize: 11,
              lineHeight: 1.55,
              color: '#A1A1AA',
            }}
          >
            💡{' '}
            <strong style={{ color: '#3B7DFF' }}>
              Player View ไม่เห็น flag
            </strong>{' '}
            — แสดงคะแนน 0/10 + comments ตามปกติ
            <br />
            Admin เห็น &ldquo;AUTO&rdquo; tag ใน player list + 🚨 banner ใน
            detail modal
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            padding: '14px 22px 18px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              background: '#1c1c1e',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.16)',
              fontSize: 12,
              fontWeight: 700,
              cursor: busy ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: busy ? 0.5 : 1,
            }}
          >
            ยกเลิก กลับไป re-judge
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              background: busy ? '#2a2a2c' : '#5DF591',
              color: busy ? '#52525B' : '#062b13',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: busy ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {busy ? 'กำลังดำเนินการ...' : 'ดำเนินต่อ — Reveal Top 3'}
          </button>
        </div>
      </div>
    </div>
  );
}
