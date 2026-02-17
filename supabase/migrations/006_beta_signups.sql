CREATE TABLE IF NOT EXISTS beta_signups (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Allow service role to insert
ALTER TABLE beta_signups ENABLE ROW LEVEL SECURITY;

-- No public access — only service role can insert/read
CREATE POLICY "Service role full access" ON beta_signups
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
