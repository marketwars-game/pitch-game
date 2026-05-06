// =====================================================
// FILE: src/hooks/usePhaseControl.ts
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v2
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Phase control actions for Admin Panel
//          - startWriting: LOBBY → WRITING + set timestamps
//          - closeWriting: WRITING → JUDGING + close timer
//          - revealResults(autoDefaultIds): JUDGING → RESULTS + auto-default failed
//          - startNextRound: RESULTS → LOBBY (FULL RESET — delete data)
//          - applyStock: UPDATE games.stock (ใช้ตอน LOBBY)
//
// CHANGE LOG:
//   T2-v2 (2026-05-06): Pivot to single-round model
//                        - startNextRound() = FULL RESET (delete players + submissions)
//                        - ไม่ +1 round_number อีก (อยู่ที่ 1 ตลอด)
//                        - Player View จะ detect การ reset ผ่าน phase change → LOBBY
//                          แล้วตรวจว่า player record ของตัวเองยังอยู่มั้ย
//                        - Reason: stale localStorage + round mismatch ก่อให้เกิด FK errors
//                          การลบทุกอย่างทำให้ state เริ่มจาก clean slate ทุกครั้ง
//   T2-v1 (2026-05-06): Initial
// =====================================================
'use client';

import { useCallback, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import {
  AUTO_DEFAULT_SCORE,
  DEFAULT_GAME_CONFIG,
  type GameConfig,
  type GameRow,
  type StockData,
} from '@/lib/types';

export interface UsePhaseControlResult {
  busy: boolean;
  error: string | null;
  startWriting: () => Promise<void>;
  closeWriting: () => Promise<void>;
  revealResults: (autoDefaultSubmissionIds: string[]) => Promise<void>;
  startNextRound: () => Promise<void>;
  applyStock: (stock: StockData) => Promise<void>;
}

/**
 * Phase control actions for one game row
 *
 * @param game - current game row (มี config + round_number)
 */
export function usePhaseControl(game: GameRow | null): UsePhaseControlResult {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrap = useCallback(
    async (action: () => Promise<void>) => {
      if (!game) {
        setError('ไม่พบ game');
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await action();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเปลี่ยน phase';
        setError(msg);
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [game]
  );

  // ============================================================
  // LOBBY → WRITING
  // ============================================================
  const startWriting = useCallback(
    async () =>
      wrap(async () => {
        if (!game) return;
        const supabase = getSupabaseBrowserClient();
        const config: GameConfig = game.config ?? DEFAULT_GAME_CONFIG;

        const startedAt = new Date();
        const endsAt = new Date(
          startedAt.getTime() + config.writingTimeSeconds * 1000
        );

        const { error: updateError } = await supabase
          .from('games')
          .update({
            phase: 'WRITING',
            writing_started_at: startedAt.toISOString(),
            writing_ends_at: endsAt.toISOString(),
          })
          .eq('id', game.id);

        if (updateError) throw new Error(updateError.message);
      }),
    [game, wrap]
  );

  // ============================================================
  // WRITING → JUDGING
  // ============================================================
  const closeWriting = useCallback(
    async () =>
      wrap(async () => {
        if (!game) return;
        const supabase = getSupabaseBrowserClient();

        const { error: updateError } = await supabase
          .from('games')
          .update({
            phase: 'JUDGING',
            writing_ends_at: new Date().toISOString(),
          })
          .eq('id', game.id);

        if (updateError) throw new Error(updateError.message);
      }),
    [game, wrap]
  );

  // ============================================================
  // JUDGING → RESULTS (with auto-default for failed players)
  // ============================================================
  const revealResults = useCallback(
    async (autoDefaultSubmissionIds: string[]) =>
      wrap(async () => {
        if (!game) return;
        const supabase = getSupabaseBrowserClient();

        // 1. Auto-default failed/scoring submissions ที่ admin เลือก
        if (autoDefaultSubmissionIds.length > 0) {
          const { error: updateSubError } = await supabase
            .from('submissions')
            .update({
              scores: AUTO_DEFAULT_SCORE,
              judging_status: 'done',
              auto_defaulted: true,
            })
            .in('id', autoDefaultSubmissionIds);

          if (updateSubError) throw new Error(updateSubError.message);
        }

        // 2. Update game phase → RESULTS
        const { error: updateGameError } = await supabase
          .from('games')
          .update({ phase: 'RESULTS' })
          .eq('id', game.id);

        if (updateGameError) throw new Error(updateGameError.message);
      }),
    [game, wrap]
  );

  // ============================================================
  // RESULTS → LOBBY (FULL RESET — T2-v2)
  // ============================================================
  // ลบ submissions + players ของ game ทั้งหมด → กลับ LOBBY
  // Player View จะ detect ผ่าน phase change → LOBBY → validate player record
  // ถ้าไม่เจอ → clear localStorage → กลับหน้า "ใส่ชื่อเล่น"
  // ============================================================
  const startNextRound = useCallback(
    async () =>
      wrap(async () => {
        if (!game) return;
        const supabase = getSupabaseBrowserClient();

        // 1. ลบ submissions ของ game นี้ (ลบก่อน เพราะมี FK ไป players)
        const { error: deleteSubError } = await supabase
          .from('submissions')
          .delete()
          .eq('game_id', game.id);

        if (deleteSubError) throw new Error(deleteSubError.message);

        // 2. ลบ players ของ game นี้
        const { error: deletePlayersError } = await supabase
          .from('players')
          .delete()
          .eq('game_id', game.id);

        if (deletePlayersError) throw new Error(deletePlayersError.message);

        // 3. Reset game state → LOBBY
        const { error: updateError } = await supabase
          .from('games')
          .update({
            phase: 'LOBBY',
            stock: null,
            writing_started_at: null,
            writing_ends_at: null,
          })
          .eq('id', game.id);

        if (updateError) throw new Error(updateError.message);
      }),
    [game, wrap]
  );

  // ============================================================
  // Apply stock (LOBBY only)
  // ============================================================
  const applyStock = useCallback(
    async (stock: StockData) =>
      wrap(async () => {
        if (!game) return;
        const supabase = getSupabaseBrowserClient();

        const { error: updateError } = await supabase
          .from('games')
          .update({ stock })
          .eq('id', game.id);

        if (updateError) throw new Error(updateError.message);
      }),
    [game, wrap]
  );

  return {
    busy,
    error,
    startWriting,
    closeWriting,
    revealResults,
    startNextRound,
    applyStock,
  };
}
