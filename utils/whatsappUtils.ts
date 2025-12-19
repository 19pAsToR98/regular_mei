import { supabase } from '../src/integrations/supabase/client';
import { showError, showSuccess, dismissToast, showLoading, showWarning } from './toastUtils';
import { Appointment, Transaction } from '../types';

// Helper para buscar a configuração da API do WhatsApp
async function getWhatsappConfig() {
    const { data, error } = await supabase
        .from('app_config')
        .select('connection_config')
        .eq('id', 1)
        .single();

    if (error || !data?.connection_config?.whatsappApi) {
        console.error('Failed to load WhatsApp config:', error);
        showError('Erro de configuração: API do WhatsApp indisponível.');
        return null;
    }
    return data.connection_config.whatsappApi;
}

// Helper para buscar o telefone do usuário
async function getUserPhone(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', userId)
        .single();

    if (error || !data?.phone) {
        console.error('Failed to load user phone:', error);
        showError('Seu telefone não está cadastrado. Verifique as configurações.');
        return null;
    }
    return data.phone.replace(/[^\d]/g, ''); // Retorna apenas dígitos
}

/**
 * Envia uma mensagem imediata via WhatsApp.
 * @param userId ID do usuário logado.
 * @param message Mensagem a ser enviada.
 */
export async function sendImmediateNotification(userId: string, message: string): Promise<boolean> {
    const config = await getWhatsappConfig();
    const phone = await getUserPhone(userId);

    if (!config || !phone) return false;

    const toastId = showLoading('Enviando notificação via WhatsApp...');

    try {
        const response = await fetch(config.sendTextUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': config.token,
            },
            body: JSON.stringify({
                number: phone,
                text: message
            })
        });

        const data = await response.json();
        dismissToast(toastId);

        if (response.ok && data.success) {
            showSuccess('Notificação enviada com sucesso!');
            return true;
        } else {
            console.error('WhatsApp API Error:', data);
            showError(`Falha ao enviar notificação: ${data.message || 'Erro desconhecido.'}`);
            return false;
        }
    } catch (e) {
        dismissToast(toastId);
        console.error('Network error during WhatsApp send:', e);
        showError('Erro de rede ao tentar enviar notificação.');
        return false;
    }
}

/**
 * Agenda um lembrete de compromisso para ser enviado no futuro via Edge Function.
 * O lembrete será agendado para 1 hora antes do compromisso.
 * @param userId ID do usuário logado.
 * @param appt O compromisso a ser lembrado.
 */
export async function scheduleAppointmentReminder(userId: string, appt: Appointment): Promise<boolean> {
    if (!appt.notify) return true; // Não agenda se notify for false

    const loadingToastId = showLoading('Agendando lembrete...');
    
    // 1. Calcular a data/hora alvo (1 hora antes do compromisso)
    const [year, month, day] = appt.date.split('-').map(Number);
    const [hour, minute] = appt.time.split(':').map(Number);
    
    // Cria a data do compromisso
    const appointmentDateTime = new Date(year, month - 1, day, hour, minute, 0);
    
    // Agenda 1 hora antes
    const targetDate = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);
    
    // Se a data alvo já passou, não agendamos (ou agendamos para agora, mas vamos evitar)
    if (targetDate < new Date()) {
        dismissToast(loadingToastId);
        showWarning('O compromisso está muito próximo ou já passou. Lembrete não agendado.');
        return false;
    }

    const formattedDate = appointmentDateTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const message = `🔔 Lembrete: Seu compromisso "${appt.title}" está marcado para ${formattedDate} às ${appt.time}.`;

    // 2. Obter o token de sessão
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
        dismissToast(loadingToastId);
        showError('Erro de autenticação ao agendar lembrete.');
        return false;
    }

    // 3. Chamar a Edge Function para registrar o lembrete
    const edgeFunctionUrl = `https://ogwjtlkemsqmpvcikrtd.supabase.co/functions/v1/schedule-whatsapp-reminder`;

    try {
        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                target_date: targetDate.toISOString(),
                message: message
            })
        });

        dismissToast(loadingToastId);

        if (response.ok) {
            showSuccess(`Lembrete agendado para 1 hora antes do compromisso!`);
            return true;
        } else {
            const errorData = await response.json();
            console.error('Edge Function Error:', errorData);
            showError(`Falha ao agendar lembrete: ${errorData.error || 'Erro desconhecido.'}`);
            return false;
        }
    } catch (e) {
        dismissToast(loadingToastId);
        console.error('Network or Fetch Error:', e);
        showError('Erro de conexão ao agendar lembrete.');
        return false;
    }
}

/**
 * Gera e envia uma notificação de lembrete para uma transação pendente.
 * Mantemos o envio imediato para transações, pois o lembrete é mais sobre a confirmação de registro.
 * @param userId ID do usuário logado.
 * @param t A transação pendente.
 */
export async function scheduleTransactionReminder(userId: string, t: Transaction): Promise<boolean> {
    const date = new Date(t.date);
    const formattedDate = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    
    const typeLabel = t.type === 'receita' ? 'Recebimento' : 'Pagamento';
    const amountStr = t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    const message = `⚠️ Lembrete: O ${typeLabel} de R$ ${amountStr} referente a "${t.description}" está previsto para ${formattedDate}. Não se esqueça de atualizar o status!`;

    // Send immediate confirmation/reminder
    return sendImmediateNotification(userId, message);
}