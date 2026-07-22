export default function FloatingInput({
  label, type = 'text', value, onChange, required = false,
  autoComplete, rightSlot, as = 'input', children
}) {
  const isSelect = as === 'select'

  const baseFieldClasses =
    'peer w-full px-4 pt-6 pb-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 appearance-none'

  const fieldStyle = {
    background: 'var(--dark)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    '--tw-ring-color': 'color-mix(in srgb, var(--primary) 35%, transparent)'
  }

  // A select always shows a value, so its label stays permanently in the
  // "floated" (small, top) position instead of sitting over the text.
  const labelClasses = isSelect
    ? 'absolute left-4 top-2 text-xs pointer-events-none transition-all duration-150'
    : `absolute left-4 top-4 text-sm pointer-events-none transition-all duration-150
       peer-focus:top-2 peer-focus:text-xs
       peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs`

  return (
    <div className='relative'>
      {isSelect ? (
        <select value={value} onChange={onChange} required={required}
          className={baseFieldClasses} style={fieldStyle}>
          {children}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          placeholder=' '
          className={baseFieldClasses}
          style={fieldStyle}
        />
      )}
      <label className={labelClasses} style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      {rightSlot && (
        <div className='absolute right-4 top-1/2 -translate-y-1/2'>
          {rightSlot}
        </div>
      )}
    </div>
  )
}
