// =====================================================
// FILE: src/components/admin/AdminAuthGate.tsx
// PROJECT: pitch-game
// TASK: T2 — Admin Panel + Phase Control
// VERSION: T2-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Password screen — first thing admin sees
//          Mesh bg + auth card with password input + submit button
//
// CHANGE LOG:
//   T2-v1 (2026-05-06): Initial — apply T1 mockup design language
// =====================================================
'use client';

import { useState, FormEvent } from 'react';

export interface AdminAuthGateProps {
  loggingIn: boolean;
  error: string | null;
  onLogin: (password: string) => void | Promise<void>;
}

export function AdminAuthGate({ loggingIn, error, onLogin }: AdminAuthGateProps) {
  const [password, setPassword] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loggingIn) return;
    onLogin(password);
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, Inter, "SF Pro Display", "Segoe UI", sans-serif',
      }}
    >
      {/* Mesh background */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 60% 40% at 20% 0%,    rgba(59,125,255,0.27), transparent 60%),
            radial-gradient(ellipse 50% 35% at 90% 15%,   rgba(139,92,246,0.22), transparent 60%),
            radial-gradient(ellipse 70% 40% at 50% 100%,  rgba(93,245,145,0.13), transparent 60%)
          `,
          animation: 'pg-mesh-shift 16s ease-in-out infinite alternate',
        }}
      />

      {/* Auth card */}
      <form
        onSubmit={handleSubmit}
        style={{
          position: 'relative',
          zIndex: 2,
          width: 360,
          maxWidth: '100%',
          background: 'rgba(28,28,30,0.85)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: 32,
          textAlign: 'center',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            color: '#8B5CF6',
          }}
        >
          🔒
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#3B7DFF',
            letterSpacing: 1.4,
            marginBottom: 4,
            textTransform: 'uppercase',
          }}
        >
          DIME × AI · MONEY EXPO 2026
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#fff',
            marginBottom: 6,
            letterSpacing: -0.3,
          }}
        >
          Admin Access
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#71717A',
            marginBottom: 22,
          }}
        >
          Pitch Game Admin Panel
        </div>

        <label
          style={{
            display: 'block',
            fontSize: 12,
            color: '#A1A1AA',
            marginBottom: 6,
            fontWeight: 500,
            textAlign: 'left',
          }}
        >
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loggingIn}
          autoFocus
          placeholder="ใส่ password"
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#1c1c1e',
            color: '#fff',
            fontSize: 16,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />

        <button
          type="submit"
          disabled={loggingIn || !password}
          style={{
            width: '100%',
            padding: '16px 20px',
            borderRadius: 10,
            border: 'none',
            fontSize: 15,
            fontWeight: 700,
            cursor: loggingIn || !password ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            marginTop: 14,
            minHeight: 52,
            background: loggingIn || !password ? '#2a2a2c' : '#5DF591',
            color: loggingIn || !password ? '#52525B' : '#062b13',
            transition: 'all 0.15s',
          }}
        >
          {loggingIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>

        {error && (
          <div
            style={{
              fontSize: 12,
              color: '#FF5C8A',
              marginTop: 10,
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}
      </form>

      {/* Inline keyframes (Next.js: scoped via attribute selector) */}
      <style>{`
        @keyframes pg-mesh-shift {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-6px, 4px) scale(1.04); }
          100% { transform: translate(4px, -4px) scale(1.02); }
        }
      `}</style>
    </main>
  );
}
