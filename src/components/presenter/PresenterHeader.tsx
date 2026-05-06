// =====================================================
// FILE: src/components/presenter/PresenterHeader.tsx
// PROJECT: pitch-game
// TASK: T4 — Presenter View
// VERSION: T4-v1
// CREATED: 2026-05-07
// LAST MODIFIED: 2026-05-07
// PURPOSE: Unified header for all in-game phases:
//          - left: Dime logo (with conic halo) + brand text
//          - right: status pill (variant: default/warn/red) + animated dot
//
//          Uses /public/dime-d.png as logo asset.
//
// CHANGE LOG:
//   T4-v1 (2026-05-07): Initial
// =====================================================

'use client';

import Image from 'next/image';

export type StatusVariant = 'default' | 'warn' | 'red';

type Props = {
  statusText: string;            // e.g. "LOBBY · WAITING"
  statusVariant?: StatusVariant; // default = green dot
};

export function PresenterHeader({ statusText, statusVariant = 'default' }: Props) {
  return (
    <header className="presenter-header">
      <div className="presenter-brand">
        <div className="presenter-brand-logo-wrap">
          <Image
            src="/dime-d.png"
            alt="Dime"
            width={56}
            height={56}
            className="presenter-brand-logo"
            priority
          />
        </div>
        <div className="presenter-brand-text">
          <div className="presenter-brand-eyebrow">KKP DIME</div>
          <div className="presenter-brand-title">AI Stock Pitch Battle</div>
        </div>
      </div>
      <div className={`presenter-status presenter-status--${statusVariant}`}>
        <span className="presenter-status-dot" />
        {statusText}
      </div>
    </header>
  );
}
