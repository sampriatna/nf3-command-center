-- ============================================================
-- FASE 1 Migration: Auth, Roles, Employees, Logs
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. employees table
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'staff',
  business_unit text NOT NULL DEFAULT 'General',
  brand text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  avatar_url text,
  join_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. user_roles table (links auth users to app roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email text NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'pending',
  business_unit text DEFAULT 'General',
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. notification_log table
CREATE TABLE IF NOT EXISTS public.notification_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL DEFAULT 'whatsapp' CHECK (type IN ('whatsapp','email','system')),
  recipient_phone text,
  recipient_name text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','pending')),
  reference_type text,
  reference_id text,
  error_message text,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 4. activity_log table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_name text,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  description text,
  metadata jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- employees
CREATE POLICY "employees_select" ON public.employees
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "employees_insert" ON public.employees
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "employees_update" ON public.employees
  FOR UPDATE TO authenticated USING (true);

-- user_roles
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_roles_select_admin" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('owner', 'super_admin', 'admin')
    )
  );

CREATE POLICY "user_roles_insert" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_roles_update" ON public.user_roles
  FOR UPDATE TO authenticated USING (true);

-- notification_log
CREATE POLICY "notif_log_select" ON public.notification_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "notif_log_insert" ON public.notification_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- activity_log
CREATE POLICY "activity_log_select" ON public.activity_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "activity_log_insert" ON public.activity_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_bu ON public.employees(business_unit);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_notif_log_sent_at ON public.notification_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);

-- ============================================================
-- Seed: insert dummy employees untuk demo
-- ============================================================

INSERT INTO public.employees (name, email, phone, role, business_unit, brand, status) VALUES
  ('Sam Priatna', 'sampriatna@gmail.com', '6281234567890', 'owner', 'General', NULL, 'active'),
  ('Manager F&B', 'manager.fnb@nf3.co', '6281234567891', 'manager_fnb', 'F&B', 'Buri Umah', 'active'),
  ('Manager NF', 'manager.nf@nf3.co', '6281234567892', 'manager_nf', 'NF', 'CS & Lead NF', 'active'),
  ('Staff CS', 'cs@nf3.co', '6281234567893', 'cs_staff', 'NF', 'CS & Lead NF', 'active'),
  ('Staff Kasir Buri', 'kasir.buri@nf3.co', '6281234567894', 'kasir_fnb', 'F&B', 'Buri Umah', 'active'),
  ('Staff Packing NF', 'packing@nf3.co', '6281234567895', 'packing_nf', 'NF', 'Packing & Gudang NF', 'active')
ON CONFLICT (email) DO NOTHING;
