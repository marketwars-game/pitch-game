// =====================================================
// FILE: src/components/admin/PlayerDetailModal.tsx
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Modal — show full pitch + 3 judge scores + comments
//          Used on stage during Top 3 reveal
//          Auto-defaulted banner shown when admin should know AI failed
//
// CHANGE LOG:
//   T2-v1 (2026-05-06): Initial
// =====================================================
'use client';

import { useEffect } from 'react';
import type {
  JudgeScore,
  PlayerStatusEnriched,
} from '@/lib/types';

export interface PlayerDetailModalProps {
  enriched: PlayerStatusEnriched;
  stockTicker: string;
  roundNumber: number;
  onClose: () => void;
}

export function PlayerDetailModal({
  enriched,
  stockTicker,
  roundNumber,
  onClose,
}: PlayerDetailModalProps) {
  const { player, submission } = enriched;
  const scores = submission?.scores ?? null;
  const finalScore = scores?.finalScore;

  // ESC key closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 100,
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
          maxWidth: 720,
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
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#fff',
                letterSpacing: -0.3,
              }}
            >
              {player.nickname}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#71717A',
                fontWeight: 600,
              }}
            >
              Round {roundNumber} · {stockTicker}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: '#A1A1AA',
              cursor: 'pointer',
              fontSize: 16,
              fontFamily: 'inherit',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
          {submission?.auto_defaulted && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(255,92,138,0.14)',
                border: '1px solid #FF5C8A',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 18,
                fontSize: 12,
                color: '#FFD0DC',
                fontWeight: 600,
              }}
            >
              <div style={{ fontSize: 16, flexShrink: 0 }}>🚨</div>
              <div style={{ lineHeight: 1.5, flex: 1 }}>
                <strong
                  style={{
                    color: '#FF5C8A',
                    display: 'block',
                    fontWeight: 800,
                    marginBottom: 2,
                  }}
                >
                  Auto-defaulted
                </strong>
                AI ตัดสินไม่สำเร็จ — ใช้ default score 0/10
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 0.6,
                  color: '#FFD93D',
                  textTransform: 'uppercase',
                  flexShrink: 0,
                  padding: '2px 7px',
                  borderRadius: 999,
                  background: 'rgba(255,217,61,0.12)',
                  border: '1px solid #FFD93D',
                }}
              >
                Admin-only
              </span>
            </div>
          )}

          {/* Final score */}
          {finalScore !== undefined && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: '#2a2a2c',
                borderRadius: 10,
                marginBottom: 18,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#71717A',
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    fontWeight: 700,
                  }}
                >
                  Final Score
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#71717A',
                    marginTop: 2,
                  }}
                >
                  เฉลี่ยจาก 3 judges
                </div>
              </div>
              <div>
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 800,
                    color: '#5DF591',
                    letterSpacing: -1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {finalScore.toFixed(1)}
                </span>
                <span
                  style={{
                    fontSize: 16,
                    color: '#71717A',
                    fontWeight: 600,
                    marginLeft: 2,
                  }}
                >
                  /10
                </span>
              </div>
            </div>
          )}

          {/* Pitch */}
          <SectionTitle>Pitch</SectionTitle>
          <div
            style={{
              background: '#2a2a2c',
              borderRadius: 10,
              padding: '14px 16px',
              fontSize: 13,
              lineHeight: 1.6,
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
              whiteSpace: 'pre-wrap',
              marginBottom: 12,
            }}
          >
            {submission?.pitch || (
              <span style={{ color: '#71717A', fontStyle: 'italic' }}>
                (ยังไม่มี pitch)
              </span>
            )}
          </div>

          {/* Judges */}
          {scores && (
            <>
              <SectionTitle>Judges</SectionTitle>
              <JudgeCard
                persona="analyst"
                icon="🧐"
                name="The Analyst"
                color="#8B5CF6"
                colorSoft="rgba(139,92,246,0.15)"
                score={scores.analyst}
              />
              <JudgeCard
                persona="creative"
                icon="🎨"
                name="The Creative"
                color="#FF8C42"
                colorSoft="rgba(255,140,66,0.15)"
                score={scores.creative}
              />
              <JudgeCard
                persona="communicator"
                icon="💬"
                name="The Communicator"
                color="#FF5C8A"
                colorSoft="rgba(255,92,138,0.14)"
                score={scores.communicator}
              />
            </>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            padding: '16px 22px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 10px',
              borderRadius: 10,
              background: '#1c1c1e',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.16)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#71717A',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
        marginTop: 4,
      }}
    >
      {children}
    </div>
  );
}

function JudgeCard({
  icon,
  name,
  color,
  colorSoft,
  score,
}: {
  persona: string;
  icon: string;
  name: string;
  color: string;
  colorSoft: string;
  score: JudgeScore | undefined;
}) {
  if (!score) return null;
  return (
    <div
      style={{
        background: '#2a2a2c',
        borderRadius: 10,
        padding: '12px 14px',
        marginBottom: 10,
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            background: colorSoft,
            color,
          }}
        >
          {icon}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color }}>{name}</div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
        }}
      >
        <div>
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: -0.5,
            }}
          >
            {score.score}
          </span>
          <span
            style={{
              fontSize: 12,
              color: '#71717A',
              fontWeight: 600,
            }}
          >
            /10
          </span>
        </div>
      </div>
      <div
        style={{
          fontSize: 12,
          color: '#A1A1AA',
          lineHeight: 1.55,
        }}
      >
        {score.comment}
      </div>
    </div>
  );
}
