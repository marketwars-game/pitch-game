// =====================================================
// FILE: src/hooks/useSoloBoard.ts
// PROJECT: pitch-game
// TASK: T6 — Solo Mode
// VERSION: T6-v1
// CREATED: 2026-05-09
// PURPOSE: Paginated leaderboard query for /board.
//          - Initial fetch: top 20 ordered by created_at desc (server-side)
//          - Client re-sorts each page by finalScore desc, created_at desc
//          - Load More fetches next 20
//          - 30s tick bump for relative time refresh
//          - Privacy: pitch column never selected
//
// CHANGE LOG:
//   T6-v1 (2026-05-09): Initial
// =====================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';

const PAGE_SIZE = 20;

export type BoardRow = {
  id: string;
  nickname: string;
  finalScore: number;
  createdAt: string;
};

export type BoardState = {
  rows: BoardRow[];
  hasMore: boolean;
  loading: boolean;
  totalCount: number;
  error: string | null;
  /** Bumps every 30s to trigger re-render of relative timestamps. */
  tick: number;
  loadMore: () => void;
  refresh: () => void;
};

export function useSoloBoard(): BoardState {
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const loadingRef = useRef(false);

  const fetchPage = useCallback(async (offset: number, append: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();

    try {
      const { data, error: fetchErr, count } = await supabase
        .from('solo_submissions')
        .select('id, nickname, scores, created_at', { count: 'exact' })
        .eq('judging_status', 'done')
        .not('scores', 'is', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (fetchErr) throw fetchErr;

      type FetchedRow = {
        id: string;
        nickname: string;
        scores: { finalScore?: number } | null;
        created_at: string;
      };

      const mapped: BoardRow[] = ((data as FetchedRow[] | null) ?? [])
        .map((r): BoardRow | null => {
          const fs = r.scores?.finalScore;
          if (fs == null) return null;
          return {
            id: r.id,
            nickname: r.nickname,
            finalScore: fs,
            createdAt: r.created_at,
          };
        })
        .filter((r): r is BoardRow => r !== null);

      // Sort by finalScore desc, then created_at desc (for tie)
      mapped.sort((a, b) => {
        if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
        return b.createdAt.localeCompare(a.createdAt);
      });

      if (append) {
        setRows((prev) => {
          // Re-sort combined list to keep total ordering correct
          const combined = [...prev, ...mapped];
          combined.sort((a, b) => {
            if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
            return b.createdAt.localeCompare(a.createdAt);
          });
          return combined;
        });
      } else {
        setRows(mapped);
      }

      setHasMore((data?.length ?? 0) === PAGE_SIZE);
      if (count != null) setTotalCount(count);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load leaderboard';
      setError(msg);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    void fetchPage(0, false);
  }, [fetchPage]);

  // Bump tick every 30s for relative time refresh
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingRef.current) return;
    void fetchPage(rows.length, true);
  }, [fetchPage, rows.length, hasMore]);

  const refresh = useCallback(() => {
    void fetchPage(0, false);
  }, [fetchPage]);

  return {
    rows,
    hasMore,
    loading,
    totalCount,
    error,
    tick,
    loadMore,
    refresh,
  };
}
