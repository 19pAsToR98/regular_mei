import React from 'react';
import { StatData } from '../types';

interface StatCardProps {
  data: StatData;
}

const StatCard: React.FC<StatCardProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-lg ${data.iconBgClass}`}>
        <span className={`material-icons text-3xl ${data.iconColorClass}`}>
          {data.icon}
        </span>
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{data.label}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-white">{data.value}</p>
      </div>
    </div>
  );
};

export default StatCard;
