import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction } from '../types';

interface DailyBalanceChartProps {
  transactions: Transaction[];
}

const DailyBalanceChart: React.FC<DailyBalanceChartProps> = ({ transactions }) => {
  
  const chartData = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const dailyData: Record<number, { day: number, balance: number }> = {};
    let runningBalance = 0;

    // Initialize data points for all days up to today
    for (let i = 1; i <= daysInMonth; i++) {
        dailyData[i] = { day: i, balance: 0 };
    }

    // Calculate realized balance up to the current day
    const realizedTransactions = transactions
        .filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentMonth && 
                   tDate.getFullYear() === currentYear && 
                   t.status === 'pago';
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    realizedTransactions.forEach(t => {
        const tDate = new Date(t.date);
        const day = tDate.getDate();
        const amount = t.type === 'receita' ? (t.amount || 0) : -(t.amount || 0);
        
        // Apply transaction amount to the balance of that day and all subsequent days
        for (let i = day; i <= daysInMonth; i++) {
            dailyData[i].balance += amount;
        }
    });
    
    // Convert to array and filter to include only days up to today
    const currentDay = today.getDate();
    const dataArray = Object.values(dailyData)
        .filter(d => d.day <= currentDay);

    return dataArray;
  }, [transactions]);

  // Custom formatter for YAxis
  const formatCurrency = (value: number) => {
      if (value === 0) return 'R$0';
      const absValue = Math.abs(value);
      const sign = value < 0 ? '-' : '';
      
      if (absValue >= 1000) {
          return `${sign}R$${(absValue / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
      }
      return `${sign}R$${absValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full w-full">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Saldo Diário Realizado</h3>
      
      <div className="flex-1 w-full min-h-[250px]" style={{ minWidth: 0 }}>
        {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 11 }} 
                        label={{ value: 'Dia do Mês', position: 'bottom', fill: '#94a3b8', dy: 10 }}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 11 }} 
                        tickFormatter={formatCurrency} 
                    />
                    <Tooltip 
                        cursor={{ stroke: '#3B82F6', strokeWidth: 1 }} 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                        formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 'Saldo']} 
                    />
                    <Line 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#3B82F6" 
                        strokeWidth={3} 
                        dot={false} 
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Adicione transações pagas para ver o saldo diário.
            </div>
        )}
      </div>
    </div>
  );
};

export default DailyBalanceChart;