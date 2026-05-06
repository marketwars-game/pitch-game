// =====================================================
// FILE: src/hooks/usePlayerStatus.ts
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Subscribe players + submissions tables filtered by round
//          Compute enriched player list with status + counts
//          Used by Admin Panel Player List + JudgingProgress
//
// CHANGE LOG:
//   T2-v1 (2026-05-06): Initial — dual subscription + enrichment
// =====================================================
'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type {
  PlayerCounts,
  PlayerRow,
  PlayerStatus,
  PlayerStatusEnriched,
  SubmissionRow,
} from '@/lib/types';

export interface UsePlayerStatusResult {
  enrichedPlayers: PlayerStatusEnriched[];
  counts: PlayerCounts;
  loading: boolean;
  error: string | null;
}

/**
 * Subscribe ทั้ง players + submissions tables
 * Filter by round_number, enrich แต่ละ player ด้วย submission state
 */
export function usePlayerStatus(
  gameId: string,
  roundNumber: number
): UsePlayerStatusResult {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;

    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    // 1. Initial fetch — ทั้ง players + submissions ของ round นี้
    Promise.all([
      supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId)
        .eq('round_number', roundNumber)
        .order('joined_at', { ascending: true }),
      supabase
        .from('submissions')
        .select('*')
        .eq('game_id', gameId)
        .eq('round_number', roundNumber),
    ])
      .then(([playersRes, submissionsRes]) => {
        if (cancelled) return;
        if (playersRes.error) {
          setError(playersRes.error.message);
        } else {
          setPlayers((playersRes.data ?? []) as PlayerRow[]);
        }
        if (submissionsRes.error) {
          setError(submissionsRes.error.message);
        } else {
          setSubmissions((submissionsRes.data ?? []) as SubmissionRow[]);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'โหลดข้อมูลล้มเหลว');
        setLoading(false);
      });

    // 2. Subscribe players (INSERT only — players ไม่ค่อย UPDATE)
    const playersChannel = supabase
      .channel(`admin-players:${gameId}:${roundNumber}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (cancelled) return;
          const row = payload.new as PlayerRow;
          // กรอง round_number ที่ตรงกัน (filter ใน Postgres ทำได้แค่ field เดียว)
          if (row.round_number !== roundNumber) return;
          setPlayers((prev) => {
            if (prev.some((p) => p.id === row.id)) return prev;
            return [...prev, row].sort((a, b) =>
              a.joined_at.localeCompare(b.joined_at)
            );
          });
        }
      )
      .subscribe();

    // 3. Subscribe submissions (INSERT + UPDATE — judging status changes)
    const submissionsChannel = supabase
      .channel(`admin-submissions:${gameId}:${roundNumber}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'submissions',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (cancelled) return;
          const eventType = payload.eventType;
          if (eventType === 'INSERT') {
            const row = payload.new as SubmissionRow;
            if (row.round_number !== roundNumber) return;
            setSubmissions((prev) => {
              if (prev.some((s) => s.id === row.id)) return prev;
              return [...prev, row];
            });
          } else if (eventType === 'UPDATE') {
            const row = payload.new as SubmissionRow;
            if (row.round_number !== roundNumber) return;
            setSubmissions((prev) =>
              prev.map((s) => (s.id === row.id ? row : s))
            );
          } else if (eventType === 'DELETE') {
            const oldRow = payload.old as Partial<SubmissionRow>;
            setSubmissions((prev) => prev.filter((s) => s.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(submissionsChannel);
    };
  }, [gameId, roundNumber]);

  // Compute enriched players + counts (memo)
  const { enrichedPlayers, counts } = useMemo(() => {
    const submissionByPlayer = new Map<string, SubmissionRow>();
    for (const s of submissions) {
      submissionByPlayer.set(s.player_id, s);
    }

    const enriched: PlayerStatusEnriched[] = players.map((player) => {
      const submission = submissionByPlayer.get(player.id) ?? null;
      const status = computeStatus(submission);
      return { player, submission, status };
    });

    const counts: PlayerCounts = {
      total: enriched.length,
      joined: 0,
      submitted: 0,
      scoring: 0,
      scored: 0,
      failed: 0,
    };

    for (const e of enriched) {
      switch (e.status) {
        case 'writing':
          counts.joined += 1;
          break;
        case 'submitted':
          counts.submitted += 1;
          break;
        case 'scoring':
          counts.scoring += 1;
          break;
        case 'scored':
          counts.scored += 1;
          break;
        case 'failed':
          counts.failed += 1;
          break;
      }
    }

    return { enrichedPlayers: enriched, counts };
  }, [players, submissions]);

  return { enrichedPlayers, counts, loading, error };
}

/**
 * Map submission state → PlayerStatus
 */
function computeStatus(submission: SubmissionRow | null): PlayerStatus {
  if (!submission) return 'writing';
  switch (submission.judging_status) {
    case 'pending':
      return 'submitted';
    case 'in_progress':
      return 'scoring';
    case 'done':
      return 'scored';
    case 'failed':
      return 'failed';
    default:
      // Exhaustive check — ถ้ามี status ใหม่ TypeScript จะเตือน
      return 'submitted';
  }
}
