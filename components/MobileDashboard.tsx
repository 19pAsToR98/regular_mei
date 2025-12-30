import React, { useMemo, useState, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, CartesianGrid } from 'recharts';
import { Transaction, Category, Appointment, FiscalData } from '../types';
import Reminders from './Reminders';
import Thermometer from './Thermometer';
import FinancialScore from './FinancialScore';
import HeroStats from './HeroStats'; // NEW IMPORT
import RevenueChart from './RevenueChart'; // NEW IMPORT
import HealthScoreCard from './HealthScoreCard'; // NEW IMPORT

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
      
      {/* BLOCO 1: HERO ABSOLUTO */}
      <HeroStats transactions={transactions} onNavigate={onNavigate} />
      
      {/* BLOCO 2: AÇÕES PRIORITÁRIAS (AlertsBlock + Reminders) */}
      <div className="px-2">
        <Reminders 
            transactions={transactions}
            appointments={appointments}
            fiscalData={fiscalData}
            onNavigate={onNavigate}
        />
      </div>

      {/* CAROUSEL CONTAINER (BLOCO 3 & 4 - Saúde e Gráfico) */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full"
        style={{ scrollbarWidth: 'none' }}
      >
          {/* --- SLIDE 0: SAÚDE DO NEGÓCIO (SCORE + TERMÔMETRO) --- */}
          <div className="min-w-full snap-center flex flex-col items-center px-4 py-2">
             <div className="w-full h-full min-h-[300px] flex items-center justify-center">
                <HealthScoreCard transactions={transactions} />
             </div>
          </div>
          
          {/* --- SLIDE 1: GRÁFICO (DONUT DE DESPESAS) --- */}
          <div className="min-w-full snap-center flex flex-col items-center px-4 py-2">
             <div className="w-full h-full min-h-[300px] flex items-center justify-center">
                <RevenueChart transactions={transactions} displayMode="expense_donut" />
             </div>
          </div>
      </div>

      {/* PAGINATION DOTS */}
      <div className="flex justify-center gap-2 -mt-4 mb-2">
          {[0, 1].map(idx => (
              <button 
                key={idx}
                onClick={() => scrollToSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all ${activeSlide === idx ? 'bg-primary w-4' : 'bg-slate-300 dark:bg-slate-700'}`}
                aria-label={`Ir para gráfico ${idx + 1}`}
              />
          ))}
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