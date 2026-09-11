// S5Report.tsx — kill-list gate (cli-anything-biddeed #20240 → PR #20312,
// Ariel's 2026-09-11 ruling: the kill list covers PAID reports, every renderer).
//
// The twin is fed the raw /report/json composer payload, which still carries
// the SIGNAL$ Max Bid, the sold-probability and the §18 ceiling call. These
// tests pin the two acceptance cases the PDF renderer (pdf.js
// test/pdf-kill-list-gate.test.js) is held to:
//   1. withheld model  → no max-bid / probability / ceiling figure in the
//      rendered HTML, 'Hidden' + 'Withheld — model not validated on verified
//      outcomes' fallbacks present;
//   2. validated model (td-soldvred-v1, tax deed) → every figure prints and
//      the report object passes through the gate untouched.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect } from 'vitest'

import S5Report, { applyKillListGate, isKillListGated, gateExecutiveSummary, ML_WITHHELD_TEXT } from '../components/report/S5Report'
import type { S5TemplateRow } from '@/app/api/report/route'

const TEMPLATE: S5TemplateRow[] = [
  'subject_identification', 'value_estimate', 'market_and_comps', 'transaction_history', 'property_record',
  'context_layers', 'shapira_ml', 'rehab_estimate', 'zonewise', 'bid_card', 'judgment_encumbrance', 'provenance', 'auction_outcome',
].map((k, i) => ({ section_key: k, section_label: String(i + 1), title: k.replace(/_/g, ' '), report_field: null, band_color: 'navy', sort_order: (i + 1) * 10 }))

type Report = Record<string, any>

// Composer-shaped fixture: the composer keeps computing the ceiling for the
// paid product — withholding is a render-time concern.
function fixture(saleType: 'foreclosure' | 'tax_deed', maxBid: number, ml: Record<string, unknown>): Report {
  const mb = `$${maxBid.toLocaleString('en-US')}`
  const p = ml.probability_third_party_purchase
  const printsProbability = typeof p === 'number' && ml.withheld !== true
  return {
    cover: {
      case_number: 'CASE-1', county: saleType === 'tax_deed' ? 'pasco' : 'duval', sale_type: saleType,
      property_address: '1 TEST AVE', auction_date: '2026-11-03', verdict: 'BID', investment_grade: 'B',
      equity_at_entry_bid: 5000, equity_at_ceiling: 15000,
      shapira_max_bid: { value: maxBid, display: mb, source: 'shapira_formula_params' },
      entry_bid: { value: 40000, display: '$40,000' }, locatable: true,
    },
    auction_listing: { auction_date: '2026-11-03', plaintiff: 'Test Bank', judgment_amount: { value: 100000 }, plaintiff_max_bid: { value: 90000 }, assessed_value: { value: 120000 } },
    value_estimate: { midpoint: 90000, low: 80500, high: 100000, anchors: [], clearing_band: { low: 70000, midpoint: 78000, high: 90000 }, market_band: { low: 85000, midpoint: 95000, high: 105000 } },
    context_layers: { ml_model: ml },
    opinion_of_price_bid_card: { entry_bid: 40000, shapira_ceiling: maxBid, value_midpoint: 90000, verdict: 'BID' },
    judgment: { judgment_amount: 100000 },
    red_flags: [{ code: 'SURVIVING_LIEN_DEDUCTED', severity: 'risk', text: `Max-bid ceiling reduced by $4,000 for lien(s) classified as surviving this sale (see §16). Ceiling before deduction: $${(maxBid + 4000).toLocaleString('en-US')}; after: ${mb}.` }],
    auction_outcome: {
      result: 'SOLD', sale_status: 'SOLD', sale_amount: maxBid - 4000, winning_bidder: 'THIRD PARTY LLC', buyer_type: 'third_party',
      clearing_multiple: 1.9, predicted_third_party: true, outcome_captured: true,
      scorecard: { available: true, ceiling_call: { shapira_max_bid: maxBid, sale: maxBid - 4000, verdict: 'ceiling held', headroom: 4000,
        text: `Sale cleared at $${(maxBid - 4000).toLocaleString('en-US')}, $4,000 under the ${mb} SIGNAL$ Max Bid — a bidder holding to the ceiling wins this lot.` } },
    },
    // Verbatim composer.buildExecutiveSummary() clause shapes.
    executive_summary: {
      text: `Case CASE-1 (Duval County, FL), ${saleType === 'tax_deed' ? 'tax deed' : 'foreclosure'} sale 2026-11-03. Verdict BID, Grade B. Entry bid $40,000, SIGNAL$ Max Bid ${mb} — walk away above ${mb}. Clearing band ~$78,000 vs retail ARV ~$95,000 — spread $17,000. Top risk: surviving lien deducted. Title: Pending. ${printsProbability ? `Third-party purchase probability ${Math.round((p as number) * 100)}%.` : 'Third-party purchase probability WITHHELD — validation gate open.'} Delivered under Gold Standard certification gating.`,
      status: 'delivered',
    },
    provenance: { certification_disclosure: 'Gold Standard', model_disclosure: 'test disclosure' },
    lien_survival: { available: false }, composition: {},
  }
}

const WITHHELD = () => fixture('foreclosure', 80000, {
  available: true, model_version: 'v4.0-20260802-015242', method: 'ml_scores_nightly_batch',
  // Belt-and-braces shape: withheld AND numeric learners in the same object.
  probability_third_party_purchase: 0.83, base_learners: { xgb_prob: 0.81, lgbm_prob: 0.84, catb_prob: 0.85 },
  withheld: true, withheld_reason: 'no passing shapira_model_validations row for model_version=v4.0-20260802-015242',
})
const VALIDATED = () => fixture('tax_deed', 50000, {
  available: true, model_version: 'td-soldvred-v1', method: 'v4_pkl_modal', probability_third_party_purchase: 0.614, withheld: false,
})

const text = (report: Report) =>
  renderToStaticMarkup(<S5Report template={TEMPLATE} report={report} />)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')

describe('S5Report kill-list gate (PR #20312 parity with worker.js + pdf.js)', () => {
  it('gate predicate matches worker.js applyKillListGate', () => {
    expect(isKillListGated({ context_layers: { ml_model: { withheld: true, probability_third_party_purchase: 0.7 } } })).toBe(true)
    expect(isKillListGated({ context_layers: { ml_model: { withheld: false, probability_third_party_purchase: 'withheld — model not validated on verified outcomes' } } })).toBe(true)
    expect(isKillListGated({ context_layers: {} })).toBe(true)
    expect(isKillListGated({ context_layers: { ml_model: { withheld: false, probability_third_party_purchase: 0.7 } } })).toBe(false)
  })

  it('gateExecutiveSummary drops only the bid clause', () => {
    const gated = gateExecutiveSummary(WITHHELD().executive_summary.text)
    expect(gated).not.toMatch(/walk away above|Max Bid \$/)
    expect(gated).toMatch(/Verdict BID, Grade B\./)
    expect(gated).toMatch(/Clearing band ~\$78,000/)
    expect(gated).toMatch(/Third-party purchase probability WITHHELD — validation gate open\./)
  })

  it('applyKillListGate strips the same fields as worker.js and never mutates the input', () => {
    const input = WITHHELD()
    const before = JSON.stringify(input)
    const gated = applyKillListGate(input)
    expect(gated).not.toBe(input)
    expect(JSON.stringify(input)).toBe(before)
    expect(gated.cover.shapira_max_bid).toBeNull()
    expect(gated.cover.equity_at_ceiling).toBeNull()
    expect(gated.opinion_of_price_bid_card.shapira_ceiling).toBeNull()
    expect('ceiling_call' in gated.auction_outcome.scorecard).toBe(false)
    expect('predicted_third_party' in gated.auction_outcome).toBe(false)
    expect(typeof gated.context_layers.ml_model.probability_third_party_purchase).toBe('string')
    expect(gated.red_flags[0].text).not.toMatch(/\$84,000|\$80,000/)
    expect(gated.red_flags[0].text).toMatch(/Max-bid ceiling reduced by \$4,000/)
    expect(gated.cover.entry_bid.value).toBe(40000)
  })

  it('ACCEPTANCE 1 — withheld model: no max-bid / probability / ceiling figure renders; Hidden + Withheld fallbacks present', () => {
    const html = text(WITHHELD())
    expect(html).not.toContain('$80,000')
    expect(html).not.toContain('$84,000')
    expect(html).not.toMatch(/8[1-5]\.0%/)
    expect(html).not.toMatch(/walk away above/)
    expect(html).not.toMatch(/ceiling held|Ceiling Call|holding to the ceiling/)
    expect(html).not.toMatch(/Equity at Ceiling: \$/)
    expect(html).toMatch(/SIGNAL\$ Max Bid\s+Hidden/)
    expect(html).toMatch(/Walk Away Above\s+Hidden/)
    expect(html).toMatch(/Equity at Ceiling: Hidden/)
    expect(html).toContain(ML_WITHHELD_TEXT)
    expect(html).toMatch(/before\/after deduction: Hidden/)
    expect(html).toMatch(/Not passed/)
    // still prints
    expect(html).toContain('$40,000')
    expect(html).toContain('$90,000')
    expect(html).toMatch(/Verdict BID, Grade B\./)
  })

  it('ACCEPTANCE 2 — validated model (td-soldvred-v1, tax deed): pass-through, every figure renders', () => {
    const report = VALIDATED()
    expect(isKillListGated(report)).toBe(false)
    expect(applyKillListGate(report)).toBe(report)
    const html = text(report)
    expect((html.match(/\$50,000/g) || []).length).toBeGreaterThanOrEqual(3)
    expect(html).toMatch(/walk away above \$50,000/)
    expect(html).toContain('61.4%')
    expect(html).toMatch(/Ceiling Call\s+ceiling held/)
    expect(html).toMatch(/Equity at Ceiling: \$15,000/)
    expect(html).toMatch(/Passed out-of-time validation/)
    expect(html).toContain('td-soldvred-v1')
    expect(html).not.toMatch(/Hidden|Withheld/)
    expect(html).not.toMatch(/Judgment Amount/)
  })
})
