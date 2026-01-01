import React from 'react';

interface DashboardMetrics {
  caixaAtual: number;
  aReceber: number;
  aPagar: number;
  caixaProjetado: number;
  emAtraso: number;
  aVencer: number;
}

interface DashboardSummaryCardsProps {
  metrics: DashboardMetrics;
}

const DashboardSummaryCards: React.FC<DashboardSummaryCardsProps> = ({ metrics }) => {
  const { caixaAtual, aReceber, aPagar, caixaProjetado, emAtraso, aVencer } = metrics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {/* 1. Caixa Atual (Realizado) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <span className="material-icons text-primary dark:text-blue-400">account_balance_wallet</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-slate-400 truncate">Caixa Atual (Realizado)</p>
            <p className={`text-xl font-bold truncate ${caixaAtual >= 0 ? 'text-slate-800 dark:text-white' : 'text-red-600'}`}>R$ {caixaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>
      
      {/* 2. A Receber (Pendente) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
            <span className="material-icons text-green-500 dark:text-green-400">arrow_upward</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-slate-400 truncate">A Receber (Pendente)</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400 truncate">R$ {aReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* 3. A Pagar (Pendente) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
            <span className="material-icons text-red-500 dark:text-red-400">arrow_downward</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-slate-400 truncate">A Pagar (Pendente)</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400 truncate">R$ {aPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* 4. Caixa Projetado do Mês (Destaque) - NOVO LAYOUT COMPACTO */}
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-4 rounded-lg border border-slate-600 ring-1 ring-slate-500 shadow-lg text-white flex flex-col justify-between">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg">
            <span className="material-icons text-white">query_stats</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-slate-300 truncate">Caixa Projetado do Mês</p>
            <p className={`text-xl font-bold truncate ${caixaProjetado >= 0 ? 'text-white' : 'text-red-300'}`}>R$ {caixaProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        
        {/* Secondary Indicators */}
        <div className="mt-3 pt-3 border-t border-white/30 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1 text-red-300">
              <span className="material-icons text-sm">error</span> Em Atraso
            </span>
            <span className="font-bold text-red-200">R$ {emAtraso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1 text-yellow-300">
              <span className="material-icons text-sm">schedule</span> A Vencer
            </span>
            <span className="font-bold text-yellow-200">R$ {aVencer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSummaryCards;