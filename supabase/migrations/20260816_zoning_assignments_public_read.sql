-- Fix: public.zoning_assignments had RLS enabled (relrowsecurity=true) with
-- ZERO policies, so every role including anon was default-denied despite
-- holding a table-level SELECT grant. Discovered while verifying the PLG
-- gate on /massing, /floorplan, /proforma (issue: email-capture gate at
-- export) — anonymous visitors got "No zoning assignment found" for every
-- parcel, because resolveZoningForParcel() (lib/development-analysis/
-- parcel-zoning-resolver.ts) queries this table with the anon client. This
-- broke the entire free-tier value proposition those three tools rely on,
-- not just the new gate. zoning_districts/zone_standards/permitted_uses
-- already carry an equivalent public-read policy; zoning_assignments was
-- the one table in that resolution chain missing it. No PII/financial
-- columns (parcel_id, zone_code, jurisdiction, county, co_no, etc.) —
-- same public-data category already exposed via zoning_districts and
-- /api/parcels/search.
create policy "zoning_assignments_public_read" on public.zoning_assignments
  for select to public using (true);
