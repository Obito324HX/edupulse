export default function PulseLogo({ size = 32 }) {
  return (
    <div
      className='rounded-lg flex items-center justify-center flex-shrink-0'
      style={{ width: size, height: size, background: 'var(--primary)' }}
    >
      <svg
        width={size * 0.68}
        height={size * 0.68}
        viewBox='0 0 32 32'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M2 16H9L12 6L18 26L21 16H30'
          stroke='var(--on-primary)'
          strokeWidth='2.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </div>
  )
}
