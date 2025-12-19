import React, { useMemo } from 'react';
import { Transaction } from '../types';

interface BalanceForecastCardProps {
  transactions: Transaction[];
}

const BalanceForecastCard: React.FC<BalanceForecastCardProps> = ({ transactions }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const { realizedBalance, expectedBalance, difference } = useMemo(() => {
    const monthlyTransactions = transactions.filter(t => {
      const [y, m] = t.date.split('-').map(Number);
      return (m - 1) === currentMonth && y === currentYear;
    });

    // Realized (Paid Only)
    const realizedRevenue = monthlyTransactions
      .filter(t => t.type === 'receita' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const realizedExpense = monthlyTransactions
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const realizedBalance = realizedRevenue - realizedExpense;

    // Expected (All transactions: Paid + Pending)
    const expectedRevenue = monthlyTransactions
      .filter(t => t.type === 'receita')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const expectedExpense = monthlyTransactions
      .filter(t => t.type === 'despesa')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const expectedBalance = expectedRevenue - expectedExpense;
    
    const difference = expectedBalance - realizedBalance;

    return { realizedBalance, expectedBalance, difference };
  }, [transactions, currentMonth, currentYear]);

  const isPositive = expectedBalance >= 0;
  const isDifferencePositive = difference >= 0;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Projeção de Saldo</h3>
        <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
            isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
            {isPositive ? 'Positivo' : 'Negativo'}
        </span>
      </div>

      <div className="flex-1 space-y-4">
        
        {/* Realized Balance */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
                <span className="material-icons text-xl text-primary">account_balance_wallet</span>
                <p className="text-sm text-slate-500 dark:text-slate-400">Saldo Realizado (Hoje)</p>
            </div>
            <p className={`text-xl font-bold ${realizedBalance >= 0 ? 'text-slate-800 dark:text-white' : 'text-red-600'}`}>
                R$ {realizedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
        </div>

        {/* Expected Balance */}
        <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-3">
                <span className="material-icons text-xl text-purple-600">query_stats</span>
                <p className="text-sm text-slate-500 dark:text-slate-400">Saldo Previsto (Mês)</p>
            </div>
            <p className={`text-xl font-bold ${isPositive ? 'text-purple-700 dark:text-purple-300' : 'text-red-600'}`}>
                R$ {expectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
        </div>

        {/* Difference / Forecast */}
        <div className={`p-4 rounded-lg border ${isDifferencePositive ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/50' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50'}`}>
            <p className="text-xs font-bold uppercase text-slate-500 mb-1">Projeção de Mudança</p>
            <div className="flex justify-between items-center">
                <p className={`text-2xl font-bold ${isDifferencePositive ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {isDifferencePositive ? '+' : '-'} R$ {Math.abs(difference).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <span className="material-icons text-3xl opacity-50">
                    {isDifferencePositive ? 'trending_up' : 'trending_down'}
                </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
                {isDifferencePositive 
                    ? 'Você espera receber mais do que pagar até o final do mês.' 
                    : 'Atenção: Você tem mais contas a pagar do que a receber.'}
            </p>
        </div>

      </div>
    </div>
  );
};

export default BalanceForecastCard;