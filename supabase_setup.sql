-- ==========================================
-- VORTEXSHEETS - SUPABASE DATABASE SCHEMA
-- ==========================================
-- Location: public.vortex_sheets
-- Purpose: Store dynamic sheets, grids, cell styles, columns & row counts for auth users.
-- RLS: Enabled to secure documents strictly per user.

-- 1. Create vortex_sheets table
CREATE TABLE IF NOT EXISTS public.vortex_sheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Spreadsheet',
  sheets_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.vortex_sheets ENABLE ROW LEVEL SECURITY;

-- 3. Setup Row-Level Security Policies for user sandboxing
DROP POLICY IF EXISTS "Users can view their own sheets" ON public.vortex_sheets;
CREATE POLICY "Users can view their own sheets" ON public.vortex_sheets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sheets" ON public.vortex_sheets;
CREATE POLICY "Users can insert their own sheets" ON public.vortex_sheets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sheets" ON public.vortex_sheets;
CREATE POLICY "Users can update their own sheets" ON public.vortex_sheets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sheets" ON public.vortex_sheets;
CREATE POLICY "Users can delete their own sheets" ON public.vortex_sheets
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================================
-- 4. Create user_security_questions table for local password reset bypass
-- ========================================================
CREATE TABLE IF NOT EXISTS public.user_security_questions (
  email TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on user_security_questions
ALTER TABLE public.user_security_questions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to find security questions/answers by email
DROP POLICY IF EXISTS "Allow public read access to find security questions" ON public.user_security_questions;
CREATE POLICY "Allow public read access to find security questions" ON public.user_security_questions
  FOR SELECT USING (true);

-- Allow public insert access for sign-ups
DROP POLICY IF EXISTS "Allow public insert access for sign-ups" ON public.user_security_questions;
CREATE POLICY "Allow public insert access for sign-ups" ON public.user_security_questions
  FOR INSERT WITH CHECK (true);

-- Custom PostgreSQL Function (RPC) to update a user's password securely after verifying their security answer
CREATE OR REPLACE FUNCTION public.set_temp_password(p_email TEXT, p_answer TEXT, p_temp_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_stored_answer TEXT;
BEGIN
  -- Retrieve the stored answer
  SELECT answer INTO v_stored_answer
  FROM public.user_security_questions
  WHERE LOWER(email) = LOWER(p_email);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF LOWER(v_stored_answer) != LOWER(p_answer) THEN
    RAISE EXCEPTION 'Incorrect answer';
  END IF;

  -- Update the user's password in auth.users using pgcrypto encryption
  BEGIN
    UPDATE auth.users
    SET encrypted_password = extensions.crypt(p_temp_password, extensions.gen_salt('bf', 10)),
        updated_at = now()
    WHERE LOWER(email) = LOWER(p_email);
  EXCEPTION WHEN OTHERS THEN
    UPDATE auth.users
    SET encrypted_password = crypt(p_temp_password, gen_salt('bf', 10)),
        updated_at = now()
    WHERE LOWER(email) = LOWER(p_email);
  END;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

