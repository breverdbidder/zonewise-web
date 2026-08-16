'use client'

interface ToolIntroBannerProps {
  title: string
  description: string
  steps: string[]
  tip?: string
}

export default function ToolIntroBanner({ title, description, steps, tip }: ToolIntroBannerProps) {
  return (
    <details className="group max-w-7xl mx-auto mt-4 mx-4 sm:mx-6 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-orange-400 text-sm">ⓘ</span>
          <span className="text-sm font-semibold text-slate-200 truncate">{title}</span>
          <span className="text-xs text-slate-500 hidden sm:inline truncate">— {description}</span>
        </div>
        <span className="text-xs text-slate-400 group-open:hidden shrink-0">How to use ▾</span>
        <span className="text-xs text-slate-400 hidden group-open:inline shrink-0">Hide ▴</span>
      </summary>
      <div className="px-4 pb-4 pt-1 border-t border-slate-800">
        <p className="text-sm text-slate-400 mb-3 sm:hidden">{description}</p>
        <ol className="space-y-1.5">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300">
              <span className="text-orange-400 font-semibold shrink-0">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        {tip && (
          <p className="text-xs text-slate-500 mt-3 border-t border-slate-800 pt-3">
            <span className="text-orange-400/80 font-medium">Tip: </span>
            {tip}
          </p>
        )}
      </div>
    </details>
  )
}
