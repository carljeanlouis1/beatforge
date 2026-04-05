import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react'

interface KnobProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  size?: number
  label?: string
  displayValue?: string
}

export function Knob({
  value,
  min = 0,
  max = 1,
  onChange,
  size = 36,
  label,
  displayValue,
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const dragStartValue = useRef(0)

  // Map value to angle: -135 to +135 degrees (270 degree sweep)
  const normalized = (value - min) / (max - min)
  const angle = -135 + normalized * 270

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault()
      dragStartY.current = e.clientY
      dragStartValue.current = value

      const handlePointerMove = (ev: globalThis.PointerEvent) => {
        const dy = dragStartY.current - ev.clientY
        const range = max - min
        const sensitivity = 200
        const newValue = Math.min(max, Math.max(min, dragStartValue.current + (dy / sensitivity) * range))
        onChange(newValue)
      }

      const handlePointerUp = () => {
        document.removeEventListener('pointermove', handlePointerMove)
        document.removeEventListener('pointerup', handlePointerUp)
      }

      document.addEventListener('pointermove', handlePointerMove)
      document.addEventListener('pointerup', handlePointerUp)
    },
    [value, min, max, onChange],
  )

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      )}
      <div
        ref={knobRef}
        className="relative cursor-grab active:cursor-grabbing select-none"
        style={{ width: size, height: size }}
        onPointerDown={handlePointerDown}
      >
        {/* Track ring */}
        <svg viewBox="0 0 36 36" className="w-full h-full">
          {/* Background arc */}
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="3"
            strokeDasharray="66 22"
            strokeLinecap="round"
            transform="rotate(135 18 18)"
          />
          {/* Value arc */}
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
            strokeDasharray={`${normalized * 66} ${88 - normalized * 66}`}
            strokeLinecap="round"
            transform="rotate(135 18 18)"
          />
        </svg>
        {/* Indicator line */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <div
            className="absolute bg-slate-700 rounded-full"
            style={{
              width: 2,
              height: size * 0.28,
              top: 2,
              left: '50%',
              marginLeft: -1,
            }}
          />
        </div>
      </div>
      {displayValue !== undefined && (
        <span className="text-[9px] font-mono text-slate-500 tabular-nums">
          {displayValue}
        </span>
      )}
    </div>
  )
}
