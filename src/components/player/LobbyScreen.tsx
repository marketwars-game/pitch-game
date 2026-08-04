// =====================================================
// FILE: src/components/player/LobbyScreen.tsx
// PROJECT: pitch-game
// TASK: T7 — LINE หาพี่เก่ง (DIME x KTC)
// VERSION: T7-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-08-04
// PURPOSE: Lobby screen — รองรับ 3 states จาก mockup-v5:
//          State 1: empty (join form)
//          State 2: joined (รอเกมเริ่ม)
//          State 3: blocked (late join — phase ≠ LOBBY แต่ไม่มี player)
//
// CHANGE LOG:
//   T7-v1 (2026-08-04): เปลี่ยนชื่อเกม + แบรนด์เป็น DIME × KTC
//                       - HeroBlock: neural network → hero แบบแชท (ชื่อเกม + คำโปรย)
//                       - ปุ่ม/คำโปรยเปลี่ยนภาษาให้เข้ากับเกมใหม่
//                       ตรรกะ join + useLivePlayerCount ไม่เปลี่ยน
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
            อีกสักครู่ MC จะกดเริ่ม แล้วพี่เก่งจะทักมา
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
          placeholder="ชื่อเล่นของคุณ (คนอื่นเห็นบนจอ)"
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
        {joining ? 'กำลังเข้าห้อง...' : 'เข้าห้อง'}
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
        marginTop: 26,
        marginBottom: 10,
        textAlign: 'center',
        boxSizing: 'border-box',
      }}
    >
      {/* แสงพื้นหลังโทนเขียวแชท */}
      <div
        style={{
          position: 'absolute',
          inset: '-40px -20px',
          background:
            'radial-gradient(ellipse 60% 55% at 50% 30%, rgba(6,193,103,0.20), transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <span
          style={{
            display: 'inline-block',
            fontSize: 10,
            fontWeight: 800,
            color: '#0b2b18',
            background: '#5DF591',
            borderRadius: 999,
            padding: '4px 12px',
            letterSpacing: 0.4,
            marginBottom: 16,
          }}
        >
          ◆ INVESTMENT MADE SIMPLE
        </span>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#71717A',
            letterSpacing: 2.4,
            marginBottom: 8,
          }}
        >
          ด่านสุดท้ายของคลาสวันนี้
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-1px',
            lineHeight: 1.12,
            marginBottom: 10,
          }}
        >
          LINE หา<span style={{ color: '#06C167' }}>พี่เก่ง</span>
        </div>
        <div style={{ fontSize: 13, color: '#A1A1AA', lineHeight: 1.6 }}>
          พี่เก่งอยากเริ่มลงทุน แต่ไม่กล้าสักที
          <br />
          คุณมีข้อความเดียวที่จะเปลี่ยนใจแก
        </div>
      </div>
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
        <span style={{ color: '#5DF591' }}>DIME × KTC</span>
        <span style={{ color: '#71717A', fontWeight: 400 }}>·</span>
        <span style={{ color: '#3B7DFF' }}>INVESTMENT MADE SIMPLE</span>
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
