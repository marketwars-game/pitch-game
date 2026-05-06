// =====================================================
// FILE: src/hooks/usePresenterState.ts
// PROJECT: pitch-game
// TASK: T4 — Presenter View
// VERSION: T4-v1
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-05-07
// PURPOSE: Combined realtime subscription hook สำหรับ Presenter View
//          ผูก 3 channels (games / players / submissions) เป็น hook เดียว
//          - re-fetch on every realtime event (T2 lesson #5)
//          - tracks "new player" IDs ภายใน window สั้นๆ สำหรับ glow effect
//          - filter ทุก query ด้วย DEFAULT_GAME_ID (single-game model จาก T2-v2)
//
// CHANGE LOG:
//   T4-v1 (2026-05-07): Initial
// =====================================================

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import {
  DEFAULT_GAME_ID,
  type GameRow,
  type PlayerRow,
  type SubmissionRow,
} from '@/lib/types';
import { PILL_NEW_GLOW_MS } from '@/lib/presenter-config';

export type PresenterState = {
  game: GameRow | null;
  players: PlayerRow[];          // sorted by joined_at DESC (newest first — for top-of-pill-grid)
  submissions: SubmissionRow[];   // sorted by submitted_at DESC
  newPlayerIds: Set<string>;      // players that joined in the last PILL_NEW_GLOW_MS
  loading: boolean;
};

const EMPTY_STATE: PresenterState = {
  game: null,
  players: [],
  submissions: [],
  newPlayerIds: new Set(),
  loading: true,
};

export function usePresenterState(): PresenterState {
  const [state, setState] = useState<PresenterState>(EMPTY_STATE);
  // Track previously-seen player IDs to detect newly joined ones
  const seenPlayerIdsRef = useRef<Set<string>>(new Set());
  // Map of player_id → setTimeout id for clearing "new" badge
  const newGlowTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const refetch = useCallback(async () => {
    const sb = getSupabaseBrowserClient();

    // parallel fetch — game / players / submissions
    const [gameRes, playersRes, submissionsRes] = await Promise.all([
      sb.from('games').select('*').eq('id', DEFAULT_GAME_ID).maybeSingle(),
      sb.from('players').select('*').eq('game_id', DEFAULT_GAME_ID).order('joined_at', { ascending: false }),
      sb.from('submissions').select('*').eq('game_id', DEFAULT_GAME_ID).order('submitted_at', { ascending: false }),
    ]);

    const game = (gameRes.data ?? null) as GameRow | null;
    const players = (playersRes.data ?? []) as PlayerRow[];
    const submissions = (submissionsRes.data ?? []) as SubmissionRow[];

    // Detect newly joined players (not in seen set)
    const previouslySeen = seenPlayerIdsRef.current;
    const freshIds: string[] = [];
    for (const p of players) {
      if (!previouslySeen.has(p.id)) {
        freshIds.push(p.id);
      }
    }

    // Update seen set with all current players
    seenPlayerIdsRef.current = new Set(players.map((p) => p.id));

    // Schedule glow expiry for each fresh ID
    setState((prev) => {
      const nextNewIds = new Set(prev.newPlayerIds);
      for (const id of freshIds) {
        nextNewIds.add(id);
        // clear any existing timer for safety
        const existing = newGlowTimersRef.current.get(id);
        if (existing) clearTimeout(existing);
        const timer = setTimeout(() => {
          setState((s) => {
            const updated = new Set(s.newPlayerIds);
            updated.delete(id);
            return { ...s, newPlayerIds: updated };
          });
          newGlowTimersRef.current.delete(id);
        }, PILL_NEW_GLOW_MS);
        newGlowTimersRef.current.set(id, timer);
      }
      return {
        game,
        players,
        submissions,
        newPlayerIds: nextNewIds,
        loading: false,
      };
    });
  }, []);

  useEffect(() => {
    // initial load
    void refetch();

    const sb = getSupabaseBrowserClient();

    // Subscribe — refetch on ANY change. We don't try to merge incremental
    // events (T2 lesson #5: re-fetch is simpler and avoids stale UPDATE merges).
    const channel = sb
      .channel(`presenter:${DEFAULT_GAME_ID}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `id=eq.${DEFAULT_GAME_ID}` },
        () => void refetch()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${DEFAULT_GAME_ID}` },
        () => void refetch()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submissions', filter: `game_id=eq.${DEFAULT_GAME_ID}` },
        () => void refetch()
      )
      .subscribe();

    return () => {
      // capture timers ref at cleanup time to satisfy react-hooks/exhaustive-deps
      const timers = newGlowTimersRef.current;
      void sb.removeChannel(channel);
      // clear any pending glow timers
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, [refetch]);

  return state;
}
