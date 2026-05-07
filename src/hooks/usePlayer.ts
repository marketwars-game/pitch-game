// =====================================================
// FILE: src/hooks/usePlayer.ts
// PROJECT: pitch-game
// TASK: T5 — Player Fix (Stale Session)
// VERSION: T5-v3
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-07
// PURPOSE: จัดการ player session — localStorage persistence + join action
//   - Mount: load player จาก localStorage + ✨ DB validation (T5-v3)
//   - join(nickname) → INSERT players row + เซฟลง localStorage
//   - Reset detection: ถ้า admin ลบ players (full reset) → clear session
//
// CHANGE LOG:
//   T5-v3 (2026-05-07): Fix stale session bug — player ที่เคย join รอบเก่า
//                        แต่ไม่ได้ online ตอน admin reset → กลับมาเปิดใหม่ติด stale localStorage
//                        Solution: เพิ่ม DB validation บน mount
//                        - Load playerId จาก localStorage
//                        - Query DB ทันทีว่า players row นี้ยังอยู่หรือเปล่า
//                        - ถ้าไม่มี → clear → user เข้า "empty lobby" ได้ปกติ
//                        - ถ้ามี → restore session ตามเดิม
//                        Reset detection (T2-v2) ยังเก็บไว้ — handle real-time reset
//                        Mount validation handle stale session ที่ miss real-time event
//   T2-v2 (2026-05-06): Add reset detection (real-time phase transition)
//   T1-v3 (2026-05-06): Revert v2 cast — typed client
//   T1-v2 (2026-05-06): [reverted] Cast insert result เป็น PlayerRow
//   T1-v1 (2026-05-06): Initial — load/join/clear flow ผ่าน localStorage
// =====================================================
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import {
  LS_KEY_PLAYER_ID,
  LS_KEY_PLAYER_NICKNAME,
  LS_KEY_GAME_ID,
  NICKNAME_MAX_LENGTH,
} from '@/lib/types';

export interface PlayerSession {
  playerId: string;
  nickname: string;
  gameId: string;
}

export interface UsePlayerResult {
  player: PlayerSession | null;
  loading: boolean; // true ระหว่างอ่าน localStorage + validate กับ DB บน client mount
  joining: boolean; // true ระหว่างยิง INSERT
  error: string | null;
  join: (nickname: string) => Promise<void>;
  clear: () => void;
}

/**
 * จัดการ player session สำหรับเกมหนึ่งๆ
 *
 * Mount flow (T5-v3):
 *   1. อ่าน localStorage → ถ้ามี player_id+nickname+game_id ตรงกัน → เก็บ candidate
 *   2. Query DB validate ว่า players row นี้ยังอยู่จริงหรือไม่
 *      - ถ้ามี → setPlayer(candidate) → restore session
 *      - ถ้าไม่มี → clear localStorage → setPlayer(null) → กลับเข้า empty lobby
 *   3. setLoading(false)
 *
 * join(nickname): INSERT players, save ลง localStorage, set session
 * clear(): ล้าง localStorage (ใช้ตอน reset / debug)
 *
 * Reset detection (T2-v2):
 *   - Subscribe games.phase change → เมื่อ phase กลายเป็น LOBBY (จาก phase อื่น)
 *     → query player record ตัวเอง → ถ้าไม่เจอ (admin ลบไปแล้ว) → clear()
 *   - Handle real-time case: device อยู่ online ตอน admin reset
 *
 * Mount validation + Reset detection ทำงานร่วมกัน:
 *   - Online ตอน reset → reset detection trigger → clear ทันที
 *   - Offline ตอน reset → กลับมาเปิดใหม่ → mount validation trigger → clear
 */
export function usePlayer(gameId: string): UsePlayerResult {
  const [player, setPlayer] = useState<PlayerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track previous phase เพื่อ detect transition → LOBBY
  const prevPhaseRef = useRef<string | null>(null);

  // ============================================================
  // Mount: load จาก localStorage + validate กับ DB (T5-v3)
  // ============================================================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    const hydrate = async () => {
      // Step 1: read localStorage
      let candidate: PlayerSession | null = null;
      try {
        const playerId = localStorage.getItem(LS_KEY_PLAYER_ID);
        const nickname = localStorage.getItem(LS_KEY_PLAYER_NICKNAME);
        const storedGameId = localStorage.getItem(LS_KEY_GAME_ID);

        if (playerId && nickname && storedGameId === gameId) {
          candidate = { playerId, nickname, gameId: storedGameId };
        } else if (storedGameId && storedGameId !== gameId) {
          // Session เก่าจากเกมอื่น — ล้างทิ้ง
          localStorage.removeItem(LS_KEY_PLAYER_ID);
          localStorage.removeItem(LS_KEY_PLAYER_NICKNAME);
          localStorage.removeItem(LS_KEY_GAME_ID);
        }
      } catch {
        // localStorage ใช้ไม่ได้ (private mode) — ignore
      }

      // No candidate — nothing to validate
      if (!candidate) {
        if (!cancelled) setLoading(false);
        return;
      }

      // Step 2: validate กับ DB (T5-v3)
      // Query players ที่ id = candidate.playerId AND game_id = gameId
      // - ถ้าเจอ → restore session
      // - ถ้าไม่เจอ → admin ลบไปแล้ว (reset round) → clear localStorage
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error: queryError } = await supabase
          .from('players')
          .select('id, nickname, game_id')
          .eq('id', candidate.playerId)
          .eq('game_id', gameId)
          .maybeSingle();

        if (cancelled) return;

        if (queryError) {
          // Network/DB error → conservative: keep candidate (restore session)
          // Reason: ปลอดภัยกว่าการลบ session ผิดเวลา network ติดๆดับๆ
          console.warn(
            '[usePlayer] DB validation failed, keeping local session:',
            queryError.message
          );
          setPlayer(candidate);
        } else if (!data) {
          // Player record ไม่มีใน DB → stale session → clear
          try {
            localStorage.removeItem(LS_KEY_PLAYER_ID);
            localStorage.removeItem(LS_KEY_PLAYER_NICKNAME);
            localStorage.removeItem(LS_KEY_GAME_ID);
          } catch {
            // ignore
          }
          setPlayer(null);
        } else {
          // Player record exists — restore session (use DB nickname as source of truth)
          setPlayer({
            playerId: data.id,
            nickname: data.nickname,
            gameId: data.game_id,
          });
        }
      } catch (err) {
        // Unexpected error — fall back to candidate (don't disrupt user)
        if (cancelled) return;
        console.warn(
          '[usePlayer] DB validation threw, keeping local session:',
          err instanceof Error ? err.message : err
        );
        setPlayer(candidate);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const join = useCallback(
    async (rawNickname: string) => {
      const nickname = rawNickname.trim().slice(0, NICKNAME_MAX_LENGTH);
      if (!nickname) {
        setError('กรุณาใส่ชื่อเล่น');
        return;
      }

      setJoining(true);
      setError(null);

      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error: insertError } = await supabase
          .from('players')
          .insert({ game_id: gameId, nickname })
          .select()
          .single();

        if (insertError || !data) {
          setError(insertError?.message ?? 'เข้าร่วมเกมไม่สำเร็จ');
          setJoining(false);
          return;
        }

        const session: PlayerSession = {
          playerId: data.id,
          nickname: data.nickname,
          gameId: data.game_id,
        };

        try {
          localStorage.setItem(LS_KEY_PLAYER_ID, session.playerId);
          localStorage.setItem(LS_KEY_PLAYER_NICKNAME, session.nickname);
          localStorage.setItem(LS_KEY_GAME_ID, session.gameId);
        } catch {
          // localStorage ใช้ไม่ได้ — session ยังใช้ได้แต่จะหายตอน refresh
        }

        setPlayer(session);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'เข้าร่วมเกมไม่สำเร็จ');
      } finally {
        setJoining(false);
      }
    },
    [gameId]
  );

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(LS_KEY_PLAYER_ID);
      localStorage.removeItem(LS_KEY_PLAYER_NICKNAME);
      localStorage.removeItem(LS_KEY_GAME_ID);
    } catch {
      // ignore
    }
    setPlayer(null);
    setError(null);
  }, []);

  // ============================================================
  // Reset detection (T2-v2 — handles real-time reset while online)
  // Subscribe games.phase — ถ้า phase เปลี่ยนเป็น LOBBY (จาก phase อื่น)
  // → admin อาจเพิ่งกด "เริ่มรอบใหม่" → ลบ players ทั้งหมด
  // → query player record ตัวเอง → ถ้าไม่เจอ → clear()
  // ============================================================
  useEffect(() => {
    if (!player) {
      prevPhaseRef.current = null;
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    // 1. อ่าน phase ปัจจุบันก่อน เพื่อ baseline
    supabase
      .from('games')
      .select('phase')
      .eq('id', gameId)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.phase) {
          prevPhaseRef.current = data.phase;
        }
      });

    // 2. Subscribe UPDATE event ของ game นี้
    const channel = supabase
      .channel(`player-reset-detect:${player.playerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        async (payload) => {
          if (cancelled) return;

          const newPhase = (payload.new as { phase?: string })?.phase;
          const oldPhase = prevPhaseRef.current;

          // Detect transition: any phase → LOBBY (signal of "เริ่มรอบใหม่")
          if (newPhase === 'LOBBY' && oldPhase && oldPhase !== 'LOBBY') {
            // Validate ว่า player record ของเรายังมีอยู่
            try {
              const { data: playerData } = await supabase
                .from('players')
                .select('id')
                .eq('id', player.playerId)
                .maybeSingle();

              if (cancelled) return;

              if (!playerData) {
                // Record ถูกลบแล้ว → clear session → กลับหน้าใส่ชื่อเล่น
                clear();
              }
            } catch {
              // ถ้า query fail — ไม่ทำอะไร (ปลอดภัยกว่าการ clear ผิด)
            }
          }

          if (newPhase) {
            prevPhaseRef.current = newPhase;
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [player, gameId, clear]);

  return { player, loading, joining, error, join, clear };
}
