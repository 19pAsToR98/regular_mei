
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Transaction } from '../types';

interface RevenueChartProps {
  transactions: Transaction[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

const RevenueChart: React.FC<RevenueChartProps> = ({ transactions }) => {
  const [viewMode, setViewMode] = useState<'evolution' | 'distribution' | 'general'>('general');
  const [distributionType, setDistributionType] = useState<'despesa' | 'receita'>('despesa');

  // --- PROCESS DATA FOR BAR CHART (EVOLUTION - LAST 6 MONTHS) ---
  // Here we show only REALIZED values (Status = Pago) for past evolution analysis
  const barData = useMemo(() => {
    const last6Months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = d.getMonth();
      const yearKey = d.getFullYear();
      
      const monthTrans = transactions.filter(t => {
        const tDate = new Date(t.date);
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
  }, [transactions]);

  // --- PROCESS DATA FOR PIE CHART (DISTRIBUTION) ---
  // Here we include PENDING values to show budget distribution
  const pieData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const relevantTrans = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth && 
             tDate.getFullYear() === currentYear && 
             t.type === distributionType;
    });

    const categoryTotals: Record<string, number> = {};
    relevantTrans.forEach(t => {
      // Use standard amount for everything
      const val = t.amount || 0;
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + val;
    });

    return Object.keys(categoryTotals)
      .map(key => ({ name: key, value: categoryTotals[key] }))
      .sort((a, b) => b.value - a.value); 
  }, [transactions, distributionType]);

  // --- PROCESS DATA FOR GENERAL OVERVIEW (FULL YEAR JAN-DEC) ---
  // Show Realized values to track actual cash flow evolution
  const fullYearData = useMemo(() => {
    const yearData = [];
    const currentYear = new Date().getFullYear();
    const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

    for (let i = 0; i < 12; i++) {
        const monthTrans = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === i && tDate.getFullYear() === currentYear && t.status === 'pago';
        });

        const receita = monthTrans.filter(t => t.type === 'receita').reduce((acc, t) => acc + t.amount, 0);
        const despesa = monthTrans.filter(t => t.type === 'despesa').reduce((acc, t) => acc + t.amount, 0);

        yearData.push({
            name: monthNames[i],
            receita,
            despesa
        });
    }
    return yearData;
  }, [transactions]);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-sm w-full">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Análise Financeira</h3>
            <p className="text-xs text-slate-500">Visão detalhada do seu negócio</p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto max-w-full">
          <button 
            onClick={() => setViewMode('general')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'general' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
          >
            <span className="material-icons text-sm">calendar_today</span> Anual (Geral)
          </button>
          <button 
            onClick={() => setViewMode('evolution')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'evolution' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
          >
            <span className="material-icons text-sm">history</span> Últimos 6 Meses
          </button>
          <button 
            onClick={() => setViewMode('distribution')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'distribution' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
          >
            <span className="material-icons text-sm">pie_chart</span> Categorias
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 w-full min-h-[300px]" style={{ minWidth: 0 }}>
        {/* VIEW: EVOLUTION (LAST 6 MONTHS) */}
        {viewMode === 'evolution' && (
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip cursor={{ fill: '#F1F5F9', opacity: 0.5 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, '']} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="receita" name="Receitas" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="despesa" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
            </ResponsiveContainer>
        )}

        {/* VIEW: DISTRIBUTION (PIE CHART) */}
        {viewMode === 'distribution' && (
            <div className="h-full flex flex-col">
                <div className="flex justify-center gap-2 mb-4">
                    <button onClick={() => setDistributionType('despesa')} className={`text-xs px-3 py-1 rounded-full border transition-colors ${distributionType === 'despesa' ? 'bg-red-50 text-red-600 border-red-200 font-bold' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>Despesas</button>
                    <button onClick={() => setDistributionType('receita')} className={`text-xs px-3 py-1 rounded-full border transition-colors ${distributionType === 'receita' ? 'bg-green-50 text-green-600 border-green-200 font-bold' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>Receitas</button>
                </div>
                {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                            </Pie>
                            <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" formatter={(value) => <span className="text-slate-600 dark:text-slate-300 text-xs font-medium ml-1">{value}</span>} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400"><span className="material-icons text-3xl mb-2 opacity-50">pie_chart</span><p className="text-sm">Sem dados nesta categoria.</p></div>
                )}
            </div>
        )}

        {/* VIEW: GENERAL (FULL YEAR BAR CHART) */}
        {viewMode === 'general' && (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fullYearData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(value) => `R$${value/1000}k`} />
                    <Tooltip cursor={{ fill: '#F1F5F9', opacity: 0.5 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, '']} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="receita" name="Receitas" fill="#10B981" radius={[2, 2, 0, 0]} barSize={12} />
                    <Bar dataKey="despesa" name="Despesas" fill="#EF4444" radius={[2, 2, 0, 0]} barSize={12} />
                </BarChart>
            </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default RevenueChart;
