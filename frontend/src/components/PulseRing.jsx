import { useState, useEffect } from 'react'

/* The Pulse Ring: a single composite score (attendance + grades, minus
 * a penalty for unresolved alerts) instead of a decorative squiggle.
 * Sweeps in once on mount, then rests with a slow heartbeat — respects
 * prefers-reduced-motion via the .pulse-ring-beat class in index.css.
 * `value === null` renders an honest "not enough data yet" state
 * instead of a fake number, for brand new institutions.
 */
export default function PulseRing({ value, size = 128, stroke = 9, label = 'Pulse', sub, color, showLabel = true }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120)
    return () => clearTimeout(t)
  }, [])

  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const hasValue = value !== null && value !== undefined
  const offset = hasValue ? c - (value / 100) * c : c
  const accent = color || 'var(--primary)'

  return (
    <div
      className='relative flex items-center justify-center shrink-0 pulse-ring-beat'
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill='none' stroke='var(--border)' strokeWidth={stroke} />
        {hasValue && (
          <circle
            cx={size / 2} cy={size / 2} r={r} fill='none' stroke={accent} strokeWidth={stroke}
            strokeLinecap='round' strokeDasharray={c}
            strokeDashoffset={mounted ? offset : c}
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 6px color-mix(in srgb, ${accent} 40%, transparent))` }}
          />
        )}
      </svg>
      <div className='absolute flex flex-col items-center px-2'>
        <span className='font-mono-data' style={{ fontSize: size * 0.24, color: 'var(--text)', fontWeight: 600, lineHeight: 1 }}>
          {hasValue ? value : '—'}
        </span>
        {showLabel && (
          <span className='text-center' style={{ fontSize: size * 0.052, color: 'var(--text-muted)', marginTop: 4, maxWidth: size * 0.75 }}>
            {hasValue ? label : 'Not enough data yet'}
          </span>
        )}
        {showLabel && hasValue && sub && (
          <span style={{ fontSize: size * 0.045, color: accent, marginTop: 2, fontWeight: 600 }}>{sub}</span>
        )}
      </div>
    </div>
  )
}
