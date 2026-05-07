// =====================================================
// FILE: src/hooks/useSubmission.ts
// PROJECT: pitch-game
// TASK: T5 — Performance Fix (event filter optimization)
// VERSION: T5-v2
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-07
// PURPOSE: Track submission row ของ player ปัจจุบัน + realtime score updates
//   ให้ submit() action และ expose submission state (รวม scores ตอนพร้อม)
//
// CHANGE LOG:
//   T5-v2 (2026-05-07): P2 — เปลี่ยน subscribe event '*' → 'UPDATE'
//                        Reason: INSERT มาจาก submit ของตัวเอง ผ่าน setSubmission()
//                                ใน doInsert อยู่แล้ว — subscribe ซ้ำเปล่าประโยชน์
//                        Effect: ลด event chatter (~50% events ลดลง)
//   T3-v1 (2026-05-06): หลัง INSERT submission → fetch POST /api/judge (fire-and-forget)
//                        Player UI ไม่ block — server ทำงาน background
//   T1-v3 (2026-05-06): Sync version กับ typed client revert (supabase.ts T1-v3)
//   T1-v2 (2026-05-06): [reverted] Version bump (untyped client compat)
//   T1-v1 (2026-05-06): Initial — fetch + subscribe + submit + autoSubmit
// =====================================================
'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { SubmissionRow } from '@/lib/types';

export interface UseSubmissionResult {
  submission: SubmissionRow | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  submit: (pitch: string) => Promise<boolean>;
  autoSubmit: (pitch: string) => Promise<boolean>;
}

/**
 * Track submission ของ (gameId, playerId)
 *
 * - mount: fetch submission row ที่มีอยู่ (ถ้าเคย submit ไปแล้ว)
 * - subscribe UPDATE only (T5-v2) บน submissions filter โดย player_id
 *   - INSERT ของตัวเองผ่าน setSubmission() ใน doInsert แล้ว
 *   - UPDATE = scores ที่ AI judge เขียนกลับมา
 * - submit(pitch): INSERT พร้อม auto_submitted=false + trigger /api/judge
 * - autoSubmit(pitch): INSERT พร้อม auto_submitted=true + trigger /api/judge
 *
 * submit/autoSubmit เป็น no-op ถ้ามี submission อยู่แล้ว
 * Return true ถ้า success (หรือ submit ไปแล้ว), false ถ้า error
 */
export function useSubmission(
  gameId: string,
  playerId: string | null
): UseSubmissionResult {
  const [submission, setSubmission] = useState<SubmissionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch + subscribe
  useEffect(() => {
    if (!playerId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    // 1. Fetch ครั้งแรก — อาจเป็น null (ยังไม่ได้ submit)
    supabase
      .from('submissions')
      .select('*')
      .eq('game_id', gameId)
      .eq('player_id', playerId)
      .maybeSingle()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return;
        if (fetchError) {
          setError(fetchError.message);
          setLoading(false);
          return;
        }
        setSubmission((data as SubmissionRow) ?? null);
        setLoading(false);
      });

    // 2. Realtime: ฟัง UPDATE only (T5-v2)
    //    INSERT ผ่าน doInsert() → setSubmission() แล้ว
    //    UPDATE = scores จาก AI judge → ต้อง pickup
    const channel = supabase
      .channel(`submission:${playerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissions',
          filter: `player_id=eq.${playerId}`,
        },
        (payload) => {
          if (cancelled) return;
          setSubmission(payload.new as SubmissionRow);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [gameId, playerId]);

  // Helper ภายใน — ใช้ทั้ง submit() + autoSubmit()
  const doInsert = useCallback(
    async (pitch: string, isAuto: boolean): Promise<boolean> => {
      if (!playerId) {
        setError('ยังไม่ได้เข้าร่วมเกม');
        return false;
      }

      // No-op ถ้า submit ไปแล้ว (idempotent)
      if (submission) return true;

      setSubmitting(true);
      setError(null);

      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error: insertError } = await supabase
          .from('submissions')
          .insert({
            game_id: gameId,
            player_id: playerId,
            pitch,
            auto_submitted: isAuto,
          })
          .select()
          .single();

        if (insertError) {
          // Unique constraint violation (race / double-click) — ถือเป็น success
          if (insertError.code === '23505') {
            setSubmitting(false);
            return true;
          }
          setError(insertError.message);
          setSubmitting(false);
          return false;
        }

        const newSubmission = data as SubmissionRow;
        setSubmission(newSubmission);
        setSubmitting(false);

        // T3-v1: fire-and-forget /api/judge
        triggerJudge(newSubmission.id).catch((err) => {
          console.error('[useSubmission] judge trigger failed:', err);
        });

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ส่ง pitch ไม่สำเร็จ');
        setSubmitting(false);
        return false;
      }
    },
    [gameId, playerId, submission]
  );

  const submit = useCallback((pitch: string) => doInsert(pitch, false), [doInsert]);
  const autoSubmit = useCallback((pitch: string) => doInsert(pitch, true), [doInsert]);

  return { submission, loading, submitting, error, submit, autoSubmit };
}

// =====================================================
// Helper: trigger /api/judge (fire-and-forget)
// =====================================================
async function triggerJudge(submissionId: string): Promise<void> {
  const response = await fetch('/api/judge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissionId }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '(no body)');
    throw new Error(`/api/judge returned ${response.status}: ${text}`);
  }
  // Don't need to read response — UPDATE scores มาจาก realtime subscribe แทน
}
