import React, { useMemo } from 'react';
import { Transaction, Appointment, FiscalData, User } from '../types';
import RevenueChart from './RevenueChart';
import Reminders from './Reminders';
import Thermometer from './Thermometer';
import FinancialScore from './FinancialScore';
import BalanceForecastCard from './BalanceForecastCard';

interface ExecutiveDashboardProps {
  transactions: Transaction[];
  appointments: Appointment[];
  fiscalData: FiscalData | null;
  user: User;
  onNavigate: (tab: string) => void;
}

const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ transactions, appointments, fiscalData, user, onNavigate }) => {
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const todayStr = new Date().toISOString().split('T')[0];

  // --- CALCULATE CORE METRICS ---
  const {
    caixaAtual,
    aReceber,
    aPagar,
    caixaProjetado,
    emAtraso,
    aVencer,
    realizedRevenue,
    realizedExpense,
  } = useMemo(() => {
    const monthlyTransactions = transactions.filter(t => {
      const [y, m] = t.date.split('-').map(Number);
      return (m - 1) === currentMonth && y === currentYear;
    });

    const realizedRevenue = monthlyTransactions
      .filter(t => t.type === 'receita' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const realizedExpense = monthlyTransactions
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const caixaAtual = realizedRevenue - realizedExpense;

    const pendingTrans = monthlyTransactions.filter(t => t.status === 'pendente');

    const aReceber = pendingTrans
      .filter(t => t.type === 'receita')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const aPagar = pendingTrans
      .filter(t => t.type === 'despesa')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const totalExpectedRevenue = realizedRevenue + aReceber;
    const totalExpectedExpense = realizedExpense + aPagar;
    const caixaProjetado = totalExpectedRevenue - totalExpectedExpense;

    let emAtraso = 0;
    let aVencer = 0;

    pendingTrans
      .forEach(t => {
        if (t.date < todayStr) {
          emAtraso += t.amount || 0;
        } else {
          aVencer += t.amount || 0;
        }
      });

    return {
      caixaAtual,
      aReceber,
      aPagar,
      caixaProjetado,
      emAtraso,
      aVencer,
      realizedRevenue,
      realizedExpense,
    };
  }, [transactions, currentMonth, currentYear]);
  
  // --- PENDING TRANSACTIONS FOR TABLE ---
  const pendingTransactions = useMemo(() => {
      return transactions
          .filter(t => t.status === 'pendente')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5); // Top 5 upcoming/overdue
  }, [transactions]);

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const userName = user.name.split(' ')[0] || 'Empreendedor(a)';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      
      {/* SECTION 1: WELCOME & KEY METRICS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 md:p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Olá, {userName}!</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Visão executiva do seu negócio em {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.</p>
          </div>
          <button 
            onClick={() => onNavigate('cashflow')}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-blue-600 transition-colors"
          >
            <span className="material-icons text-lg">swap_horiz</span>
            Ir para Fluxo de Caixa
          </button>
        </div>

        {/* Key Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Realized Balance */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-bold uppercase text-slate-400 mb-1">Caixa Atual</p>
            <p className={`text-xl font-bold ${caixaAtual >= 0 ? 'text-slate-800 dark:text-white' : 'text-red-600'}`}>R$ {formatCurrency(caixaAtual)}</p>
          </div>
          
          {/* Expected Revenue */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-900/50">
            <p className="text-xs font-bold uppercase text-green-600 mb-1">Receita Prevista</p>
            <p className="text-xl font-bold text-green-700 dark:text-green-400">R$ {formatCurrency(realizedRevenue + aReceber)}</p>
          </div>
          
          {/* Expected Expense */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-900/50">
            <p className="text-xs font-bold uppercase text-red-600 mb-1">Despesa Prevista</p>
            <p className="text-xl font-bold text-red-700 dark:text-red-400">R$ {formatCurrency(realizedExpense + aPagar)}</p>
          </div>
          
          {/* Projected Balance */}
          <div className="p-4 bg-primary/10 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-900/50">
            <p className="text-xs font-bold uppercase text-primary mb-1">Projeção Mês</p>
            <p className={`text-xl font-bold ${caixaProjetado >= 0 ? 'text-primary dark:text-blue-400' : 'text-red-600'}`}>R$ {formatCurrency(caixaProjetado)}</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: CHARTS & REMINDERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Revenue Chart (Annual Evolution) */}
        <div className="lg:col-span-8">
          <RevenueChart transactions={transactions} />
        </div>
        
        {/* Reminders & Fiscal Status */}
        <div className="lg:col-span-4">
          <Reminders 
            transactions={transactions}
            appointments={appointments}
            fiscalData={fiscalData}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* SECTION 3: FINANCIAL HEALTH CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FinancialScore transactions={transactions} />
        <Thermometer transactions={transactions} />
        <BalanceForecastCard transactions={transactions} />
      </div>

      {/* SECTION 4: PENDING TRANSACTIONS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Próximas Contas e Recebimentos</h3>
            <button 
                onClick={() => onNavigate('cashflow')}
                className="text-xs font-bold text-primary hover:underline uppercase tracking-wide"
            >
                Ver todas
            </button>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                        <th className="px-6 py-3">Descrição</th>
                        <th className="px-6 py-3">Vencimento</th>
                        <th className="px-6 py-3">Tipo</th>
                        <th className="px-6 py-3 text-right">Valor</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pendingTransactions.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                🎉 Nenhuma conta pendente ou em atraso nos próximos dias.
                            </td>
                        </tr>
                    ) : (
                        pendingTransactions.map(t => {
                            const isOverdue = t.date < todayStr;
                            const isRevenue = t.type === 'receita';
                            
                            return (
                                <tr key={t.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                    <td className="px-6 py-3">
                                        <p className="font-medium text-slate-800 dark:text-white text-sm">{t.description}</p>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{t.category}</span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`text-sm font-mono ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {new Date(t.date).toLocaleDateString('pt-BR')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                                            isRevenue ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {isRevenue ? 'Receber' : 'Pagar'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <span className={`font-bold text-sm ${isRevenue ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {isRevenue ? '+' : '-'} R$ {formatCurrency(t.amount || 0)}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
      </div>
      
      {/* News Slider */}
      <div className="pt-4">
        <NewsSlider news={[]} onViewNews={onNavigate} />
      </div>
    </div>
  );
};

export default ExecutiveDashboard;