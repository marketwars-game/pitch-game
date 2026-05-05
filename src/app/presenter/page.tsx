// FILE: src/app/presenter/page.tsx — Presenter View (Placeholder)
// VERSION: T0-v1 — Placeholder; จะ implement ใน T4
// LAST MODIFIED: 2026-05-05
// HISTORY:
//   T0-v1: Initial — placeholder page

export default function PresenterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12 text-center">
      <div className="mb-2 text-sm uppercase tracking-[0.3em] text-white/30">
        DIME x AI — MONEY EXPO 2026
      </div>
      <h1 className="mb-4 text-6xl font-medium" style={{ color: 'var(--dime-cyan)' }}>
        AI Stock Pitch Battle
      </h1>

      <div className="mt-12 rounded-xl border border-white/10 bg-white/5 px-12 py-10 max-w-2xl">
        <div className="mb-2 text-4xl">🚧</div>
        <div className="text-xl text-white/60">Presenter View</div>
        <div className="mt-1 text-sm text-white/30">
          Placeholder — coming in T4
        </div>
      </div>
    </main>
  );
}
