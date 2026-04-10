-- CI Dossier Protocol v1.2 Schema Upgrade
-- Adds v1.1 (Google Business + Stitch + Banana Pro) and v1.2 (GitHub Secret Discoveries) columns
-- Creates 2 missing tables: ci_dossier_evidence_log, ci_dossier_runs
-- Date: April 10, 2026
-- Issue: breverdbidder/cli-anything-biddeed#445

-- ============================================
-- PHASE 1: ALTER ci_dossiers — add v1.0 protocol columns missing from current schema
-- ============================================

-- Phase 1 corporate profile columns
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS legal_name text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS jurisdiction text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS registration_number text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS hq_primary text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS hq_locations jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS founded_date date;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS founding_story text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS employee_count integer;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS employee_growth_30_90_365 jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS crunchbase_url text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS pitchbook_url text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS pitchbook_status text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS opencorporates_url text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS sec_form_d_count integer DEFAULT 0;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS funding_rounds jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS investor_context jsonb DEFAULT '{}';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS board_members jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS founders jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS key_executives jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS notable_hires jsonb DEFAULT '[]';

-- Phase 1 v1.1: Translate API
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS non_english_sources_translated boolean DEFAULT false;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS translated_content jsonb;

-- Phase 4: Pricing & Business Model (beyond existing pricing_tiers)
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS pricing_signals jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS pricing_model_type text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS subscription_terms jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS revenue_streams jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS unit_economics jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS business_model_summary text;

-- Phase 5: Legal, IP, Moat
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS patent_search_uspto jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS patent_search_google jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS patent_search_epo jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS patent_search_wipo jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS patent_search_justia jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS per_founder_patent_search jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS trademark_search jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS litigation_federal jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS litigation_state jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS regulatory_filings jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS trade_secret_inference text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS prior_art_severity text;

-- Phase 6: Customer & Market Intelligence
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS known_customers jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS linkedin_customer_signals jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS review_intelligence jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS press_timeline jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS social_metrics jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS search_trends jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS traffic_intelligence jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS backlink_profile jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS current_jobs jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS historical_jobs jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS market_claims jsonb;

-- Phase 6 v1.1: Google APIs
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS youtube_founder_videos jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS knowledge_graph_entities jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS sentiment_scores jsonb;

-- Phase 6 v1.2: Exa, LinkedIn, Apify, Greptile
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS exa_search_results jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS linkedin_enriched_founders jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS instagram_metrics jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS linkedin_company_data jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS greptile_code_intel jsonb;

-- Phase 7: Technology Stack
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS frontend_stack jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS css_stack text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS analytics_stack jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS chat_booking_tools jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS experimentation_tools jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS tracking_pixels jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS hosting_stack text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS auth_stack text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS security_headers jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS tls_config jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS compliance_claims jsonb DEFAULT '[]';

-- Phase 7 v1.2: BuiltWith
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS builtwith_profile jsonb;

-- Phase 8a: SEO Intelligence
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS seo_keywords jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS schema_markup jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS internal_link_graph jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS canonical_strategy text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS robots_meta_patterns jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS web_vitals jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS content_clusters jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS editorial_cadence text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS lead_magnets jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS backlink_signals jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS press_velocity jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS wikipedia_url text;

-- Phase 8a v1.1: PSI + CrUX
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS psi_scores jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS crux_trends jsonb;

-- Phase 8b: GEO Intelligence
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS geo_perplexity_cited jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS geo_chatgpt_cited jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS geo_claude_cited jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS geo_gemini_cited jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS llms_txt_published boolean;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS agent_skill_published boolean;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS ssr_score numeric;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS claim_density_score numeric;

-- Phase 8b v1.1: Gemini Grounded + NotebookLM
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS geo_gemini_grounded jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS notebooklm_research_id text;

-- Phase 8c: Customer Behavior
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS behavior_tools jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS personalization_tools jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS intent_data_stack jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS visitor_reveal_tools jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS consent_stack text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS retargeting_pixels jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS behavior_triggers jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS abandonment_recovery boolean;

-- Phase 8d: Lead Generation
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS demo_flow jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS form_fields jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS newsletter_strategy text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS webinars jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS founder_podcasts jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS conference_appearances jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS guest_posts jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS case_studies jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS interactive_tools jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS free_tier_mechanics jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS partner_programs jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS community_presence jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS progressive_profiling boolean;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS enrichment_stack jsonb DEFAULT '[]';

-- Phase 8e: Recurring Revenue
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS expansion_mechanics jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS workflow_lock_in_score numeric;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS data_portability_score numeric;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS retention_machinery jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS contract_templates jsonb DEFAULT '[]';
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS sla_commitments text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS product_expansion_velocity text;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS geo_expansion_pattern jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS vertical_expansion_pattern jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS acquisitions_made jsonb DEFAULT '[]';

-- Phase 2 v1.1: Stitch design system
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS design_tokens jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS component_patterns jsonb;
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS ux_flows jsonb;

-- Phase 11 v1.1: Banana Pro
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS patent_illustrations_generated boolean DEFAULT false;

-- Protocol version tracking
ALTER TABLE ci_dossiers ADD COLUMN IF NOT EXISTS protocol_version text DEFAULT '1.2';

-- ============================================
-- PHASE 2: CREATE missing tables
-- ============================================

-- Evidence log: tracks every checkpoint verification
CREATE TABLE IF NOT EXISTS ci_dossier_evidence_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_slug text NOT NULL,
  phase integer NOT NULL,
  checkpoint text NOT NULL,
  artifact_description text,
  evidence_path text,
  verification_command text,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_evidence_log_competitor FOREIGN KEY (competitor_slug)
    REFERENCES ci_dossiers(competitor_slug) ON DELETE CASCADE
);

COMMENT ON TABLE ci_dossier_evidence_log IS 'Tracks verification of each CI Dossier protocol checkpoint per competitor';

CREATE INDEX IF NOT EXISTS idx_evidence_log_slug ON ci_dossier_evidence_log(competitor_slug);
CREATE INDEX IF NOT EXISTS idx_evidence_log_phase ON ci_dossier_evidence_log(phase);

-- Execution runs: tracks each protocol execution session
CREATE TABLE IF NOT EXISTS ci_dossier_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_slug text NOT NULL,
  protocol_version text NOT NULL DEFAULT '1.2',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  current_phase integer DEFAULT 0,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'paused')),
  credits_used integer DEFAULT 0,
  session_id text,
  checkpoints_passed integer DEFAULT 0,
  checkpoints_total integer DEFAULT 196,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_runs_competitor FOREIGN KEY (competitor_slug)
    REFERENCES ci_dossiers(competitor_slug) ON DELETE CASCADE
);

COMMENT ON TABLE ci_dossier_runs IS 'Tracks execution sessions of the CI Dossier protocol per competitor';

CREATE INDEX IF NOT EXISTS idx_runs_slug ON ci_dossier_runs(competitor_slug);
CREATE INDEX IF NOT EXISTS idx_runs_status ON ci_dossier_runs(status);

-- ============================================
-- PHASE 3: RLS policies for new tables
-- ============================================

ALTER TABLE ci_dossier_evidence_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_dossier_runs ENABLE ROW LEVEL SECURITY;

-- Service role full access (used by AI agents)
CREATE POLICY "service_role_evidence_log" ON ci_dossier_evidence_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_runs" ON ci_dossier_runs
  FOR ALL USING (auth.role() = 'service_role');

-- Anon read access (for dashboards)
CREATE POLICY "anon_read_evidence_log" ON ci_dossier_evidence_log
  FOR SELECT USING (true);

CREATE POLICY "anon_read_runs" ON ci_dossier_runs
  FOR SELECT USING (true);

-- ============================================
-- PHASE 4: Updated_at trigger for ci_dossiers
-- ============================================

CREATE OR REPLACE FUNCTION update_ci_dossier_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ci_dossiers_updated_at ON ci_dossiers;
CREATE TRIGGER ci_dossiers_updated_at
  BEFORE UPDATE ON ci_dossiers
  FOR EACH ROW EXECUTE FUNCTION update_ci_dossier_updated_at();

-- ============================================
-- PHASE 5: Update existing dono-ai row protocol version
-- ============================================

UPDATE ci_dossiers SET protocol_version = '1.2' WHERE competitor_slug = 'dono-ai';
