import React from 'react';

interface PendingMetricsCardProps {
  emAtraso: number;
  aVencer: number;
}

const PendingMetricsCard: React.FC<PendingMetricsCardProps> = ({ emAtraso, aVencer }) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
      <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Pendências Financeiras</h4>
      
      <div className="space-y-3">
        {/* Em Atraso */}
        <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/50">
          <div className="flex items-center gap-2">
            <span className="material-icons text-red-600 text-xl">error</span>
            <span className="text-sm font-medium text-red-700 dark:text-red-300">Em Atraso</span>
          </div>
          <span className="font-bold text-lg text-red-700 dark:text-red-300">
            R$ {emAtraso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* A Vencer */}
        <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-900/50">
          <div className="flex items-center gap-2">
            <span className="material-icons text-yellow-600 text-xl">schedule</span>
            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">A Vencer (Próximo)</span>
          </div>
          <span className="font-bold text-lg text-yellow-700 dark:text-yellow-300">
            R$ {aVencer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PendingMetricsCard;