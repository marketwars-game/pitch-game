// =====================================================
// FILE: src/components/admin/ConfirmResetModal.tsx
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v2
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Confirmation dialog before "เริ่มรอบใหม่" in RESULTS phase
//          Reset will DELETE players + submissions of this game
//          Players will be force back to "ใส่ชื่อเล่น" screen
//
// CHANGE LOG:
//   T2-v2 (2026-05-06): Initial — pair with usePhaseControl T2-v2 startNextRound full reset
// =====================================================
'use client';

import { useEffect } from 'react';

export interface ConfirmResetModalProps {
  playerCount: number;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmResetModal({
  playerCount,
  busy,
  onCancel,
  onConfirm,
}: ConfirmResetModalProps) {
  // ESC closes (only when not busy)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel, busy]);

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
          maxWidth: 480,
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
              background: 'rgba(255,217,61,0.14)',
              border: '1px solid #FFD93D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}
          >
            🔄
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
              เริ่มรอบใหม่?
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#71717A',
                lineHeight: 1.55,
              }}
            >
              จะ <strong style={{ color: '#FF5C8A' }}>ลบทุก player + submission</strong>{' '}
              ของเกมนี้ และกลับไปที่ LOBBY
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 22px' }}>
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
            สิ่งที่จะเกิดขึ้น
          </div>
          <div
            style={{
              background: '#2a2a2c',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 14,
              fontSize: 12,
              color: '#A1A1AA',
              lineHeight: 1.7,
            }}
          >
            <ActionItem>
              ลบ <strong style={{ color: '#FF5C8A' }}>{playerCount}</strong>{' '}
              players + submissions ของเกมนี้
            </ActionItem>
            <ActionItem>
              UPDATE{' '}
              <code
                style={{
                  background: 'rgba(139,92,246,0.12)',
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily: 'SF Mono, monospace',
                  color: '#8B5CF6',
                }}
              >
                games.phase = LOBBY
              </code>
              , clear stock + writing timestamps
            </ActionItem>
            <ActionItem>
              Player ทุกคนจะถูก force กลับหน้า{' '}
              <strong style={{ color: '#5DF591' }}>&ldquo;ใส่ชื่อเล่น&rdquo;</strong>
            </ActionItem>
          </div>

          <div
            style={{
              background: 'rgba(255,217,61,0.06)',
              borderLeft: '3px solid #FFD93D',
              padding: '10px 12px',
              borderRadius: 6,
              fontSize: 11,
              lineHeight: 1.55,
              color: '#FFD93D',
              fontWeight: 600,
            }}
          >
            ⚠️ การกระทำนี้ <strong>ย้อนกลับไม่ได้</strong> — ตรวจให้แน่ใจว่ารอบนี้จบแล้ว
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
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              background: busy ? '#2a2a2c' : '#FF5C8A',
              color: busy ? '#52525B' : '#fff',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: busy ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {busy ? 'กำลัง reset...' : 'ใช่ — Reset เกม'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionItem({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        paddingLeft: 18,
        marginBottom: 4,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          color: '#5DF591',
          fontWeight: 700,
        }}
      >
        →
      </span>
      {children}
    </div>
  );
}
