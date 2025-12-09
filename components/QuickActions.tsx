import React from 'react';

const QuickActions: React.FC = () => {
  return (
    <div className="col-span-12 flex flex-col sm:flex-row gap-4 mb-2">
      <button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-lg flex items-center justify-center gap-3 transition-colors shadow-sm group">
        <div className="p-2 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
          <span className="material-icons">arrow_upward</span>
        </div>
        <span className="font-semibold text-lg">Nova Receita</span>
      </button>
      <button className="flex-1 bg-rose-500 hover:bg-rose-600 text-white p-4 rounded-lg flex items-center justify-center gap-3 transition-colors shadow-sm group">
        <div className="p-2 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
          <span className="material-icons">arrow_downward</span>
        </div>
        <span className="font-semibold text-lg">Nova Despesa</span>
      </button>
    </div>
  );
};

export default QuickActions;