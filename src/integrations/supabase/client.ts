import { createClient } from '@supabase/supabase-js'

// O Supabase Project ID e a Anon Key são injetados pelo ambiente.
const supabaseUrl = 'https://ogwjtlkemsqmpvcikrtd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nd2p0bGtlbXNxbXB2Y2lrcnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNjEyOTcsImV4cCI6MjA4MDYzNzI5N30.at2Bl3cAhiZxQ6uuYrEwYVSqkBj7XGaMlD125O8wjRk'

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase credentials.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)