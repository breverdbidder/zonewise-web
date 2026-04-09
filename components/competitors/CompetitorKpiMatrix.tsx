// components/competitors/CompetitorKpiMatrix.tsx
// Battle Cards Sprint S0a — categorized KPI comparison grid.
// Drives off lib/kpi-data.ts (the 308-KPI source of truth) + competitor profile's
// parity/advantage/gap KPI code arrays.

import { STATIC_KPIS, type KPI } from '@/lib/kpi-data'
import type { CompetitorProfile, KpiMatrixRow, RowOutcome } from '@/types/competitors'

interface Props {
  competitor: CompetitorProfile
}

// Build a lookup map once for O(1) code → KPI resolution
const KPI_BY_CODE: Map<string, KPI> = new Map(STATIC_KPIS.map((k) => [k.kpi_code, k]))

function buildMatrixRows(competitor: CompetitorProfile): KpiMatrixRow[] {
  const rows: KpiMatrixRow[] = []

  // Parity rows
  for (const code of competitor.parity_kpi_codes) {
    const kpi = KPI_BY_CODE.get(code)
    if (!kpi) continue
    rows.push({
      kpi_code: kpi.kpi_code,
      kpi_name: kpi.kpi_name,
      category: kpi.category,
      subcategory: kpi.subcategory,
      description: kpi.description,
      outcome: 'PARITY',
      is_exclusive: kpi.is_exclusive,
    })
  }

  // Advantage rows
  for (const code of competitor.advantage_kpi_codes) {
    const kpi = KPI_BY_CODE.get(code)
    if (!kpi) continue
    rows.push({
      kpi_code: kpi.kpi_code,
      kpi_name: kpi.kpi_name,
      category: kpi.category,
      subcategory: kpi.subcategory,
      description: kpi.description,
      outcome: 'ADVANTAGE',
      is_exclusive: kpi.is_exclusive,
    })
  }

  // Gap rows — these codes may not exist in STATIC_KPIS yet (Q2 2026 build targets).
  // Render them with a synthesized name from the code itself so parity stays honest.
  for (const code of competitor.gap_kpi_codes) {
    const kpi = KPI_BY_CODE.get(code)
    if (kpi) {
      rows.push({
        kpi_code: kpi.kpi_code,
        kpi_name: kpi.kpi_name,
        category: kpi.category,
        subcategory: kpi.subcategory,
        description: kpi.description,
        outcome: 'GAP',
        is_exclusive: false,
      })
    } else {
      // Synthesized placeholder for "build target" codes
      const prettyName = code
        .replace(/^ZON-/, '')
        .replace(/-/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
      rows.push({
        kpi_code: code,
        kpi_name: prettyName,
        category: 'Zoning',
        subcategory: 'Roadmap',
        description: 'Build target for Q2 2026 — tracked in PROPZONE-COMPARISON-SPEC.md',
        outcome: 'GAP',
        is_exclusive: false,
      })
    }
  }

  return rows
}

function OutcomeTag({ outcome }: { outcome: RowOutcome }) {
  if (outcome === 'PARITY') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
        <span aria-hidden="true">⚖</span> PARITY
      </span>
    )
  }
  if (outcome === 'ADVANTAGE') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-2 py-0.5 text-[10px] font-bold text-[#F59E0B]">
        <span aria-hidden="true">★</span> ZONEWISE ONLY
      </span>
    )
  }
  if (outcome === 'GAP') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-rose-900/40 bg-rose-950/30 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
        <span aria-hidden="true">◷</span> ROADMAP Q2 2026
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-500">
      TIE
    </span>
  )
}

export function CompetitorKpiMatrix({ competitor }: Props) {
  const rows = buildMatrixRows(competitor)

  // Group by category, preserving the canonical category order
  const CATEGORY_ORDER = [
    'Property', 'Zoning', 'Auction', 'Financial', 'Liens', 'ML',
    'Physical', 'Investment', 'Demographics', 'Market', 'Comps',
    'HBU', 'CMA', 'Risk', 'Red Flags', 'Development', 'Environmental',
    'Ownership',
  ]
  const byCategory = new Map<string, KpiMatrixRow[]>()
  for (const row of rows) {
    const list = byCategory.get(row.category) ?? []
    list.push(row)
    byCategory.set(row.category, list)
  }

  const parity = rows.filter((r) => r.outcome === 'PARITY').length
  const advantage = rows.filter((r) => r.outcome === 'ADVANTAGE').length
  const gap = rows.filter((r) => r.outcome === 'GAP').length

  return (
    <section
      aria-labelledby="kpi-matrix-heading"
      className="rounded-xl border border-slate-800 bg-slate-900/40 p-6"
    >
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id="kpi-matrix-heading"
          className="text-xs font-bold uppercase tracking-wider text-slate-400"
        >
          KPI Parity Matrix — {rows.length} data points compared
        </h2>
        <div className="flex flex-wrap gap-3 text-[11px]">
          <span className="text-slate-500">
            <span className="font-bold text-slate-300">{parity}</span> parity
          </span>
          <span className="text-slate-500">
            <span className="font-bold text-[#F59E0B]">{advantage}</span> ZoneWise only
          </span>
          {gap > 0 && (
            <span className="text-slate-500">
              <span className="font-bold text-rose-400">{gap}</span> roadmap
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {CATEGORY_ORDER.filter((cat) => byCategory.has(cat)).map((cat) => {
          const catRows = byCategory.get(cat)!
          return (
            <div key={cat}>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {cat} <span className="font-normal text-slate-600">({catRows.length})</span>
              </h3>
              <ul className="divide-y divide-slate-800/60 rounded-lg border border-slate-800 bg-slate-950/40">
                {catRows.map((row) => (
                  <li
                    key={row.kpi_code}
                    className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-slate-600">
                        {row.kpi_code}
                      </div>
                      <div className="text-sm font-semibold text-white">{row.kpi_name}</div>
                      {row.description && (
                        <div className="mt-0.5 text-xs text-slate-500">{row.description}</div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <OutcomeTag outcome={row.outcome} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
