// =====================================================
// FILE: src/components/presenter/PresenterLobbyScreen.tsx
// PROJECT: pitch-game
// TASK: T4 — Presenter View
// VERSION: T4-v1
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-05-07
// PURPOSE: LOBBY phase on Presenter
//          - QR code (large) + url bar + caption
//          - Live player count
//          - Pill grid of nicknames (newest first, glow on new joins)
//          - Static layout (no auto-scroll) — overflow truncated with "+N more" badge
//
// Dependency: `qrcode.react` (added by T4 — see T4-guide.md Step 3)
//
// CHANGE LOG:
//   T4-v1 (2026-05-07): Initial
// =====================================================

'use client';

import { QRCodeSVG } from 'qrcode.react';
import type { PlayerRow } from '@/lib/types';
import {
  URL_BAR_TEXT,
  URL_BAR_CAPTION,
  QR_TARGET_URL,
  PILL_GRID_MAX,
} from '@/lib/presenter-config';
import { PresenterAmbientBg } from './PresenterAmbientBg';
import { PresenterHeader } from './PresenterHeader';

type Props = {
  players: PlayerRow[];        // sorted DESC by joined_at (newest first)
  newPlayerIds: Set<string>;   // for glow effect
};

export function PresenterLobbyScreen({ players, newPlayerIds }: Props) {
  const total = players.length;
  const visible = players.slice(0, PILL_GRID_MAX);
  const overflowCount = Math.max(0, total - visible.length);

  return (
    <div className="presenter-stage-inner">
      <PresenterAmbientBg />

      <PresenterHeader statusText="LOBBY · WAITING" statusVariant="default" />

      <div className="presenter-lobby-grid">
        {/* LEFT: QR */}
        <div className="presenter-lobby-left">
          <div className="presenter-qr-stage">
            <div className="presenter-qr-glow" />
            <div className="presenter-qr-block">
              <QRCodeSVG
                value={QR_TARGET_URL}
                size={360}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
                marginSize={0}
              />
            </div>
            <div className="presenter-qr-url-bar">{URL_BAR_TEXT}</div>
            <div className="presenter-qr-caption">{URL_BAR_CAPTION}</div>
          </div>
        </div>

        {/* RIGHT: Count + pill grid */}
        <div className="presenter-lobby-right">
          <div className="presenter-count-row">
            <span className="presenter-count-label">ผู้เล่นในห้อง</span>
            <span className="presenter-count-live">LIVE</span>
          </div>
          <div className="presenter-count-num">{total}</div>
          <div className="presenter-count-subtitle">
            {total === 0
              ? 'รอคนเข้าร่วม...'
              : 'คนเข้าร่วมแล้ว — รอเริ่มเกม'}
          </div>

          <div className="presenter-divider" />

          <div className="presenter-pills-header">
            <div className="presenter-pills-title">รายชื่อผู้เล่น</div>
            <div className="presenter-pills-meta">เรียงล่าสุดบนสุด</div>
          </div>

          <div className="presenter-pills-wrap">
            {visible.map((p) => {
              const isNew = newPlayerIds.has(p.id);
              return (
                <div
                  key={p.id}
                  className={`presenter-pill${isNew ? ' presenter-pill--new' : ''}`}
                >
                  {p.nickname}
                </div>
              );
            })}
            {overflowCount > 0 && (
              <div className="presenter-pill presenter-pill--overflow">
                +{overflowCount} คน
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
