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
  
  // 1. Authenticate the user via JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
  const token = authHeader.replace('Bearer ', '')

  // Initialize Supabase client (standard client, relies on RLS)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  
  // Get user ID from token (required for RLS on profile lookup)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
  }
  const userId = user.id;

  try {
    const { message } = await req.json();

    if (!message) {
        return new Response(JSON.stringify({ error: 'Missing required field: message' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // 2. Fetch Connection Config (to get URL) and User Phone
    const [
        { data: configData, error: configError },
        { data: profileData, error: profileError }
    ] = await Promise.all([
        supabase.from('app_config').select('connection_config').eq('id', 1).single(),
        supabase.from('profiles').select('phone').eq('id', userId).single()
    ]);

    if (configError || !configData?.connection_config?.whatsappApi) {
        console.error('Failed to load WhatsApp config:', configError?.message);
        return new Response(JSON.stringify({ error: 'Erro de configuração: API do WhatsApp indisponível.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const config = configData.connection_config.whatsappApi;
    
    if (profileError || !profileData?.phone) {
        console.error('Failed to load user phone:', profileError?.message);
        return new Response(JSON.stringify({ error: 'Seu telefone não está cadastrado. Verifique as configurações.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const phone = profileData.phone.replace(/[^\d]/g, '');

    // 3. Get Token from Deno Secret (Issue 5)
    const tokenSecret = Deno.env.get('WHATSAPP_API_TOKEN');
    if (!tokenSecret) {
        return new Response(JSON.stringify({ error: 'Erro de configuração: Token da API WhatsApp não encontrado.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 4. Send message
    const response = await fetch(config.sendTextUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'token': tokenSecret,
        },
        body: JSON.stringify({
            number: phone,
            text: message
        })
    });

    const data = await response.json();

    if (response.ok) {
        return new Response(JSON.stringify({ message: 'Notificação enviada com sucesso!' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } else {
        console.error('WhatsApp API Error:', data);
        return new Response(JSON.stringify({ error: `Falha ao enviar notificação: ${data.message || data.error || 'Erro desconhecido.'}` }), {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('General error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})