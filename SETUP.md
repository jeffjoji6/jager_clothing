# Jager E-Commerce Setup Guide

## Phase 1: Foundation Setup ✅

The authentication system has been implemented. Follow these steps to get started:

---

## 1. Supabase Setup

### Create Supabase Project

1. Go to [Supabase](https://app.supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name:** Jager Clothing
   - **Database Password:** (save this securely)
   - **Region:** Choose closest to your users
4. Wait for project to be created (~2 minutes)

### Get API Keys

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

### Set Up Database Schema

Run these SQL commands in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  address JSONB,
  is_admin BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'customer' CHECK (role IN ('super_admin', 'admin', 'freelancer', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    'customer',
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 2. Environment Variables

1. Create a `.env` file in the root directory:

```bash
# Copy from .env.example (if it exists) or create new
cp .env.example .env
```

2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. **Important:** Add `.env` to `.gitignore` (should already be there)

---

## 3. Test Authentication

1. Start the dev server:
```bash
npm run dev
```

2. Navigate to `http://localhost:8080/auth/signup`
3. Create a test account
4. Check Supabase Dashboard → **Authentication** → **Users** to see the new user
5. Check **Table Editor** → `user_profiles` to see the profile

---

## 4. Create First Admin User

After creating your account, run this SQL in Supabase:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE user_profiles
SET is_admin = TRUE, role = 'super_admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
```

Or manually update in Supabase Dashboard:
1. Go to **Table Editor** → `user_profiles`
2. Find your user
3. Set `is_admin` to `true`
4. Set `role` to `super_admin`

---

## 5. Next Steps

Once authentication is working:

- ✅ **Phase 1 Complete:** Foundation & Authentication
- 🔄 **Phase 2:** Products & Cart (Next)
- 🔄 **Phase 3:** Custom Lab
- 🔄 **Phase 4:** Checkout & Payments
- 🔄 **Phase 5-8:** Admin Panel & Advanced Features

---

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env` file exists in root directory
- Check that variables start with `VITE_`
- Restart dev server after adding env variables

### "Error creating profile"
- Check that `user_profiles` table exists
- Verify RLS policies are set up correctly
- Check Supabase logs in Dashboard

### Authentication not working
- Verify Supabase URL and key are correct
- Check browser console for errors
- Ensure email confirmation is disabled in Supabase (Settings → Auth) for testing

---

## Need Help?

Refer to:
- [Supabase Docs](https://supabase.com/docs)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [Branding Guidelines](./BRANDING_GUIDELINES.md)

