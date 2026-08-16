-- Fix subscriptions.user_id to store Clerk user IDs, not Supabase Auth UUIDs.
--
-- Root cause: user_id was `uuid` FK'd to auth.users(id), but this app
-- authenticates via Clerk (see .env.example: "Supabase Database — used for
-- data, NOT auth"). Clerk IDs look like `user_2abc...` and are never valid
-- uuid input, so every checkout.session.completed webhook write to this
-- table has failed since the table's creation (0 rows ever, confirmed via
-- direct query 2026-08-16). app/api/report/route.ts and
-- app/api/zoning-chat/route.ts already carry an Aug-14 ADMIN_USER_IDS
-- override worked around this exact symptom without fixing the cause.
--
-- Also widens the plan CHECK constraint: it only allowed
-- ('free','pro','enterprise'), which excludes the real tier ids
-- ('investor','proplus') used by public.mcp_subscription_tiers and
-- public.stripe_products. Even with user_id fixed, an investor/proplus
-- purchase would still have failed the CHECK.

BEGIN;

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE public.subscriptions ALTER COLUMN user_id TYPE text USING user_id::text;

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan = ANY (ARRAY['free', 'investor', 'pro', 'proplus', 'enterprise']));

-- Recreated on the new text column. auth.uid() is NULL for all requests in
-- this app (Clerk, not Supabase Auth) so this policy is inert either way;
-- service-role queries (all current app code) bypass RLS entirely via the
-- existing "Service role full access subscriptions" policy.
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING ((auth.uid())::text = user_id);

COMMIT;
