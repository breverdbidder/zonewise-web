// The old fixed max-bid formula ((value x 70%) less repairs, $10,000 and
// min($25,000, 15%)) and its BID / REVIEW / SKIP ratio badges are retired
// (Ariel, 29 Sep / 1 Oct 2026). The max bid is the SIGNAL$ Max Bid, withheld
// until its model validates. Nothing on zonewise.ai may compute or teach the
// old formula again.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const read = (rel: string) => readFileSync(join(root, rel), 'utf8')

const FILES = [
  'lib/scoring.ts',
  'app/api/auctions/[id]/route.ts',
  'app/api/chat/route.ts',
  'components/auctions/AuctionDetail.tsx',
  'components/auctions/AuctionTable.tsx',
  'components/auctions/AuctionSpreadsheet.tsx',
  'components/auctions/AuctionMap.tsx',
  'components/auctions/AuctionSummaryCards.tsx',
  'components/envelope/DevIntelTab.tsx',
  'components/envelope/ParcelCard.tsx',
  'components/envelope/ComparePanel.tsx',
  'lib/development-analysis/hbu-engine.ts',
  'zonewise/lib/development-analysis/hbu-engine.ts',
  'lib/osint/parent-dispatch.ts',
  'lib/kpi-data.ts',
  'app/demo/page.tsx',
  '.claude/skills/auction-pipeline/SKILL.md',
  '.claude/skills/county-setup/SKILL.md',
]

const BANNED = [
  /\*\s*0\.70?(?!\d)\s*\)?\s*-\s*(repairs|10000)/,
  /Math\.min\(\s*25_?000/,
  /\bcalculateMaxBid\b|\bgetRecommendation\b/,
  /70% rule/i,
  /Shapira Formula/,
  /ARV\s*[×x*]\s*70%/,
  /arv_multiplier:\s*0\.7/,
  /max bid[^\n]{0,24}\$\d/i,
]

describe('retired max-bid formula', () => {
  for (const f of FILES) {
    it(`${f} neither computes nor teaches it`, () => {
      const src = read(f)
      for (const re of BANNED) expect(re.test(src), `${f} matches ${re}`).toBe(false)
    })
  }

  it('the auction detail API returns no max bid and no verdict', () => {
    const api = read('app/api/auctions/[id]/route.ts')
    expect(api).toMatch(/max_bid: null as number \| null/)
    expect(api).toMatch(/recommendation: 'UNKNOWN'/)
  })

  it('the chat context carries the SIGNAL$ Max Bid only as withheld', () => {
    const chat = read('app/api/chat/route.ts')
    expect(chat).toMatch(/KPI_121: \{ name: 'SIGNAL\$ Max Bid', value: null, note: 'Withheld - validation in progress'/)
  })
})
