// The EduPulse mark: a typographic wordmark with a single living dot as the
// word separator, instead of an illustrated icon. The dot beats at a slow,
// resting-heart-rate pace (~1.15s) rather than a frantic blink, and is the
// only signature element -- see /mnt/user-data/outputs/edupulse-wordmark-direction.html
// for the full rationale sheet this was approved from.
export default function PulseWordmark({ size = 22, showTagline = false, stacked = false, className = '' }) {
  const dotSize = size * 0.15
  return (
    <div className={`flex ${stacked ? 'flex-col items-center gap-1' : 'items-center'} ${className}`}>
      <span
        className='inline-flex items-baseline shrink-0'
        style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: size, color: 'var(--text)', whiteSpace: 'nowrap', lineHeight: 1 }}
      >
        Edu
        <span
          aria-hidden='true'
          className='pulse-wordmark-dot'
          style={{
            display: 'inline-block',
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: 'var(--primary-bright)',
            margin: `0 ${dotSize * 0.55}px`,
            transform: 'translateY(-0.32em)',
            animation: 'pulse-dot-beat 1.15s cubic-bezier(.4,0,.2,1) infinite'
          }}
        />
        <span style={{ fontStyle: 'italic', fontWeight: 500, color: 'var(--primary-bright)' }}>Pulse</span>
      </span>
      {showTagline && (
        <span
          className='font-mono-data'
          style={{ fontSize: size * 0.24, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--text-faint)' }}
        >
          School Management
        </span>
      )}
    </div>
  )
}
