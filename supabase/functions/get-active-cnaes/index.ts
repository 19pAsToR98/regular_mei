import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { validateApiSecret } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-secret',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // 1. Validate API Secret (Security check for external automation)
  const authResult = validateApiSecret(req);
  if (!authResult.isValid) {
      console.error("[get-active-cnaes] Unauthorized access attempt.");
      return authResult.response!;
  }
  
  try {
    // Initialize Supabase client with Service Role Key (Admin access to read all profiles)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Fetch all unique, non-null CNPJs from active users
    const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('cnpj_data')
        .not('cnpj_data', 'is', null)
        .eq('status', 'active');

    if (profilesError) {
        console.error('[get-active-cnaes] Error fetching profiles:', profilesError);
        return new Response(JSON.stringify({ error: 'Failed to fetch profiles.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
    
    // 3. Extract unique CNAE codes
    const cnaeSet = new Set<string>();
    
    profiles.forEach(profile => {
        const cnpjData = profile.cnpj_data;
        
        // Safely extract CNAE code from the nested JSONB structure
        const cnaeCode = cnpjData?.estabelecimento?.atividade_principal?.id;
        
        if (cnaeCode && typeof cnaeCode === 'string' && cnaeCode.length > 0) {
            cnaeSet.add(cnaeCode);
        }
    });
    
    const activeCnaes = Array.from(cnaeSet);
    console.log(`[get-active-cnaes] Found ${activeCnaes.length} unique CNAEs.`);

    return new Response(JSON.stringify({ 
        message: 'Active CNAEs retrieved successfully', 
        cnaes: activeCnaes 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[get-active-cnaes] General error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});