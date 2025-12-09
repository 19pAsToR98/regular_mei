
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface AIAnalysisProps {
  enabled: boolean;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ enabled }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!enabled) return null;

  const generateAnalysis = async () => {
    setExpanded(true);
    setLoading(true);
    try {
      // Context data from the dashboard (simulated from the static data in other components)
      const context = `
          Dados do MEI:
          - Receita Mensal Atual: R$ 5.780,00 (Tendência de alta)
          - Despesas Mensais: R$ 1.250,00
          - Saldo em Caixa: R$ 4.530,00
          - Faturamento Anual Acumulado: R$ 52.650,00
          - Limite MEI Anual: R$ 81.000,00 (65% utilizado)
          - Previsão (30 dias): Receber R$ 2.100,00 vs Pagar R$ 875,50
          - Obrigações Próximas: Guia DAS vence em 3 dias (R$ 72,60), Declaração Anual em 31/05.
        `;

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

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setAnalysis(response.text);
    } catch (error) {
      console.error("Erro ao gerar análise:", error);
      setAnalysis("O sistema de análise inteligente está temporariamente indisponível. Por favor, verifique sua conexão e tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <div className="col-span-12 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800/80 p-6 rounded-lg border border-indigo-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm">
            <span className="material-icons text-indigo-600 dark:text-indigo-400">auto_awesome</span>
          </div>
          <div>
            <h3 className="font-bold text-indigo-900 dark:text-indigo-100 text-lg">Análise Financeira Inteligente</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Obtenha insights personalizados sobre o seu negócio com um clique.</p>
          </div>
        </div>
        <button 
          onClick={generateAnalysis}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          <span className="material-icons text-sm">analytics</span>
          <span>Gerar Análise</span>
        </button>
      </div>
    );
  }

  return (
    <div className="col-span-12 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800/80 p-6 rounded-lg border border-indigo-100 dark:border-slate-700 relative overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300">
      <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 pointer-events-none">
        <span className="material-icons text-9xl text-indigo-600 dark:text-indigo-400">auto_awesome</span>
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
              <span className={`material-icons text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`}>
                {loading ? 'autorenew' : 'auto_awesome'}
              </span>
            </div>
            <h3 className="font-bold text-indigo-900 dark:text-indigo-100 text-lg">
              {loading ? 'Analisando dados...' : 'Análise Financeira Inteligente'}
            </h3>
          </div>
          <button 
            onClick={() => setExpanded(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Fechar análise"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse max-w-3xl">
            <div className="h-4 bg-indigo-200 dark:bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-indigo-200 dark:bg-slate-700 rounded w-11/12"></div>
            <div className="h-4 bg-indigo-200 dark:bg-slate-700 rounded w-4/6"></div>
          </div>
        ) : (
          <div className="prose prose-indigo dark:prose-invert max-w-none">
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed text-sm md:text-base">
              {analysis}
            </p>
            <div className="mt-4 flex gap-3">
               <button 
                  onClick={generateAnalysis}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span className="material-icons text-sm">refresh</span>
                  Atualizar Análise
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysis;
