// =====================================================
// FILE: src/hooks/usePlayer.ts
// PROJECT: pitch-game
// TASK: T5 — Performance Fix (Eliminate duplicate games subscription)
// VERSION: T5-v4
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-07
// PURPOSE: จัดการ player session — localStorage persistence + join action
//   - Mount: load player จาก localStorage + DB validation
//   - join(nickname) → INSERT players row + เซฟลง localStorage
//   - Reset detection: ถ้า admin ลบ players (full reset) → clear session
//
// CHANGE LOG:
//   T5-v4 (2026-05-07): P1 — Eliminate duplicate games table subscription
//                        Reason: useGameState ก็ subscribe games table อยู่แล้ว
//                        การมี subscription ของ usePlayer ซ้ำ = -100 channels บน free tier
//                        Solution: รับ currentPhase เป็น argument จาก parent
//                        - Effect listen การเปลี่ยน currentPhase prop แทน DB subscription
//                        - Trigger reset detection เมื่อ phase เปลี่ยนเป็น LOBBY (any → LOBBY)
//                        - Logic เดียวกัน แค่ event source ต่างกัน (DB → React props)
//   T5-v3 (2026-05-07): Fix stale session bug — mount-time DB validation
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
import type { GamePhase } from '@/lib/types';

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
 * Reset detection (T5-v4):
 *   - รับ currentPhase prop จาก parent (ที่ subscribe useGameState อยู่แล้ว)
 *   - Effect listen การเปลี่ยน currentPhase: any → LOBBY = "เริ่มรอบใหม่"
 *   - Validate ว่า player record ยังอยู่ → ถ้าไม่อยู่ → clear()
 *
 * Why: T2-v2 ใช้ DB subscription ซ้ำกับ useGameState — กิน 2x channel quota
 *
 * @param gameId — game ที่ใช้
 * @param currentPhase — phase ปัจจุบัน จาก useGameState (parent provides)
 */
export function usePlayer(gameId: string, currentPhase: GamePhase | null): UsePlayerResult {
  const [player, setPlayer] = useState<PlayerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track previous phase เพื่อ detect transition → LOBBY
  const prevPhaseRef = useRef<GamePhase | null>(null);

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
          // Player record exists — restore session
          setPlayer({
            playerId: data.id,
            nickname: data.nickname,
            gameId: data.game_id,
          });
        }
      } catch (err) {
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
  // Reset detection (T5-v4 — uses currentPhase prop, no DB subscription)
  // เปลี่ยนจาก T2-v2: subscribe games table → ใช้ phase prop จาก parent
  // เหตุผล: useGameState subscribe games อยู่แล้ว → ไม่ต้องซ้ำ
  // Effect: เมื่อ currentPhase เปลี่ยนเป็น LOBBY (จาก phase อื่น)
  //   → admin reset → query player record → ถ้าไม่เจอ → clear()
  // ============================================================
  useEffect(() => {
    if (!player) {
      prevPhaseRef.current = null;
      return;
    }

    // Initial set baseline (skip detection ครั้งแรก)
    if (prevPhaseRef.current === null) {
      prevPhaseRef.current = currentPhase;
      return;
    }

    const oldPhase = prevPhaseRef.current;
    const newPhase = currentPhase;

    // Detect transition: any phase → LOBBY (signal of "เริ่มรอบใหม่")
    if (newPhase === 'LOBBY' && oldPhase && oldPhase !== 'LOBBY') {
      let cancelled = false;

      const checkPlayerExists = async () => {
        try {
          const supabase = getSupabaseBrowserClient();
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
      };

      checkPlayerExists();

      // No subscription cleanup needed — เป็น one-shot async check
      // แต่เก็บ cancelled flag ให้ unmount safe
      return () => {
        cancelled = true;
      };
    }

    // Update prevPhase ทุกครั้ง (ทำหลัง detection เพื่อไม่ลบ history)
    prevPhaseRef.current = newPhase;
  }, [player, currentPhase, clear]);

  return { player, loading, joining, error, join, clear };
}
