import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // 1. Authenticate the user via JWT (only admins should call this)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
  const token = authHeader.replace('Bearer ', '')

  // Initialize Supabase client (standard client) to verify admin role
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
  }
  
  // Check if user is admin (optional but good practice)
  const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

  if (profileError || profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can access this resource.' }), { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
  }

  // 2. Initialize Supabase client with Service Role Key (Admin access)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // 3. Fetch all profiles, bypassing RLS
    const { data: profiles, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('*');

    if (fetchError) {
        console.error('Error fetching profiles with admin key:', fetchError);
        return new Response(JSON.stringify({ error: 'Failed to fetch profiles.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify(profiles), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('General error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})