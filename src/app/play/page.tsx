// FILE: src/app/play/page.tsx — Player View (Placeholder)
// VERSION: T0-v1 — Placeholder; จะ implement ใน T1
// LAST MODIFIED: 2026-05-05
// HISTORY:
//   T0-v1: Initial — placeholder page

export default function PlayPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="mb-2 text-xs uppercase tracking-widest text-white/40">
        DIME x AI
      </div>
      <h1 className="mb-2 text-3xl font-medium" style={{ color: 'var(--dime-cyan)' }}>
        AI Stock Pitch Battle
      </h1>
      <p className="mb-8 text-sm text-white/40">MONEY EXPO 2026</p>

      <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-8 max-w-sm">
        <div className="mb-2 text-2xl">🚧</div>
        <div className="text-sm text-white/60">Player View</div>
        <div className="mt-1 text-xs text-white/30">
          Placeholder — coming in T1
        </div>
      </div>
    </main>
  );
}
