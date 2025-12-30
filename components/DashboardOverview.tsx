import React, { useMemo } from 'react';
import { Transaction, User, FiscalData, AppNotification } from '../types';
import StatCard from './StatCard';
import Thermometer from './Thermometer';
import FinancialScore from './FinancialScore';
import Reminders from './Reminders';
import DailyBalanceChart from './DailyBalanceChart';
import AIAnalysis from './AIAnalysis';
import QuickActions from './QuickActions';
import NewsSlider from './NewsSlider';

interface DashboardOverviewProps {
  transactions: Transaction[];
  appointments: Appointment[];
  fiscalData: FiscalData | null;
  news: any[];
  notifications: AppNotification[];
  user: User;
  onNavigate: (tab: string) => void;
  onViewNews: (id: number) => void;
  connectionConfig: any;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
    transactions, appointments, fiscalData, news, notifications, user, onNavigate, onViewNews, connectionConfig
}) => {
  
  const today = new Date();
  const cMonth = today.getMonth();
  const cYear = today.getFullYear();
  const todayStr = today.toISOString().split('T')[0];

  // --- CALCULATIONS ---
  const { caixaAtual, entradasHoje, saidasHoje } = useMemo(() => {
    const monthlyTransactions = transactions.filter(t => {
      const [y, m] = t.date.split('-').map(Number);
      return (m - 1) === cMonth && y === cYear;
    });

    // 1. Caixa Atual (Realizado no mês)
    const realizedRevenue = monthlyTransactions
      .filter(t => t.type === 'receita' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const realizedExpense = monthlyTransactions
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const caixaAtual = realizedRevenue - realizedExpense;
    
    // 2. Entradas/Saídas Previstas HOJE
    const todayTransactions = transactions.filter(t => t.date === todayStr && t.status === 'pendente');
    
    const entradasHoje = todayTransactions
        .filter(t => t.type === 'receita')
        .reduce((acc, t) => acc + (t.amount || 0), 0);
        
    const saidasHoje = todayTransactions
        .filter(t => t.type === 'despesa')
        .reduce((acc, t) => acc + (t.amount || 0), 0);

    return { caixaAtual, entradasHoje, saidasHoje };
  }, [transactions, cMonth, cYear, todayStr]);
  
  // --- ALERTS (Reminders component adapted for the new layout) ---
  // We use the existing Reminders component but place it in the new context.
  
  // --- FINANCIAL SCORE & THERMOMETER ---
  // We combine these two into a single card for the "Saúde do Negócio" section.
  
  // --- CAIXA PROJETADO (From CashFlowPage logic) ---
  const { caixaProjetado, emAtraso, aVencer } = useMemo(() => {
    const monthlyTransactions = transactions.filter(t => {
      const [y, m] = t.date.split('-').map(Number);
      return (m - 1) === cMonth && y === cYear;
    });
    
    const realizedRevenue = monthlyTransactions
      .filter(t => t.type === 'receita' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const realizedExpense = monthlyTransactions
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const pendingTrans = monthlyTransactions.filter(t => t.status === 'pendente');

    const aReceber = pendingTrans
      .filter(t => t.type === 'receita')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const aPagar = pendingTrans
      .filter(t => t.type === 'despesa')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const caixaProjetado = (realizedRevenue + aReceber) - (realizedExpense + aPagar);

    let emAtraso = 0;
    let aVencer = 0;
    
    pendingTrans.forEach(t => {
        if (t.date < todayStr) {
          emAtraso += t.amount || 0;
        } else {
          aVencer += t.amount || 0;
        }
    });
    
    return { caixaProjetado, emAtraso, aVencer };
  }, [transactions, cMonth, cYear, todayStr]);


  return (
    <div className="space-y-6">
      
      {/* ROW 1: CAIXA ATUAL & ALERTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD 1: CAIXA ATUAL & PREVISÕES DO DIA */}
        <div className="lg:col-span-2 flex flex-col bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-slate-800 dark:text-white text-xl font-bold tracking-tight">Caixa disponível agora</h2>
            {/* Placeholder for trend indicator */}
            <span className="bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-xs px-2 py-1 rounded font-bold">+2.4% vs ontem</span>
          </div>
          <p className="text-slate-800 dark:text-white text-4xl font-black tracking-tight mb-6">
            R$ {caixaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Entradas Previstas (Hoje) */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Entradas Previstas (Hoje)</p>
                <p className="text-slate-800 dark:text-white text-xl font-bold">R$ {entradasHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                <span className="material-icons">trending_up</span>
              </div>
            </div>
            {/* Saídas Previstas (Hoje) */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Saídas Previstas (Hoje)</p>
                <p className="text-slate-800 dark:text-white text-xl font-bold">R$ {saidasHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="size-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600">
                <span className="material-icons">trending_down</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* CARD 2: ALERTAS CRÍTICOS (Reminders adapted) */}
        <div className="lg:col-span-1 flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h3 className="text-slate-800 dark:text-white font-bold text-lg flex items-center gap-2">
              <span className="material-icons text-red-500 text-xl">warning</span>
              Alertas Críticos
            </h3>
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{notifications.filter(n => n.type === 'warning' && !n.read).length + (fiscalData?.pendingDasnCount || 0)}</span>
          </div>
          
          {/* Using Reminders component for the list content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <Reminders 
                transactions={transactions} 
                appointments={appointments} 
                fiscalData={fiscalData} 
                onNavigate={onNavigate} 
            />
          </div>
          
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <button onClick={() => onNavigate('calendar')} className="w-full text-center text-primary hover:underline text-sm font-medium">Ver todos os alertas</button>
          </div>
        </div>
      </div>
      
      {/* ROW 2: SAÚDE, GRÁFICO DIÁRIO, INSIGHT */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* CARD 3: SAÚDE DO NEGÓCIO (Score + Thermometer) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between">
          <h3 className="text-slate-800 dark:text-white font-bold text-lg mb-4">Saúde do Negócio</h3>
          
          <div className="flex flex-col gap-4">
            {/* Financial Score (Radial Bar) */}
            <div className="h-32">
                <FinancialScore transactions={transactions} />
            </div>
            
            {/* Thermometer (Limit MEI) - Simplified view */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Thermometer transactions={transactions} />
            </div>
          </div>
        </div>
        
        {/* CARD 4: SALDO DIÁRIO (Line Chart) */}
        <DailyBalanceChart transactions={transactions} />
        
        {/* CARD 5: INSIGHT DA SEMANA (AI Analysis adapted) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-primary/30 shadow-sm p-6 flex flex-col relative overflow-hidden">
          <span className="material-icons absolute -bottom-4 -right-4 text-[120px] text-primary/5 rotate-12 select-none">auto_awesome</span>
          <div className="flex items-center gap-2 mb-4">
            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white shadow-md shadow-primary/30">
              <span className="material-icons text-[18px]">auto_awesome</span>
            </div>
            <h3 className="text-primary font-bold text-lg">Insight da Semana</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {/* Using AIAnalysis component but forcing it to generate/show analysis immediately */}
            {connectionConfig.ai.enabled ? (
                <AIAnalysis enabled={connectionConfig.ai.enabled} />
            ) : (
                <p className="text-slate-500 text-sm italic">Análise de IA desativada nas configurações.</p>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={() => onNavigate('dashboard')} className="text-primary text-sm font-bold hover:text-blue-700 flex items-center gap-1 transition-colors">
              Ver Detalhes <span className="material-icons text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* ROW 3: QUICK ACTIONS & NEWS */}
      <div className="grid grid-cols-12 gap-6">
        <QuickActions />
        <NewsSlider news={news} onViewNews={onViewNews} />
      </div>
    </div>
  );
};

export default DashboardOverview;