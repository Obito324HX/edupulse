import { useEffect, useRef, useState } from 'react'

/* Draws itself once on mount, then rests -- used only on the login
 * screen so it means something (a genuine one-time reveal) rather than
 * looping as background wallpaper.
 */
export default function PulseECG({ w = 92, h = 20, stroke = 'var(--primary)' }) {
  const ref = useRef(null)
  const [len, setLen] = useState(0)

  useEffect(() => {
    if (ref.current) setLen(ref.current.getTotalLength())
  }, [])

  const d = `M0,${h * 0.5} L${w * 0.12},${h * 0.5} L${w * 0.17},${h * 0.15} L${w * 0.22},${h * 0.85} L${w * 0.27},${h * 0.5} L${w * 0.38},${h * 0.5} L${w * 0.43},${h * 0.28} L${w * 0.48},${h * 0.72} L${w * 0.53},${h * 0.5} L${w},${h * 0.5}`

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill='none'>
      <path
        ref={ref}
        d={d}
        stroke={stroke}
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
        className={len ? 'ecg-draw' : ''}
        style={{ strokeDasharray: len, strokeDashoffset: len }}
      />
    </svg>
  )
}
