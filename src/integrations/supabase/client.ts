import { createClient } from '@supabase/supabase-js'

// O Supabase Project ID e a Anon Key serão carregados das variáveis de ambiente (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase credentials in environment variables.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')