-- ============================================================================
-- TeaceLock: Admin Authorization & Role-Based Access Control (RBAC)
-- Migration: 001_admin_authorization_and_rbac.sql
-- ============================================================================

-- 1. Admin emails configuration (source of truth for admin authorization)
CREATE TABLE IF NOT EXISTS admin_emails (
  email TEXT PRIMARY KEY NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. User profiles with roles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer'
    CHECK (role IN ('admin', 'manufacturer', 'distributor', 'retailer', 'customer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- 3. Enable Row Level Security on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_chain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies (idempotent cleanup — avoids duplicates)
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS products_public_read ON products';
  EXECUTE 'DROP POLICY IF EXISTS products_manufacturer_admin_insert ON products';
  EXECUTE 'DROP POLICY IF EXISTS products_manufacturer_admin_update ON products';
  EXECUTE 'DROP POLICY IF EXISTS products_admin_delete ON products';

  EXECUTE 'DROP POLICY IF EXISTS supply_chain_events_public_read ON supply_chain_events';
  EXECUTE 'DROP POLICY IF EXISTS supply_chain_events_manufacturer_insert ON supply_chain_events';
  EXECUTE 'DROP POLICY IF EXISTS supply_chain_events_distributor_insert ON supply_chain_events';
  EXECUTE 'DROP POLICY IF EXISTS supply_chain_events_retailer_insert ON supply_chain_events';
  EXECUTE 'DROP POLICY IF EXISTS supply_chain_events_admin_insert ON supply_chain_events';
  EXECUTE 'DROP POLICY IF EXISTS supply_chain_events_admin_delete ON supply_chain_events';

  EXECUTE 'DROP POLICY IF EXISTS user_profiles_own_read ON user_profiles';
  EXECUTE 'DROP POLICY IF EXISTS user_profiles_admin_all ON user_profiles';
  EXECUTE 'DROP POLICY IF EXISTS user_profiles_service_insert ON user_profiles';

  EXECUTE 'DROP POLICY IF EXISTS admin_emails_public_read ON admin_emails';
  EXECUTE 'DROP POLICY IF EXISTS admin_emails_admin_all ON admin_emails';
END $$;

-- 5. RLS Policies — products
CREATE POLICY products_public_read ON products
  FOR SELECT TO public USING (true);

CREATE POLICY products_manufacturer_admin_insert ON products
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('manufacturer', 'admin'))
  );

CREATE POLICY products_manufacturer_admin_update ON products
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('manufacturer', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('manufacturer', 'admin')));

CREATE POLICY products_admin_delete ON products
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. RLS Policies — supply_chain_events
CREATE POLICY supply_chain_events_public_read ON supply_chain_events
  FOR SELECT TO public USING (true);

CREATE POLICY supply_chain_events_manufacturer_insert ON supply_chain_events
  FOR INSERT TO authenticated
  WITH CHECK (
    event_type = 'MANUFACTURED'
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('manufacturer', 'admin'))
  );

CREATE POLICY supply_chain_events_distributor_insert ON supply_chain_events
  FOR INSERT TO authenticated
  WITH CHECK (
    event_type IN ('DISPATCHED', 'RECEIVED')
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('distributor', 'admin'))
  );

CREATE POLICY supply_chain_events_retailer_insert ON supply_chain_events
  FOR INSERT TO authenticated
  WITH CHECK (
    event_type IN ('RETAILER_RECEIVED', 'SOLD')
    AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('retailer', 'admin'))
  );

CREATE POLICY supply_chain_events_admin_insert ON supply_chain_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY supply_chain_events_admin_delete ON supply_chain_events
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7. RLS Policies — user_profiles
CREATE POLICY user_profiles_own_read ON user_profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY user_profiles_admin_all ON user_profiles
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY user_profiles_service_insert ON user_profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- 8. RLS Policies — admin_emails
CREATE POLICY admin_emails_public_read ON admin_emails
  FOR SELECT TO public USING (true);

CREATE POLICY admin_emails_admin_all ON admin_emails
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- 9. SECURITY DEFINER function — sync user profile after sign-in
CREATE OR REPLACE FUNCTION sync_user_profile(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  p_email := lower(trim(p_email));

  SELECT EXISTS (SELECT 1 FROM admin_emails WHERE email = p_email)
  INTO v_is_admin;

  IF v_is_admin THEN
    INSERT INTO user_profiles (id, email, role, updated_at)
    VALUES (auth.uid(), p_email, 'admin', now())
    ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          role = 'admin',
          updated_at = now();
  ELSE
    INSERT INTO user_profiles (id, email, role, updated_at)
    VALUES (auth.uid(), p_email, 'customer', now())
    ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          role = CASE WHEN user_profiles.role = 'admin' THEN 'admin' ELSE 'customer' END,
          updated_at = now();
  END IF;
END;
$$;

-- 10. Trigger — auto-create user_profiles on new auth.user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_profiles (id, email, role)
  SELECT
    NEW.id,
    lower(NEW.email),
    CASE
      WHEN EXISTS (SELECT 1 FROM admin_emails WHERE email = lower(NEW.email))
      THEN 'admin'
      ELSE 'customer'
    END
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 11. Seed admin_emails (run manually in Supabase SQL Editor after deployment)
-- Replace 'admin@gmail.com' with your actual admin email(s).
-- Each email must be inserted individually:
--   INSERT INTO admin_emails (email) VALUES ('admin@gmail.com');
--
-- NOTE: The VITE_ADMIN_EMAILS environment variable is used by the frontend for
-- UI-level checks. This table is the server-side source of truth for RBAC.
-- You must insert admin emails here via the Supabase Dashboard SQL Editor.