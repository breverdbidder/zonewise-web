-- LLM call metrics table
-- Tracks every Gemini/DeepSeek/DB-fallback call for cost analysis and alerting.

create table if not exists llm_metrics (
  id              bigserial primary key,
  provider        text        not null check (provider in ('gemini', 'deepseek', 'db_fallback')),
  model           text        not null,
  tokens_in       integer,
  tokens_out      integer,
  latency_ms      integer     not null,
  success         boolean     not null,
  route           text        not null,          -- e.g. '/api/zoning-chat'
  error_message   text,
  cost_estimate   numeric(12, 8) not null default 0,
  created_at      timestamptz not null default now()
);

-- Fast dashboard queries: provider success rate, avg latency, daily cost
create index if not exists llm_metrics_provider_created_at
  on llm_metrics (provider, created_at desc);

create index if not exists llm_metrics_route_created_at
  on llm_metrics (route, created_at desc);

-- Row-level security: service role writes, anon cannot read
alter table llm_metrics enable row level security;

create policy "service role full access"
  on llm_metrics
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
