// =====================================================
// FILE: src/components/admin/AdminDashboard.tsx
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v2
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Main admin panel after auth — orchestrates all sub-components
//          - Subscribes to game state + player status
//          - Manages modals (PlayerDetail + ConfirmReveal + ConfirmReset)
//          - Provides phase control actions to children
//
// CHANGE LOG:
//   T2-v2 (2026-05-06): Wire ConfirmResetModal for "เริ่มรอบใหม่"
//                        startNextRound() เป็น destructive action
//                        ต้อง confirm ก่อน — แสดงรายชื่อ player ที่จะถูกลบ
//   T2-v1 (2026-05-06): Initial
// =====================================================
'use client';

import { useMemo, useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { usePhaseControl } from '@/hooks/usePhaseControl';
import { usePlayerStatus } from '@/hooks/usePlayerStatus';
import {
  DEFAULT_GAME_ID,
  type PlayerStatusEnriched,
} from '@/lib/types';
import { AdminTopBar } from './AdminTopBar';
import { GameControlPanel } from './GameControlPanel';
import { PlayerStatusList } from './PlayerStatusList';
import { PlayerDetailModal } from './PlayerDetailModal';
import { ConfirmRevealModal } from './ConfirmRevealModal';
import { ConfirmResetModal } from './ConfirmResetModal';

export interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const gameId = DEFAULT_GAME_ID;
  const { game, phase, loading: gameLoading, error: gameError } =
    useGameState(gameId);

  const roundNumber = game?.round_number ?? 1;
  const { enrichedPlayers, counts, loading: playersLoading } = usePlayerStatus(
    gameId,
    roundNumber
  );

  const phaseControl = usePhaseControl(game);

  // Modals state
  const [detailPlayerId, setDetailPlayerId] = useState<string | null>(null);
  const [confirmRevealOpen, setConfirmRevealOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const detailPlayer = useMemo(
    () => enrichedPlayers.find((p) => p.player.id === detailPlayerId) ?? null,
    [enrichedPlayers, detailPlayerId]
  );

  const unresolvedPlayers = useMemo<PlayerStatusEnriched[]>(
    () =>
      enrichedPlayers.filter(
        (p) =>
          p.status === 'failed' ||
          p.status === 'scoring' ||
          p.status === 'submitted'
      ),
    [enrichedPlayers]
  );

  if (gameLoading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#000',
          color: '#71717A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
        }}
      >
        กำลังโหลด...
      </main>
    );
  }

  if (gameError || !game) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#000',
          color: '#FF5C8A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          padding: 24,
          textAlign: 'center',
        }}
      >
        เชื่อมต่อ database ไม่สำเร็จ — {gameError ?? 'ไม่พบ game'}
      </main>
    );
  }

  const handlePrimaryAction = async () => {
    if (!phase) return;
    if (phase === 'LOBBY') {
      await phaseControl.startWriting();
    } else if (phase === 'WRITING') {
      await phaseControl.closeWriting();
    } else if (phase === 'JUDGING') {
      if (unresolvedPlayers.length > 0) {
        setConfirmRevealOpen(true);
      } else {
        await phaseControl.revealResults([]);
      }
    } else if (phase === 'RESULTS') {
      // T2-v2: เปิด confirm modal ก่อน — destructive action
      setConfirmResetOpen(true);
    }
  };

  const handleConfirmReveal = async () => {
    const submissionIds = unresolvedPlayers
      .map((p) => p.submission?.id)
      .filter((id): id is string => Boolean(id));
    await phaseControl.revealResults(submissionIds);
    setConfirmRevealOpen(false);
  };

  const handleConfirmReset = async () => {
    await phaseControl.startNextRound();
    setConfirmResetOpen(false);
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, Inter, "SF Pro Display", "Segoe UI", sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 60% 40% at 20% 0%,    rgba(59,125,255,0.27), transparent 60%),
            radial-gradient(ellipse 50% 35% at 90% 15%,   rgba(139,92,246,0.22), transparent 60%),
            radial-gradient(ellipse 70% 40% at 50% 100%,  rgba(93,245,145,0.13), transparent 60%)
          `,
          animation: 'pg-mesh-shift 16s ease-in-out infinite alternate',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AdminTopBar
          phase={game.phase}
          roundNumber={game.round_number}
          onLogout={onLogout}
        />

        <div
          style={{
            flex: 1,
            display: 'grid',
            gap: 16,
            padding: 18,
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            ...(typeof window !== 'undefined' && window.innerWidth < 900
              ? { gridTemplateColumns: '1fr' }
              : {}),
          }}
          className="pg-admin-content"
        >
          <GameControlPanel
            game={game}
            counts={counts}
            unresolvedCount={unresolvedPlayers.length}
            phaseControl={phaseControl}
            onPrimaryAction={handlePrimaryAction}
            onPlayerClick={setDetailPlayerId}
            enrichedPlayers={enrichedPlayers}
          />
          <PlayerStatusList
            phase={game.phase}
            enrichedPlayers={enrichedPlayers}
            counts={counts}
            loading={playersLoading}
            onPlayerClick={setDetailPlayerId}
          />
        </div>

        {phaseControl.error && (
          <div
            style={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 50,
              padding: '10px 14px',
              background: 'rgba(255,92,138,0.15)',
              border: '1px solid #FF5C8A',
              borderRadius: 8,
              color: '#FFD0DC',
              fontSize: 12,
              fontWeight: 600,
              maxWidth: 320,
            }}
          >
            ⚠️ {phaseControl.error}
          </div>
        )}
      </div>

      {/* Modals */}
      {detailPlayer && (
        <PlayerDetailModal
          enriched={detailPlayer}
          stockTicker={game.stock?.ticker ?? '—'}
          roundNumber={game.round_number}
          onClose={() => setDetailPlayerId(null)}
        />
      )}

      {confirmRevealOpen && (
        <ConfirmRevealModal
          unresolvedPlayers={unresolvedPlayers}
          busy={phaseControl.busy}
          onCancel={() => setConfirmRevealOpen(false)}
          onConfirm={handleConfirmReveal}
        />
      )}

      {confirmResetOpen && (
        <ConfirmResetModal
          playerCount={counts.total}
          busy={phaseControl.busy}
          onCancel={() => setConfirmResetOpen(false)}
          onConfirm={handleConfirmReset}
        />
      )}

      <style>{`
        @keyframes pg-mesh-shift {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-6px, 4px) scale(1.04); }
          100% { transform: translate(4px, -4px) scale(1.02); }
        }
        @keyframes pg-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes pg-live-pulse {
          0% { box-shadow: 0 0 0 0 rgba(93,245,145,0.7); }
          70% { box-shadow: 0 0 0 6px rgba(93,245,145,0); }
          100% { box-shadow: 0 0 0 0 rgba(93,245,145,0); }
        }
        @media (max-width: 900px) {
          .pg-admin-content { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
