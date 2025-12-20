import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const WEBHOOK_URL = 'https://n8nauto.portalmei360.com/webhook-test/d5c69353-a50b-471b-b518-919af0ced726';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // 1. Authenticate the user via JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    const token = authHeader.replace('Bearer ', '')

    // Initialize Supabase client to get user info
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
    const userId = user.id;

    // 2. Get the user query, audioBase64, and mimeType from the request body
    const { query, audioBase64, mimeType } = await req.json();

    if (!query) {
        return new Response(JSON.stringify({ error: 'Missing required field: query' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // 3. Prepare payload for the external webhook
    const webhookPayload: Record<string, any> = {
        userId: userId,
        query: query,
        timestamp: new Date().toISOString(),
    };
    
    // Include Base64 and MIME type if provided
    if (audioBase64) {
        webhookPayload.audioBase64 = audioBase64;
        webhookPayload.mimeType = mimeType; // Repassa o MIME type
    }

    // 4. Send request to the external webhook
    const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
    });

    // 5. Read the response from the webhook
    const webhookData = await webhookResponse.json();

    // 6. Return the webhook's response directly to the client
    return new Response(JSON.stringify(webhookData), {
      status: webhookResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('General error in process-assistant-query:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})