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
    const { phone, description, category, type, amount, date, status, is_recurring, installments } = await req.json();

    if (!phone || !description || !category || !type || !amount || !date || !status) {
        return new Response(JSON.stringify({ error: 'Missing required fields: phone, description, category, type, amount, date, status' }), { 
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

    // 2. Insert the new transaction using the found user ID
    const { data: transactionData, error: transactionError } = await supabaseAdmin
        .from('transactions')
        .insert({
            user_id: userId,
            description,
            category,
            type,
            amount,
            date,
            status,
            is_recurring,
            installments,
            external_api: true, // <-- Set to TRUE for API insertions
        })
        .select()
        .single();

    if (transactionError) {
        console.error('Transaction insertion error:', transactionError);
        return new Response(JSON.stringify({ error: 'Failed to create transaction.', details: transactionError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ message: 'Transaction created successfully', transaction: transactionData }), {
      status: 201,
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