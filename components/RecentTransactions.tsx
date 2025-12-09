
import React from 'react';
import { Transaction } from '../types';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onNavigate: (tab: string) => void;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions, onNavigate }) => {
  // Sort by date desc and take top 5
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const formatDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full w-full">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Últimas Movimentações</h3>
      
      {recent.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <span className="material-icons text-3xl mb-2 opacity-30">receipt_long</span>
              <p className="text-sm">Nenhuma movimentação recente.</p>
          </div>
      ) : (
          <div className="flex-1 overflow-auto">
              <div className="space-y-3">
                  {recent.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${t.type === 'receita' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                                  <span className="material-icons text-lg">
                                      {t.type === 'receita' ? 'arrow_upward' : 'arrow_downward'}
                                  </span>
                              </div>
                              <div>
                                  <p className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-1">
                                      {t.description}
                                  </p>
                                  <div className="flex items-center gap-2">
                                      <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 rounded">
                                          {t.category}
                                      </span>
                                      <span className="text-xs text-slate-400">
                                          {formatDate(t.date)}
                                      </span>
                                  </div>
                              </div>
                          </div>
                          
                          <div className="text-right">
                              <p className={`font-bold text-sm ${t.type === 'receita' ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>
                                  {t.type === 'despesa' ? '- ' : '+ '}R$ {(t.amount || t.expectedAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              {t.status === 'pendente' && (
                                  <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded uppercase">
                                      Pendente
                                  </span>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <button 
            onClick={() => onNavigate('cashflow')}
            className="text-xs font-bold text-primary hover:text-blue-600 hover:underline uppercase tracking-wide"
          >
              Ver Extrato Completo
          </button>
      </div>
    </div>
  );
};

export default RecentTransactions;
