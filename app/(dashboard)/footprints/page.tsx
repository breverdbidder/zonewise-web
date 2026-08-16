import { Building2, Ruler, Layers, ShieldCheck, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Building Footprints | ZoneWise.AI',
  description:
    'AI-detected building footprints and height estimates across Florida — existing structure detection, impervious coverage and massing inputs.',
}

const CAPABILITIES = [
  {
    icon: Building2,
    title: 'Existing structure detection',
    body: 'Know whether a parcel is genuinely vacant before you underwrite it. Footprint count per parcel, derived from imagery rather than from a use code.',
  },
  {
    icon: Ruler,
    title: 'Height estimates',
    body: 'Every footprint carries a height in metres, so existing massing can be compared against what the zoning district actually permits.',
  },
  {
    icon: Layers,
    title: 'Coverage & buildable area',
    body: 'Footprint area against lot area gives real impervious coverage — buildable envelope net of what is already standing, not an empty-lot assumption.',
  },
  {
    icon: ShieldCheck,
    title: 'Licensed for commercial use',
    body: 'Sourced under CDLA Permissive 2.0. No share-alike obligation, unlike the ODbL building datasets commonly used elsewhere.',
  },
]

export default function FootprintsPage() {
  return (
    <div className="min-h-full bg-[#020617] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-[#F59E0B]">
          <Building2 className="h-3.5 w-3.5" /> Building intelligence
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Building footprints &amp; heights
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          AI-detected building outlines with height estimates, joined to Florida parcels. This is
          what turns a zoning envelope into a real feasibility answer — you cannot size an
          opportunity without knowing what is already standing on the site.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {CAPABILITIES.map((c) => (
            <div
              key={c.title}
              className="rounded-lg border p-5"
              style={{ background: '#0d1829', borderColor: 'rgba(30,58,95,0.6)' }}
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E3A5F]">
                <c.icon className="h-4 w-4 text-[#F59E0B]" />
              </div>
              <h2 className="text-sm font-semibold text-white">{c.title}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{c.body}</p>
            </div>
          ))}
        </div>

        <div
          className="mt-8 rounded-lg border p-5"
          style={{ background: '#0d1829', borderColor: 'rgba(245,158,11,0.28)' }}
        >
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
            <h2 className="text-sm font-semibold text-white">Ingestion in progress</h2>
          </div>
          <p className="text-[13px] leading-relaxed text-slate-400">
            61 imagery tiles covering Florida are being processed. Until a county reports coverage
            here, feasibility analysis continues to work from lot geometry and zoning controls
            alone — footprints are additive, never a silent substitute.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
            <span className="font-semibold text-slate-200">On accuracy:</span> these footprints are
            machine-detected from aerial and satellite imagery. Recall is strong in low-density
            areas and weaker in dense urban blocks, and some records carry no confidence score. We
            surface them as a measured input, not as a survey. Verify against the county appraiser
            before relying on a height in an investment decision.
          </p>
        </div>

        <p className="mt-8 font-mono text-[11px] text-slate-600">
          Source: Microsoft GlobalMLBuildingFootprints · CDLA Permissive 2.0 · imagery 2014–2025 ·
          heights in metres
        </p>
      </div>
    </div>
  )
}
