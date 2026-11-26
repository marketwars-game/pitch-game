// =====================================================
// FILE: src/hooks/usePresenterSound.ts
// PROJECT: pitch-game
// TASK: T11 — LINE หาพี่ชัวร์ (DIME x BU · FinTech & Digital Investment)
// VERSION: T11-v2
// CREATED: 2026-11-26
// LAST MODIFIED: 2026-11-26
// PURPOSE: ตัวจัดการเสียงของจอใหญ่ — ปลดล็อก autoplay + SFX + BGM crossfade + mute
//          ยกมาจาก market-wars hooks/useDisplaySound.ts (B16a-v2) เพิ่ม mute
//          - ใช้ HTMLAudioElement ล้วน ไม่มี dependency ใหม่
//          - ทุกจุดกัน error: ไฟล์หาย / autoplay ถูกบล็อก = เงียบ เกมเดินต่อ
//          - ไม่แตะ Supabase / game state
//
// CHANGE LOG:
//   T11-v2 (2026-11-26): playBgm รับ volume (ปรับความดังเพลงเดิมได้) + stopSfx (ตัดรัวกลองตอนชื่อเด้ง)
//   T11-v1 (2026-11-26): Initial
// =====================================================
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BGM_FILES,
  SFX_FILES,
  BGM_VOLUME,
  SFX_VOLUME,
  BGM_FADE_MS,
  type BgmKey,
  type SfxKey,
} from '@/lib/sound';

const FADE_STEP_MS = 50;

export type PresenterSound = {
  isUnlocked: boolean;
  muted: boolean;
  unlock: () => void;
  playSfx: (key: SfxKey) => void;
  /** volume ไม่ใส่ = BGM_VOLUME · key เดิมแต่ volume ใหม่ = ปรับความดังอย่างเดียว */
  playBgm: (key: BgmKey, volume?: number) => void;
  /** หยุด SFX ที่กำลังเล่น (ใช้ตัดเสียงรัวกลองตอนชื่อเด้ง) */
  stopSfx: (key: SfxKey) => void;
  stopBgm: () => void;
  toggleMute: () => void;
};

export function usePresenterSound(): PresenterSound {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const bgmRef = useRef<Partial<Record<BgmKey, HTMLAudioElement>>>({});
  const sfxRef = useRef<Partial<Record<SfxKey, HTMLAudioElement>>>({});
  const currentBgm = useRef<BgmKey | null>(null);
  const currentBgmVol = useRef(BGM_VOLUME);
  const fadeTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // สร้าง audio element ครั้งเดียว (client เท่านั้น) + preload
  useEffect(() => {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
    (Object.keys(BGM_FILES) as BgmKey[]).forEach((k) => {
      const a = new Audio(BGM_FILES[k]);
      a.loop = true;
      a.preload = 'auto';
      a.volume = 0;
      bgmRef.current[k] = a;
    });
    (Object.keys(SFX_FILES) as SfxKey[]).forEach((k) => {
      const a = new Audio(SFX_FILES[k]);
      a.preload = 'auto';
      a.volume = SFX_VOLUME;
      sfxRef.current[k] = a;
    });
    const bgm = bgmRef.current;
    const sfx = sfxRef.current;
    const timers = fadeTimers.current;
    return () => {
      Object.values(bgm).forEach((a) => a && a.pause());
      Object.values(sfx).forEach((a) => a && a.pause());
      Object.values(timers).forEach((t) => clearInterval(t));
    };
  }, []);

  const fadeTo = useCallback(
    (el: HTMLAudioElement, target: number, done?: () => void) => {
      const key = el.src;
      if (fadeTimers.current[key]) clearInterval(fadeTimers.current[key]);
      const steps = Math.max(1, Math.round(BGM_FADE_MS / FADE_STEP_MS));
      const start = el.volume;
      const delta = (target - start) / steps;
      let i = 0;
      fadeTimers.current[key] = setInterval(() => {
        i++;
        el.volume = Math.min(1, Math.max(0, start + delta * i));
        if (i >= steps) {
          clearInterval(fadeTimers.current[key]);
          delete fadeTimers.current[key];
          el.volume = Math.min(1, Math.max(0, target));
          if (done) done();
        }
      }, FADE_STEP_MS);
    },
    []
  );

  // ปลดล็อก autoplay — ต้องเรียกภายใน user gesture (กด SPACE / คลิก ที่หน้า landing)
  const unlock = useCallback(() => {
    if (typeof window === 'undefined') return;
    const all: HTMLAudioElement[] = [
      ...(Object.values(bgmRef.current) as HTMLAudioElement[]),
      ...(Object.values(sfxRef.current) as HTMLAudioElement[]),
    ];
    all.forEach((a) => {
      if (!a) return;
      const restore = a.volume;
      a.volume = 0;
      try {
        const p = a.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            // ถ้า element นี้กลายเป็น BGM ที่กำลังเล่นอยู่ → ปล่อยให้เล่นต่อ
            const activeKey = currentBgm.current;
            if (activeKey && bgmRef.current[activeKey] === a) return;
            a.pause();
            a.currentTime = 0;
            a.volume = restore;
          }).catch(() => {
            a.volume = restore;
          });
        }
      } catch {
        a.volume = restore;
      }
    });
    setIsUnlocked(true);
  }, []);

  const playBgm = useCallback(
    (key: BgmKey, volume: number = BGM_VOLUME) => {
      if (typeof window === 'undefined') return;
      if (currentBgm.current === key) {
        // เพลงเดิม — ปรับความดังอย่างเดียว (ถ้าเปลี่ยน)
        if (currentBgmVol.current !== volume) {
          currentBgmVol.current = volume;
          const cur = bgmRef.current[key];
          if (cur && !mutedRef.current) fadeTo(cur, volume);
        }
        return;
      }
      currentBgmVol.current = volume;
      const next = bgmRef.current[key];
      const prevKey = currentBgm.current;
      const prev = prevKey ? bgmRef.current[prevKey] : null;
      currentBgm.current = key;
      if (next) {
        next.volume = 0;
        next.play().catch(() => {});
        fadeTo(next, mutedRef.current ? 0 : volume);
      }
      if (prev && prev !== next) {
        fadeTo(prev, 0, () => {
          prev.pause();
          prev.currentTime = 0;
        });
      }
    },
    [fadeTo]
  );

  const playSfx = useCallback((key: SfxKey) => {
    if (typeof window === 'undefined' || mutedRef.current) return;
    const el = sfxRef.current[key];
    if (!el) return;
    try {
      el.currentTime = 0;
      el.volume = SFX_VOLUME;
      el.play().catch(() => {});
    } catch {
      // ไฟล์หาย/เล่นไม่ได้ → เงียบ ไม่พัง
    }
  }, []);

  const stopSfx = useCallback((key: SfxKey) => {
    const el = sfxRef.current[key];
    if (!el) return;
    try {
      el.pause();
      el.currentTime = 0;
    } catch {
      // เงียบ
    }
  }, []);

  const stopBgm = useCallback(() => {
    const key = currentBgm.current;
    const cur = key ? bgmRef.current[key] : null;
    if (cur) {
      fadeTo(cur, 0, () => {
        cur.pause();
        cur.currentTime = 0;
      });
    }
    currentBgm.current = null;
  }, [fadeTo]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    const key = currentBgm.current;
    const cur = key ? bgmRef.current[key] : null;
    if (cur) fadeTo(cur, next ? 0 : currentBgmVol.current);
    if (next) {
      (Object.values(sfxRef.current) as HTMLAudioElement[]).forEach((a) => a && a.pause());
    }
  }, [fadeTo]);

  return { isUnlocked, muted, unlock, playSfx, stopSfx, playBgm, stopBgm, toggleMute };
}
