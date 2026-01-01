import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper para formatar a data
const formatDate = (dateStr: string) => {
    try {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch {
        return dateStr;
    }
}

// Helper para enviar a mensagem via API do WhatsApp
async function sendWhatsappMessage(phone: string, message: string, config: any) {
    const url = config.whatsappApi.sendTextUrl;
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
  
  try {
    // Initialize Supabase client with Service Role Key (Admin access)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch Connection Config (to get WhatsApp API details and global toggle)
    const { data: configData, error: configError } = await supabaseAdmin
        .from('app_config')
        .select('connection_config')
        .eq('id', 1)
        .single();

    if (configError || !configData?.connection_config) {
        console.error('Failed to load connection config:', configError?.message);
        return new Response(JSON.stringify({ error: 'Failed to load connection config' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const connectionConfig = configData.connection_config;
    
    // Check global WhatsApp toggle
    if (!connectionConfig.whatsappApi?.enabled) {
        console.log('WhatsApp integration is globally disabled. Skipping weekly summary.');
        return new Response(JSON.stringify({ message: 'WhatsApp integration is globally disabled.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }


    // 2. Determine the date range for the next 7 days
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    // 3. Fetch all active users who OPTED IN for the weekly summary
    const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, name, phone')
        .not('phone', 'is', null)
        .eq('status', 'active')
        .eq('receive_weekly_summary', true); // NEW FILTER

    if (profilesError) {
        console.error('Failed to fetch profiles:', profilesError.message);
        return new Response(JSON.stringify({ error: 'Failed to fetch profiles' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results = [];

    // 4. Iterate over each user and generate summary
    for (const profile of profiles) {
        const userId = profile.id;
        const userName = profile.name || 'Empreendedor(a)';
        const userPhone = profile.phone!.replace(/[^\d]/g, ''); // Clean phone number

        // A. Fetch upcoming appointments (next 7 days)
        const { data: appts, error: apptsError } = await supabaseAdmin
            .from('appointments')
            .select('title, date, time')
            .eq('user_id', userId)
            .gte('date', todayStr)
            .lte('date', nextWeekStr)
            .order('date', { ascending: true });

        // B. Fetch upcoming pending transactions (next 7 days)
        const { data: trans, error: transError } = await supabaseAdmin
            .from('transactions')
            .select('description, type, amount, date')
            .eq('user_id', userId)
            .eq('status', 'pendente')
            .gte('date', todayStr)
            .lte('date', nextWeekStr)
            .order('date', { ascending: true });

        if (apptsError || transError) {
            console.error(`Error fetching data for user ${userId}:`, apptsError?.message || transError?.message);
            continue;
        }

        let summary = `Olá, ${userName}! 👋\n\n`;
        summary += `Aqui está o seu resumo semanal do Regular MEI para os próximos 7 dias:\n\n`;
        
        let hasContent = false;

        // 5. Build Appointments Summary
        if (appts && appts.length > 0) {
            summary += `🗓️ *Compromissos (${appts.length}):*\n`;
            appts.forEach(a => {
                summary += `- ${formatDate(a.date)} às ${a.time}: ${a.title}\n`;
            });
            summary += '\n';
            hasContent = true;
        }

        // 6. Build Financial Summary
        if (trans && trans.length > 0) {
            const receitas = trans.filter(t => t.type === 'receita');
            const despesas = trans.filter(t => t.type === 'despesa');
            
            if (receitas.length > 0) {
                const totalReceita = receitas.reduce((acc, t) => acc + t.amount, 0);
                summary += `💰 *Contas a Receber (${receitas.length}):*\n`;
                summary += `Total Previsto: R$ ${totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
                receitas.forEach(t => {
                    summary += `- ${formatDate(t.date)}: R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${t.description})\n`;
                });
                summary += '\n';
                hasContent = true;
            }

            if (despesas.length > 0) {
                const totalDespesa = despesas.reduce((acc, t) => acc + t.amount, 0);
                summary += `💸 *Contas a Pagar (${despesas.length}):*\n`;
                summary += `Total Previsto: R$ ${totalDespesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
                despesas.forEach(t => {
                    summary += `- ${formatDate(t.date)}: R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${t.description})\n`;
                });
                summary += '\n';
                hasContent = true;
            }
        }
        
        if (!hasContent) {
            summary += '🎉 Tudo tranquilo! Não há compromissos ou contas pendentes para os próximos 7 dias.';
        }

        summary += '\n_Para gerenciar, acesse seu dashboard Regular MEI._';

        // 7. Send WhatsApp Message
        const sendResult = await sendWhatsappMessage(userPhone, summary, connectionConfig);
        results.push({ userId, phone: userPhone, success: sendResult.success, message: sendResult.data.message || sendResult.error });
    }

    return new Response(JSON.stringify({ message: 'Weekly summaries processed.', results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('General error in send-weekly-summary:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});