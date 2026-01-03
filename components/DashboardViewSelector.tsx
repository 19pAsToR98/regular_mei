import React from 'react';

interface DashboardViewSelectorProps {
  viewMode: 'monthly' | 'annual';
  setViewMode: (mode: 'monthly' | 'annual') => void;
}

const DashboardViewSelector: React.FC<DashboardViewSelectorProps> = ({ viewMode, setViewMode }) => {
  return (
    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto self-start inline-flex shadow-inner">
      <button
        onClick={() => setViewMode('monthly')}
        className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
          viewMode === 'monthly' 
            ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
        }`}
      >
        <span className="material-icons text-sm mr-1">calendar_month</span> Mensal
      </button>
      <button
        onClick={() => setViewMode('annual')}
        className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
          viewMode === 'annual' 
            ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
        }`}
      >
        <span className="material-icons text-sm mr-1">calendar_today</span> Anual
      </button>
    </div>
  );
};

export default DashboardViewSelector;