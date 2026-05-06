// =====================================================
// FILE: src/hooks/usePlayer.ts
// PROJECT: pitch-game
// TASK: T1 — Player View + Realtime
// VERSION: T1-v3
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: จัดการ player session — localStorage persistence + join action
//          Mount: load player จาก localStorage (ถ้ามี)
//          join(nickname) → INSERT players row + เซฟลง localStorage
//
// CHANGE LOG:
//   T1-v3 (2026-05-06): Revert v2 cast — typed client (T1-v3) ทำให้ data จาก insert
//                        เป็น PlayerRow โดยตรง ไม่ต้อง cast
//   T1-v2 (2026-05-06): [reverted] Cast insert result เป็น PlayerRow (untyped client)
//   T1-v1 (2026-05-06): Initial — load/join/clear flow ผ่าน localStorage
// =====================================================
'use client';

import { useEffect, useState, useCallback } from 'react';
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
 * หมายเหตุ: validate ว่า game_id ที่เก็บไว้ตรงกับ gameId arg ปัจจุบัน
 * ถ้า user เคย join เกมอื่น session จะถูกล้าง
 */
export function usePlayer(gameId: string): UsePlayerResult {
  const [player, setPlayer] = useState<PlayerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return { player, loading, joining, error, join, clear };
}
