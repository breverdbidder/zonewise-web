-- Allow anonymous users to insert into beta_signups (email capture only)
-- No SELECT/UPDATE/DELETE for anon — they can only submit their email
CREATE POLICY "Anon insert only" ON beta_signups
  FOR INSERT
  TO anon
  WITH CHECK (true);
