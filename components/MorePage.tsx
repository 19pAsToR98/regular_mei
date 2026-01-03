import React from 'react';
import { User } from '../types'; // Importando o tipo User

interface MorePageProps {
  onNavigate: (tab: string) => void;
  userRole?: 'admin' | 'user'; // Adicionando userRole
}

const secondaryNavItems = [
    { id: 'tools', label: 'Ferramentas', icon: 'build', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'news', label: 'Notícias & Blog', icon: 'article', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { id: 'offers', label: 'Ofertas & Cupons', icon: 'local_offer', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { id: 'invoices', label: 'Notas Fiscais', icon: 'receipt', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
];

const MorePage: React.FC<MorePageProps> = ({ onNavigate, userRole }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Mais Opções</h2>
      <p className="text-slate-500 dark:text-slate-400">Acesse funcionalidades adicionais da plataforma.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {secondaryNavItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="flex items-center text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm group"
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${item.bg} ${item.color} flex-shrink-0`}>
              <span className="material-icons text-2xl">{item.icon}</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-primary">{item.label}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Acesse e gerencie.</p>
            </div>
            <span className="material-icons text-slate-400 ml-auto">chevron_right</span>
          </button>
        ))}
      </div>
      
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Ajustes e Suporte</h3>
          
          {/* Admin Link (Visible only to Admins) */}
          {userRole === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className="flex items-center text-left p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors shadow-sm group w-full mb-4"
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4 bg-red-100 dark:bg-red-900/30 text-red-600 flex-shrink-0">
                  <span className="material-icons text-2xl">admin_panel_settings</span>
                </div>
                <div>
                  <h3 className="font-bold text-red-800 dark:text-red-300 group-hover:text-red-900">Área de Administração</h3>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Gerencie usuários, conteúdo e configurações.</p>
                </div>
                <span className="material-icons text-red-400 ml-auto">chevron_right</span>
              </button>
          )}

          <button
            onClick={() => onNavigate('settings')}
            className="flex items-center text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm group w-full"
          >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mr-4 bg-slate-100 dark:bg-slate-800 text-slate-600 flex-shrink-0">
              <span className="material-icons text-2xl">settings</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-primary">Configurações</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gerencie seu perfil, categorias e tema.</p>
            </div>
            <span className="material-icons text-slate-400 ml-auto">chevron_right</span>
          </button>
      </div>
    </div>
  );
};

export default MorePage;