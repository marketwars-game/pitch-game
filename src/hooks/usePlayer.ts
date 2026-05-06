// =====================================================
// FILE: src/hooks/usePlayer.ts
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v2
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: จัดการ player session — localStorage persistence + join action
//          - Mount: load player จาก localStorage (ถ้ามี)
//          - join(nickname) → INSERT players row + เซฟลง localStorage
//          - Reset detection: ถ้า admin ลบ players (full reset) → clear session
//
// CHANGE LOG:
//   T2-v2 (2026-05-06): Add reset detection
//                        Subscribe games.phase changes — เมื่อ phase = LOBBY (จาก state อื่น)
//                        → query player record ตัวเอง → ถ้าไม่เจอ → clear()
//                        → Player View จะกลับไปหน้าใส่ชื่อเล่น
//                        Reason: Admin "เริ่มรอบใหม่" ทำ full reset (ลบ players + submissions)
//                        ทุก player ต้อง re-join ใหม่ — UX clean ทุกรอบ
//   T1-v3 (2026-05-06): Revert v2 cast — typed client (T1-v3) ทำให้ data จาก insert
//                        เป็น PlayerRow โดยตรง ไม่ต้อง cast
//   T1-v2 (2026-05-06): [reverted] Cast insert result เป็น PlayerRow (untyped client)
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
  loading: boolean;       // true ระหว่างอ่าน localStorage บน client mount
  joining: boolean;       // true ระหว่างยิง INSERT
  error: string | null;
  join: (nickname: string) => Promise<void>;
  clear: () => void;
}

/**
 * จัดการ player session สำหรับเกมหนึ่งๆ
 *
 * - Mount: อ่าน localStorage ถ้ามี player_id+nickname+game_id และ game_id ตรงกับปัจจุบัน
 *          → restore session
 * - join(nickname): INSERT players, save ลง localStorage, set session
 * - clear(): ล้าง localStorage (ใช้ตอน reset / debug)
 *
 * Reset detection (T2-v2):
 * - Subscribe games.phase change → เมื่อ phase กลายเป็น LOBBY (จาก phase อื่น)
 *   → query player record ตัวเอง → ถ้าไม่เจอ (admin ลบไปแล้ว) → clear()
 * - การ subscribe นี้รัน "นอกเหนือ" จาก useGameState ที่ component ใช้อยู่
 *   เพื่อให้ usePlayer self-contained — ไม่ต้องรับ game state จาก parent
 */
export function usePlayer(gameId: string): UsePlayerResult {
  const [player, setPlayer] = useState<PlayerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track previous phase เพื่อ detect transition → LOBBY
  const prevPhaseRef = useRef<string | null>(null);

  // Mount: load จาก localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const playerId = localStorage.getItem(LS_KEY_PLAYER_ID);
      const nickname = localStorage.getItem(LS_KEY_PLAYER_NICKNAME);
      const storedGameId = localStorage.getItem(LS_KEY_GAME_ID);

      if (playerId && nickname && storedGameId === gameId) {
        setPlayer({ playerId, nickname, gameId: storedGameId });
      } else if (storedGameId && storedGameId !== gameId) {
        // Session เก่าจากเกมอื่น — ล้างทิ้ง
        localStorage.removeItem(LS_KEY_PLAYER_ID);
        localStorage.removeItem(LS_KEY_PLAYER_NICKNAME);
        localStorage.removeItem(LS_KEY_GAME_ID);
      }
    } catch {
      // localStorage ใช้ไม่ได้ (private mode) — ignore
    }
    setLoading(false);
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
  // Reset detection (T2-v2)
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
