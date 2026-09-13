// Renders the BidDeed SIGNAL$ Property Report (18 sections) as HTML.
// Layout/content mirrors packages/biddeed-mcp/src/report/pdf.js section-for-
// section (the canonical PDF renderer) — this is the HTML twin, not a fork
// of the report math. Data comes from GET /api/report (server-fetched from
// the BidDeed MCP report engine); this component only formats it.
//
// 2026-09-11 parity pass (cli-anything-biddeed #20287, defects E1–E5):
//  - context_layers reads the composer's OBJECTS (neighborhood.*, fema.*,
//    schools.*, nearby_places.*) exactly like pdf.js — no more "[object Object]".
//  - shapira_ml is data-driven; the probability prints ONLY when the composer
//    has passed the validation gate (numeric probability and withheld !== true —
//    the composer never emits a print_probability flag); otherwise WITHHELD
//    with the gate named. Never the retired v14.0 text.
//  - 2026-09-11 evening: POI per-class rows (#20290), NCES schools format
//    (#20291), executive summary block (#20293), rental line + DOR value
//    history rows (#20339), clearing-ratio sparkline (#20338), report sha256
//    row (#20336) — each mirrors the pdf.js strings verbatim.
//  - rehab_estimate renderer added (SSOT row §REHAB existed with no handler).
//  - judgment_encumbrance renders report.title_search blocks 1–9 like pdf.js
//    (#20254 / #20270): header, vesting, chain (gated on delivered), tax,
//    mortgages, other encumbrances, lien hierarchy, additional comments,
//    other-property instruments, disclosed limits.
//  - Band colours = biddeed.ai SSOT palette (#0A2540 navy, #005EB8 brand).
//
// 2026-09-11 kill-list gate (cli-anything-biddeed #20240 → PR #20312): the
// component runs applyKillListGate() over the raw /report/json payload before
// any section renders — see the gate block below. Withheld model → SIGNAL$
// Max Bid 'Hidden', ML row 'Withheld — model not validated on verified
// outcomes', §18 Ceiling Call omitted, executive-summary bid clause dropped.
import { Fragment, type ReactNode } from 'react'
import type { S5TemplateRow } from '@/app/api/report/route'

const BAND_COLOR: Record<string, string> = {
  navy: '#0A2540',
  orange: '#005EB8',
  green: '#16A34A',
  red: '#DC2626',
  amber: '#D97706',
}

type Report = Record<string, any>

// ─── Kill-list gate (cli-anything-biddeed #20240 → PR #20312, Ariel's
// 2026-09-11 ruling: the kill list covers PAID reports, every renderer).
// This twin is fed the raw /report/json composer output, which still carries
// the SIGNAL$ Max Bid, the sold-probability and the §18 ceiling call the web
// report (src/worker.js applyKillListGate) and the canonical PDF (pdf.js
// applyKillListGate) strip whenever context_layers.ml_model.withheld is true.
// Same predicate, same stripped fields, same fallback text — 'Hidden' for a
// max-bid figure, 'Withheld — model not validated on verified outcomes' for
// the ML row. A validated model (withheld false + numeric probability, e.g.
// td-soldvred-v1) passes through untouched.
export const MAX_BID_HIDDEN_TEXT = 'Hidden'
export const ML_WITHHELD_TEXT = 'Withheld — model not validated on verified outcomes (see §17 Provenance)'
export const ML_NOT_DEPLOYED_TEXT = 'Withheld — artifact not deployed at scoring time'

export function isKillListGated(report: Report | null | undefined): boolean {
  const ml = report?.context_layers?.ml_model || {}
  return ml.withheld === true || typeof ml.probability_third_party_purchase !== 'number'
}

function mlWithheldText(ml: any): string {
  return ml?.withheld === true ? ML_WITHHELD_TEXT : ML_NOT_DEPLOYED_TEXT
}

// The executive summary is composer prose built from cover.shapira_max_bid
// ("Entry bid $X, SIGNAL$ Max Bid $Y — walk away above $Y."). pdf.js rebuilds
// it through the composer; this twin has no composer, so it drops the
// sentence(s) that carry the ceiling. Every clause ends in '.', so a
// sentence split is exact.
export function gateExecutiveSummary(text: string): string {
  return text
    .split(/(?<=\.)\s+/)
    .filter((s) => !/SIGNAL\$ Max Bid|walk away above|ceiling held|walked correctly/i.test(s))
    .join(' ')
}

export function applyKillListGate(report: Report): Report {
  if (!report || !isKillListGated(report)) return report
  const r: Report = JSON.parse(JSON.stringify(report))
  if (r.cover) { r.cover.shapira_max_bid = null; r.cover.equity_at_ceiling = null }
  if (r.opinion_of_price_bid_card) {
    r.opinion_of_price_bid_card.shapira_max_bid = null
    r.opinion_of_price_bid_card.shapira_ceiling = null
  }
  if (r.auction_outcome) {
    if (r.auction_outcome.scorecard) delete r.auction_outcome.scorecard.ceiling_call
    delete r.auction_outcome.ceiling_call
    delete r.auction_outcome.predicted_third_party
  }
  const ml = r.context_layers?.ml_model
  if (ml && ml.withheld === true && typeof ml.probability_third_party_purchase === 'number') {
    ml.probability_third_party_purchase = `withheld — ${ml.withheld_reason || 'model not validated on verified outcomes'}`
  }
  if (Array.isArray(r.red_flags)) {
    r.red_flags = r.red_flags.map((f: any) => (f && f.code === 'SURVIVING_LIEN_DEDUCTED' && typeof f.text === 'string')
      ? { ...f, text: f.text.replace(/Ceiling before deduction: .*?; after: .*?\.\s*$/, `Ceiling before/after deduction: ${MAX_BID_HIDDEN_TEXT} — SIGNAL$ Max Bid withheld (see §15).`) }
      : f)
  }
  if (typeof r.executive_summary?.text === 'string') {
    r.executive_summary = { ...r.executive_summary, text: gateExecutiveSummary(r.executive_summary.text) }
  }
  return r
}

// Max-bid figure at any render site: 'Hidden' while gated, normal money()
// formatting otherwise (incl. its 'Pending' for a legitimately null ceiling).
function maxBidText(report: Report, val: unknown): string {
  return isKillListGated(report) ? MAX_BID_HIDDEN_TEXT : money(val)
}

function money(val: unknown): string {
  if (val == null || val === '') return 'Pending'
  const n = typeof val === 'object' && val !== null ? (val as any).value : val
  if (n == null) return typeof val === 'object' && val !== null && (val as any).display ? (val as any).display : 'Pending'
  if (Number.isNaN(Number(n))) return 'Pending'
  return `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function pct(val: unknown): string {
  return val == null ? 'Pending' : `${(Number(val) * 100).toFixed(1)}%`
}

function safeStr(val: unknown, fallback = 'Pending'): string {
  if (val == null || val === '' || val === 'null') return fallback
  if (typeof val === 'object' && val !== null) {
    const v = val as any
    if (v.display) return String(v.display)
    if (v.value != null) return String(v.value)
    return fallback
  }
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

// DOR fl_parcels stores sale month + year — no day-level sold date exists in
// the cadastral feed. Print real stored precision only, never a padded day.
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function compSaleDateText(c: any): string {
  const yr = c.sale_yr1 ?? c.sale_year;
  const mo = c.sale_mo1 ?? c.sale_month;
  if (yr && Number(mo) >= 1 && Number(mo) <= 12) return `${MONTH_ABBR[Number(mo) - 1]} ${yr}`;
  if (yr) return String(yr);
  if (c.auction_date) return String(c.auction_date).slice(0, 10);
  return '';
}

function Row({ label, value, alt }: { label: string; value: unknown; alt?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 px-4 py-2 text-sm ${alt ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-950'}`}>
      <span className="text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
      <span className="font-semibold text-slate-900 dark:text-white text-right break-words">{safeStr(value)}</span>
    </div>
  )
}

function TwoCol({ pairs }: { pairs: [string, unknown][] }) {
  return (
    <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800">
      {pairs.map(([l, v], i) => (
        <div key={l} className={`flex justify-between gap-3 px-3 py-2 text-sm ${i % 4 < 2 ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-950'}`}>
          <span className="text-slate-500 dark:text-slate-400 shrink-0">{l}</span>
          <span className="font-semibold text-slate-900 dark:text-white text-right break-words">{safeStr(v)}</span>
        </div>
      ))}
    </div>
  )
}

function SubHead({ children }: { children: ReactNode }) {
  return <p className="px-4 pt-3 pb-1 text-sm font-bold text-[#0A2540] dark:text-white">{children}</p>
}

function Para({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <p className={`px-4 py-2 text-xs ${muted ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{children}</p>
}

function LiabilityNote({ note }: { note?: string | null }) {
  if (!note) return null
  return <p className="px-4 py-2 text-xs italic text-amber-600 dark:text-amber-400">⚠ {note}</p>
}

function callClass(call: unknown): string {
  return call === 'SURVIVES' ? 'text-red-700 dark:text-red-400'
    : call === 'EXTINGUISHED' ? 'text-green-700 dark:text-green-400'
    : call === 'UNRESOLVED' ? 'text-amber-700 dark:text-amber-400'
    : 'text-slate-500'
}

// ─── Title Search blocks (Title Tier 3) — mirrors pdf.js renderTitleSearchBlocks
// Fed entirely by report.title_search (rpc/title_search_snapshot). Only the
// Chain of Title block is gated on status === 'delivered'; every other block
// renders whenever title_search.available !== false. No county allowlist.
function InstrumentCard({ item, i, borrowerLabel }: { item: any; i: number; borrowerLabel: string }) {
  return (
    <>
      <Row label={safeStr(item.instrument || item.class, 'Instrument')} value={safeStr(item.lender_of_record || item.lienholder)} alt={i % 2 === 0} />
      <Row label={borrowerLabel} value={safeStr(item.borrower || item.against)} />
      <Row label="Recorded / Book-Page / Instr#" value={`${safeStr(item.recorded)} / ${safeStr(item.book_page)} / ${safeStr(item.instrument_number)}`} alt={i % 2 === 0} />
      <Row label="Amount on Face" value={money(item.amount_on_face)} />
      {Array.isArray(item.assignments) && item.assignments.length > 0 && (
        <Row label="Assignments" value={item.assignments.map((a: any) => `${safeStr(a.recorded)} ${safeStr(a.from)} → ${safeStr(a.to)} (${safeStr(a.book_page)})`).join('; ')} alt />
      )}
      {Array.isArray(item.modifications) && item.modifications.length > 0 && (
        <Row label="Modifications" value={item.modifications.map((m: any) => `${safeStr(m.recorded)} ${safeStr(m.note || m.raw_type)} (${safeStr(m.book_page)})`).join('; ')} />
      )}
      {Array.isArray(item.litigation) && item.litigation.length > 0 && (
        <Row label="Litigation" value={item.litigation.map((l: any) => `${safeStr(l.recorded)} ${safeStr(l.raw_type)} ${safeStr(l.case_number)}`).join('; ')} alt />
      )}
    </>
  )
}

function TitleSearchBlocks({ ts }: { ts: any }) {
  const cov = ts.coverage || {}
  const subj = ts.subject || {}
  const chain = ts.chain_of_title || {}
  const tax = ts.tax || {}
  const lh = ts.lien_hierarchy || {}
  const opi = ts.other_property_instruments || {}
  const vpa = chain.vesting_per_appraiser || {}
  const caseIdx = cov.case_index_search?.ran ? '✓' : 'not run'
  const ownerIdx = cov.owner_name_search?.ran ? '✓' : 'not run'
  let header = `Effective date ${safeStr(ts.effective_date)} · Sources: case index ${caseIdx} · owner-name index ${ownerIdx} · ${safeStr(cov.or_platform)} · Official Records portal: ${safeStr(cov.portal_url)}`
  if (ts.from_snapshot) header += ` · Snapshot v${safeStr(ts.snapshot_version)} · sha256 ${String(ts.snapshot_sha256 || '').slice(0, 12)}`
  if (ts.parity) header += ` · Parity checkpoints: ${safeStr(ts.parity.score)}/${safeStr(ts.parity.max_score)}`
  const rows: any[] = Array.isArray(lh.rows) ? lh.rows : []

  return (
    <>
      <SubHead>Title Search</SubHead>
      <Para muted>{header}</Para>

      <SubHead>Property &amp; Vesting</SubHead>
      <Row label="Owner of Record" value={subj.owner_of_record} alt />
      {subj.owner_estate_flag && <p className="px-4 py-1 text-xs font-bold text-red-700 dark:text-red-400">ESTATE / HEIRS OF RECORD — probate risk</p>}
      <Row label="Parcel" value={subj.parcel_id} />
      <Row label="Legal Description" value={subj.legal_description} alt />
      <Row label="Vesting Per Appraiser" value={`${safeStr(vpa.sale_date)} · ${money(vpa.sale_price)} · ${safeStr(vpa.book_page)} · grantor ${safeStr(vpa.grantor)}`} />

      <SubHead>Chain of Title</SubHead>
      {chain.status === 'delivered' ? (
        <>
          {((chain.tier3_pull || {}).owners || []).map((o: any, i: number) => (
            <Row key={`o${i}`} label={`Owner (seq ${safeStr(o.seq)})`} value={`${safeStr(o.owner_name)} — ${safeStr(o.deed_type)} ${safeStr(o.deed_date)}`} alt={i % 2 === 0} />
          ))}
          {((chain.tier3_pull || {}).gaps || []).map((g: any, i: number) => <Row key={`g${i}`} label="Gap" value={safeStr(g.reason)} />)}
          {(chain.conveyances_of_record || []).map((c: any, i: number) => (
            <Row key={`c${i}`} label="Conveyance" value={`${safeStr(c.recorded)} · ${safeStr(c.book_page)} · ${safeStr(c.grantor)} → ${safeStr(c.grantee)}`} alt={i % 2 === 0} />
          ))}
          {(chain.tax_deed_chain || []).map((c: any, i: number) => <Row key={`t${i}`} label="Tax Deed Chain" value={safeStr(c)} />)}
        </>
      ) : (
        <Row label="Status" value={safeStr(chain.status, 'Pending — chain of title not yet pulled for this county')} />
      )}

      <SubHead>Property Tax</SubHead>
      <Row label="Market / Assessed / Taxable" value={`${money(tax.market_value)} / ${money(tax.assessed_value)} / ${money(tax.taxable_value)}`} alt />
      <Row label="Exemptions / Homestead" value={`${safeStr(tax.exemptions)} / ${safeStr(tax.homestead_status)}`} />
      {Array.isArray(tax.tax_certificates_of_record) && tax.tax_certificates_of_record.length > 0 && (
        <Row label="Certificates of Record" value={tax.tax_certificates_of_record.map((c: any) => safeStr(c.cert_number || c)).join(', ')} alt />
      )}
      {tax.outstanding_certs_total != null && <Row label="Outstanding Certs Total" value={money(tax.outstanding_certs_total)} />}
      <Row label="Payment Status" value={tax.payment_status} alt />

      <SubHead>Mortgages of Record</SubHead>
      {Array.isArray(ts.mortgages) && ts.mortgages.length > 0
        ? ts.mortgages.map((m: any, i: number) => <InstrumentCard key={`m${i}`} item={m} i={i} borrowerLabel="Borrower" />)
        : <Row label="Mortgages" value="None on file" />}

      <SubHead>Other Encumbrances</SubHead>
      {Array.isArray(ts.other_encumbrances) && ts.other_encumbrances.length > 0
        ? ts.other_encumbrances.map((e: any, i: number) => <InstrumentCard key={`e${i}`} item={e} i={i} borrowerLabel="Against" />)
        : <Row label="Other Encumbrances" value="None on file" />}

      <SubHead>Lien Hierarchy</SubHead>
      {rows.length === 0 ? (
        <Row label="Lien Hierarchy" value="No instruments on the stack for this parcel." />
      ) : (
        <div className="px-2 pb-2 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400">
                <th className="px-2 py-1">Pos</th><th className="px-2 py-1">Date</th><th className="px-2 py-1">Instrument</th><th className="px-2 py-1">Holder</th><th className="px-2 py-1">Class</th><th className="px-2 py-1">Call</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, i: number) => (
                <Fragment key={`lh${i}`}>
                  <tr className={i % 2 === 0 ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-950'}>
                    <td className="px-2 py-1 align-top">{safeStr(r.stack_position, '—')}</td>
                    <td className="px-2 py-1 align-top whitespace-nowrap">{safeStr(r.recording_date)}</td>
                    <td className="px-2 py-1 align-top">{safeStr(r.raw_type || r.instrument_class)}</td>
                    <td className="px-2 py-1 align-top">{safeStr(r.lienholder || r.party_from)}</td>
                    <td className="px-2 py-1 align-top">{safeStr(r.priority_class)}</td>
                    <td className={`px-2 py-1 align-top font-bold ${callClass(r.survival_call)}`}>{safeStr(r.survival_call)}</td>
                  </tr>
                  <tr className={i % 2 === 0 ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-950'}>
                    <td colSpan={6} className="px-2 pb-2 text-[11px] text-slate-500 dark:text-slate-400">{safeStr(r.statutory_basis)}</td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
          <Row label="Anchor" value={`${safeStr(lh.anchor_date)} — ${safeStr(lh.anchor_basis)}`} alt />
          <Row label="Totals" value={`Survives ${lh.n_survives ?? 0} · Extinguished ${lh.n_extinguished ?? 0} · Unresolved ${lh.n_unresolved ?? 0} · Surviving amount on face ${money(lh.surviving_amount_on_face)} · Surviving without amount ${lh.surviving_without_amount ?? 0}`} />
        </div>
      )}

      <SubHead>Additional Comments</SubHead>
      <Row label="Summary" value={ts.analyst_summary || 'Additional Comments: not available for this sale'} alt />

      <SubHead>Instruments on Other Properties (Same Owner Name)</SubHead>
      <Row label="Count" value={String(opi.n ?? 0)} alt />
      {opi.note && <Para muted>{opi.note}</Para>}
      {(opi.rows || []).map((r: any, i: number) => (
        <Row key={`opi${i}`} label={safeStr(r.raw_type || r.instrument_class)} value={`${safeStr(r.recording_date)} · ${safeStr(r.book_page)}`} alt={i % 2 === 0} />
      ))}

      <SubHead>Disclosed Limits</SubHead>
      <Para>{safeStr(cov.disclosed_limits)}</Para>
    </>
  )
}

// ─── Clearing-ratio sparkline (K10, cli-anything-biddeed #20338) — mirrors
// pdf.js drawClearingRatioSparkline: monthly median sold ÷ assessed for the
// subject's county and SAME sale type, months with >=10 verified outcomes,
// at least 6 months or the composer sends { available:false, reason }.
// Inline SVG in the SSOT colours (line #005EB8, axis #D7E3F1, text #0A2540).
function ClearingRatioSparkline({ history }: { history: any }) {
  const title = 'Clearing Ratio History — Monthly Median Sold ÷ Assessed (trailing 24mo)'
  if (!Array.isArray(history) || history.length === 0) {
    return (
      <>
        <SubHead>{title}</SubHead>
        <Row label="Clearing Ratio History" value={(history && history.reason) || 'Pending — insufficient monthly history'} />
      </>
    )
  }
  const W = 600
  const H = 60
  const values: number[] = history.map((m: any) => Number(m.median_sold_to_assessed))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = (max - min) || 1
  const stepX = history.length > 1 ? W / (history.length - 1) : 0
  const points = history.map((m: any, i: number) => `${(i * stepX).toFixed(1)},${(H - ((Number(m.median_sold_to_assessed) - min) / range) * H).toFixed(1)}`).join(' ')
  const latest = history[history.length - 1]
  const minPoint = history.reduce((a: any, b: any) => (Number(b.median_sold_to_assessed) < Number(a.median_sold_to_assessed) ? b : a))
  const maxPoint = history.reduce((a: any, b: any) => (Number(b.median_sold_to_assessed) > Number(a.median_sold_to_assessed) ? b : a))
  const ns: number[] = history.map((m: any) => Number(m.n))
  const nLo = Math.min(...ns)
  const nHi = Math.max(...ns)
  return (
    <>
      <SubHead>{title}</SubHead>
      <div className="px-4 pb-1">
        <svg viewBox={`0 -4 ${W} ${H + 8}`} className="w-full h-16" role="img" aria-label={`Clearing ratio history, ${history.length} months, latest ${pct(latest.median_sold_to_assessed)}`}>
          <line x1="0" y1={H} x2={W} y2={H} stroke="#D7E3F1" strokeWidth="1" />
          <polyline points={points} fill="none" stroke="#005EB8" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>
      <Para>
        Min {pct(minPoint.median_sold_to_assessed)} ({minPoint.month}, n={minPoint.n}) · Max {pct(maxPoint.median_sold_to_assessed)} ({maxPoint.month}, n={maxPoint.n}) · Latest {pct(latest.median_sold_to_assessed)} ({latest.month}, n={latest.n})
      </Para>
      <Para muted>Source: multi_county_auctions, {history.length} months with &gt;=10 verified outcomes each (n {nLo}-{nHi} per month).</Para>
    </>
  )
}

// ─── Section renderers — keyed by section_key, mirroring pdf.js ────────────
const SECTION_RENDERERS: Record<string, (report: Report) => ReactNode> = {
  subject_identification(report) {
    const cover = report.cover || {}
    const auction = report.auction_listing || {}
    const isTaxDeed = cover.sale_type === 'tax_deed'
    return (
      <>
        <Row label="Address" value={cover.property_address} alt />
        <Row label="County" value={cover.county ? `${String(cover.county).toUpperCase()} County, Florida` : null} />
        <Row label="Case Number" value={cover.case_number} alt />
        <Row label="Sale Type" value={cover.sale_type} />
        <Row label="Auction Date" value={auction.auction_date || cover.auction_date} alt />
        {isTaxDeed ? (
          <>
            <Row label="Applicant / Certificate Holder" value={auction.applicant || auction.plaintiff || cover.plaintiff} />
            <Row label="Assessed Value" value={money(auction.assessed_value)} alt />
            <Row label="Opening Bid (Taxes, Interest, Costs)" value={money(auction.opening_bid)} />
          </>
        ) : (
          <>
            <Row label="Plaintiff" value={auction.plaintiff || cover.plaintiff} />
            <Row label="Assessed Value" value={money(auction.assessed_value)} alt />
            <Row label="Final Judgment" value={money(auction.judgment_amount)} />
            <Row label="Plaintiff Max Bid" value={money(auction.plaintiff_max_bid)} alt />
          </>
        )}
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
          <p className="text-lg font-bold text-[#0A2540] dark:text-white">{cb?.low != null ? `${money(cb.low)} – ${money(cb.high)}` : 'Pending'}</p>
          {cb?.midpoint != null && <p className="text-xs text-slate-500">Midpoint {money(cb.midpoint)}{cb.confidence ? ` · confidence ${cb.confidence}` : ''}</p>}
        </div>
        <div className="m-3 p-3 rounded bg-green-50 dark:bg-green-950/30">
          <p className="text-xs font-bold text-green-700 dark:text-green-400">RETAIL ARV — OPEN MARKET EXIT VALUE</p>
          <p className="text-lg font-bold text-[#0A2540] dark:text-white">{mb?.low != null ? `${money(mb.low)} – ${money(mb.high)}` : 'Pending'}</p>
          {mb?.midpoint != null && (
            <p className="text-xs text-slate-500">
              Midpoint {money(mb.midpoint)} · Investment Grade {cover.investment_grade || '—'} · SIGNAL$ Max Bid {maxBidText(report, cover.shapira_max_bid)}
            </p>
          )}
        </div>
        {cover.equity_at_entry_bid != null && (
          <div className="mx-3 mb-3 p-3 rounded bg-green-600 text-white text-sm font-bold">
            {/* equity_at_ceiling = ARV midpoint − ceiling: printing it would hand back the withheld ceiling by subtraction */}
            Day-1 Equity at Entry Bid: {money(cover.equity_at_entry_bid)} · Equity at Ceiling: {maxBidText(report, cover.equity_at_ceiling)}
          </div>
        )}
        {Array.isArray(value.anchors) && value.anchors.length > 0 && (
          <div className="px-3 pb-2">
            <p className="text-xs font-bold text-slate-500 mb-1">Value Anchors:</p>
            {value.anchors.map((a: any, i: number) => (
              <Row key={a.key} label={String(a.key).replace(/_/g, ' ')} value={a.value != null ? `${money(a.value)} · ${a.source}` : `Pending — ${a.reason || a.source}`} alt={i % 2 === 0} />
            ))}
          </div>
        )}
        {/* §2-3 rental line + DOR value history (K11, cli-anything-biddeed #20339) — same strings as pdf.js; real listings / real roll fields only */}
        <Row
          label="Rental Estimate"
          value={value.rental_estimate && value.rental_estimate.available !== false
            ? `${money(value.rental_estimate.median_rent)}/mo · n=${value.rental_estimate.n} · ${value.rental_estimate.geography} · ${value.rental_estimate.bedrooms_rule} · as of ${value.rental_estimate.as_of}`
            : (value.rental_estimate?.reason || 'Pending')}
          alt
        />
        <Row
          label="DOR Just Value History"
          value={value.value_history && value.value_history.available !== false
            ? `${money(value.value_history.jv_current)} (${value.value_history.roll_year ?? '?'}) vs. prior ${money(value.value_history.jv_prior)} (change ${money(value.value_history.jv_chng)}) · longer history: Pending`
            : (value.value_history?.reason || 'Pending')}
        />
      </>
    )
  },

  market_and_comps(report) {
    const cma = report.cma || {}
    const distressed = report.cma_distressed || {}
    const l3 = report.cma_layer3 || {}
    const retailComps: any[] = Array.isArray(cma.comps) ? cma.comps : []
    const auctionComps: any[] = Array.isArray(distressed.comps) ? distressed.comps : []
    return (
      <>
        <SubHead>LAYER 1 — Auction Market Comps (Distressed)</SubHead>
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
        <ClearingRatioSparkline history={(report.county_stats || report.county_market_priors || {}).clearing_ratio_history} />
        <SubHead>LAYER 2 — Retail Market Comps (Open Market ARV)</SubHead>
        {retailComps.length > 0 ? (
          <>
            {retailComps.map((c, i) => (
              <Row key={i} label={c.address || c.property_address || 'Address pending'} value={`Sold ${money(c.sale_price1 ?? c.sold_amount ?? c.sale_price)} · ${compSaleDateText(c)}`} alt={i % 2 === 0} />
            ))}
            {cma.median_sale_price && (
              <Para muted>Retail stats: median {money(cma.median_sale_price)} · n={cma.n} · dispersion {cma.dispersion_flag || '—'}</Para>
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
        <SubHead>LAYER 3 — Live Market (additive)</SubHead>
        {l3.available ? (
          <TwoCol
            pairs={[
              ['Geography Used', l3.geography_used || l3.geography_level || '—'],
              ['Home Value Index', money(l3.zhvi)],
              ['Index YoY', l3.zhvi_yoy != null ? pct(l3.zhvi_yoy) : 'Pending'],
              ['Rent Index', money(l3.zori)],
              ['Inventory / DOM', `${safeStr(l3.inventory)} / ${safeStr(l3.days_on_market)}`],
              ['Source', l3.source || '—'],
            ]}
          />
        ) : (
          <Row label="Live Market" value={l3.reason || 'Pending — live market layer not available for this geography'} />
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
        {tx.prior_sale_date_2 && <Row label="Earlier Transfer" value={`${safeStr(tx.prior_sale_date_2)} · ${money(tx.prior_sale_price_2)}`} alt />}
        <Row label="Current Owner" value={report.cover?.current_owner || report.auction_listing?.current_owner || 'Pending'} alt />
        <Row label="Homestead Status" value={report.property_record?.homestead_status || 'Pending'} />
        {tx.note && <Para muted>{tx.note}</Para>}
      </>
    )
  },

  property_record(report) {
    const prop = report.property_record || {}
    const auction = report.auction_listing || {}
    const aerial = prop.aerial || {}
    return (
      <>
      <TwoCol
        pairs={[
          ['Property Type', prop.property_type || 'Pending'],
          ['Beds / Baths', `${safeStr(prop.beds)} / ${safeStr(prop.baths)}`],
          ['Living Area', prop.living_area_sqft ? `${prop.living_area_sqft} sqft` : 'Pending'],
          ['Year Built', prop.year_built || 'Pending'],
          ['Lot Size', prop.lot_size_acres ? `${prop.lot_size_acres} ac` : 'Pending'],
          ['Homestead', prop.homestead_status || 'Pending'],
          ['Stories / Construction', 'Pending — not in county roll'],
          ['Coordinates', report.cover?.coordinates || 'Pending'],
          ['Auction URL', auction.auction_url || 'Pending'],
        ]}
      />
      {/* K9 (cli-anything-biddeed #20337): the same stored aerial the deal page renders; pdf.js prints the identical Pending sentence when no image is available */}
      {typeof aerial.url === 'string' && aerial.url ? (
        <div className="px-4 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={aerial.url} alt="Aerial view of the subject parcel" className="w-full max-w-md rounded border border-slate-200 dark:border-slate-800" loading="lazy" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Aerial source: {aerial.source || 'Pending'}</p>
        </div>
      ) : (
        <Row label="Aerial" value="Pending — image not available at generation time" />
      )}
      </>
    )
  },

  context_layers(report) {
    const ctx = report.context_layers || {}
    const nbhd = ctx.neighborhood || {}
    const fema = ctx.fema || {}
    const schools = ctx.schools || {}
    const poi = ctx.nearby_places || {}
    const floodText = fema.available
      ? `${fema.zone || 'Unmapped'}${fema.sfha != null ? ` (${fema.sfha ? 'SFHA' : 'not SFHA'})` : ''}${fema.bfe != null ? `, BFE ${fema.bfe}ft` : ''} — ${fema.source || 'FEMA NFHL'}`
      : (fema.reason || 'Pending — FEMA layer not yet wired')
    const nbhdText = nbhd.available
      ? `Median income ${nbhd.median_income != null ? '$' + Number(nbhd.median_income).toLocaleString() : '—'}, ownership ${nbhd.ownership_rate != null ? Math.round(nbhd.ownership_rate * 100) + '%' : '—'}, poverty rate ${nbhd.poverty_rate != null ? Math.round(nbhd.poverty_rate * 100) + '%' : '—'}${nbhd.median_rent != null ? `, median rent $${Number(nbhd.median_rent).toLocaleString()}` : ''} — ${nbhd.source || 'Census ACS'}`
      : (nbhd.reason || 'Pending — layer not yet wired for this county')
    const schoolsText = schools.available
      ? ((Array.isArray(schools.nearest) ? schools.nearest.map((s: any) => `${String(s.level || '')[0]?.toUpperCase() ?? ''}${String(s.level || '').slice(1)}: ${s.name} (${s.distance_mi}mi)`).join(' · ') : '') || 'Pending — no schools found within 5mi')
      : (schools.reason || 'Pending — school layer not wired; source TBD')
    // #20290: poi.classes[] = { key, label, count, nearest_mi, names[] } within
    // poi.radius_mi of the subject — one row per class, exactly like pdf.js.
    const poiClasses: any[] = poi.available && Array.isArray(poi.classes) ? poi.classes : []
    return (
      <>
        <Row label="Market Grade" value={ctx.market_grade || 'Pending'} alt />
        <Row label="Flood Zone" value={floodText} />
        <Row label="Neighborhood" value={nbhdText} alt />
        <Row label="Schools" value={schoolsText} />
        {/* K4 (parent #20287): SABS attendance-boundary assignment from fetchSchools() (#20291) — Pending strings verbatim, never guessed; same row as pdf.js */}
        <Row
          label="Assigned Schools"
          value={schools.available && schools.assigned
            ? ['elementary', 'middle', 'high'].map((l) => `${l[0].toUpperCase()}${l.slice(1)}: ${schools.assigned[l] || 'Pending'}`).join(' · ')
            : 'Pending — attendance boundary layer not available'}
        />
        <Row label="Median Income" value={nbhd.available && nbhd.median_income != null ? `$${Number(nbhd.median_income).toLocaleString()}` : 'Pending'} alt />
        {poi.available ? (
          poiClasses.map((c: any, i: number) => (
            <Row
              key={c.key || c.label || i}
              label={c.label || c.key || 'Place'}
              value={c.count > 0
                ? `nearest ${c.nearest_mi} mi · ${c.count} within ${poi.radius_mi} mi — ${poi.source || 'OpenStreetMap'}${c.names?.length ? ` (${c.names.join(', ')})` : ''}`
                : `none within ${poi.radius_mi} mi — ${poi.source || 'OpenStreetMap'}`}
              alt={i % 2 === 0}
            />
          ))
        ) : (
          <Row label="Nearby Places" value={poi.reason || 'Pending — nearby places layer not wired'} />
        )}
        <Row label="Other Hazards" value="Pending — not sourced" alt />
      </>
    )
  },

  shapira_ml(report) {
    const ml = report.context_layers?.ml_model || {}
    const p = ml.probability_third_party_purchase
    // Same contract as pdf.js + composer.scoreModel(): when the validation gate
    // has not passed, the composer replaces the probability with a 'withheld —'
    // string and sets ml.withheld=true; a numeric probability therefore means
    // the gate passed. (The earlier `print_probability` flag was never emitted
    // by the composer, so this twin could never print even a validated number.)
    const canPrint = typeof p === 'number' && ml.withheld !== true
    const bl = ml.base_learners || {}
    const hasDistinctLearners = canPrint && ml.method === 'ml_scores_nightly_batch'
      && typeof bl.xgb_prob === 'number' && typeof bl.lgbm_prob === 'number' && typeof bl.catb_prob === 'number'
    const fv = ml.feature_vector
    return (
      <>
        <Row label="Model" value={ml.model_version || 'Pending — model version not reported'} alt />
        <Row label="Method" value={ml.method || 'Pending'} />
        <Row
          label="Validation"
          value={ml.withheld
            ? `Not passed — ${ml.withheld_reason || 'out-of-time validation on verified outcomes has not passed'}`
            : (canPrint ? 'Passed out-of-time validation on verified outcomes (shapira_model_validations)' : 'Pending')}
          alt
        />
        {canPrint ? (
          <>
            <Row label="3rd-Party Probability" value={`${(Number(p) * 100).toFixed(1)}%`} />
            {hasDistinctLearners && (
              <TwoCol pairs={[['XGBoost', `${(bl.xgb_prob * 100).toFixed(1)}%`], ['LightGBM', `${(bl.lgbm_prob * 100).toFixed(1)}%`], ['CatBoost', `${(bl.catb_prob * 100).toFixed(1)}%`], ['Meta', `${(Number(p) * 100).toFixed(1)}%`]]} />
            )}
          </>
        ) : (
          // Same fallback sentence the web report's §ML row prints (worker.js
          // mlWithheldText) and pdf.js prints — PR #20312 parity.
          <Row label="3rd-Party Probability" value={mlWithheldText(ml)} />
        )}
        {fv && typeof fv === 'object' && (
          <div className="px-3 pb-2">
            <p className="text-xs font-bold text-slate-500 mb-1">Feature Vector (exact model inputs):</p>
            {Object.entries(fv).map(([k, v], i) => (
              <Row key={k} label={k.replace(/_/g, ' ')} value={safeStr(v)} alt={i % 2 === 0} />
            ))}
          </div>
        )}
      </>
    )
  },

  rehab_estimate(report) {
    const rehab = report.rehab
    if (!rehab || rehab.available === false) {
      return <Row label="Rehab Cost Estimate" value={rehab?.reason || 'Pending — rehab estimate engine not yet producing for this parcel'} />
    }
    const items: any[] = Array.isArray(rehab.line_items) ? rehab.line_items : []
    return (
      <>
        <TwoCol
          pairs={[
            ['Scope Band', rehab.scope_band || 'Pending'],
            ['Expected Total', money(rehab.expected_total)],
            ['Low / High', `${money(rehab.low)} / ${money(rehab.high)}`],
            ['Basis', rehab.basis || 'exterior-only'],
          ]}
        />
        {items.map((li, i) => <Row key={i} label={safeStr(li.item)} value={money(li.amount)} alt={i % 2 === 0} />)}
        {rehab.carry_cost_note && <Para muted>{rehab.carry_cost_note}</Para>}
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
    const verdict = String(cover.verdict || opp.verdict || 'PENDING')
    return (
      <>
        <div className="m-3 p-3 rounded text-white" style={{ backgroundColor: verdict.startsWith('BID') ? '#16A34A' : verdict === 'SKIP' ? '#DC2626' : '#D97706' }}>
          <p className="text-2xl font-bold">{verdict}</p>
          <p className="text-sm">Investment Grade {cover.investment_grade || '—'}</p>
        </div>
        <TwoCol
          pairs={[
            ['Entry Bid', money(opp.entry_bid || cover.entry_bid)],
            ['SIGNAL$ Max Bid', maxBidText(report, smbVal)],
            ['Walk Away Above', maxBidText(report, smbVal)],
            ['Value Midpoint', money(opp.value_midpoint)],
          ]}
        />
      </>
    )
  },

  judgment_encumbrance(report) {
    const j = report.judgment || {}
    const flags: any[] = report.red_flags || []
    const isTaxDeed = report.cover?.sale_type === 'tax_deed'
    const lienGate = report.composition?.lien_survival
    const ls = report.lien_survival
    const ts = report.title_search
    return (
      <>
        {isTaxDeed ? (
          <>
            <Row label="Sale Type Note" value={j.sale_type_note || 'Tax deed sale — no foreclosure judgment.'} alt />
            <Row label="Unpaid Taxes (Opening Bid Basis)" value={j.unpaid_taxes != null ? money(j.unpaid_taxes) : 'N/A — tax deed sale (no final judgment)'} />
            <Row label="IRS Lien Survival" value={j.irs_lien_survives ? 'Survives (26 U.S.C. §7425)' : 'Pending'} alt />
            <Row label="HOA/COA Lien" value={j.hoa_lien_may_survive ? 'May survive (FL FS 720.3085/718.116)' : 'Pending'} />
            <Row label="Statutory Extinguishment" value={j.statutory_extinguishment || 'Pending'} alt />
          </>
        ) : (
          <>
            <Row label="Recorded CFN" value={j.cfn || 'Pending'} alt />
            <Row label="Judgment Amount" value={money(j.judgment_amount)} />
            <Row label="Principal" value={money(j.principal)} alt />
            <Row label="Interest" value={money(j.interest)} />
            <Row label="County Tax" value={money(j.county_tax)} alt />
            <Row label="Hazard Insurance" value={money(j.hazard_insurance)} />
            <Row label="Fees / Costs" value={money(j.fees)} alt />
          </>
        )}
        {flags.map((f, i) => (
          <div key={i} className={`mx-3 my-1 p-2 border-l-4 text-xs ${f.severity === 'risk' ? 'border-red-600 text-red-700' : f.severity === 'pending' ? 'border-amber-600 text-amber-700' : 'border-green-600 text-green-700'}`}>
            <span className="font-bold">{f.code || f.label || 'FLAG'}</span> {f.detail || f.text || ''}
          </div>
        ))}
        <SubHead>Lien Survival (Title Tier 2)</SubHead>
        {lienGate?.status === 'delivered' && ls?.available ? (
          <>
            <Row label="Statutory Basis" value={ls.statutory_basis || 'Pending'} alt />
            {(ls.items || []).map((item: any, i: number) => {
              const label = `${item.lien_type}${item.creditor && item.creditor !== 'Pending — not on file' ? ' — ' + item.creditor : ''}`
              const call = item.survives === true ? 'SURVIVES' : item.survives === false ? 'EXTINGUISHED' : 'UNRESOLVED'
              return <Row key={i} label={label} value={`${call} — ${item.statement}`} alt={i % 2 === 0} />
            })}
            {lienGate.disclosure && <Para muted>{lienGate.disclosure}</Para>}
          </>
        ) : (
          <Row label="Status" value={lienGate?.status_text || lienGate?.status || 'Pending — Title Tier 2 not yet live for this county'} />
        )}
        {ts && ts.available !== false ? (
          <TitleSearchBlocks ts={ts} />
        ) : (
          <>
            <SubHead>Title Search</SubHead>
            <Row label="Status" value={ts?.reason || 'Pending — title search not yet harvested for this sale'} />
          </>
        )}
      </>
    )
  },

  provenance(report) {
    const prov = report.provenance || {}
    return (
      <>
        <Row label="Data Sources" value={prov.generated_from || 'multi_county_auctions, fl_parcels, zoning_assignments, shapira_models, context_layer_cache, title_search_snapshots'} alt />
        <Row label="Certification" value={prov.certification_disclosure || 'Pending'} />
        <Row label="Effective Date" value={prov.effective_date || report.title_search?.effective_date || 'Pending'} alt />
        <Row label="Snapshot sha256" value={report.title_search?.snapshot_sha256 ? String(report.title_search.snapshot_sha256).slice(0, 16) + '…' : 'Pending — no versioned snapshot for this sale yet'} />
        {/* K7 (cli-anything-biddeed #20336): whole-report sha256 is written by the purchase writer into provenance.snapshot_sha256; a preview render prints Pending by construction */}
        <Row label="Report snapshot sha256" value={prov.snapshot_sha256 || 'Pending — hashed at purchase'} alt />
        <Para>{prov.model_disclosure || 'SIGNAL$ Models — probability withheld until out-of-time validation on verified outcomes passes.'}</Para>
      </>
    )
  },

  auction_outcome(report) {
    const outcome = report.auction_outcome || {}
    if (outcome.result || outcome.sale_status) {
      // Ceiling call: the composer grades it in scorecard.ceiling_call
      // ('ceiling held' / 'walked correctly' against the SIGNAL$ Max Bid).
      // applyKillListGate() deletes it while withheld and — like the web
      // report and pdf.js — the row is then omitted, never printed as a dash.
      const cc = outcome.scorecard?.ceiling_call
      const ceilingCall: string | null = cc && typeof cc === 'object'
        ? `${cc.verdict || 'graded'}${cc.headroom != null ? ` — ${money(cc.headroom)} headroom` : cc.overshoot != null ? ` — ${money(cc.overshoot)} over` : ''}`
        : (typeof outcome.ceiling_call === 'string' ? outcome.ceiling_call : null)
      const pairs: [string, unknown][] = [
        ['Result', outcome.sale_status || outcome.result],
        ['Sale Amount', money(outcome.sale_amount || outcome.winning_bid)],
        ['Winning Bidder', outcome.winning_bidder || '—'],
        ['Buyer Type', outcome.buyer_type || '—'],
        ['Clearing Multiple', outcome.clearing_multiple ? `${outcome.clearing_multiple}×` : '—'],
      ]
      if (!isKillListGated(report)) pairs.push(['Ceiling Call', ceilingCall || '—'])
      return <TwoCol pairs={pairs} />
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

export default function S5Report({ template, report: inputReport }: S5ReportProps) {
  // Kill-list gate BEFORE anything renders — every SECTION_RENDERERS entry
  // below receives the gated copy, so no code path can reach a withheld
  // figure. Pass-through (same object) when the gate is open.
  const report = applyKillListGate(inputReport)
  const cover = report.cover || {}
  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-t-lg bg-[#0A2540] text-white px-5 py-4">
        <p className="text-lg font-bold text-white">BidDeed.AI <span className="font-normal text-slate-300">+ ZoneWise.AI</span></p>
        <p className="text-xs mt-1">SIGNAL$ PROPERTY REPORT · 18 SECTIONS</p>
        <p className="text-xs text-slate-300 mt-1">
          {(cover.county || '').toUpperCase()} County, FL · {cover.sale_type || 'Foreclosure'} Sale {cover.auction_date || ''} · {cover.property_address || ''}
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Case {cover.case_number || '—'} · Parcel {cover.parcel_id || '—'}
        </p>
      </div>
      {typeof report.executive_summary?.text === 'string' && report.executive_summary.text.trim() && (
        <div className="border-x border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 py-3">
          <p className="text-[11px] font-bold tracking-wide text-[#0A2540] dark:text-[#4DA6FF]">EXECUTIVE SUMMARY</p>
          <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">{report.executive_summary.text}</p>
        </div>
      )}
      <div className="space-y-4 mt-4">
        {template.map((section) => (
          <div key={section.section_key} className="rounded-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <Band label={section.section_label} title={section.title} color={section.band_color} />
            <div className="divide-y divide-slate-100 dark:divide-slate-900">
              {SECTION_RENDERERS[section.section_key]
                ? SECTION_RENDERERS[section.section_key](report)
                : <Row label="Status" value={`Pending — this section has no renderer yet (${section.section_key}); the PDF twin is authoritative`} />}
            </div>
            <LiabilityNote note={(section as any).liability_note} />
          </div>
        ))}
      </div>
    </div>
  )
}
