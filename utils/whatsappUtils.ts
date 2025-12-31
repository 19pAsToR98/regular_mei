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

        let data: any = {};
        try {
            data = await response.json();
        } catch (e) {
            // Ignora erro de parsing JSON se a resposta for OK, mas não for JSON puro
        }
        
        dismissToast(toastId);

        if (response.ok) {
            // Assume sucesso se o status HTTP for OK (2xx)
            showSuccess('Notificação enviada com sucesso!');
            return true;
        } else {
            // Se o status HTTP não for OK, mostra a mensagem de erro do corpo da resposta, se disponível.
            console.error('WhatsApp API Error:', data);
            showError(`Falha ao enviar notificação: ${data.message || data.error || 'Erro desconhecido.'}`);
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
    
    // Vamos usar a coluna 'message' para armazenar o ID do compromisso
    const reminderMessage = `[APPT_ID:${appt.id}] ${message}`;
    
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
                message: reminderMessage // Usando o ID no início da mensagem
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
 * Deleta um lembrete agendado na tabela scheduled_reminders baseado no ID do compromisso.
 * Nota: Isso funciona porque incluímos o ID do compromisso no campo 'message' da tabela.
 * @param appointmentId ID do compromisso.
 */
export async function deleteScheduledReminder(appointmentId: number): Promise<boolean> {
    const loadingToastId = showLoading('Cancelando lembrete agendado...');
    
    // 1. Obter o token de sessão
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
        dismissToast(loadingToastId);
        showError('Erro de autenticação ao cancelar lembrete.');
        return false;
    }

    // 2. Chamar a Edge Function para deletar o lembrete
    // Como não temos uma Edge Function específica para exclusão por ID de compromisso,
    // vamos usar o cliente Supabase diretamente (requer RLS configurado para DELETE em scheduled_reminders).
    
    // RLS para DELETE em scheduled_reminders: Users can manage own reminders.
    // A exclusão deve ser feita pelo user_id e pelo conteúdo da mensagem (que contém o ID do compromisso).
    
    const searchPattern = `[APPT_ID:${appointmentId}]%`; // Busca mensagens que começam com o padrão
    
    const { error } = await supabase
        .from('scheduled_reminders')
        .delete()
        .like('message', searchPattern); // Deleta todos os lembretes relacionados a este compromisso

    dismissToast(loadingToastId);

    if (error) {
        console.error('Error deleting scheduled reminder:', error);
        showError('Erro ao cancelar lembrete agendado.');
        return false;
    }
    
    // Não mostramos sucesso aqui, pois o App.tsx mostrará o sucesso da operação principal.
    return true;
}


/**
 * Gera e envia uma notificação de lembrete para uma transação pendente.
 * Mantemos o envio imediato para transações, pois o lembrete é mais sobre a confirmação de registro.
 * @param userId ID do usuário logado.
 * @param t A transação pendente.
 */
export async function scheduleTransactionReminder(userId: string, t: Transaction): Promise<boolean> {
    // FIX: Criar a data explicitamente ao meio-dia local para evitar problemas de fuso horário
    const [year, month, day] = t.date.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    
    const formattedDate = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    
    const typeLabel = t.type === 'receita' ? 'Recebimento' : 'Pagamento';
    const amountStr = t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    const message = `⚠️ Lembrete: O ${typeLabel} de R$ ${amountStr} referente a "${t.description}" está previsto para ${formattedDate}. Não se esqueça de atualizar o status!`;

    // Send immediate confirmation/reminder
    return sendImmediateNotification(userId, message);
}