import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  (import.meta as any).env.VITE_SUPABASE_URL || 
  (import.meta as any).env.SUPABASE_URL || 
  (typeof process !== 'undefined' && (process as any).env ? ((process as any).env.VITE_SUPABASE_URL || (process as any).env.SUPABASE_URL) : '') || 
  '';

const supabaseAnonKey = 
  (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 
  (import.meta as any).env.SUPABASE_ANON_KEY || 
  (typeof process !== 'undefined' && (process as any).env ? ((process as any).env.VITE_SUPABASE_ANON_KEY || (process as any).env.SUPABASE_ANON_KEY) : '') || 
  '';

// Verify credentials exist before instantiating to prevent startup crashing.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);

/**
 * Standard SQL Schema for the vortex_sheets table.
 * Users can execute this directly in their Supabase SQL editor.
 */
export const SUPABASE_TABLE_SCHEMA = `
-- Create VortexSheets table
create table if not exists public.vortex_sheets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null default 'My Spreadsheet',
  sheets_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.vortex_sheets enable row level security;

-- Setup Row-Level Security Policies for vortex_sheets
create policy "Users can view their own sheets" on public.vortex_sheets
  for select using (auth.uid() = user_id);

create policy "Users can insert their own sheets" on public.vortex_sheets
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own sheets" on public.vortex_sheets
  for update using (auth.uid() = user_id);

create policy "Users can delete their own sheets" on public.vortex_sheets
  for delete using (auth.uid() = user_id);
`;
