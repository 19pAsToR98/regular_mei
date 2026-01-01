import React, { useState } from 'react';
import { supabase } from '../src/integrations/supabase/client';
import { showError } from '../utils/toastUtils';

interface AIAnalysisProps {
  enabled: boolean;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ enabled }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const generateAnalysis = async () => {
    if (!enabled) return;
    
    setExpanded(true);
    setLoading(true);
    setAnalysis(null);
    
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

    // 1. Get the current session token
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
        setLoading(false);
        showError('Erro de autenticação. Faça login novamente.');
        return;
    }
    
    // 2. Call the secure Edge Function (Issue 3)
    const EDGE_FUNCTION_URL = 'https://ogwjtlkemsqmpvcikrtd.supabase.co/functions/v1/analyze-financial-data';

    try {
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ context })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('AI Analysis Error:', data);
            showError(`Erro na análise: ${data.error || 'Falha na comunicação com o servidor AI.'}`);
            setAnalysis("O sistema de análise inteligente está temporariamente indisponível. Por favor, tente novamente mais tarde.");
            return;
        }
        
        setAnalysis(data.analysis);
    } catch (error) {
        console.error("Erro ao gerar análise:", error);
        showError("Erro de rede ao tentar gerar análise.");
        setAnalysis("O sistema de análise inteligente está temporariamente indisponível. Por favor, verifique sua conexão e tente novamente mais tarde.");
    } finally {
        setLoading(false);
    }
  };

  if (!enabled) return null;

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