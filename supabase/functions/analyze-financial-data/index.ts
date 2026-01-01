import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.30.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // 1. Authentication (Requires JWT from client)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
  
  // 2. Get API Key from Deno Secrets
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured.' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
  }

  try {
    const { context } = await req.json();

    if (!context) {
        return new Response(JSON.stringify({ error: 'Missing required field: context' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    const prompt = `
        Você é um consultor financeiro especializado em Microempreendedores Individuais (MEI) no Brasil.
        Analise os dados financeiros fornecidos e gere um resumo executivo curto e motivador.
        
        Dados: ${context}
        
        Instruções:
        1. Fale diretamente com o empreendedor ("Você").
        2. O texto deve ser conciso (máximo 3-4 frases para o resumo).
        3. Inclua 2 dicas práticas e acionáveis em bullet points, focando em otimização fiscal (limite MEI) ou fluxo de caixa.
        4. Use um tom profissional mas amigável e encorajador.
        5. Não use formatação Markdown complexa (como negrito **), apenas texto corrido e quebras de linha.
      `;

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return new Response(JSON.stringify({ analysis: response.text }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('General error in AI analysis:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error during AI processing.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})