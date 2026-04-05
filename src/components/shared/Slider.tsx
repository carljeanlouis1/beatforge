interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  orientation?: 'horizontal' | 'vertical'
  label?: string
  displayValue?: string
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  orientation = 'horizontal',
  label,
  displayValue,
}: SliderProps) {
  const isVertical = orientation === 'vertical'

  return (
    <div
      className={`flex items-center gap-2 ${isVertical ? 'flex-col' : 'flex-row'}`}
    >
      {label && (
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
          {label}
        </span>
      )}
      <div className={`relative ${isVertical ? 'h-full flex items-center' : 'w-full'}`}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`
            slider-input
            ${isVertical ? 'slider-vertical' : 'w-full'}
            appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-runnable-track]:h-1.5
            [&::-webkit-slider-runnable-track]:rounded-full
            [&::-webkit-slider-runnable-track]:bg-slate-200
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3.5
            [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-indigo-500
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-webkit-slider-thumb]:-mt-[5px]
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:duration-100
            [&::-webkit-slider-thumb]:hover:scale-125
          `}
          style={
            isVertical
              ? {
                  writingMode: 'vertical-lr' as const,
                  direction: 'rtl',
                  height: '100%',
                  width: 24,
                }
              : undefined
          }
        />
      </div>
      {displayValue !== undefined && (
        <span className="text-[10px] font-mono text-slate-500 tabular-nums whitespace-nowrap">
          {displayValue}
        </span>
      )}
    </div>
  )
}
