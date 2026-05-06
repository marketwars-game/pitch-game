// =====================================================
// FILE: src/hooks/useGameState.ts
// PROJECT: pitch-game
// TASK: T1 — Player View + Realtime
// VERSION: T1-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Subscribe ตาราง games — return current game row + phase + loading state
//          React ต่อ realtime UPDATE (admin เปลี่ยน phase, set writing_ends_at, etc.)
//
// CHANGE LOG:
//   T1-v1 (2026-05-06): Initial — fetch + subscribe game row 1 row
// =====================================================
'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { GameRow, GamePhase } from '@/lib/types';

export interface UseGameStateResult {
  game: GameRow | null;
  phase: GamePhase | null;
  loading: boolean;
  error: string | null;
}

/**
 * Subscribe game row 1 row ตาม ID
 * Return current game state พร้อม realtime updates
 *
 * Lifecycle:
 *   1. mount → fetch initial row
 *   2. subscribe UPDATE event เฉพาะ row นี้
 *   3. unmount → cleanup channel
 */
export function useGameState(gameId: string): UseGameStateResult {
  const [game, setGame] = useState<GameRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;

    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    // 1. Fetch ครั้งแรก
    supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) {
          setError(fetchError.message);
          setLoading(false);
          return;
        }
        setGame(data as GameRow);
        setLoading(false);
      });

    // 2. Realtime subscription — เฉพาะ row นี้เท่านั้น
    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          if (cancelled) return;
          setGame(payload.new as GameRow);
        }
      )
      .subscribe();

    // 3. Cleanup
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return {
    game,
    phase: game?.phase ?? null,
    loading,
    error,
  };
}
