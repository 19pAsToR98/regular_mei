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
 * @param audioBase64 Opcional: String Base64 do áudio gravado (sem prefixo Data URI).
 * @param mimeType Opcional: O MIME type do áudio (ex: 'audio/ogg;codecs=opus').
 * @returns A resposta processada do webhook.
 */
export async function sendAssistantQuery(query: string, audioBase64?: string, mimeType?: string): Promise<WebhookResponse | null> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
        showError('Erro de autenticação. Faça login novamente.');
        return null;
    }
    
    const messageType = audioBase64 ? 'audio' : 'text';

    try {
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                query,
                audioBase64, // Base64 puro
                mimeType,    // MIME type separado
                messageType, // NOVO CAMPO
            })
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