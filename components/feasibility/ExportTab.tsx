'use client'

import type { SiteData } from '@/types/feasibility'
import { COLORS } from '@/lib/feasibility/constants'
import { Card } from './ui'

interface ExportTabProps {
  site: SiteData
}

const EXPORTS = [
  { icon: '📄', title: 'PDF Report', desc: 'Full feasibility study: site, zoning, market, comps, pro forma', ready: true },
  { icon: '📊', title: 'Excel Pro Forma', desc: 'Editable development model with sensitivity tables', ready: true },
  { icon: '🖼️', title: 'Investor Deck', desc: '10-slide presentation with maps, massing, and returns', ready: true },
  { icon: '📐', title: '3D Massing PNG', desc: 'Satellite overlay with building envelope render', ready: false },
  { icon: '📋', title: 'DOCX Memo', desc: 'Investment committee memo with executive summary', ready: true },
]

export default function ExportTab({ site }: ExportTabProps) {
  return (
    <div className="max-w-2xl">
      <Card className="p-6">
        <div className="text-base font-bold text-slate-900 mb-1">Export Feasibility Package</div>
        <div className="text-[13px] text-slate-500 mb-5">
          Generate investor-ready deliverables for {site.address}
        </div>
        {EXPORTS.map((exp) => (
          <div key={exp.title} className="flex items-center py-3.5 border-b border-slate-50">
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900">{exp.icon} {exp.title}</div>
              <div className="text-xs text-slate-500">{exp.desc}</div>
            </div>
            <button
              className={`px-5 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer transition-colors ${
                exp.ready
                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              disabled={!exp.ready}
            >
              {exp.ready ? 'Generate' : 'Coming Q2'}
            </button>
          </div>
        ))}
      </Card>

      <div
        className="mt-4 rounded-xl p-4"
        style={{ background: COLORS.brandLight, border: `1px solid ${COLORS.brand}30` }}
      >
        <div className="text-xs font-semibold mb-1" style={{ color: COLORS.brandDark }}>💬 NLP Export (Coming Soon)</div>
        <div className="text-xs text-slate-500 leading-relaxed italic">
          &ldquo;Generate a PDF feasibility report for {site.address} comparing garden apartment vs townhome scenarios&rdquo;
          — ZoneWise will generate the report from a single chat message.
        </div>
      </div>
    </div>
  )
}
