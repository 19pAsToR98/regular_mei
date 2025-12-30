import React, { useMemo } from 'react';
import { Transaction } from '../types';

interface HeroStatsProps {
  transactions: Transaction[];
  onNavigate: (tab: string) => void;
}

const HeroStats: React.FC<HeroStatsProps> = ({ transactions, onNavigate }) => {
  const { caixaAtual, aReceber30d, aPagar30d, caixaProjetado } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Calculate date 30 days from now
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 30);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    // Transactions up to 30 days in the future
    const relevantTrans = transactions.filter(t => t.date <= futureDateStr);

    // 1. Caixa Atual (Realized Balance - Paid transactions up to today)
    const realizedTrans = relevantTrans.filter(t => t.status === 'pago' && t.date <= todayStr);
    const realizedRevenue = realizedTrans.filter(t => t.type === 'receita').reduce((acc, t) => acc + (t.amount || 0), 0);
    const realizedExpense = realizedTrans.filter(t => t.type === 'despesa').reduce((acc, t) => acc + (t.amount || 0), 0);
    const caixaAtual = realizedRevenue - realizedExpense;

    // Pending transactions within the next 30 days
    const pendingTrans30d = relevantTrans.filter(t => t.status === 'pendente' && t.date > todayStr);

    // 2. A Receber (Pending Revenue in 30 days)
    const aReceber30d = pendingTrans30d
      .filter(t => t.type === 'receita')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // 3. A Pagar (Pending Expense in 30 days)
    const aPagar30d = pendingTrans30d
      .filter(t => t.type === 'despesa')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
      
    // 4. Caixa Projetado do Mês (Realized up to today + Pending up to end of month)
    // We use the current month's end for this projection, not 30 days.
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    const currentMonthTrans = transactions.filter(t => {
        const [y, m] = t.date.split('-').map(Number);
        return (m - 1) === today.getMonth() && y === today.getFullYear();
    });
    
    const totalExpectedRevenue = currentMonthTrans.filter(t => t.type === 'receita').reduce((acc, t) => acc + (t.amount || 0), 0);
    const totalExpectedExpense = currentMonthTrans.filter(t => t.type === 'despesa').reduce((acc, t) => acc + (t.amount || 0), 0);
    const caixaProjetado = totalExpectedRevenue - totalExpectedExpense;

    return { caixaAtual, aReceber30d, aPagar30d, caixaProjetado };
  }, [transactions]);

  const microCards = [
    {
      label: 'A Receber (30 dias)',
      value: aReceber30d,
      icon: 'arrow_upward',
      colorClass: 'text-green-600',
      bgClass: 'bg-green-100 dark:bg-green-900/30',
      tab: 'cashflow',
    },
    {
      label: 'A Pagar (30 dias)',
      value: aPagar30d,
      icon: 'arrow_downward',
      colorClass: 'text-red-600',
      bgClass: 'bg-red-100 dark:bg-red-900/30',
      tab: 'cashflow',
    },
    {
      label: 'Caixa Projetado do Mês',
      value: caixaProjetado,
      icon: 'query_stats',
      colorClass: caixaProjetado >= 0 ? 'text-primary' : 'text-red-600',
      bgClass: 'bg-blue-100 dark:bg-blue-900/30',
      tab: 'cashflow',
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <p className="text-sm font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
            Caixa Disponível Agora
          </p>
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${caixaAtual >= 0 ? 'text-slate-800 dark:text-white' : 'text-red-600'}`}>
            R$ {caixaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h1>
        </div>
        <button 
            onClick={() => onNavigate('cashflow')}
            className="mt-2 md:mt-0 text-sm font-bold text-primary hover:underline flex items-center gap-1"
        >
            Ver Extrato Completo <span className="material-icons text-sm">arrow_forward</span>
        </button>
      </div>

      {/* Micro Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {microCards.map((card, index) => (
          <button
            key={index}
            onClick={() => onNavigate(card.tab)}
            className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left flex items-center gap-3"
          >
            <div className={`p-2 rounded-full ${card.bgClass}`}>
              <span className={`material-icons text-xl ${card.colorClass}`}>
                {card.icon}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{card.label}</p>
              <p className={`text-lg font-bold ${card.colorClass}`}>
                R$ {card.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroStats;