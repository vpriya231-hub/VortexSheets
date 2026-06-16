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
