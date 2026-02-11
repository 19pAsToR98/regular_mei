import React from 'react';
import { NavItem } from '../types';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  userRole?: 'admin' | 'user';
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Início', icon: 'home', href: '#' },
  { id: 'cashflow', label: 'Caixa', icon: 'account_balance_wallet', href: '#' },
  { id: 'cnpj', label: 'Meu CNPJ', icon: 'business_center', href: '#' },
  { id: 'calendar', label: 'Agenda', icon: 'calendar_today', href: '#' },
  { id: 'more', label: 'Menu', icon: 'grid_view', href: '#' },
];

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab, userRole }) => {
  const filteredNavItems = navItems.filter(item => 
    item.id !== 'admin' || userRole === 'admin'
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden 
                    bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl 
                    border-t border-slate-200/50 dark:border-slate-800/50 
                    pb-safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {filteredNavItems.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300"
            >
              {/* Indicador Ativo Superior */}
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-full animate-in fade-in slide-in-from-top-1" />
              )}
              
              <span className={`material-icons text-2xl mb-0.5 transition-transform duration-300 ${
                isActive ? 'text-primary scale-110' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-bold tracking-tight transition-colors ${
                isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;