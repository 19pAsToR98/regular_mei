import { supabase } from '../src/integrations/supabase/client';
import { showError, showSuccess } from './toastUtils';
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

    const loadingToastId = 'whatsapp-send';
    showSuccess('Enviando notificação via WhatsApp...');

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
        dismissToast(loadingToastId);

        if (response.ok && data.success) {
            showSuccess('Notificação enviada com sucesso!');
            return true;
        } else {
            console.error('WhatsApp API Error:', data);
            showError(`Falha ao enviar notificação: ${data.message || 'Erro desconhecido.'}`);
            return false;
        }
    } catch (e) {
        dismissToast(loadingToastId);
        console.error('Network error during WhatsApp send:', e);
        showError('Erro de rede ao tentar enviar notificação.');
        return false;
    }
}

/**
 * Gera e envia uma notificação de lembrete para um compromisso.
 * Nota: Como não temos um serviço de agendamento (cron job) no frontend, 
 * esta função simula o envio imediato ou registra a intenção.
 * Para um lembrete real, precisaríamos de um serviço de terceiros ou uma Edge Function agendada.
 * Por enquanto, vamos apenas enviar uma confirmação de agendamento.
 * 
 * @param userId ID do usuário logado.
 * @param appt O compromisso a ser lembrado.
 */
export async function scheduleAppointmentReminder(userId: string, appt: Appointment): Promise<boolean> {
    if (!appt.notify) return true; // No need to schedule if notify is false

    const date = new Date(appt.date);
    const formattedDate = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    
    const message = `🔔 Lembrete Agendado: Seu compromisso "${appt.title}" está marcado para ${formattedDate} às ${appt.time}.`;

    // In a real scenario, this would call a backend service to schedule the message.
    // Here, we send an immediate confirmation message to the user.
    return sendImmediateNotification(userId, message);
}

/**
 * Gera e envia uma notificação de lembrete para uma transação pendente.
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