import { supabase } from '../src/integrations/supabase/client';
import { showError } from './toastUtils';

const EDGE_FUNCTION_URL = 'https://ogwjtlkemsqmpvcikrtd.supabase.co/functions/v1/process-assistant-query';

interface WebhookResponse {
    text: string;
    action?: {
        type: 'navigate';
        target: string;
        label: string;
    }
}

/**
 * Envia a consulta do usuário para a Edge Function, que a repassa ao webhook externo.
 * @param query A mensagem de texto do usuário.
 * @returns A resposta processada do webhook.
 */
export async function sendAssistantQuery(query: string): Promise<WebhookResponse | null> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
        showError('Erro de autenticação. Faça login novamente.');
        return null;
    }

    try {
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Assistant Query Error:', data);
            showError(`Erro do assistente: ${data.error || 'Falha na comunicação.'}`);
            return { text: 'Desculpe, houve um erro ao processar sua solicitação. Tente novamente mais tarde.' };
        }
        
        // O webhook deve retornar um objeto com 'text' e opcionalmente 'action'
        return data as WebhookResponse;

    } catch (e) {
        console.error('Network or Fetch Error:', e);
        showError('Erro de conexão ao falar com o assistente.');
        return { text: 'Erro de rede. Verifique sua conexão.' };
    }
}