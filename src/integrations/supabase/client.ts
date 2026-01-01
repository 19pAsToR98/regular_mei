import { createClient } from '@supabase/supabase-js'

// Reading Supabase credentials from environment variables (Issue 7)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase credentials.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')