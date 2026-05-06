// =====================================================
// FILE: src/components/player/LobbyScreen.tsx
// PROJECT: pitch-game
// TASK: T1 — Player View + Realtime
// VERSION: T1-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Lobby screen — รองรับ 3 states จาก mockup-v5:
//          State 1: empty (join form)
//          State 2: joined (รอเกมเริ่ม)
//          State 3: blocked (late join — phase ≠ LOBBY แต่ไม่มี player)
//
// CHANGE LOG:
//   T1-v1 (2026-05-06): Initial — neural network hero + join form + frosted cards
// =====================================================
'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { NICKNAME_MAX_LENGTH } from '@/lib/types';
import type { PlayerSession } from '@/hooks/usePlayer';

interface LobbyScreenProps {
  gameId: string;
  variant: 'empty' | 'joined' | 'blocked';
  player?: PlayerSession | null;
  joining?: boolean;
  joinError?: string | null;
  onJoin?: (nickname: string) => void;
}

export function LobbyScreen({
  gameId,
  variant,
  player,
  joining,
  joinError,
  onJoin,
}: LobbyScreenProps) {
  const [nickname, setNickname] = useState('');
  const playerCount = useLivePlayerCount(gameId);

  const trimmedNickname = nickname.trim();
  const canSubmit = trimmedNickname.length > 0 && !joining;

  const handleJoin = () => {
    if (!canSubmit || !onJoin) return;
    onJoin(trimmedNickname);
  };

  // ---------- State 3: Blocked (late join) ----------
  if (variant === 'blocked') {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px 8px',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#1c1c1e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            marginBottom: 16,
          }}
        >
          🔒
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#A1A1AA',
            marginBottom: 8,
            letterSpacing: '-0.3px',
          }}
        >
          เกมเริ่มไปแล้ว
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#A1A1AA',
            lineHeight: 1.55,
            marginBottom: 12,
          }}
        >
          รอบนี้รับผู้เล่นเต็มแล้ว
          <br />
          รอชมผลการแข่งขันได้บนจอใหญ่
        </div>
        <Watermark />
      </div>
    );
  }

  // ---------- State 2: Joined (รอเกมเริ่ม) ----------
  if (variant === 'joined') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', margin: '28px 0 24px' }}>
          <Spinner />
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#fff',
              marginBottom: 6,
              marginTop: 20,
              animation: 'pulse 1.6s ease-in-out infinite',
            }}
          >
            รอเกมเริ่ม
          </div>
          <div style={{ fontSize: 13, color: '#A1A1AA', lineHeight: 1.55 }}>
            Presenter จะกดเริ่มเกมในไม่ช้า
          </div>
        </div>

        {player && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              background: 'rgba(28,28,30,0.7)',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: 12,
              color: '#A1A1AA',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              marginBottom: 24,
            }}
          >
            <span style={{ color: '#71717A' }}>ชื่อเล่น</span>
            <span style={{ color: '#5DF591', fontWeight: 700 }}>{player.nickname}</span>
          </div>
        )}

        <PlayerCountCard count={playerCount} status="รวมคุณด้วย ✓" />
      </div>
    );
  }

  // ---------- State 1: Empty (join form) ----------
  return (
    <div>
      <HeroBlock />

      <div style={{ margin: '16px 0 14px' }}>
        <div style={{ fontSize: 12, color: '#A1A1AA', marginBottom: 6, fontWeight: 500 }}>
          ชื่อเล่น
        </div>
        <input
          autoFocus
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleJoin();
          }}
          maxLength={NICKNAME_MAX_LENGTH}
          placeholder="ใส่ชื่อเล่นของคุณ"
          disabled={joining}
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#1c1c1e',
            color: '#FFFFFF',
            fontSize: 16,
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#5DF591')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
        />
      </div>

      <button
        onClick={handleJoin}
        disabled={!canSubmit}
        style={{
          width: '100%',
          padding: '14px 16px',
          borderRadius: 10,
          border: 'none',
          fontSize: 15,
          fontWeight: 700,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit',
          background: canSubmit ? '#5DF591' : '#1c1c1e',
          color: canSubmit ? '#062b13' : '#52525B',
          marginBottom: 24,
          transition: 'background 0.15s',
        }}
      >
        {joining ? 'กำลังเข้าร่วม...' : 'เข้าร่วมเกม'}
      </button>

      {joinError && (
        <div
          style={{
            fontSize: 12,
            color: '#FF5C8A',
            textAlign: 'center',
            marginBottom: 16,
            padding: '8px 12px',
            background: 'rgba(255,92,138,0.08)',
            borderRadius: 8,
          }}
        >
          {joinError}
        </div>
      )}

      <PlayerCountCard count={playerCount} status="รอเกมเริ่ม" />
    </div>
  );
}

// =====================================================
// Sub-components
// =====================================================

function HeroBlock() {
  return (
    <div
      style={{
        position: 'relative',
        height: 200,
        marginTop: 16,
        marginBottom: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <NeuralNetwork />
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#5DF591',
            letterSpacing: 3,
            marginBottom: 14,
          }}
        >
          DIME × AI
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.6px',
            marginBottom: 10,
            lineHeight: 1.15,
          }}
        >
          AI Stock Pitch Battle
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: '#3B7DFF',
            letterSpacing: 1.2,
          }}
        >
          MONEY EXPO 2026
        </div>
      </div>
    </div>
  );
}

function NeuralNetwork() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.65,
      }}
    >
      <svg viewBox="0 0 280 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {/* เส้นเชื่อม */}
        {[
          ['40', '60', '140', '100'],
          ['240', '60', '140', '100'],
          ['40', '60', '240', '60'],
          ['60', '140', '140', '100'],
          ['220', '140', '140', '100'],
          ['60', '140', '220', '140'],
          ['100', '40', '40', '60'],
          ['180', '40', '240', '60'],
          ['100', '40', '180', '40'],
          ['20', '100', '40', '60'],
          ['260', '100', '240', '60'],
          ['20', '100', '60', '140'],
          ['260', '100', '220', '140'],
          ['140', '170', '60', '140'],
          ['140', '170', '220', '140'],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
            fill="none"
          />
        ))}

        {/* Pulse particles เดินทางตามเส้น */}
        <circle r="2.5" fill="#3B7DFF" filter="drop-shadow(0 0 4px #3B7DFF)">
          <animateMotion dur="3s" repeatCount="indefinite" path="M40,60 L140,100" />
        </circle>
        <circle r="2.5" fill="#8B5CF6" filter="drop-shadow(0 0 4px #8B5CF6)">
          <animateMotion dur="3s" repeatCount="indefinite" begin="0.7s" path="M240,60 L140,100" />
        </circle>
        <circle r="2.5" fill="#5DF591" filter="drop-shadow(0 0 4px #5DF591)">
          <animateMotion dur="3s" repeatCount="indefinite" begin="1.4s" path="M60,140 L140,100" />
        </circle>
        <circle r="2" fill="#3B7DFF" filter="drop-shadow(0 0 4px #3B7DFF)">
          <animateMotion dur="3.5s" repeatCount="indefinite" begin="2.1s" path="M220,140 L140,100" />
        </circle>
        <circle r="2" fill="#8B5CF6" filter="drop-shadow(0 0 4px #8B5CF6)">
          <animateMotion dur="4s" repeatCount="indefinite" begin="0.3s" path="M40,60 L240,60" />
        </circle>
        <circle r="2" fill="#5DF591" filter="drop-shadow(0 0 4px #5DF591)">
          <animateMotion dur="4s" repeatCount="indefinite" begin="1.8s" path="M60,140 L220,140" />
        </circle>

        {/* Nodes พื้นหลัง (สีจาง) */}
        {[
          [100, 40],
          [180, 40],
          [20, 100],
          [260, 100],
          [140, 170],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={2}
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
          />
        ))}

        {/* Nodes สี accent (เด่น) */}
        <circle cx="40" cy="60" r="3.5" fill="#3B7DFF" stroke="#3B7DFF" filter="drop-shadow(0 0 4px #3B7DFF)" />
        <circle cx="240" cy="60" r="3.5" fill="#8B5CF6" stroke="#8B5CF6" filter="drop-shadow(0 0 4px #8B5CF6)" />
        <circle cx="60" cy="140" r="3" fill="#5DF591" stroke="#5DF591" filter="drop-shadow(0 0 4px #5DF591)" />
        <circle cx="220" cy="140" r="3" fill="#5DF591" stroke="#5DF591" filter="drop-shadow(0 0 4px #5DF591)" />
        <circle cx="140" cy="100" r="4" fill="#3B7DFF" stroke="#3B7DFF" filter="drop-shadow(0 0 4px #3B7DFF)" />
      </svg>
    </div>
  );
}

function PlayerCountCard({ count, status }: { count: number; status: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 16,
        background: 'rgba(28,28,30,0.7)',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#5DF591',
            display: 'inline-block',
            animation: 'live-pulse 1.6s ease-in-out infinite',
          }}
        />
        <span style={{ fontSize: 11, color: '#71717A', fontWeight: 500 }}>
          ผู้เล่นที่เข้ามาแล้ว
        </span>
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 800,
          color: '#FFFFFF',
          lineHeight: 1.1,
          letterSpacing: '-1px',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {count}
      </div>
      <div style={{ fontSize: 11, color: '#71717A', marginTop: 4, fontWeight: 500 }}>
        {status}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        border: '3px solid rgba(255,255,255,0.08)',
        borderTopColor: '#5DF591',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto',
      }}
    />
  );
}

function Watermark() {
  return (
    <div style={{ marginTop: 16 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1.5,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      >
        <span style={{ color: '#5DF591' }}>DIME × AI</span>
        <span style={{ color: '#71717A', fontWeight: 400 }}>·</span>
        <span style={{ color: '#3B7DFF' }}>MONEY EXPO 2026</span>
      </span>
    </div>
  );
}

// =====================================================
// Live player count hook (inline — ใช้ที่นี่ที่เดียว)
// =====================================================
function useLivePlayerCount(gameId: string): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    const fetchCount = async () => {
      const { count: c } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', gameId);
      if (!cancelled && typeof c === 'number') setCount(c);
    };

    fetchCount();

    const channel = supabase
      .channel(`player-count:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          if (!cancelled) setCount((c) => c + 1);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return count;
}
