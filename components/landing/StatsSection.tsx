const stats = [
  { value: '245K+', label: 'Auction records' },
  { value: '10.8M', label: 'FL parcels' },
  { value: '67', label: 'Florida counties' },
  { value: '93.3%', label: 'Brevard zoning coverage' },
]

export function StatsSection() {
  return (
    <section className="border-y border-slate-800 bg-slate-900/30 py-16">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl sm:text-4xl font-bold text-[#F59E0B] mb-1">{s.value}</div>
              <div className="text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
