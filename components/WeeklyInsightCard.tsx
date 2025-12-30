import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { showSuccess, showError } from '../utils/toastUtils';

interface WeeklyInsightCardProps {
  enabled: boolean;
  transactions: any[]; // Pass transactions for context
  onNavigate: (tab: string) => void;
}

const WeeklyInsightCard: React.FC<WeeklyInsightCardProps> = ({ enabled, transactions, onNavigate }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Use a memoized context based on transactions
  const context = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const monthlyTrans = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.status === 'pago';
    });

    const revenue = monthlyTrans.filter(t => t.type === 'receita').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthlyTrans.filter(t => t.type === 'despesa').reduce((acc, t) => acc + t.amount, 0);
    const balance = revenue - expense;
    
    const accumulatedRevenue = transactions
        .filter(t => new Date(t.date).getFullYear() === currentYear && t.type === 'receita' && t.status === 'pago')
        .reduce((acc, t) => acc + t.amount, 0);
        
    const maxLimit = 81000;
    const limitUsed = (accumulatedRevenue / maxLimit) * 100;

    return `
        Dados do MEI (Mês Atual):
        - Receita Realizada: R$ ${revenue.toFixed(2)}
        - Despesas Realizadas: R$ ${expense.toFixed(2)}
        - Saldo em Caixa: R$ ${balance.toFixed(2)}
        - Faturamento Anual Acumulado: R$ ${accumulatedRevenue.toFixed(2)}
        - Limite MEI Utilizado: ${limitUsed.toFixed(1)}%
    `;
  }, [transactions]);

  const generateInsight = async () => {
    if (!enabled) return;
    setLoading(true);
    setExpanded(true);
    
    try {
      const prompt = `
          Você é um consultor financeiro especializado em Microempreendedores Individuais (MEI) no Brasil.
          Analise os dados financeiros fornecidos e gere um "Insight da Semana" curto e motivador.
          
          Dados: ${context}
          
          Instruções:
          1. O insight deve ser um resumo de 1 a 2 frases, focado no ponto mais relevante (ex: margem, limite, ou consistência).
          2. Use um tom profissional, mas amigável.
          3. Não use formatação Markdown (negrito, listas).
          4. Se o limite MEI estiver acima de 70%, priorize um alerta sobre o limite.
          5. Se o saldo estiver negativo, priorize a gestão de despesas.
        `;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setInsight(response.text);
      showSuccess("Insight gerado!");
    } catch (error) {
      console.error("Erro ao gerar análise:", error);
      setInsight("O sistema de análise inteligente está temporariamente indisponível.");
      showError("Falha ao gerar insight.");
    } finally {
      setLoading(false);
    }
  };
  
  // Load initial insight on mount (optional, but good for first impression)
  useEffect(() => {
      if (enabled && !insight) {
          // generateInsight(); // Removed auto-generation to keep it user-triggered initially
      }
  }, [enabled]);

  if (!enabled) return null;

  if (!expanded) {
    return (
      <div className="col-span-12 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800/80 p-4 rounded-xl border border-indigo-100 dark:border-slate-700 shadow-sm flex items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3">
          <span className="material-icons text-indigo-600 dark:text-indigo-400 text-2xl">auto_awesome</span>
          <div>
            <h3 className="font-bold text-indigo-900 dark:text-indigo-100 text-sm">Análise Inteligente</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">Obtenha um insight rápido sobre sua saúde financeira.</p>
          </div>
        </div>
        <button 
          onClick={generateInsight}
          disabled={loading}
          className="flex-shrink-0 flex items-center justify-center gap-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm text-xs"
        >
          {loading ? (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
              <span className="material-icons text-sm">analytics</span>
          )}
          <span>{loading ? 'Gerando...' : 'Gerar Insight'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="col-span-12 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800/80 p-6 rounded-xl border border-indigo-100 dark:border-slate-700 relative overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300">
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
              {loading ? 'Analisando dados...' : 'Insight da Semana'}
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
              {insight}
            </p>
            <div className="mt-4 flex gap-3">
               <button 
                  onClick={() => onNavigate('settings')} // Navigate to settings/profile for full analysis
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span className="material-icons text-sm">analytics</span>
                  Ver Análise Completa
                </button>
                <button 
                  onClick={generateInsight}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span className="material-icons text-sm">refresh</span>
                  Atualizar Insight
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyInsightCard;