import React, { useMemo, useState, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, CartesianGrid } from 'recharts';
import { Transaction, Category, Appointment, FiscalData } from '../types';
import Reminders from './Reminders';
import Thermometer from './Thermometer';
import FinancialScore from './FinancialScore';
import BalanceForecastCard from './BalanceForecastCard'; // NEW IMPORT

interface MobileDashboardProps {
  transactions: Transaction[];
  appointments: Appointment[];
  fiscalData: FiscalData | null;
  user: any; // User object
  onNavigate: (tab: string) => void;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

const MobileDashboard: React.FC<MobileDashboardProps> = ({ transactions, user, appointments, fiscalData, onNavigate }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [categoryType, setCategoryType] = useState<'despesa' | 'receita'>('despesa');
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- 1. STATS FOR CARDS & HALF PIE ---
  const stats = useMemo(() => {
    const today = new Date();
    const cMonth = today.getMonth();
    const cYear = today.getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const [y, m] = t.date.split('-').map(Number);
      return (m - 1) === cMonth && y === cYear;
    });

    // Realized (Paid Only)
    const revenue = monthlyTransactions
      .filter(t => t.type === 'receita' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const expense = monthlyTransactions
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const balance = revenue - expense;

    // Expected (Forecast = Realized + Pending)
    const expectedRevenue = monthlyTransactions
      .filter(t => t.type === 'receita')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const expectedExpense = monthlyTransactions
      .filter(t => t.type === 'despesa')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const expectedBalance = expectedRevenue - expectedExpense;

    return { revenue, expense, balance, expectedBalance };
  }, [transactions]);

  // --- 2. DATA FOR HALF PIE (SLIDE 0) ---
  const halfPieData = useMemo(() => {
    if (stats.balance >= 0 && stats.revenue > 0) {
      return [
        { name: 'Despesas', value: stats.expense, color: '#EF4444' },
        { name: 'Saldo', value: stats.balance, color: '#10B981' },
      ];
    } else if (stats.balance < 0) {
       return [
        { name: 'Receita', value: stats.revenue, color: '#10B981' },
        { name: 'Déficit', value: Math.abs(stats.balance), color: '#EF4444' }, 
       ];
    }
    return [{ name: 'Sem dados', value: 1, color: '#E2E8F0' }];
  }, [stats]);

  // --- 3. DATA FOR MONTHLY EVOLUTION (SLIDE 1) ---
  const monthlyData = useMemo(() => {
    const yearData = [];
    const currentYear = new Date().getFullYear();
    const monthNames = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

    for (let i = 0; i < 12; i++) {
        const monthTrans = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === i && tDate.getFullYear() === currentYear && t.status === 'pago';
        });

        const receita = monthTrans.filter(t => t.type === 'receita').reduce((acc, t) => acc + t.amount, 0);
        const despesa = monthTrans.filter(t => t.type === 'despesa').reduce((acc, t) => acc + t.amount, 0);

        yearData.push({ name: monthNames[i], receita, despesa });
    }
    return yearData;
  }, [transactions]);

  // --- 4. DATA FOR CATEGORIES (SLIDE 2) ---
  const categoryData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const relevantTrans = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth && 
             tDate.getFullYear() === currentYear && 
             t.type === categoryType; // Include pending for better planning view? Or strictly paid? Let's stick to Paid for consistency in analysis
    });

    const totals: Record<string, number> = {};
    relevantTrans.forEach(t => {
      // Only count if paid for category chart on mobile? Or expected? 
      // Usually category breakdown is better with "all intended spend"
      // Let's use all amounts for categories
      totals[t.category] = (totals[t.category] || 0) + (t.amount || 0);
    });

    return Object.keys(totals)
      .map(key => ({ name: key, value: totals[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [transactions, categoryType]);

  // FIX: Use Math.round to ensure integer percentage
  const savingsRate = stats.revenue > 0 ? Math.round((stats.balance / stats.revenue) * 100) : 0;

  const handleScroll = () => {
    if (scrollRef.current) {
        const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
        setActiveSlide(index);
    }
  };

  const scrollToSlide = (index: number) => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({
            left: index * scrollRef.current.offsetWidth,
            behavior: 'smooth'
        });
        setActiveSlide(index);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-20">
      
      {/* CAROUSEL CONTAINER */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full"
        style={{ scrollbarWidth: 'none' }}
      >
          {/* --- SLIDE 0: SALDO (HALF PIE) --- */}
          <div className="min-w-full snap-center flex flex-col items-center">
            <div className="flex flex-col items-center justify-center pt-4 mb-2">
                <h2 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide mb-1">
                Saldo em Caixa
                </h2>
                <h1 className={`text-4xl font-bold ${stats.balance >= 0 ? 'text-slate-800 dark:text-white' : 'text-red-600'}`}>
                R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h1>
                <div className={`flex items-center gap-1 mt-2 text-sm font-medium px-3 py-1 rounded-full ${Number(savingsRate) > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    <span className="material-icons text-sm">{Number(savingsRate) > 0 ? 'trending_up' : 'trending_flat'}</span>
                    {stats.revenue > 0 ? (stats.balance >= 0 ? `${savingsRate}% da receita economizada` : 'Despesas superam receitas') : 'Sem movimentação'}
                </div>
            </div>

            <div className="h-48 w-full relative -mt-4" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={halfPieData}
                    cx="50%"
                    cy="70%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    >
                    {halfPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-300 dark:text-slate-600">
                    <span className="material-icons text-4xl">pie_chart</span>
                </div>
            </div>
          </div>

          {/* --- SLIDE 1: EVOLUÇÃO (BAR CHART) --- */}
          <div className="min-w-full snap-center flex flex-col items-center px-4">
             <div className="flex flex-col items-center justify-center pt-4 mb-6 w-full">
                <h2 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide mb-1">
                    Evolução Anual
                </h2>
                <div className="flex items-center gap-4 text-sm font-bold">
                    <div className="flex items-center gap-1 text-green-600"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Receita</div>
                    <div className="flex items-center gap-1 text-red-600"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Despesa</div>
                </div>
             </div>
             
             <div className="h-56 w-full" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={10} />
                        <Tooltip cursor={{ fill: '#F1F5F9', opacity: 0.5 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="receita" name="Receitas" fill="#10B981" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="despesa" name="Despesas" fill="#EF4444" radius={[2, 2, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* --- SLIDE 2: CATEGORIAS (DONUT) --- */}
          <div className="min-w-full snap-center flex flex-col items-center px-4">
             <div className="flex flex-col items-center justify-center pt-4 mb-2 w-full">
                <h2 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide mb-3">
                    Distribuição por Categoria
                </h2>
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full flex text-xs font-bold">
                    <button 
                        onClick={() => setCategoryType('despesa')}
                        className={`px-4 py-1.5 rounded-full transition-colors ${categoryType === 'despesa' ? 'bg-white dark:bg-slate-700 text-red-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Despesas
                    </button>
                    <button 
                        onClick={() => setCategoryType('receita')}
                        className={`px-4 py-1.5 rounded-full transition-colors ${categoryType === 'receita' ? 'bg-white dark:bg-slate-700 text-green-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Receitas
                    </button>
                </div>
             </div>

             <div className="h-52 w-full relative" style={{ minWidth: 0 }}>
                {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                        Sem dados neste período.
                    </div>
                )}
             </div>
          </div>

          {/* --- SLIDE 3: TERMÔMETRO MEI --- */}
          <div className="min-w-full snap-center flex flex-col items-center px-4 py-2">
             <div className="w-full h-full min-h-[300px] flex items-center justify-center">
                <Thermometer transactions={transactions} />
             </div>
          </div>

          {/* --- SLIDE 4: SCORE FINANCEIRO --- */}
          <div className="min-w-full snap-center flex flex-col items-center px-4 py-2">
             <div className="w-full h-full min-h-[300px] flex items-center justify-center">
                <FinancialScore transactions={transactions} />
             </div>
          </div>
          
          {/* --- SLIDE 5: PROJEÇÃO DE SALDO --- */}
          <div className="min-w-full snap-center flex flex-col items-center px-4 py-2">
             <div className="w-full h-full min-h-[300px] flex items-center justify-center">
                <BalanceForecastCard transactions={transactions} />
             </div>
          </div>

      </div>

      {/* PAGINATION DOTS */}
      <div className="flex justify-center gap-2 -mt-4 mb-2">
          {[0, 1, 2, 3, 4, 5].map(idx => (
              <button 
                key={idx}
                onClick={() => scrollToSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all ${activeSlide === idx ? 'bg-primary w-4' : 'bg-slate-300 dark:bg-slate-700'}`}
                aria-label={`Ir para gráfico ${idx + 1}`}
              />
          ))}
      </div>

      {/* STATS LIST (Global) */}
      <div className="flex flex-col gap-3 px-2">
        
        {/* Income */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                 <span className="material-icons">arrow_upward</span>
              </div>
              <div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Receitas (Pagos)</p>
                 <p className="text-lg font-bold text-slate-800 dark:text-white">R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
           </div>
        </div>

        {/* Expenses */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                 <span className="material-icons">arrow_downward</span>
              </div>
              <div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Despesas (Pagos)</p>
                 <p className="text-lg font-bold text-slate-800 dark:text-white">R$ {stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
           </div>
        </div>

        {/* Forecast */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                 <span className="material-icons">query_stats</span>
              </div>
              <div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Saldo Previsto (Total)</p>
                 <p className={`text-lg font-bold ${stats.expectedBalance >= 0 ? 'text-purple-700 dark:text-purple-300' : 'text-red-600'}`}>
                    R$ {stats.expectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </p>
              </div>
           </div>
        </div>

      </div>

      {/* REMINDERS SECTION */}
      <div className="px-2">
        <Reminders 
            transactions={transactions}
            appointments={appointments}
            fiscalData={fiscalData}
            onNavigate={onNavigate}
        />
      </div>

      {/* Quick Access / Footer */}
      <div className="px-2">
         <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg flex items-center justify-between cursor-pointer">
            <div>
               <p className="text-blue-100 text-xs font-bold uppercase mb-1">Dica do dia</p>
               <p className="font-medium text-sm">Mantenha seus registros fiscais atualizados.</p>
            </div>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
               <span className="material-icons text-sm">lightbulb</span>
            </div>
         </div>
      </div>

    </div>
  );
};

export default MobileDashboard;