## Admin Portal Setup Instructions

### Step 1: Run SQL Migration in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com/
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy-paste the entire content dari file `SETUP_ADMIN_MANUAL.sql`
6. Click **Run**

Ini akan:
- Create `admin_credentials` table
- Setup security policies
- Create password verification functions
- Insert admin user: **sampriatna@gmail.com** / **tukgumer123**

### Step 2: Test Admin Login

1. Open browser: http://localhost:3000/admin-login
2. Enter:
   - Email: `sampriatna@gmail.com`
   - Password: `tukgumer123`
3. Click **Sign In**

Jika berhasil, kamu akan redirect ke `/admin-dashboard`

### Step 3: Customize Password (Recommended)

Untuk mengubah password admin, buka Supabase SQL Editor dan run:

```sql
UPDATE public.admin_credentials 
SET password_hash = crypt('YOUR_NEW_PASSWORD', gen_salt('bf'))
WHERE email = 'sampriatna@gmail.com';
```

Replace `YOUR_NEW_PASSWORD` dengan password baru.

### Adding New Admin Users

```sql
SELECT insert_admin_with_password(
  'newemail@nf3.co',
  'newpassword123',
  'New Admin Name'
);
```

### API Endpoints

**POST /api/admin/login**
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email": "sampriatna@gmail.com", "password": "tukgumer123"}'
```

**GET /api/admin/verify-session**
```bash
curl http://localhost:3000/api/admin/verify-session
```

**POST /api/admin/logout**
```bash
curl -X POST http://localhost:3000/api/admin/logout
```

### Features

- **Admin Login Page**: `/admin-login` - Simple email/password form
- **Admin Dashboard**: `/admin-dashboard` - Overview with quick stats
- **Session Management**: 7-day HttpOnly cookies
- **Security**: Passwords hashed dengan bcrypt (pgcrypto)

### Troubleshooting

**"Email atau password salah" error:**
- Pastikan migration sudah di-run di Supabase
- Verify admin user ada di database
- Check spelling: `sampriatna@gmail.com` (bukan sampriatna@nf3.co)

**Dashboard tidak muncul:**
- Clear browser cookies
- Logout dan login lagi
- Check browser console untuk error

**Forgot password:**
- Update password menggunakan SQL query di atas
