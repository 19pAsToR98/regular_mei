import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper para enviar a mensagem via API do WhatsApp
async function sendWhatsappMessage(phone: string, message: string, config: any) {
    const url = config.sendTextUrl;
    // Read token from Deno environment secret (Issue 5)
    const token = Deno.env.get('WHATSAPP_API_TOKEN');

    if (!url || !token) {
        console.error("WhatsApp API URL or Token is missing in config/secrets.");
        return { success: false, error: "Config missing" };
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'token': token,
        },
        body: JSON.stringify({
            number: phone,
            text: message
        })
    });

    const data = await response.json();
    return { success: response.ok, data };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // This function should ideally be protected by a secret key, but for simplicity, we rely on the Service Role Key internally.
  
  try {
    // Initialize Supabase client with Service Role Key (Admin access)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch Connection Config (to get WhatsApp API details, excluding token)
    const { data: configData, error: configError } = await supabaseAdmin
        .from('app_config')
        .select('connection_config')
        .eq('id', 1)
        .single();

    if (configError || !configData?.connection_config?.whatsappApi) {
        console.error('Failed to load WhatsApp config:', configError?.message);
        return new Response(JSON.stringify({ error: 'Failed to load WhatsApp config' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const whatsappConfig = configData.connection_config.whatsappApi;

    // 2. Find pending reminders whose target_date is in the past or now
    const now = new Date().toISOString();
    const { data: reminders, error: remindersError } = await supabaseAdmin
        .from('scheduled_reminders')
        .select('id, user_id, message')
        .eq('status', 'pending')
        .lte('target_date', now)
        .limit(50); // Limit batch size

    if (remindersError) {
        console.error('Error fetching pending reminders:', remindersError.message);
        return new Response(JSON.stringify({ error: 'Failed to fetch reminders' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results = [];

    // 3. Process each reminder
    for (const reminder of reminders) {
        // A. Get user phone number
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('phone')
            .eq('id', reminder.user_id)
            .single();
        
        if (profileError || !profileData?.phone) {
            console.warn(`Skipping reminder ${reminder.id}: User phone not found.`);
            // Mark as failed if phone is missing
            await supabaseAdmin.from('scheduled_reminders').update({ status: 'failed', sent_at: now }).eq('id', reminder.id);
            continue;
        }
        
        const userPhone = profileData.phone.replace(/[^\d]/g, '');

        // B. Send WhatsApp Message
        const sendResult = await sendWhatsappMessage(userPhone, reminder.message, whatsappConfig);
        
        // C. Update reminder status
        const newStatus = sendResult.success ? 'sent' : 'failed';
        await supabaseAdmin
            .from('scheduled_reminders')
            .update({ status: newStatus, sent_at: now })
            .eq('id', reminder.id);

        results.push({ id: reminder.id, success: sendResult.success, status: newStatus });
    }

    return new Response(JSON.stringify({ message: `Processed ${reminders.length} reminders.`, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('General error in process-scheduled-reminders:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})