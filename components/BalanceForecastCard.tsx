import React, { useMemo } from 'react';
import { Transaction } from '../types';

interface BalanceForecastCardProps {
  transactions: Transaction[];
}

const BalanceForecastCard: React.FC<BalanceForecastCardProps> = ({ transactions }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const { isProjectedNegative, negativeDays } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    let isProjectedNegative = false;
    let negativeDays = 0;

    // --- Liquidity Projection: Find first day balance goes below zero ---
    
    // 1. Calculate realized balance up to today
    let tempBalance = transactions
        .filter(t => t.status === 'pago' && t.date <= todayStr)
        .reduce((acc, t) => acc + (t.type === 'receita' ? t.amount : -t.amount), 0);
    
    // 2. Get pending transactions from today onwards, sorted by date
    const pendingTransSorted = transactions
        .filter(t => t.status === 'pendente' && t.date >= todayStr)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let projectionDate = new Date(today);
    
    // Iterate day by day for the next 30 days (or until end of month)
    for (let i = 0; i < 30; i++) {
        projectionDate.setDate(projectionDate.getDate() + 1);
        const dateStr = projectionDate.toISOString().split('T')[0];
        
        // Stop if we pass the end of the current month
        if (projectionDate.getMonth() !== currentMonth) break;

        const dailyTrans = pendingTransSorted.filter(t => t.date === dateStr);
        
        dailyTrans.forEach(t => {
            tempBalance += (t.type === 'receita' ? t.amount : -t.amount);
        });
        
        if (tempBalance < 0 && !isProjectedNegative) {
            isProjectedNegative = true;
            // Calculate days difference from today
            const diffTime = projectionDate.getTime() - today.getTime();
            negativeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            break; // Found the critical day
        }
    }
    
    return { isProjectedNegative, negativeDays };
  }, [transactions, currentMonth, currentYear]);

  if (!isProjectedNegative) {
    return null; // Only render if there is a negative projection
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-red-200 dark:border-red-900/50 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Alerta de Liquidez</h3>
        <span className="material-icons text-3xl text-red-500">warning</span>
      </div>

      <div className="flex-1 space-y-4">
        
        {/* Alert Message */}
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50">
            <p className="text-xs font-bold uppercase text-red-700 dark:text-red-400 mb-1">Atenção: Risco de Caixa</p>
            <p className="text-xl font-bold text-red-800 dark:text-red-300">
                Seu caixa fica negativo em {negativeDays} dia{negativeDays !== 1 ? 's' : ''}.
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                A projeção indica que as despesas pendentes superam o saldo atual e as receitas previstas.
            </p>
        </div>
      </div>
    </div>
  );
};

export default BalanceForecastCard;