// =====================================================
// FILE: src/components/player/PlayerView.tsx
// PROJECT: pitch-game
// TASK: T1 — Player View + Realtime
// VERSION: T1-v1
// CREATED: 2026-05-05
// LAST MODIFIED: 2026-05-06
// PURPOSE: Player View main component — orchestrate hooks + route ไป screen ตาม phase
//          Load global mesh-bg ทุก state เพื่อ visual consistency
//          Routes:
//            no player + LOBBY                → LobbyScreen "empty"
//            no player + (WRITING/JUDGING/RESULTS) → LobbyScreen "blocked" (late join)
//            has player + LOBBY               → LobbyScreen "joined"
//            has player + WRITING             → WritingScreen (active หรือ submitted)
//            has player + JUDGING + submitted → JudgingScreen "waiting"
//            has player + JUDGING + !submitted→ JudgingScreen "not-playing"
//            has player + RESULTS + submitted → ResultsScreen "full"
//            has player + RESULTS + !submitted→ ResultsScreen "not-playing"
//
// CHANGE LOG:
//   T1-v1 (2026-05-06): Full implementation — replaces T0-v2 placeholder
//                        Mesh gradient bg + global keyframes + phase router
//   T0-v2 (2026-05-06): Refactor เป็น wrapper pattern (placeholder)
//   T0-v1 (2026-05-05): Initial placeholder (inline)
// =====================================================
'use client';

import { useGameState } from '@/hooks/useGameState';
import { usePlayer } from '@/hooks/usePlayer';
import { useCountdown } from '@/hooks/useCountdown';
import { useSubmission } from '@/hooks/useSubmission';
import { LobbyScreen } from './LobbyScreen';
import { WritingScreen } from './WritingScreen';
import { JudgingScreen } from './JudgingScreen';
import { ResultsScreen } from './ResultsScreen';
import { DEFAULT_GAME_ID, DEFAULT_GAME_CONFIG } from '@/lib/types';

export function PlayerView() {
  const gameId = DEFAULT_GAME_ID;

  const { game, phase, loading: gameLoading, error: gameError } = useGameState(gameId);
  const { player, loading: playerLoading, joining, error: joinError, join } = usePlayer(gameId);

  const config = game?.config ?? DEFAULT_GAME_CONFIG;
  const countdown = useCountdown(game?.writing_ends_at ?? null, config.writingTimeSeconds);

  const {
    submission,
    submitting,
    error: submitError,
    submit,
    autoSubmit,
  } = useSubmission(gameId, player?.playerId ?? null);

  // โหลดครั้งแรก (game row + localStorage hydration)
  if (gameLoading || playerLoading) {
    return (
      <Screen>
        <MeshBg />
        <GlobalStyles />
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#71717A',
            fontSize: 13,
          }}
        >
          กำลังโหลด...
        </div>
      </Screen>
    );
  }

  // Error ตอน fetch game
  if (gameError || !game || !phase) {
    return (
      <Screen>
        <MeshBg />
        <GlobalStyles />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 16, color: '#fff', fontWeight: 700, marginBottom: 8 }}>
            ไม่สามารถโหลดเกมได้
          </div>
          <div style={{ fontSize: 13, color: '#A1A1AA', lineHeight: 1.55 }}>
            ตรวจสอบ network แล้วลองใหม่
          </div>
        </div>
      </Screen>
    );
  }

  // ===== Phase routing =====

  // ยังไม่มี player session
  if (!player) {
    if (phase === 'LOBBY') {
      return (
        <Screen>
          <MeshBg />
          <GlobalStyles />
          <ScrollBody>
            <LobbyScreen
              gameId={gameId}
              variant="empty"
              joining={joining}
              joinError={joinError}
              onJoin={join}
            />
          </ScrollBody>
        </Screen>
      );
    }
    // Late join — phase ผ่าน LOBBY ไปแล้ว
    return (
      <Screen>
        <MeshBg />
        <GlobalStyles />
        <ScrollBody>
          <LobbyScreen gameId={gameId} variant="blocked" />
        </ScrollBody>
      </Screen>
    );
  }

  // มี player แล้ว — route ตาม phase
  switch (phase) {
    case 'LOBBY':
      return (
        <Screen>
          <MeshBg />
          <GlobalStyles />
          <ScrollBody>
            <LobbyScreen gameId={gameId} variant="joined" player={player} />
          </ScrollBody>
        </Screen>
      );

    case 'WRITING':
      return (
        <Screen>
          <MeshBg />
          <GlobalStyles />
          <WritingScreen
            game={game}
            countdown={countdown}
            submission={submission}
            submitting={submitting}
            submitError={submitError}
            onSubmit={submit}
            onAutoSubmit={autoSubmit}
          />
        </Screen>
      );

    case 'JUDGING':
      return (
        <Screen>
          <MeshBg />
          <GlobalStyles />
          <ScrollBody>
            <JudgingScreen variant={submission ? 'waiting' : 'not-playing'} />
          </ScrollBody>
        </Screen>
      );

    case 'RESULTS':
      return (
        <Screen>
          <GlobalStyles />
          {/* ResultsScreen มี gradient bg ของตัวเอง — ข้าม MeshBg ตอนเป็น state full */}
          {submission ? (
            <ResultsScreen gameId={gameId} variant="full" submission={submission} />
          ) : (
            <>
              <MeshBg />
              <ScrollBody>
                <ResultsScreen gameId={gameId} variant="not-playing" submission={null} />
              </ScrollBody>
            </>
          )}
        </Screen>
      );

    default:
      return (
        <Screen>
          <MeshBg />
          <GlobalStyles />
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#71717A',
              fontSize: 13,
            }}
          >
            สถานะเกมไม่ถูกต้อง
          </div>
        </Screen>
      );
  }
}

// =====================================================
// Layout primitives
// =====================================================
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000000',
        color: '#FFFFFF',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, Inter, "SF Pro Display", "Segoe UI", sans-serif',
        WebkitFontSmoothing: 'antialiased',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

function ScrollBody({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        padding: 16,
        overflowY: 'auto',
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  );
}

function MeshBg() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        background:
          'radial-gradient(ellipse 60% 40% at 20% 0%, rgba(59,125,255,0.27), transparent 60%), ' +
          'radial-gradient(ellipse 50% 35% at 90% 15%, rgba(139,92,246,0.22), transparent 60%), ' +
          'radial-gradient(ellipse 70% 40% at 50% 100%, rgba(93,245,145,0.13), transparent 60%)',
        animation: 'mesh-shift 16s ease-in-out infinite alternate',
      }}
    />
  );
}

// =====================================================
// Global keyframes (inject ครั้งเดียวต่อ render — idempotent)
// =====================================================
function GlobalStyles() {
  return (
    <style jsx global>{`
      @keyframes mesh-shift {
        0% {
          transform: translate(0, 0) scale(1);
        }
        50% {
          transform: translate(-6px, 4px) scale(1.04);
        }
        100% {
          transform: translate(4px, -4px) scale(1.02);
        }
      }
      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes live-pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(93, 245, 145, 0.7);
        }
        70% {
          box-shadow: 0 0 0 6px rgba(93, 245, 145, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(93, 245, 145, 0);
        }
      }
      @keyframes sparkle-float {
        0%,
        100% {
          opacity: 0;
          transform: translateY(0) scale(0.5);
        }
        20% {
          opacity: 1;
          transform: translateY(-4px) scale(1);
        }
        60% {
          opacity: 0.8;
          transform: translateY(-12px) scale(1.1);
        }
        100% {
          opacity: 0;
          transform: translateY(-20px) scale(0.5);
        }
      }
    `}</style>
  );
}
