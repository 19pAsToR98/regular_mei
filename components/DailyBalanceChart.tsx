import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DailyBalanceChartProps {
  transactions: Transaction[];
}

const DailyBalanceChart: React.FC<DailyBalanceChartProps> = ({ transactions }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const chartData = useMemo(() => {
    const dailyBalances: Record<number, number> = {};
    let runningBalance = 0;
    
    // 1. Calculate realized balance up to the start of the month (simplified: assuming 0 for now, focusing on monthly change)
    // For a real app, this would require fetching the previous month's closing balance.
    
    // 2. Process transactions for the current month
    const monthlyTransactions = transactions.filter(t => {
      const [y, m] = t.date.split('-').map(Number);
      return (m - 1) === currentMonth && y === currentYear;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate daily running balance
    for (let day = 1; day <= daysInMonth; day++) {
        dailyBalances[day] = runningBalance;
    }

    monthlyTransactions.forEach(t => {
        const [y, m, d] = t.date.split('-').map(Number);
        const day = d;
        const amount = t.amount || 0;
        
        // Only count realized (paid) transactions for the 'current' balance line
        if (t.status === 'pago') {
            const change = t.type === 'receita' ? amount : -amount;
            
            // Apply change to the running balance from this day forward
            for (let d = day; d <= daysInMonth; d++) {
                dailyBalances[d] += change;
            }
        }
    });
    
    // Format data for Recharts
    const data = Object.keys(dailyBalances).map(dayStr => {
        const day = parseInt(dayStr);
        return {
            name: day.toString().padStart(2, '0'),
            saldo: dailyBalances[day]
        };
    });
    
    // Add a starting point (Day 0) for visual continuity if needed, but let's stick to Day 1
    return data;

  }, [transactions, currentMonth, currentYear, daysInMonth]);
  
  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-xs">
          <p className="font-bold text-slate-800 dark:text-white mb-1">Dia {label}</p>
          <p className="text-slate-600 dark:text-slate-300">
            Saldo: <span className={`font-bold ${payload[0].value >= 0 ? 'text-highlight-green' : 'text-highlight-red'}`}>
                R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-slate-800 dark:text-white font-bold text-lg">Saldo Diário Realizado</h3>
        <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-500">
          <span className="material-icons text-[20px]">more_horiz</span>
        </button>
      </div>
      
      <div className="flex-1 w-full h-[180px] pt-4 relative" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} 
                interval="preserveStartEnd"
                ticks={['01', '07', '14', '21', daysInMonth.toString().padStart(2, '0')]}
                dy={10}
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10 }} 
                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
                type="monotone" 
                dataKey="saldo" 
                stroke="#3B82F6" 
                strokeWidth={2} 
                dot={{ r: 3, fill: '#3B82F6', stroke: '#fff', strokeWidth: 1.5 }}
                activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DailyBalanceChart;