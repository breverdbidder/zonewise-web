const ORANGE = '#F59E0B'

export interface ParamSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  unit?: string
}

export function ParamSlider({ label, value, min, max, step, onChange, unit = '' }: ParamSliderProps) {
  const id = `slider-${label.replace(/\s/g, '-')}`
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-[10px] text-gray-400 w-14 shrink-0">{label}</label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: ORANGE, background: '#334155' }}
      />
      <span className="text-xs font-bold text-white w-12 text-right" aria-live="polite">
        {value}{unit}
      </span>
    </div>
  )
}
