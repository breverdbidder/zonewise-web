---
pattern: "src/lib/**"
---
# ZoneWise Data Rules

- FL GIO = 10.8M parcels. Hybrid: FL GIO + county GIS + Firecrawl
- Tables: fl_counties(67), county_conquest_status, county_jurisdictions, zoning_assignments
- co_no is the county join key everywhere. Never use county name for joins
- Brevard VERIFIED: 327,882/351,424 (93.3%). NEVER claim 100%
- NEVER-LIE: exact parcel counts from DB only. No rounding, no invented progress
- Query optimization: always filter by co_no first, then jurisdiction
- Vercel project: prj_EaXgEO6WDoSpCeLhuCemtbPr6e8E (zonewise-web). NEVER use deprecated prj_B478...
