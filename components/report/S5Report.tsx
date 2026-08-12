// Renders the BidDeed S5 18-section property intelligence report as HTML.
// Layout/content mirrors packages/biddeed-mcp/src/report/pdf.js section-for-
// section (the canonical PDF renderer) — this is the HTML twin, not a fork
// of the report math. Data comes from GET /api/report (server-fetched from
// the BidDeed MCP report engine); this component only formats it.
import type { ReactNode } from 'react'
import type { S5TemplateRow } from '@/app/api/report/route'

const BAND_COLOR: Record<string, string> = {
  navy: '#1E3A5F',
  orange: '#F59E0B',
  green: '#16A34A',
  red: '#DC2626',
  amber: '#D97706',
}

type Report = Record<string, any>

function money(val: unknown): string {
  if (val == null || val === '') return 'Pending'
  const n = typeof val === 'object' && val !== null ? (val as any).value : val
  if (n == null) return typeof val === 'object' && val !== null && (val as any).display ? (val as any).display : 'Pending'
  return `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function pct(val: unknown): string {
  return val == null ? 'Pending' : `${(Number(val) * 100).toFixed(1)}%`
}

function safeStr(val: unknown, fallback = 'Pending'): string {
  if (val == null || val === '' || val === 'null') return fallback
  if (typeof val === 'object' && val !== null && (val as any).display) return (val as any).display
  return String(val)
}

function Band({ label, title, color }: { label: string; title: string; color: string | null }) {
  return (
    <div
      className="px-4 py-2 rounded-t-md text-white text-sm font-bold tracking-wide"
      style={{ backgroundColor: BAND_COLOR[color ?? 'navy'] ?? BAND_COLOR.navy }}
    >
      §{label} {title.toUpperCase()}
    </div>
  )
}

function Row({ label, value, alt }: { label: string; value: unknown; alt?: boolean }) {
  return (
    <div className={`flex justify-between px-4 py-2 text-sm ${alt ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-950'}`}>
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-semibold text-slate-900 dark:text-white text-right">{safeStr(value)}</span>
    </div>
  )
}

function TwoCol({ pairs }: { pairs: [string, unknown][] }) {
  return (
    <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800">
      {pairs.map(([l, v], i) => (
        <div key={l} className={`flex justify-between px-3 py-2 text-sm ${i % 4 < 2 ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-950'}`}>
          <span className="text-slate-500 dark:text-slate-400">{l}</span>
          <span className="font-semibold text-slate-900 dark:text-white text-right">{safeStr(v)}</span>
        </div>
      ))}
    </div>
  )
}

function LiabilityNote({ note }: { note?: string | null }) {
  if (!note) return null
  return <p className="px-4 py-2 text-xs italic text-amber-600 dark:text-amber-400">⚠ {note}</p>
}

// ─── Section renderers — keyed by section_key, mirroring pdf.js ────────────
const SECTION_RENDERERS: Record<string, (report: Report) => ReactNode> = {
  subject_identification(report) {
    const cover = report.cover || {}
    const auction = report.auction_listing || {}
    return (
      <>
        <Row label="Address" value={cover.property_address} alt />
        <Row label="County" value={cover.county ? `${String(cover.county).toUpperCase()} County, Florida` : null} />
        <Row label="Case Number" value={cover.case_number} alt />
        <Row label="Sale Type" value={cover.sale_type} />
        <Row label="Auction Date" value={auction.auction_date || cover.auction_date} alt />
        <Row label="Plaintiff" value={auction.plaintiff || cover.plaintiff} />
        <Row label="Assessed Value" value={money(auction.assessed_value)} alt />
        <Row label="Final Judgment" value={money(auction.judgment_amount)} />
        <Row label="Plaintiff Max Bid" value={money(auction.plaintiff_max_bid)} alt />
        <Row label="Gold Standard" value={cover.cert_status || 'Standard'} />
      </>
    )
  },

  value_estimate(report) {
    const value = report.value_estimate
    const cover = report.cover || {}
    if (!value || value.midpoint == null) {
      return <Row label="Value Estimate" value="Pending — parcel not located in fl_parcels" />
    }
    const cb = value.clearing_band
    const mb = value.market_band
    return (
      <>
        <div className="m-3 p-3 rounded bg-amber-50 dark:bg-amber-950/30">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400">EXPECTED CLEARING PRICE (Distressed)</p>
          <p className="text-lg font-bold text-[#1E3A5F] dark:text-white">{cb?.low != null ? `${money(cb.low)} – ${money(cb.high)}` : 'Pending'}</p>
          {cb?.midpoint != null && <p className="text-xs text-slate-500">Midpoint {money(cb.midpoint)}</p>}
        </div>
        <div className="m-3 p-3 rounded bg-green-50 dark:bg-green-950/30">
          <p className="text-xs font-bold text-green-700 dark:text-green-400">RETAIL ARV — OPEN MARKET EXIT VALUE</p>
          <p className="text-lg font-bold text-[#1E3A5F] dark:text-white">{mb?.low != null ? `${money(mb.low)} – ${money(mb.high)}` : 'Pending'}</p>
          {mb?.midpoint != null && (
            <p className="text-xs text-slate-500">
              Midpoint {money(mb.midpoint)} · Investment Grade {cover.investment_grade || '—'} · Shapira Max Bid {money(cover.shapira_max_bid)}
            </p>
          )}
        </div>
        {cover.equity_at_entry_bid != null && (
          <div className="mx-3 mb-3 p-3 rounded bg-green-600 text-white text-sm font-bold">
            Day-1 Equity at Entry Bid: {money(cover.equity_at_entry_bid)} · Equity at Ceiling: {money(cover.equity_at_ceiling)}
          </div>
        )}
        {Array.isArray(value.anchors) && value.anchors.length > 0 && (
          <div className="px-3 pb-2">
            <p className="text-xs font-bold text-slate-500 mb-1">Value Anchors:</p>
            {value.anchors.map((a: any, i: number) => (
              <Row key={a.key} label={a.key.replace(/_/g, ' ')} value={a.value != null ? `${money(a.value)} · ${a.source}` : `Pending — ${a.source}`} alt={i % 2 === 0} />
            ))}
          </div>
        )}
      </>
    )
  },

  market_and_comps(report) {
    const cma = report.cma || {}
    const distressed = report.cma_distressed || {}
    const retailComps: any[] = Array.isArray(cma.comps) ? cma.comps : []
    const auctionComps: any[] = Array.isArray(distressed.comps) ? distressed.comps : []
    return (
      <>
        <p className="px-4 pt-3 pb-1 text-sm font-bold text-[#1E3A5F] dark:text-white">
          LAYER 1 — Auction Market Comps (Distressed)
        </p>
        {distressed.n_county_outcomes > 0 ? (
          <>
            <TwoCol
              pairs={[
                ['County Outcomes', `${distressed.n_county_outcomes} sold (${distressed.since_year}→)`],
                ['Median Clearing Ratio', distressed.median_clearing_ratio_sold_to_assessed ? `${pct(distressed.median_clearing_ratio_sold_to_assessed)} of assessed` : '—'],
                ['Distressed Median $', money(distressed.median_distressed_price)],
                ['Implied Clearing (Subject)', money(distressed.implied_clearing_price_for_subject)],
              ]}
            />
            {auctionComps.map((c, i) => (
              <Row key={i} label={c.address || '—'} value={`Sold ${money(c.sold_amount)} · ${c.clearing_pct_of_assessed != null ? c.clearing_pct_of_assessed + '%' : '—'} · ${c.auction_date ? String(c.auction_date).slice(0, 10) : '—'}`} alt={i % 2 === 0} />
            ))}
          </>
        ) : (
          <Row label="Distressed CMA" value={distressed.note || 'Pending — no auction-cleared comps found for this county/sqft range'} />
        )}
        <p className="px-4 pt-3 pb-1 text-sm font-bold text-[#1E3A5F] dark:text-white">
          LAYER 2 — Retail Market Comps (Open Market ARV)
        </p>
        {retailComps.length > 0 ? (
          <>
            {retailComps.map((c, i) => (
              <Row key={i} label={c.address || c.property_address || 'Address pending'} value={`Sold ${money(c.sale_price1 ?? c.sold_amount)} · ${c.sale_yr1 ?? c.auction_date ?? ''}`} alt={i % 2 === 0} />
            ))}
            {cma.median_sale_price && (
              <p className="px-4 py-2 text-xs text-slate-500">
                Retail stats: median {money(cma.median_sale_price)} · n={cma.n} · dispersion {cma.dispersion_flag || '—'}
              </p>
            )}
          </>
        ) : (
          <Row label="Retail ARV Comps" value={cma.note || 'Pending — no retail comps returned for this parcel'} />
        )}
        {(distressed.implied_clearing_price_for_subject || distressed.median_distressed_price) && cma.median_sale_price && (
          <div className="mx-3 my-2 p-3 rounded bg-green-50 dark:bg-green-950/30 text-sm font-bold text-green-700 dark:text-green-400">
            THE SPREAD: Distressed clearing {money(distressed.implied_clearing_price_for_subject || distressed.median_distressed_price)} → Retail ARV {money(cma.median_sale_price)}
          </div>
        )}
      </>
    )
  },

  transaction_history(report) {
    const tx = report.transaction_history || {}
    return (
      <>
        <Row label="Prior Transfer Date" value={tx.prior_sale_date || 'Pending'} alt />
        <Row label="Prior Transfer Price" value={money(tx.prior_sale_price)} />
        <Row label="Current Owner" value={report.cover?.current_owner || report.auction_listing?.current_owner || 'Pending'} alt />
        <Row label="Homestead Status" value={report.property_record?.homestead_status || 'Pending'} />
      </>
    )
  },

  property_record(report) {
    const prop = report.property_record || {}
    const auction = report.auction_listing || {}
    return (
      <TwoCol
        pairs={[
          ['Property Type', prop.property_type || 'Pending'],
          ['Beds / Baths', `${safeStr(prop.beds)} / ${safeStr(prop.baths)}`],
          ['Living Area', prop.living_area_sqft ? `${prop.living_area_sqft} sqft` : 'Pending'],
          ['Year Built', prop.year_built || 'Pending'],
          ['Lot Size', prop.lot_size_acres ? `${prop.lot_size_acres} ac` : 'Pending'],
          ['Homestead', prop.homestead_status || 'Pending'],
          ['Coordinates', report.cover?.coordinates || 'Pending'],
          ['Auction URL', auction.auction_url || 'Pending'],
        ]}
      />
    )
  },

  context_layers(report) {
    const ctx = report.context_layers || {}
    return (
      <>
        <Row label="Market Grade" value={ctx.market_grade || 'Pending'} alt />
        <Row label="Neighborhood" value={ctx.neighborhood || 'Pending — layer not yet wired for this county'} />
        <Row label="Schools" value={ctx.schools || 'Pending — GreatSchools layer not yet wired'} alt />
        <Row label="Flood Zone" value={ctx.flood_zone || 'Pending — FEMA layer not yet wired; verify Zone X vs AE'} />
        <Row label="Median Income" value={ctx.median_income ? `$${Number(ctx.median_income).toLocaleString()}` : 'Pending'} alt />
      </>
    )
  },

  shapira_ml(report) {
    const ml = report.context_layers?.ml_model || {}
    return (
      <>
        <Row label="Model" value={ml.model_version || 'v14.0 XGBoost'} alt />
        <Row label="Trained" value="2026-05-27 · 137,488 samples · 21 features" />
        <Row label="Accuracy / AUC" value="acc 72.2% · AUC 0.783 · precision 0.716 · recall 0.909 · F1 0.801" alt />
        {typeof ml.probability_third_party_purchase === 'number' ? (
          <p className="px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400">
            NOTE: Live inference probability withheld — a number the model did not produce will not be printed under its name.
          </p>
        ) : (
          <Row label="3rd-Party Probability" value="Withheld — see methodology note above" alt />
        )}
      </>
    )
  },

  zonewise(report) {
    const zw = report.zoning || {}
    return (
      <>
        <Row label="State Parcel (DOR)" value={zw.parcel_id || 'Pending'} alt />
        <Row label="Jurisdiction" value={zw.jurisdiction || 'Pending'} />
        <Row label="DOR Land Use" value={zw.dor_land_use || 'Pending'} alt />
        <Row label="Land Tenure (MH)" value={zw.land_tenure || 'Pending'} />
        <Row label="DOR Just Value" value={money(zw.just_value)} alt />
        <Row label="District Assignment" value={zw.district || 'PENDING — ZoneWise district layer not yet built for this county'} />
        <Row label="ZoneWise Verdict" value={zw.verdict || 'Pending'} alt />
      </>
    )
  },

  bid_card(report) {
    const cover = report.cover || {}
    const opp = report.opinion_of_price_bid_card || {}
    const smb = cover.shapira_max_bid
    const smbVal = typeof smb === 'object' && smb !== null ? smb.value : smb
    return (
      <>
        <div className="m-3 p-3 rounded text-white" style={{ backgroundColor: cover.verdict?.startsWith('BID') ? '#16A34A' : cover.verdict === 'SKIP' ? '#DC2626' : '#D97706' }}>
          <p className="text-2xl font-bold">{cover.verdict || 'PENDING'}</p>
          <p className="text-sm">Investment Grade {cover.investment_grade || '—'}</p>
        </div>
        <TwoCol
          pairs={[
            ['Entry Bid', money(opp.entry_bid || cover.entry_bid)],
            ['Shapira Max Bid', money(smbVal)],
            ['Walk Away Above', money(smbVal)],
            ['Value Midpoint', money(opp.value_midpoint)],
          ]}
        />
      </>
    )
  },

  judgment_encumbrance(report) {
    const j = report.judgment || {}
    const flags: any[] = report.red_flags || []
    return (
      <>
        <Row label="Recorded CFN" value={j.cfn || 'Pending'} alt />
        <Row label="Judgment Amount" value={money(j.judgment_amount)} />
        <Row label="Principal" value={money(j.principal)} alt />
        <Row label="Interest" value={money(j.interest)} />
        <Row label="County Tax" value={money(j.county_tax)} alt />
        <Row label="Hazard Insurance" value={money(j.hazard_insurance)} />
        <Row label="Fees / Costs" value={money(j.fees)} alt />
        {flags.map((f, i) => (
          <div key={i} className={`mx-3 my-1 p-2 border-l-4 text-xs ${f.severity === 'risk' ? 'border-red-600 text-red-700' : f.severity === 'pending' ? 'border-amber-600 text-amber-700' : 'border-green-600 text-green-700'}`}>
            <span className="font-bold">{f.code || f.label || 'FLAG'}</span> {f.detail || f.text || ''}
          </div>
        ))}
      </>
    )
  },

  provenance(report) {
    const prov = report.provenance || {}
    return (
      <>
        <Row label="Data Sources" value={prov.generated_from || 'multi_county_auctions, fl_parcels, zoning_assignments, shapira_models'} alt />
        <Row label="Certification" value={prov.certification_disclosure || 'Pending'} />
        <p className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400">
          {prov.model_disclosure || 'Shapira Models v14.0 XGBoost — probability withheld rather than approximated.'}
        </p>
      </>
    )
  },

  auction_outcome(report) {
    const outcome = report.auction_outcome || {}
    if (outcome.result || outcome.sale_status) {
      return (
        <TwoCol
          pairs={[
            ['Result', outcome.sale_status || outcome.result],
            ['Sale Amount', money(outcome.sale_amount || outcome.winning_bid)],
            ['Winning Bidder', outcome.winning_bidder || '—'],
            ['Buyer Type', outcome.buyer_type || '—'],
            ['Clearing Multiple', outcome.clearing_multiple ? `${outcome.clearing_multiple}×` : '—'],
            ['3rd-Party Predicted', outcome.predicted_third_party ? 'YES' : 'Withheld'],
          ]}
        />
      )
    }
    return (
      <Row
        label="Status"
        value={`Pending — auction scheduled ${report.cover?.auction_date || '—'}. Populates automatically after sale closes.`}
      />
    )
  },
}

interface S5ReportProps {
  template: S5TemplateRow[]
  report: Report
}

export default function S5Report({ template, report }: S5ReportProps) {
  const cover = report.cover || {}
  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-t-lg bg-[#020617] text-white px-5 py-4">
        <p className="text-lg font-bold text-[#F59E0B]">BidDeed.AI</p>
        <p className="text-xs mt-1">PROPERTY INTELLIGENCE REPORT · S5 CLASS</p>
        <p className="text-xs text-slate-400 mt-1">
          {(cover.county || '').toUpperCase()} County, FL · {cover.sale_type || 'Foreclosure'} Sale {cover.auction_date || ''} · {cover.property_address || ''}
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Case {cover.case_number || '—'} · Parcel {cover.parcel_id || '—'}
        </p>
      </div>
      <div className="space-y-4 mt-4">
        {template.map((section) => (
          <div key={section.section_key} className="rounded-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <Band label={section.section_label} title={section.title} color={section.band_color} />
            <div className="divide-y divide-slate-100 dark:divide-slate-900">
              {SECTION_RENDERERS[section.section_key]
                ? SECTION_RENDERERS[section.section_key](report)
                : <Row label="Status" value={`No renderer registered for section_key '${section.section_key}'`} />}
            </div>
            <LiabilityNote note={(section as any).liability_note} />
          </div>
        ))}
      </div>
    </div>
  )
}
