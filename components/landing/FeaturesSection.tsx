import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Map, Gavel, Building2, MessageSquare, FileText, Activity } from 'lucide-react'

const features = [
  {
    icon: Gavel,
    title: 'Auction Intelligence',
    description: '245K+ Florida foreclosure records. County-by-county auction calendars, bid history, and max-bid formula built in.',
  },
  {
    icon: Map,
    title: 'Zoning Explorer',
    description: 'Interactive choropleth map of 10.8M FL parcels. Zoning overlays, ZHVI heatmaps, and neighborhood comps.',
  },
  {
    icon: Building2,
    title: 'Development Feasibility',
    description: 'Buildable envelope math, 3D massing engine, and pro forma scenarios for any Florida parcel.',
  },
  {
    icon: MessageSquare,
    title: 'AI Zoning Chat',
    description: 'Cited answers on permitted uses, setbacks, and height limits from our own Supabase-backed RAG pipeline.',
  },
  {
    icon: FileText,
    title: 'Zoning Reports',
    description: 'One-click PDF zoning reports with HBU analysis, comp sales, and legal lot coverage.',
  },
  {
    icon: Activity,
    title: 'Deal Scoring',
    description: 'Max-bid formula: (ARV×70%)−Repairs−$10K−MIN($25K,15%×ARV). Scored against live auction data.',
  },
]

export function FeaturesSection() {
  return (
    <section className="bg-[#020617] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything a Florida investor needs
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Built by a licensed FL broker and GC with 10+ years in Brevard County foreclosures.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card
              key={f.title}
              className="border-slate-800 bg-slate-900/50 hover:border-[#F59E0B]/30 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1E3A5F]">
                  <f.icon className="h-5 w-5 text-[#F59E0B]" />
                </div>
                <CardTitle className="text-white text-base">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
