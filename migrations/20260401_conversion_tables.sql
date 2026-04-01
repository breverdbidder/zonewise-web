-- user_preferences: stores BuyBoxForm data
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  counties TEXT[] DEFAULT '{}',
  min_price INTEGER,
  max_price INTEGER,
  property_types TEXT[] DEFAULT '{}',
  zoning_codes TEXT[] DEFAULT '{}',
  alert_email BOOLEAN DEFAULT true,
  telegram_handle TEXT,
  alert_frequency TEXT DEFAULT 'daily' CHECK (alert_frequency IN ('daily','weekly','instant')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_memory: stores session click history for personalization
CREATE TABLE IF NOT EXISTS user_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT,
  clicked_counties TEXT[] DEFAULT '{}',
  click_count INTEGER DEFAULT 0,
  conversion_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_dashboards: stores saved dashboard configs
CREATE TABLE IF NOT EXISTS user_dashboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Dashboard',
  config JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- price_events: auction price change tracking
CREATE TABLE IF NOT EXISTS price_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  county TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('bid_drop','bid_rise','new_listing','cancelled')),
  pct_change NUMERIC(6,4),
  median_bid INTEGER,
  auction_count INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- buy_zone_alerts: user alert subscriptions
CREATE TABLE IF NOT EXISTS buy_zone_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  county TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('price_drop','new_auction','zoning_change','foreclosure')),
  threshold JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE buy_zone_alerts ENABLE ROW LEVEL SECURITY;

-- service_role full access (for agents)
CREATE POLICY "service_role_all" ON user_preferences FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "users_own_prefs" ON user_preferences FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "service_role_all" ON user_memory FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "users_own_memory" ON user_memory FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "service_role_all" ON user_dashboards FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "users_own_dashboards" ON user_dashboards FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "service_role_all" ON price_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "price_events_read" ON price_events FOR SELECT USING (true);

CREATE POLICY "service_role_all" ON buy_zone_alerts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "users_own_alerts" ON buy_zone_alerts FOR ALL USING (user_id = auth.uid()::text);
