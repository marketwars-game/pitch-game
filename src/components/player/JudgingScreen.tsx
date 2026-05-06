// =====================================================
// FILE: src/components/player/JudgingScreen.tsx
// PROJECT: pitch-game
// TASK: T1 — Player View + Realtime
// VERSION: T1-v1
// CREATED: 2026-05-06
// LAST MODIFIED: 2026-05-06
// PURPOSE: Judging screen — รองรับ 2 states จาก mockup-v5:
//          State 6: waiting result (player submit แล้ว, AI ประมวลผล — neural network)
//          State 7: not playing (ไม่ได้ submit — faded "ไม่ได้แข่งรอบนี้")
//
// CHANGE LOG:
//   T1-v1 (2026-05-06): Initial — neural network SVG + status dots + not-playing variant
// =====================================================
'use client';

interface JudgingScreenProps {
  variant: 'waiting' | 'not-playing';
}

export function JudgingScreen({ variant }: JudgingScreenProps) {
  if (variant === 'not-playing') {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px 8px',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#1c1c1e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            opacity: 0.6,
            marginBottom: 16,
          }}
        >
          👀
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#A1A1AA',
            marginBottom: 8,
            letterSpacing: '-0.3px',
          }}
        >
          ไม่ได้แข่งรอบนี้
        </div>
        <div style={{ fontSize: 13, color: '#A1A1AA', lineHeight: 1.55 }}>
          รอชมผลการแข่งขัน
          <br />
          บนจอใหญ่ได้เลย
        </div>
      </div>
    );
  }

  // ----- variant === 'waiting' -----
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '24px 8px',
      }}
    >
      <NeuralNetworkAnimation />

      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#FFFFFF',
          marginBottom: 6,
          letterSpacing: '-0.3px',
          animation: 'pulse 1.6s ease-in-out infinite',
        }}
      >
        AI กำลังประมวลผล
      </div>
      <div style={{ fontSize: 13, color: '#A1A1AA', lineHeight: 1.55, marginBottom: 14 }}>
        กรรมการทั้ง 3 กำลังอ่าน Pitch ของคุณ
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          fontSize: 10,
        }}
      >
        <StatusDot color="#8B5CF6" label="Analyst" />
        <StatusDot color="#FF8C42" label="Creative" />
        <StatusDot color="#FF5C8A" label="Communicator" />
      </div>
    </div>
  );
}

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        color: '#A1A1AA',
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          animation: 'live-pulse 1.4s ease-in-out infinite',
        }}
      />
      <span style={{ color }}>{label}</span>
    </div>
  );
}

// =====================================================
// Neural Network animation (3 personas + center pitch node)
// =====================================================
function NeuralNetworkAnimation() {
  return (
    <div style={{ width: 200, height: 200, margin: '0 auto 20px', position: 'relative' }}>
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {/* เส้นเชื่อมหลัก */}
        {[
          ['100', '100', '40', '40'],
          ['100', '100', '160', '40'],
          ['100', '100', '100', '170'],
          ['40', '40', '160', '40'],
          ['40', '40', '100', '170'],
          ['160', '40', '100', '170'],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={1}
            fill="none"
          />
        ))}

        {/* เส้นประภายใน */}
        {[
          ['100', '100', '60', '120'],
          ['100', '100', '140', '120'],
          ['100', '100', '70', '60'],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={`d-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={1}
            strokeDasharray="2 3"
            fill="none"
          />
        ))}

        {/* Pulse particles */}
        <circle r={3} fill="#8B5CF6" filter="drop-shadow(0 0 6px #8B5CF6)">
          <animateMotion dur="1.4s" repeatCount="indefinite" path="M100,100 L40,40" />
        </circle>
        <circle r={3} fill="#FF8C42" filter="drop-shadow(0 0 6px #FF8C42)">
          <animateMotion dur="1.4s" repeatCount="indefinite" begin="0.4s" path="M100,100 L160,40" />
        </circle>
        <circle r={3} fill="#FF5C8A" filter="drop-shadow(0 0 6px #FF5C8A)">
          <animateMotion dur="1.4s" repeatCount="indefinite" begin="0.8s" path="M100,100 L100,170" />
        </circle>
        <circle r={2.5} fill="#8B5CF6" filter="drop-shadow(0 0 6px #8B5CF6)">
          <animateMotion dur="1.6s" repeatCount="indefinite" begin="0.2s" path="M40,40 L160,40" />
        </circle>
        <circle r={2.5} fill="#FF5C8A" filter="drop-shadow(0 0 6px #FF5C8A)">
          <animateMotion dur="1.6s" repeatCount="indefinite" begin="1.0s" path="M160,40 L100,170" />
        </circle>

        {/* Persona nodes (animated glow ผ่าน SVG animate) */}
        <circle
          cx="40"
          cy="40"
          r="7"
          fill="#8B5CF6"
          stroke="#8B5CF6"
          style={{ filter: 'drop-shadow(0 0 8px #8B5CF6)' }}
        >
          <animate attributeName="r" values="6;8;6" dur="1.4s" repeatCount="indefinite" />
        </circle>
        <circle
          cx="160"
          cy="40"
          r="7"
          fill="#FF8C42"
          stroke="#FF8C42"
          style={{ filter: 'drop-shadow(0 0 8px #FF8C42)' }}
        >
          <animate attributeName="r" values="6;8;6" dur="1.4s" begin="0.4s" repeatCount="indefinite" />
        </circle>
        <circle
          cx="100"
          cy="170"
          r="7"
          fill="#FF5C8A"
          stroke="#FF5C8A"
          style={{ filter: 'drop-shadow(0 0 8px #FF5C8A)' }}
        >
          <animate attributeName="r" values="6;8;6" dur="1.4s" begin="0.8s" repeatCount="indefinite" />
        </circle>

        {/* Micro nodes ภายใน */}
        {[
          [60, 120, 3],
          [140, 120, 3],
          [70, 60, 3],
          [130, 60, 3],
          [50, 90, 2.5],
          [150, 90, 2.5],
        ].map(([cx, cy, r], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="#2a2a2c"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={1.5}
          />
        ))}

        {/* Center node (pitch ของผู้เล่น) */}
        <circle
          cx="100"
          cy="100"
          r="9"
          fill="#5DF591"
          stroke="#5DF591"
          style={{ filter: 'drop-shadow(0 0 10px #5DF591)' }}
        />

        {/* Labels */}
        <text x="40" y="25" textAnchor="middle" fill="#8B5CF6" fontSize="9" fontWeight="700">
          ANALYST
        </text>
        <text x="160" y="25" textAnchor="middle" fill="#FF8C42" fontSize="9" fontWeight="700">
          CREATIVE
        </text>
        <text x="100" y="190" textAnchor="middle" fill="#FF5C8A" fontSize="9" fontWeight="700">
          COMMUNICATOR
        </text>
      </svg>
    </div>
  );
}
