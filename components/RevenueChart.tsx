import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Transaction } from '../types';

interface RevenueChartProps {
  transactions: Transaction[];
  displayMode: 'daily_balance' | 'expense_donut'; // Novo modo de exibição
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

const RevenueChart: React.FC<RevenueChartProps> = ({ transactions, displayMode }) => {
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Helper para filtrar transações realizadas (Status = Pago)
  const filterRealized = (t: Transaction) => t.status === 'pago';

  // --- PROCESS DATA FOR DAILY BALANCE (DESKTOP) ---
  const dailyBalanceData = useMemo(() => {
    const today = new Date();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyData: { name: string, saldo: number }[] = [];
    
    // Calculate realized balance up to the start of the month
    let initialBalance = transactions
        .filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() < currentYear || (tDate.getFullYear() === currentYear && tDate.getMonth() < currentMonth);
        })
        .filter(filterRealized)
        .reduce((acc, t) => acc + (t.type === 'receita' ? t.amount : -t.amount), 0);

    let runningBalance = initialBalance;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const dailyTrans = transactions.filter(t => t.date === dateStr && filterRealized(t));
        
        dailyTrans.forEach(t => {
            runningBalance += (t.type === 'receita' ? t.amount : -t.amount);
        });
        
        dailyData.push({
            name: String(day),
            saldo: runningBalance
        });
        
        // Stop calculating if we pass today
        if (day === today.getDate() && today.getMonth() === currentMonth && today.getFullYear() === currentYear) {
            break;
        }
    }
    return dailyData;
  }, [transactions, currentMonth, currentYear]);

  // --- PROCESS DATA FOR EXPENSE DONUT (MOBILE) ---
  const expenseDonutData = useMemo(() => {
    const relevantTrans = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth && 
             tDate.getFullYear() === currentYear && 
             t.type === 'despesa';
    });

    const categoryTotals: Record<string, number> = {};
    relevantTrans.forEach(t => {
      const val = t.amount || 0;
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + val;
    });

    return Object.keys(categoryTotals)
      .map(key => ({ name: key, value: categoryTotals[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [transactions, currentMonth, currentYear]);
  
  const totalExpense = expenseDonutData.reduce((acc, curr) => acc + curr.value, 0);

  // Custom formatter for YAxis to handle 'k' notation without long decimals
  const formatKilo = (value: number) => {
      if (value === 0) return 'R$0';
      const kValue = value / 1000;
      return `R$${kValue.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
  };

  // --- RENDER LOGIC ---
  
  const renderDailyBalanceChart = () => (
    <div className="h-full w-full min-h-[300px]">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Saldo Diário Realizado</h3>
        <ResponsiveContainer width="100%" height="90%">
            <BarChart data={dailyBalanceData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={10} />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                    tickFormatter={formatKilo} 
                />
                <Tooltip 
                    cursor={{ fill: '#F1F5F9', opacity: 0.5 }} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 'Saldo']} 
                />
                <Bar dataKey="saldo" name="Saldo" fill="#3B82F6" radius={[2, 2, 0, 0]} barSize={12} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );

  const renderExpenseDonutChart = () => (
    <div className="h-full flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Top 5 Despesas por Categoria</h3>
        {expenseDonutData.length > 0 ? (
            <div className="h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={expenseDonutData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {expenseDonutData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" formatter={(value) => <span className="text-slate-600 dark:text-slate-300 text-xs font-medium ml-1">{value}</span>} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                            Total: R$ {totalExpense.toLocaleString('pt-BR', { notation: 'compact', compactDisplay: 'short' })}
                        </span>
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400"><span className="material-icons text-3xl mb-2 opacity-50">pie_chart</span><p className="text-sm">Sem dados de despesas este mês.</p></div>
        )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-sm w-full">
      {displayMode === 'daily_balance' && renderDailyBalanceChart()}
      {displayMode === 'expense_donut' && renderExpenseDonutChart()}
    </div>
  );
};

export default RevenueChart;