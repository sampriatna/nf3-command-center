-- Run this in Supabase SQL Editor to setup admin credentials

-- 1. Create admin_credentials table
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
CREATE POLICY "admin_credentials_select_public" ON public.admin_credentials
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admin_credentials_insert_service" ON public.admin_credentials
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "admin_credentials_update_service" ON public.admin_credentials
  FOR UPDATE USING (auth.role() = 'service_role');

-- 4. Create password verification function
CREATE OR REPLACE FUNCTION verify_admin_password(admin_id uuid, password_input text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_credentials
    WHERE id = admin_id
    AND password_hash = crypt(password_input, password_hash)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to insert admin with password hashing
CREATE OR REPLACE FUNCTION insert_admin_with_password(
  p_email text,
  p_password text,
  p_name text
)
RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.admin_credentials (email, password_hash, name)
  VALUES (p_email, crypt(p_password, gen_salt('bf')), p_name)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Insert default admin (sampriatna@gmail.com / tukgumer123)
DELETE FROM public.admin_credentials WHERE email = 'sampriatna@gmail.com';
INSERT INTO public.admin_credentials (email, password_hash, name) 
VALUES ('sampriatna@gmail.com', crypt('tukgumer123', gen_salt('bf')), 'Sampriatna Admin');

-- 7. Create index
CREATE INDEX IF NOT EXISTS idx_admin_credentials_email ON public.admin_credentials(email);
