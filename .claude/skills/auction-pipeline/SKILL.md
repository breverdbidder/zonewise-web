---
name: auction-pipeline
description: BidDeed.AI auction intelligence pipeline operations. Use when triggering scrapers, running analysis, generating reports, debugging pipeline stages, or checking county auction data. Covers the 12-stage Everest Ascent pipeline: Discovery → Scraping → Title → Lien Priority → Tax Certs → Demographics → ML Score → Max Bid → Decision Log → Report → Disposition → Archive.
---

# BidDeed.AI Auction Pipeline — Shapira Stack

## Pipeline Overview (The Everest Ascent™)

| Stage | Name | Description |
|-------|------|-------------|
| 1 | Discovery | Find auctions on RealForeclose + county portals |
| 2 | Scraping | Pull case details, judgment amounts, plaintiff |
| 3 | Title Search | AcclaimWeb — mortgages, liens by party name |
| 4 | Lien Priority | Detect HOA foreclosures (senior mortgage survives) |
| 5 | Tax Certificates | RealTDM — outstanding tax certs |
| 6 | Demographics | Census API — income, vacancy, population |
| 7 | ML Score | XGBoost — third-party purchase probability |
| 8 | Max Bid | SIGNAL$ Max Bid from `public.signal_max_bid_v1` (see Max Bid below) |
| 9 | Decision Log | BID / REVIEW / SKIP from the ML purchase-probability and clearing-price predictions |
| 10 | Report | One-page DOCX with BCPAO photos + ML predictions |
| 11 | Disposition | Track won bids, second sale, rehab, rental |
| 12 | Archive | Supabase historical_auctions, master_index sync |

## Trigger Night Run

```bash
# Via GitHub Actions API
curl -X POST \
  -H "Authorization: token $GITHUB_PAT" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/breverdbidder/brevard-bidder-scraper/actions/workflows/nightly-auction-scrape.yml/dispatches" \
  -d '{"ref":"main"}'

# Check workflow status after 2 minutes
curl -H "Authorization: token $GITHUB_PAT" \
  "https://api.github.com/repos/breverdbidder/brevard-bidder-scraper/actions/runs?per_page=1" \
  | python3 -c "import sys,json; r=json.load(sys.stdin)['workflow_runs'][0]; print(r['status'], r['conclusion'])"
```

## Run Pipeline Manually (Python)

```bash
cd src/
python -m scrapers.realforeclose_scraper    # Stage 1-2
python -m scrapers.acclaimweb_scraper       # Stage 3-4
python -m scrapers.realtdm_scraper          # Stage 5
python -m analysis.ml_scorer               # Stage 7
python -m reports.generate_docx            # Stage 10
```

## Check Pipeline Health

```bash
# Last 5 pipeline runs
psql "$DATABASE_URL" -c "
SELECT task, status, message, created_at 
FROM insights 
WHERE task LIKE '%scraper%' OR task LIKE '%pipeline%'
ORDER BY created_at DESC LIMIT 10"

# Tonight's auctions
psql "$DATABASE_URL" -c "
SELECT county, COUNT(*) as count, 
       SUM(CASE WHEN recommendation='BID' THEN 1 ELSE 0 END) as bids,
       SUM(CASE WHEN recommendation='REVIEW' THEN 1 ELSE 0 END) as reviews
FROM multi_county_auctions 
WHERE auction_date = CURRENT_DATE
GROUP BY county"
```

## Data Sources & URLs

| Source | URL | Purpose |
|--------|-----|---------|
| RealForeclose | brevard.realforeclose.com | Primary auction calendar |
| BCPAO | gis.brevardfl.gov | Parcel data + photos |
| AcclaimWeb | vaclmweb1.brevardclerk.us | Mortgages + liens |
| RealTDM | realtdm.com | Tax certificates |
| Census API | api.census.gov | Demographics |

## BCPAO Photo URLs

```
https://www.bcpao.us/photos/{prefix}/{account}011.jpg
```
Retrieved from `api/v1/search` → `masterPhotoUrl` field.

## Max Bid (SIGNAL$ Max Bid)

The old fixed 70%-of-value formula (less repairs, a flat fee and a capped reserve) and its
BID / REVIEW / SKIP bid-to-judgment thresholds are retired (Ariel, 1 Oct 2026).
Do not compute, suggest or teach them anywhere.

The max bid is the SIGNAL$ Max Bid, computed in one place: Supabase
`public.signal_max_bid_v1(county, sale_type, property_type, assessed_value, value_fallback, recorded_lien_deduction)`,
which mirrors `computeShapiraCeiling` in cli-anything-biddeed `packages/biddeed-mcp/src/report/composer.js`:

- parameters come from `shapira_formula_params` for the county, sale type and DOR use code
  (or ALL), largest sample first, first coherent row;
- basis = assessed value (else a value estimate);
- ceiling = basis x the county's learned bid share x the plaintiff factor (the plaintiff's
  record of sale price on the dollar against the final judgment);
- effective ceiling = ceiling less recorded liens that survive the sale.

The BID / REVIEW / SKIP call comes from the ML third-party-purchase probability and
clearing-price predictions, not from a ratio. `bid_decisions.max_bid` is filled by the
trigger `trg_bid_decisions_signal_max_bid`. Under report policy v1 the SIGNAL$ Max Bid, the
third-party-purchase probability and the predicted sale price show only as
"Withheld - validation in progress" until the models pass validation.

## Multi-County Scale

- Current: 3 counties (Brevard)
- Q1 2026 target: 67 FL counties
- Scale threshold: Render.com at 50+ counties
- Table: `multi_county_auctions` (partitioned by county)
- Volume: 1K–2K auctions/day at full scale

## Lien Priority Critical Rule

When plaintiff is an **HOA** → the senior mortgage survives the foreclosure.
This means buyer at auction takes property **subject to** the mortgage.
**NEVER mark HOA-plaintiff properties as BID without lien analysis.**

```sql
-- Flag HOA plaintiff properties needing review
SELECT id, case_number, plaintiff, recommendation
FROM historical_auctions
WHERE plaintiff ILIKE '%HOA%' OR plaintiff ILIKE '%Association%'
AND recommendation = 'BID'
```

## Report Generation

Reports use BrevardBidderAI branding only (no Property360 / Mariam references):

```bash
node scripts/generate_brevard_reports.js --date 2026-02-26 --county brevard
```

Output: `reports/YYYY-MM-DD_brevard_report.docx`

DOCX color theme:
- Header: `#1E3A5F` (navy)
- BID: `#E8F5E9` (green)
- SKIP: `#FFEBEE` (red)
- REVIEW: `#FFF3E0` (orange)
