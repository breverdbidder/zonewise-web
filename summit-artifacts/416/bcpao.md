# SUMMIT #416 — BCPAO Sales History Pull

**Date:** 2026-04-09
**Status:** COMPLETE — Sales history NOT AVAILABLE in our DB for either parcel
**Tables queried:** `brevard_properties`, `zw_parcels`, `multi_county_auctions`, `sales_history`, `fl_parcels`

---

## Parcel 1 — MIMS (US Highway 1, ~0.92 acres)

### Property Record

| Field | Value | Source | Tag |
|-------|-------|--------|-----|
| BCPAO Account | 2000369 | `zw_parcels.altkey` | VERIFIED |
| Parcel ID (GEO) | 20 3531-00-516 | `zw_parcels.pin` | VERIFIED |
| Site Address | UNKNOWN (no address on file) | `zw_parcels.site_addr` | VERIFIED |
| Current Owner | Everest Capital of Brevard LLC | `zw_parcels.owner_name` | VERIFIED |
| Owner Address | 390 Roosevelt Ave, Satellite Beach, FL 32937 | `zw_parcels.owner_addr1` | VERIFIED |
| Just/Market Value | $28,800 | `zw_parcels.val_market` | VERIFIED |
| Assessed Value | $28,800 | `zw_parcels.val_assessed` | VERIFIED |
| Taxable Value | $28,800 | `zw_parcels.val_taxable` | VERIFIED |
| Land Value | $28,800 | `zw_parcels.val_land` | VERIFIED |
| Building Value | $0 (vacant) | `zw_parcels.val_building` = null | VERIFIED |
| Use Code | 010 (Vacant Residential) | `zw_parcels.luse_code` | VERIFIED |
| Acres | BLANK | Not in `zw_parcels` for this record | BLANK |
| Year Built | N/A (vacant land) | `zw_parcels.year_built` = null | VERIFIED |
| Data Source | FL_DOR_CADASTRAL_2025 | `zw_parcels.data_source` | VERIFIED |

### Auction Record (from `multi_county_auctions`)

| Field | Value | Source | Tag |
|-------|-------|--------|-----|
| Case Number | 250369 | `multi_county_auctions.case_number` | VERIFIED |
| Sale Type | Tax Deed | `multi_county_auctions.sale_type` | VERIFIED |
| Auction Date | 2025-12-18 | `multi_county_auctions.auction_date` | VERIFIED |
| Opening Bid | $2,217.63 | `multi_county_auctions.opening_bid` | VERIFIED |
| Assessed Value | $28,800 | `multi_county_auctions.assessed_value` | VERIFIED |
| Auction Status | Completed | `multi_county_auctions.auction_status` | VERIFIED |
| RealForeclose URL | [Link](https://brevard.realforeclose.com/index.cfm?zaction=auction&zmethod=details&AID=1470938) | `multi_county_auctions.realforeclose_url` | VERIFIED |

### Sales History

**NOT AVAILABLE.** `sales_history` table (12,546 rows) has no records for tax_account `2000369`. This parcel was not included in the BCPAO sales history scrape.

### Notes
- This parcel is **NOT in `brevard_properties`** (175,783 rows). It exists only in `zw_parcels` (FL DOR Cadastral) and `multi_county_auctions`.
- The `brevard_properties` table sourced from `bcpao_gis` did not capture this unaddressed Mims parcel.
- `fl_parcels` query timed out (10.8M rows, no index on parcel_id for ILIKE).
- Acres listed in issue as ~0.92 — **not confirmed from our DB**. The `brevard_properties` record doesn't exist, and `zw_parcels` has null acres.
- Tax deed file #250369 auctioned 2025-12-18 with opening bid $2,217.63.
- Currently selling to Pure Clean Systems Inc. for $80,000 (per issue context — not in DB).

---

## Parcel 2 — LAKEWOOD (1581 & 1591 Lakewood Drive NE, Palm Bay)

### Property Record (from `brevard_properties`)

| Field | Value | Source | Tag |
|-------|-------|--------|-----|
| BCPAO Account | 2831799 | `brevard_properties.tax_account` | VERIFIED |
| Property ID | 2831799 | `brevard_properties.property_id` | VERIFIED |
| Parcel ID (GEO) | 28 3722-01-5-5 | `brevard_properties.parcel_id` | VERIFIED |
| Site Address | 1581 LAKEWOOD DR, Palm Bay 32905 | `brevard_properties.street_number` + `street_name` | VERIFIED |
| Current Owner | EVEREST CAPITAL OF BREVARD LLC | `brevard_properties.owner_name1` | VERIFIED |
| Owner Address | 390 ROOSEVELT AVE, SATELLITE BEACH, FL 32937 | `brevard_properties.owner_street` + city/state/zip | VERIFIED |
| Use Code | 0007 | `brevard_properties.use_code` | VERIFIED |
| Use Description | Vacant Residential Land (Multi-Family, Platted) | `brevard_properties.use_code_description` | VERIFIED |
| Legal Description | PALM BAY HOMES SUBD LOTS 5,6 BLK 5 | `brevard_properties.legal_desc` | VERIFIED |
| Acres | 0.83 | `brevard_properties.acres` | VERIFIED |
| Living Area | 0 sqft (vacant) | `brevard_properties.living_area` | VERIFIED |
| Subdivision | PALM BAY HOMES SUBD | `brevard_properties.subdivision_name` | VERIFIED |
| Building Value | $0 | `brevard_properties.bldg_value` | VERIFIED |
| Land Value | $99,600 | `brevard_properties.land_value` | VERIFIED |
| Homestead | $0 | `brevard_properties.homestead_value` | VERIFIED |
| Township/Range/Section | 28 / 37 / 22 | `brevard_properties.township/range_code/section_code` | VERIFIED |
| Block / Lot | 5 / 5 | `brevard_properties.block_code/lot_code` | VERIFIED |
| Plat Book/Page | 0011 / 0061 | `brevard_properties.plat_book/plat_page` | VERIFIED |
| Shape Area | 36,289 sqft | `brevard_properties.shape_area` | VERIFIED |
| Year Built | N/A (vacant land) | No building | VERIFIED |
| Data Source | bcpao_gis | `brevard_properties.source` | VERIFIED |

### Cross-reference (from `zw_parcels`)

| Field | Value | Source | Tag |
|-------|-------|--------|-----|
| Just/Market Value | $99,600 | `zw_parcels.val_market` | VERIFIED |
| Assessed Value | $99,600 | `zw_parcels.val_assessed` | VERIFIED |
| Taxable Value | $99,600 | `zw_parcels.val_taxable` | VERIFIED |
| Site Address | 1581 LAKEWOOD DR NE, PALM BAY 32905 | `zw_parcels.site_addr` | VERIFIED |

### Sales History

**NOT AVAILABLE.** `sales_history` table (12,546 rows) has no records for tax_account `2831799`. This parcel was not included in the BCPAO sales history scrape.

### Notes
- Both Lots 5 & 6 of Block 5 are combined into **one BCPAO record** (account 2831799, 0.83 acres total).
- Acquired via Brevard tax deed Jan 20, 2022 per issue context — **not confirmed from our DB**. The `sale_date`, `sale_price`, `sale_book`, `sale_page` fields in `zw_parcels` are all null.
- Currently under contract to LIG LLC for $320,000 (per issue context — not in DB).

---

## Summary of Findings

### What We Have

| Parcel | `brevard_properties` | `zw_parcels` | `multi_county_auctions` | `sales_history` |
|--------|---------------------|-------------|------------------------|----------------|
| Mims (2000369) | NOT FOUND | FOUND | FOUND | NOT FOUND |
| Lakewood (2831799) | FOUND | FOUND | NOT FOUND | NOT FOUND |

### Critical Gap: No Sales History Data

The `sales_history` table contains 12,546 records but **neither Everest Capital parcel has sales history data**. This means:

1. **Purchase price** — BLANK. Cannot verify from our DB what Everest Capital paid at tax deed sale for either parcel.
2. **Purchase date** — BLANK. Cannot verify acquisition dates from our DB.
3. **Prior owner** — BLANK. No grantor/grantee chain available.
4. **Deed book/page** — BLANK. Not captured in any table for these parcels.

### Recommendation

To get verified sales history for these parcels, options are:
1. **Expand `sales_history` scrape** to cover all Everest Capital parcels (currently only 12,546 of 175,783 Brevard parcels have sales history)
2. **Manual BCPAO lookup** — but issue notes Akamai 403 blocks live access
3. **Brevard Clerk of Court ORB search** — deed book/page available through clerk recording search (not blocked like BCPAO)

---

*Generated 2026-04-09 by Claude Code for SUMMIT #416*
*Honesty Protocol: All values tagged VERIFIED with table.column citation. BLANK where data unavailable. Zero invented numbers.*
