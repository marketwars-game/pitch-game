// =====================================================
// FILE: src/hooks/useSoloFlow.ts
// PROJECT: pitch-game
// TASK: T6 — Solo Mode
// VERSION: T6-v1
// CREATED: 2026-05-09
// PURPOSE: State machine for the 4-phase solo flow.
//          WELCOME → WRITING → JUDGING → RESULTS → (loop via reset)
//          Single source of truth for nickname/pitch/submissionId/scores/rank.
//
// CHANGE LOG:
//   T6-v1 (2026-05-09): Initial
// =====================================================

'use client';

import { useState, useCallback, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { LS_KEY_SOLO_NICKNAME, type SubmissionScores } from '@/lib/types';

export type SoloPhase = 'WELCOME' | 'WRITING' | 'JUDGING' | 'RESULTS';

export type SoloFlow = {
  phase: SoloPhase;
  nickname: string;
  pitch: string;
  submissionId: string | null;
  scores: SubmissionScores | null;
  rank: number | null;
  // actions
  startWriting: (nickname: string) => void;
  submitPitch: (pitch: string, autoSubmitted?: boolean) => Promise<void>;
  showResults: (scores: SubmissionScores, rank: number | null) => void;
  reset: () => void;
};

export function useSoloFlow(): SoloFlow {
  const [phase, setPhase] = useState<SoloPhase>('WELCOME');
  const [nickname, setNickname] = useState<string>('');
  const [pitch, setPitch] = useState<string>('');
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [scores, setScores] = useState<SubmissionScores | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  // Autofill nickname from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(LS_KEY_SOLO_NICKNAME);
    if (saved) setNickname(saved);
  }, []);

  const startWriting = useCallback((nick: string) => {
    const trimmed = nick.trim().slice(0, 20);
    if (!trimmed) return;
    setNickname(trimmed);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LS_KEY_SOLO_NICKNAME, trimmed);
    }
    setPitch('');
    setSubmissionId(null);
    setScores(null);
    setRank(null);
    setPhase('WRITING');
  }, []);

  const submitPitch = useCallback(
    async (pitchText: string, autoSubmitted = false) => {
      const trimmed = pitchText.trim();
      // Even empty pitch is allowed when auto-submitted (timer expired)
      if (!autoSubmitted && trimmed.length === 0) return;

      const supabase = getSupabaseBrowserClient();

      // Insert solo_submission
      const { data, error } = await supabase
        .from('solo_submissions')
        .insert({
          nickname,
          pitch: trimmed || '(ไม่ได้เขียน)',
          stock_ticker: 'PLTR',
          auto_submitted: autoSubmitted,
        })
        .select('id')
        .single();

      if (error || !data) {
        // eslint-disable-next-line no-console
        console.error('[useSoloFlow] Insert failed:', error);
        // Stay on WRITING screen — let user retry
        return;
      }

      setPitch(trimmed);
      setSubmissionId(data.id);
      setPhase('JUDGING');

      // Fire-and-forget /api/judge-solo
      void fetch('/api/judge-solo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: data.id }),
      }).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[useSoloFlow] Judge trigger failed:', err);
        // Realtime will still detect status change if server-side judging happens
      });
    },
    [nickname]
  );

  const showResults = useCallback((s: SubmissionScores, r: number | null) => {
    setScores(s);
    setRank(r);
    setPhase('RESULTS');
  }, []);

  const reset = useCallback(() => {
    // Keep nickname for autofill convenience; clear everything else
    setPitch('');
    setSubmissionId(null);
    setScores(null);
    setRank(null);
    setPhase('WELCOME');
  }, []);

  return {
    phase,
    nickname,
    pitch,
    submissionId,
    scores,
    rank,
    startWriting,
    submitPitch,
    showResults,
    reset,
  };
}
