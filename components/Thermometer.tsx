import React, { useMemo } from 'react';
import { Transaction } from '../types';

interface ThermometerProps {
  transactions: Transaction[];
}

const Thermometer: React.FC<ThermometerProps> = ({ transactions }) => {
  const currentYear = new Date().getFullYear();
  const maxLimit = 81000;

  const metrics = useMemo(() => {
    // 1. Calculate Realized Revenue for Current Year
    const revenue = transactions
      .filter(t => {
        const tYear = parseInt(t.date.split('-')[0]);
        return tYear === currentYear && t.type === 'receita' && t.status === 'pago';
      })
      .reduce((acc, t) => acc + t.amount, 0);

    const percentage = Math.min((revenue / maxLimit) * 100, 100);

    // 2. Calculate Pro-Rata (Ideal Pace)
    const today = new Date();
    const startOfYear = new Date(currentYear, 0, 1);
    const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const daysInYear = 365; // Simplified
    
    const timePercentage = (dayOfYear / daysInYear) * 100;
    
    // Status
    let status = 'Regular';
    let statusColor = 'text-slate-500';
    let message = 'Seu faturamento está dentro do esperado para o período.';

    if (percentage > (timePercentage + 10)) {
        status = 'Acelerado';
        statusColor = 'text-yellow-600';
        message = 'Atenção: Você está faturando mais rápido que o tempo decorrido. Cuidado com o limite.';
    } else if (percentage > 90) {
        status = 'Crítico';
        statusColor = 'text-red-600';
        message = 'Você está muito próximo do limite anual. Considere o desenquadramento.';
    }

    return { revenue, percentage, timePercentage, status, statusColor, message };
  }, [transactions, currentYear]);

  return (
    <div className="flex flex-col justify-between w-full">
      
      <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          Limite MEI {currentYear}
          </h3>
          <span className={`text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 ${metrics.statusColor}`}>
              {metrics.status}
          </span>
      </div>

      <div>
        {/* Progress Bar Container */}
        <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full mb-2 overflow-hidden">
          {/* Revenue Bar */}
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out relative z-10 ${
                metrics.percentage > 80 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                metrics.percentage > 50 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 
                'bg-gradient-to-r from-green-400 to-green-500'
            }`}
            style={{ width: `${metrics.percentage}%` }}
          ></div>
          
          {/* Time Marker (Where you should be ideally) */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-slate-800 dark:bg-white z-20 opacity-50 border-l border-dashed border-slate-400"
            style={{ left: `${metrics.timePercentage}%` }}
            title="Referência Temporal (Hoje)"
          ></div>
        </div>
        
        <div className="flex justify-between items-end mt-2">
          <div>
            <p className="font-bold text-sm text-slate-800 dark:text-white">R$ {metrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Acumulado</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">{metrics.percentage.toFixed(1)}%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">de R$ {maxLimit.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Thermometer;