import React, { useMemo } from 'react';
import { Transaction, Appointment, FiscalData } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import FinancialScore from './FinancialScore';
import Thermometer from './Thermometer';
import Reminders from './Reminders';
import NewsSlider from './NewsSlider';
import RecentTransactions from './RecentTransactions';
import AIAnalysis from './AIAnalysis';
import QuickActions from './QuickActions'; // Mantendo QuickActions para a barra de botões

interface DashboardPageProps {
  transactions: Transaction[];
  appointments: Appointment[];
  fiscalData: FiscalData | null;
  onNavigate: (tab: string) => void;
  news: any[]; // Adicionando news para o slider
  onViewNews: (id: number) => void; // Adicionando handler para o slider
  aiEnabled: boolean; // Para controlar o card de AI
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

// --- CHART DATA (SIMULATED DAILY BALANCE) ---
const useDailyBalanceData = (transactions: Transaction[]) => {
    const today = new Date();
    const cMonth = today.getMonth();
    const cYear = today.getFullYear();
    const daysInMonth = new Date(cYear, cMonth + 1, 0).getDate();
    
    const dailyData: { name: string, saldo: number }[] = [];
    let runningBalance = 0; 

    // Calculate realized balance up to the start of the month
    const realizedBeforeMonth = transactions
        .filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() < cYear || (tDate.getFullYear() === cYear && tDate.getMonth() < cMonth);
        })
        .filter(t => t.status === 'pago')
        .reduce((acc, t) => acc + (t.type === 'receita' ? t.amount : -t.amount), 0);
    
    // For simplicity in this visualization, we'll focus on the monthly flow
    // and start the running balance from the beginning of the month.
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${cYear}-${String(cMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const dayTrans = transactions.filter(t => t.date === dateStr);
        
        const netFlow = dayTrans
            .filter(t => t.status === 'pago') // Only realized flow affects the daily balance line
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

// --- COMPONENT ---
const DashboardPage: React.FC<DashboardPageProps> = ({ transactions, appointments, fiscalData, onNavigate, news, onViewNews, aiEnabled }) => {
  const metrics = useDashboardMetrics(transactions);
  const dailyBalanceData = useDailyBalanceData(transactions);
  
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
            {/* Reusing Reminders component for the list content */}
            <div className="flex-1 overflow-y-auto">
                <Reminders 
                    transactions={transactions}
                    appointments={appointments}
                    fiscalData={fiscalData}
                    onNavigate={onNavigate}
                />
            </div>
        </div>
      </div>

      {/* ROW 2: SCORE, CHART & AI ANALYSIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
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
        
        {/* CARD 4: SALDO DIÁRIO (BAR CHART) - 2/3 */}
        <div className="md:col-span-1 xl:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-slate-800 dark:text-white font-bold text-lg">Saldo diário em {currentMonthName}</h3>
                <button onClick={() => onNavigate('cashflow')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-500">
                    <span className="material-icons text-[20px]">more_horiz</span>
                </button>
            </div>
            
            <div className="flex-1 w-full h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyBalanceData} margin={{ top: 10, right: 0, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
                            dy={10} 
                        />
                        <RechartsTooltip 
                            formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="saldo" name="Saldo" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
        
        {/* CARD 5: INSIGHT DA SEMANA (REMOVIDO) */}
      </div>
      
      {/* ROW 3: RECENT TRANSACTIONS & AI ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD 6: TRANSAÇÕES RECENTES - 2/3 */}
        <div className="lg:col-span-2">
            <RecentTransactions transactions={transactions} onNavigate={onNavigate} />
        </div>
        
        {/* CARD 7: AI ANALYSIS - 1/3 */}
        {aiEnabled && (
            <div className="lg:col-span-1">
                <AIAnalysis enabled={aiEnabled} />
            </div>
        )}
        {!aiEnabled && <div className="lg:col-span-1"></div>}
      </div>
      
      {/* ROW 4: NEWS SLIDER (Full Width) */}
      <div className="grid grid-cols-12">
        <NewsSlider news={news} onViewNews={onViewNews} />
      </div>
    </div>
  );
};

export default DashboardPage;