import React from 'react';
import { NavItem } from '../types';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  userRole?: 'admin' | 'user';
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Início', icon: 'dashboard', href: '#' },
  { id: 'cashflow', label: 'Caixa', icon: 'swap_horiz', href: '#' },
  { id: 'cnpj', label: 'CNPJ', icon: 'business', href: '#' },
  { id: 'tools', label: 'Ferramentas', icon: 'build', href: '#' },
  { id: 'settings', label: 'Ajustes', icon: 'settings', href: '#' },
];

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab, userRole }) => {
  
  // Filtra itens de navegação (Admin não é necessário aqui, mas Settings é essencial)
  const filteredNavItems = navItems.filter(item => 
    item.id !== 'admin' || userRole === 'admin'
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden 
                    bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 
                    shadow-2xl shadow-slate-900/20">
      <div className="flex justify-around h-16">
        {filteredNavItems.map((item) => {
          const isActive = activeTab === item.id;
          
          // Ajusta o ícone para 'settings' se for a aba ativa
          const icon = item.id === 'settings' ? 'settings' : item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 text-xs font-medium transition-colors 
                ${isActive 
                  ? 'text-primary dark:text-white' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-primary'
                }`}
            >
              <span className="material-icons text-xl mb-0.5">
                {icon}
              </span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;