import React from 'react';

interface MaintenanceOverlayProps {
  type: 'global' | 'page';
}

const MaintenanceOverlay: React.FC<MaintenanceOverlayProps> = ({ type }) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in-95 duration-500 ${type === 'global' ? 'fixed inset-0 z-50 bg-background-light dark:bg-background-dark' : 'h-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800'}`}>
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-yellow-400 opacity-20 blur-xl rounded-full"></div>
        <div className="relative bg-white dark:bg-slate-800 p-6 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
          <span className="material-icons text-6xl text-yellow-500">engineering</span>
        </div>
      </div>
      
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-3">
        {type === 'global' ? 'Sistema em Manutenção' : 'Página em Manutenção'}
      </h2>
      
      <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 text-lg">
        {type === 'global' 
          ? 'Estamos realizando atualizações importantes para melhorar sua experiência. Voltaremos em breve!' 
          : 'Esta funcionalidade está passando por melhorias técnicas no momento. Por favor, tente novamente mais tarde.'}
      </p>

      {type === 'global' && (
        <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full">
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
          Equipe técnica trabalhando
        </div>
      )}
    </div>
  );
};

export default MaintenanceOverlay;