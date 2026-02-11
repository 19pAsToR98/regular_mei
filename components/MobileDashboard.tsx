import React, { useMemo, useState, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction, Appointment, FiscalData } from '../types';
import Reminders from './Reminders';
import Thermometer from './Thermometer';
import FinancialScore from './FinancialScore';
import BalanceForecastCard from './BalanceForecastCard';

interface MobileDashboardProps {
  transactions: Transaction[];
  appointments: Appointment[];
  fiscalData: FiscalData | null;
  user: any;
  onNavigate: (tab: string) => void;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const MobileDashboard: React.FC<MobileDashboardProps> = ({ transactions, user, appointments, fiscalData, onNavigate }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const today = new Date();
    const cMonth = today.getMonth();
    const cYear = today.getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const [y, m] = t.date.split('-').map(Number);
      return (m - 1) === cMonth && y === cYear;
    });

    const revenue = monthlyTransactions.filter(t => t.type === 'receita' && t.status === 'pago').reduce((acc, t) => acc + (t.amount || 0), 0);
    const expense = monthlyTransactions.filter(t => t.type === 'despesa' && t.status === 'pago').reduce((acc, t) => acc + (t.amount || 0), 0);
    const balance = revenue - expense;

    return { revenue, expense, balance };
  }, [transactions]);

  const handleScroll = () => {
    if (scrollRef.current) {
        const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
        setActiveSlide(index);
    }
  };

  const quickActions = [
      { label: 'Receita', icon: 'add_circle', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', tab: 'cashflow' },
      { label: 'Despesa', icon: 'remove_circle', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', tab: 'cashflow' },
      { label: 'DAS', icon: 'receipt_long', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', tab: 'cnpj' },
      { label: 'Agenda', icon: 'event', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', tab: 'calendar' },
  ];

  return (
    <div className="flex flex-col gap-8 pb-24 animate-in fade-in duration-500">
      
      {/* 1. SALDO EM DESTAQUE (App Style) */}
      <div className="px-2">
          <div className="bg-gradient-to-br from-slate-800 to-slate-950 dark:from-slate-900 dark:to-black p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Saldo Disponível</p>
                  <h1 className="text-4xl font-black tracking-tighter mb-6">
                      R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h1>
                  
                  <div className="flex gap-4">
                      <div className="flex-1 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/5">
                          <p className="text-[9px] font-bold text-emerald-400 uppercase mb-1">Entradas</p>
                          <p className="text-sm font-black">R$ {stats.revenue.toLocaleString('pt-BR', { notation: 'compact' })}</p>
                      </div>
                      <div className="flex-1 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/5">
                          <p className="text-[9px] font-bold text-rose-400 uppercase mb-1">Saídas</p>
                          <p className="text-sm font-black">R$ {stats.expense.toLocaleString('pt-BR', { notation: 'compact' })}</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* 2. AÇÕES RÁPIDAS (Grid Style) */}
      <div className="px-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Ações Rápidas</h3>
          <div className="grid grid-cols-4 gap-3">
              {quickActions.map((action, i) => (
                  <button 
                    key={i} 
                    onClick={() => onNavigate(action.tab)}
                    className="flex flex-col items-center gap-2 group"
                  >
                      <div className={`w-14 h-14 rounded-2xl ${action.bg} ${action.color} flex items-center justify-center shadow-sm active:scale-90 transition-transform`}>
                          <span className="material-icons text-2xl">{action.icon}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{action.label}</span>
                  </button>
              ))}
          </div>
      </div>

      {/* 3. CAROUSEL DE INSIGHTS (Cards 3xl) */}
      <div className="space-y-4">
          <div className="flex justify-between items-center px-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Análise Mensal</h3>
              <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                      <div key={i} className={`h-1.5 rounded-full transition-all ${activeSlide === i ? 'w-4 bg-primary' : 'w-1.5 bg-slate-200 dark:bg-slate-800'}`} />
                  ))}
              </div>
          </div>

          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full px-2 gap-4"
            style={{ scrollbarWidth: 'none' }}
          >
              <div className="min-w-[90%] snap-center">
                  <div className="h-full bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                      <FinancialScore transactions={transactions} viewMode="monthly" />
                  </div>
              </div>
              <div className="min-w-[90%] snap-center">
                  <div className="h-full bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                      <Thermometer transactions={transactions} />
                  </div>
              </div>
              <div className="min-w-[90%] snap-center">
                  <div className="h-full bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                      <BalanceForecastCard transactions={transactions} viewMode="monthly" />
                  </div>
              </div>
          </div>
      </div>

      {/* 4. LEMBRETES (Native List Style) */}
      <div className="px-2">
          <Reminders 
              transactions={transactions}
              appointments={appointments}
              fiscalData={fiscalData}
              onNavigate={onNavigate}
          />
      </div>

      {/* 5. DICA DO DIA (Banner Style) */}
      <div className="px-2">
         <div className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-500/20 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
               <span className="material-icons">lightbulb</span>
            </div>
            <div>
               <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-1">Dica do dia</p>
               <p className="font-bold text-sm leading-tight">Mantenha seus registros fiscais atualizados para evitar multas.</p>
            </div>
         </div>
      </div>

    </div>
  );
};

export default MobileDashboard;