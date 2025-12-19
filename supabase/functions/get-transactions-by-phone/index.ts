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
    const { phone: rawPhone, type, status, date_start, date_end, limit } = await req.json();

    if (!rawPhone) {
        return new Response(JSON.stringify({ error: 'Missing required field: phone' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // Padronização: Limpar o telefone para buscar no formato armazenado (apenas dígitos)
    const phone = rawPhone.replace(/[^\d]/g, '');
    if (phone.length < 8) {
        return new Response(JSON.stringify({ error: 'Invalid phone number format.' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // Initialize Supabase client with Service Role Key (Admin access)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Find the user ID based on the phone number
    const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .single();

    if (profileError || !profileData) {
        console.error('Profile lookup error:', profileError?.message);
        return new Response(JSON.stringify({ error: 'User not found or phone number is incorrect.' }), { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }
    
    const userId = profileData.id;

    // 2. Build the query
    let query = supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (type) {
        query = query.eq('type', type);
    }
    if (status) {
        query = query.eq('status', status);
    }
    if (date_start) {
        query = query.gte('date', date_start);
    }
    if (date_end) {
        query = query.lte('date', date_end);
    }
    if (limit) {
        query = query.limit(limit);
    } else {
        query = query.limit(10); // Default limit
    }

    // 3. Execute the query
    const { data: transactionsData, error: transactionsError } = await query;

    if (transactionsError) {
        console.error('Transaction query error:', transactionsError);
        return new Response(JSON.stringify({ error: 'Failed to retrieve transactions.', details: transactionsError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ message: 'Transactions retrieved successfully', transactions: transactionsData }), {
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
});