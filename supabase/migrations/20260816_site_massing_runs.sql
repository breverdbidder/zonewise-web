-- Site massing runs + candidate options — persistence for the Massing
-- Engine's real-parcel-polygon solver + CAD/DXF export (issue #19144).
--
-- Both tables already exist live in this project (created directly against
-- the DB by the earlier, superseded #19143 dispatch before it was stopped —
-- confirmed via the PostgREST OpenAPI schema and pg_class.relrowsecurity on
-- 2026-08-16; zero rows in either table, no migration file had been
-- committed for them). This migration is `if not exists` so it is a no-op
-- against the live DB and exists purely so the schema is reproducible from
-- a fresh clone instead of only living in prod.

create table if not exists public.site_massing_runs (
  id uuid primary key default gen_random_uuid(),
  parcel_id text not null,
  co_no int not null,
  zoning_snapshot jsonb not null,
  parcel_boundary geometry(Geometry, 4326) not null,
  status text not null default 'pending',
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.site_massing_options (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.site_massing_runs(id) on delete cascade,
  option_rank int not null,
  layout_type text not null,
  footprints jsonb not null,
  unit_count int not null,
  gross_floor_area_sqft numeric not null,
  lot_coverage_pct numeric not null,
  setback_compliant boolean not null,
  score numeric not null,
  dxf_path text,
  created_at timestamptz not null default now()
);

alter table public.site_massing_runs enable row level security;
alter table public.site_massing_options enable row level security;
-- no anon policy — reads/writes go through service-role API routes only
