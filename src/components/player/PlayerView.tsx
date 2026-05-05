// =====================================================
// FILE: src/components/player/PlayerView.tsx
// PROJECT: pitch-game
// TASK: T0 — Infra Setup (refactored T0-v2)
// VERSION: T0-v2
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Player View main component — placeholder for T1 expansion.
//          In T1 will subscribe to games.phase and render appropriate
//          phase screen (LobbyScreen / WritingScreen / JudgingScreen / ResultsScreen).
//
// CHANGE LOG:
//   T0-v2 (2026-05-06): Initial extraction from src/app/play/page.tsx
// =====================================================
export function PlayerView() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="mb-2 text-xs uppercase tracking-widest text-white/40">
        DIME x AI
      </div>
      <h1
        className="mb-2 text-3xl font-medium"
        style={{ color: 'var(--dime-cyan)' }}
      >
        AI Stock Pitch Battle
      </h1>
      <p className="mb-8 text-sm text-white/40">MONEY EXPO 2026</p>

      <div className="max-w-sm rounded-xl border border-white/10 bg-white/5 px-6 py-8">
        <div className="mb-2 text-2xl">🚧</div>
        <div className="text-sm text-white/60">Player View</div>
        <div className="mt-1 text-xs text-white/30">
          Placeholder — coming in T1
        </div>
      </div>
    </main>
  );
}
