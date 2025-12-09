import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // 1. Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    const token = authHeader.replace('Bearer ', '')

    // 2. Initialize Supabase client with Service Role Key (required to delete auth.users)
    // NOTE: We use the Service Role Key here, which is automatically available as a secret in Edge Functions.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Get the user ID from the JWT (manual verification since verify_jwt is false)
    // We use the admin client to get the user details securely.
    const { data: userResponse, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !userResponse.user) {
        console.error('JWT verification failed:', userError?.message)
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
    }
    
    const userId = userResponse.user.id;

    // 4. Delete the user from the auth schema
    // This action triggers RLS and ON DELETE CASCADE on related tables (profiles, transactions, appointments)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return new Response(JSON.stringify({ error: 'Failed to delete user account.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`User ${userId} and associated data deleted successfully.`);

    return new Response(JSON.stringify({ message: 'Account deleted successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('General error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})