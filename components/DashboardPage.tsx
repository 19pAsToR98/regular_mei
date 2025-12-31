import React, { useMemo } from 'react';
import { Transaction, Appointment, FiscalData } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import FinancialScore from './FinancialScore';
import Thermometer from './Thermometer';
import Reminders from './Reminders';
import NewsSlider from './NewsSlider';
import RecentTransactions from './RecentTransactions';
import AIAnalysis from './AIAnalysis';
import QuickActions from './QuickActions';
import DashboardChartSlider from './DashboardChartSlider'; // NEW IMPORT
import BalanceForecastCard from './BalanceForecastCard'; // Keep import for internal use

interface DashboardPageProps {
  transactions: Transaction[];
  appointments: Appointment[];
  fiscalData: FiscalData | null;
  onNavigate: (tab: string) => void;
  news: any[];
  onViewNews: (id: number) => void;
  aiEnabled: boolean;
}

// --- UTILS ---
const formatCurrency = (value: number) => 
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

// --- DATA PROCESSING ---
const useDashboardMetrics = (transactions: Transaction[]) => {
    const today = new Date();
    const cMonth = today.getMonth();
    const cYear = today.getFullYear();
    const todayStr = today.toISOString().split('T')[0];

    const monthlyTransactions = transactions.filter(t => {
        const [y, m] = t.date.split('-').map(Number);
        return (m - 1) === cMonth && y === cYear;
    });

    // Realized (Paid Only)
    const realizedRevenue = monthlyTransactions
        .filter(t => t.type === 'receita' && t.status === 'pago')
        .reduce((acc, t) => acc + (t.amount || 0), 0);

    const realizedExpense = monthlyTransactions
        .filter(t => t.type === 'despesa' && t.status === 'pago')
        .reduce((acc, t) => acc + (t.amount || 0), 0);

    const caixaAtual = realizedRevenue - realizedExpense;

    // Pending Transactions
    const pendingTrans = monthlyTransactions.filter(t => t.status === 'pendente');

    // Pending for Today
    const pendingToday = pendingTrans.filter(t => t.date === todayStr);
    const revenueToday = pendingToday.filter(t => t.type === 'receita').reduce((acc, t) => acc + (t.amount || 0), 0);
    const expenseToday = pendingToday.filter(t => t.type === 'despesa').reduce((acc, t) => acc + (t.amount || 0), 0);

    // Overdue (Em Atraso)
    const emAtraso = pendingTrans
        .filter(t => t.date < todayStr)
        .reduce((acc, t) => acc + (t.amount || 0), 0);

    return {
        caixaAtual,
        revenueToday,
        expenseToday,
        emAtraso,
    };
};

// --- CHART DATA CALCULATIONS ---

// 1. Daily Balance Data (Current Month)
const useDailyBalanceData = (transactions: Transaction[]) => {
    const today = new Date();
    const cMonth = today.getMonth();
    const cYear = today.getFullYear();
    const daysInMonth = new Date(cYear, cMonth + 1, 0).getDate();
    
    const dailyData: { name: string, saldo: number }[] = [];
    let runningBalance = 0; 

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${cYear}-${String(cMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const dayTrans = transactions.filter(t => t.date === dateStr);
        
        const netFlow = dayTrans
            .filter(t => t.status === 'pago')
            .reduce((acc, t) => acc + (t.type === 'receita' ? t.amount : -t.amount), 0);
        
        runningBalance += netFlow;
        
        dailyData.push({
            name: String(day).padStart(2, '0'),
            saldo: runningBalance,
        });
    }
    
    // Only show up to today
    return dailyData.slice(0, today.getDate());
};

// 2. Monthly Evolution Data (Last 6 Months)
const useMonthlyEvolutionData = (transactions: Transaction[]) => {
    const last6Months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = d.getMonth();
      const yearKey = d.getFullYear();
      
      const monthTrans = transactions.filter(t => {
        const tDate = new Date(t.date);
        // Only include realized transactions (status = pago)
        return tDate.getMonth() === monthKey && tDate.getFullYear() === yearKey && t.status === 'pago';
      });

      const receita = monthTrans.filter(t => t.type === 'receita').reduce((acc, t) => acc + t.amount, 0);
      const despesa = monthTrans.filter(t => t.type === 'despesa').reduce((acc, t) => acc + t.amount, 0);

      last6Months.push({
        name: d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
        receita,
        despesa
      });
    }
    return last6Months;
};

// 3. Category Distribution Data (Current Month - All types combined for simplicity in slider)
const useCategoryDistributionData = (transactions: Transaction[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const relevantTrans = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth && 
             tDate.getFullYear() === currentYear;
    });

    const categoryTotals: Record<string, number> = {};
    relevantTrans.forEach(t => {
      const key = `${t.type === 'receita' ? 'R: ' : 'D: '}${t.category}`;
      const val = t.amount || 0;
      categoryTotals[key] = (categoryTotals[key] || 0) + val;
    });

    return Object.keys(categoryTotals)
      .map(key => ({ name: key, value: categoryTotals[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
};


// --- COMPONENT ---
const DashboardPage: React.FC<DashboardPageProps> = ({ transactions, appointments, fiscalData, onNavigate, news, onViewNews, aiEnabled }) => {
  const metrics = useDashboardMetrics(transactions);
  const dailyBalanceData = useDailyBalanceData(transactions);
  const monthlyEvolutionData = useMonthlyEvolutionData(transactions);
  const categoryDistributionData = useCategoryDistributionData(transactions);
  
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const currentMonthName = monthNames[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  // Determine the number of critical alerts (DASN pending + overdue DAS/transactions)
  const criticalAlertCount = (fiscalData?.pendingDasnCount || 0) + 
                             (metrics.emAtraso > 0 ? 1 : 0) + 
                             (appointments.filter(a => {
                                 const diff = (new Date(a.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
                                 return diff >= -5 && diff <= 0; // Overdue or today
                             }).length > 0 ? 1 : 0);

  return (
    <div className="flex flex-col gap-6">
      
      {/* ROW 0: QUICK ACTIONS (Mobile/Tablet) */}
      <div className="md:hidden">
        <QuickActions />
      </div>

      {/* ROW 1: MAIN BALANCE & ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD 1: CAIXA DISPONÍVEL (DESTAQUE) - LG: 2/3 */}
        <div className="lg:col-span-2 flex flex-col bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-slate-800 dark:text-white text-xl font-bold tracking-tight">Caixa disponível agora</h2>
            <span className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-xs px-2 py-1 rounded font-bold">+2.4% vs mês passado</span>
          </div>
          <p className="text-slate-800 dark:text-white text-4xl font-black tracking-tight mb-6">
            {formatCurrency(metrics.caixaAtual)}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Entradas Previstas (Today) */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Entradas Previstas (Hoje)</p>
                <p className="text-slate-800 dark:text-white text-xl font-bold">{formatCurrency(metrics.revenueToday)}</p>
              </div>
              <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                <span className="material-icons">trending_up</span>
              </div>
            </div>
            {/* Saídas Previstas (Today) */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Saídas Previstas (Hoje)</p>
                <p className="text-slate-800 dark:text-white text-xl font-bold">{formatCurrency(metrics.expenseToday)}</p>
              </div>
              <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                <span className="material-icons">trending_down</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* CARD 2: ALERTAS CRÍTICOS (REMINDERS) - LG: 1/3 */}
        <div className="lg:col-span-1 flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-red-50 dark:bg-red-900/20">
                <h3 className="text-red-700 dark:text-red-400 font-bold text-lg flex items-center gap-2">
                    <span className="material-icons text-red-500 text-xl">warning</span>
                    Alertas Críticos
                </h3>
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {criticalAlertCount}
                </span>
            </div>
            {/* Aumentando a altura máxima do container do Reminders */}
            <div className="flex-1 overflow-y-auto max-h-[400px] lg:max-h-[500px]">
                <Reminders 
                    transactions={transactions}
                    appointments={appointments}
                    fiscalData={fiscalData}
                    onNavigate={onNavigate}
                />
            </div>
        </div>
      </div>

      {/* ROW 2: CHART SLIDER (Full Width) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* CARD 4: CHART SLIDER - AGORA OCUPA 3/3 */}
        <div className="md:col-span-1 xl:col-span-3 h-[350px]">
            <DashboardChartSlider 
                dailyBalanceData={dailyBalanceData}
                monthlyEvolutionData={monthlyEvolutionData}
                categoryDistributionData={categoryDistributionData}
                transactions={transactions}
                onNavigate={onNavigate}
            />
        </div>
      </div>
      
      {/* ROW 3: RECENT TRANSACTIONS & SAÚDE DO NEGÓCIO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD 6: TRANSAÇÕES RECENTES - 2/3 */}
        <div className="lg:col-span-2">
            <RecentTransactions transactions={transactions} onNavigate={onNavigate} />
        </div>
        
        {/* CARD 3: SAÚDE DO NEGÓCIO (SCORE & THERMOMETER) - 1/3 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 flex flex-col justify-between">
            <h3 className="text-slate-800 dark:text-white font-bold text-lg mb-4">Saúde do Negócio</h3>
            <div className="flex flex-col gap-4">
                {/* Financial Score (Radial Chart) */}
                <FinancialScore transactions={transactions} />
                
                {/* Thermometer (MEI Limit) */}
                <Thermometer transactions={transactions} />
            </div>
        </div>
      </div>
      
      {/* ROW 4: NEWS SLIDER (Full Width) */}
      <div className="grid grid-cols-12">
        <NewsSlider news={news} onViewNews={onViewNews} />
      </div>
      
      {/* ROW 5: AI ANALYSIS (Full Width) */}
      {aiEnabled && (
          <div className="grid grid-cols-12">
              <AIAnalysis enabled={aiEnabled} />
          </div>
      )}
    </div>
  );
};

export default DashboardPage;