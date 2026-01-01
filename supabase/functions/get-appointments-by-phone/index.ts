import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { validateApiSecret } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-secret',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // 1. Validate API Secret (Issue 2)
  const authResult = validateApiSecret(req);
  if (!authResult.isValid) {
      return authResult.response!;
  }
  
  try {
    const { phone: rawPhone, date_start, date_end, limit } = await req.json();

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
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

    // Filter by date range
    if (date_start) {
        query = query.gte('date', date_start);
    }
    if (date_end) {
        query = query.lte('date', date_end);
    } else {
        // If only date_start is provided, assume it's for that day
        if (date_start && !date_end) {
             query = query.eq('date', date_start);
        }
    }
    
    if (limit) {
        query = query.limit(limit);
    } else {
        query = query.limit(10); // Default limit
    }

    // 3. Execute the query
    const { data: appointmentsData, error: appointmentsError } = await query;

    if (appointmentsError) {
        console.error('Appointment query error:', appointmentsError);
        return new Response(JSON.stringify({ error: 'Failed to retrieve appointments.', details: appointmentsError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ message: 'Appointments retrieved successfully', appointments: appointmentsData }), {
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