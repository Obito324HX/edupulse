export default function PulseMark({ size = 36 }) {
  return (
    <div
      className='flex items-center justify-center rounded-xl shrink-0'
      style={{ width: size, height: size, background: 'var(--primary)' }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox='0 0 36 20' fill='none'>
        <path
          d='M0 10 H8 L11 2 L16 18 L20 6 L23 10 H36'
          stroke='white'
          strokeWidth='2.4'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='pulse-line'
        />
      </svg>
    </div>
  )
}
