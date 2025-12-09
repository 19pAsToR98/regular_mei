import React from 'react';
import { ForecastItem } from '../types';

const forecastData: ForecastItem[] = [
  {
    label: 'A Receber',
    value: 'R$ 2.100,00',
    icon: 'arrow_upward',
    trend: 'up',
    bgClass: 'bg-green-100 dark:bg-green-900/50',
    iconColorClass: 'text-green-500 dark:text-green-400'
  },
  {
    label: 'A Pagar',
    value: 'R$ 875,50',
    icon: 'arrow_downward',
    trend: 'down',
    bgClass: 'bg-red-100 dark:bg-red-900/50',
    iconColorClass: 'text-red-500 dark:text-red-400'
  },
  {
    label: 'Saldo Previsto',
    value: 'R$ 1.224,50',
    icon: 'account_balance_wallet',
    trend: 'up',
    bgClass: 'bg-blue-100 dark:bg-blue-900/50',
    iconColorClass: 'text-blue-500 dark:text-blue-400'
  }
];

const FinancialForecast: React.FC = () => {
  return (
    <div className="col-span-12 xl:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Previsão Financeira (30 dias)</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {forecastData.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${item.bgClass}`}>
              <span className={`material-icons text-2xl ${item.iconColorClass}`}>
                {item.icon}
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialForecast;