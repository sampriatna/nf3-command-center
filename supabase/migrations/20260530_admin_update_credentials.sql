-- Update existing admin credentials
DELETE FROM public.admin_credentials WHERE email = 'admin@nf3.co';

-- Insert new admin with sampriatna credentials
INSERT INTO public.admin_credentials (email, password_hash, name) 
VALUES ('sampriatna@gmail.com', crypt('tukgumer123', gen_salt('bf')), 'Sampriatna Admin')
ON CONFLICT (email) DO UPDATE SET 
  password_hash = crypt('tukgumer123', gen_salt('bf')),
  name = 'Sampriatna Admin',
  updated_at = now();
