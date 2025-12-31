import React from 'react';
import { NavItem } from '../types';

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '#' },
  { id: 'executive', label: 'Dashboard Executivo', icon: 'analytics', href: '#' }, // NOVO ITEM
  { id: 'cashflow', label: 'Fluxo de Caixa', icon: 'swap_horiz', href: '#' },
  { id: 'invoices', label: 'Notas Fiscais', icon: 'receipt', href: '#' },
  { id: 'calendar', label: 'Calendário', icon: 'calendar_today', href: '#' },
  { id: 'cnpj', label: 'Meu CNPJ', icon: 'business', href: '#' },
  { id: 'tools', label: 'Ferramentas', icon: 'build', href: '#' },
  { id: 'news', label: 'Notícias', icon: 'article', href: '#' },
  { id: 'offers', label: 'Ofertas', icon: 'local_offer', href: '#' },
  { id: 'admin', label: 'Admin', icon: 'admin_panel_settings', href: '#' },
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  userRole?: 'admin' | 'user';
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, toggleSidebar, userRole }) => {
  
  const filteredNavItems = navItems.filter(item => 
    item.id !== 'admin' || userRole === 'admin'
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-20 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      {/* 
        Sidebar Container 
        Full height, attached to left edge, professional border separation
      */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 
          w-72 bg-white dark:bg-slate-900 
          border-r border-slate-200 dark:border-slate-800
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:block
          flex flex-col h-screen
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
          
        {/* Header */}
        <div className="h-[72px] flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <img 
            src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
            alt="Regular MEI" 
            className="h-8 w-auto object-contain dark:brightness-0 dark:invert transition-all"
          />
          <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
              <span className="material-icons">close</span>
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-grow px-4 py-6 overflow-y-auto custom-scrollbar space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Menu Principal</p>
          <ul>
            {filteredNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(item.id);
                      if (window.innerWidth < 1024) toggleSidebar();
                    }}
                    className={`
                      group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200
                      ${isActive 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }
                    `}
                  >
                    <span className={`material-icons text-[20px] ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                      {item.icon}
                    </span>
                    
                    <span className="flex-1">{item.label}</span>
                    
                    {item.id === 'invoices' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                          Novo
                        </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer (Settings) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('settings');
              if (window.innerWidth < 1024) toggleSidebar();
            }}
            className={`
              flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-md transition-all duration-200
              ${activeTab === 'settings' 
                ? 'bg-white dark:bg-slate-800 text-primary border border-slate-200 dark:border-slate-700 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:text-slate-900'
              }
            `}
          >
            <div className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${activeTab === 'settings' ? 'bg-primary/10 text-primary' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                <span className="material-icons text-lg">settings</span>
            </div>
            <div className="flex-1">
                <span className="block leading-none font-semibold">Configurações</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Preferências & Conta</span>
            </div>
          </a>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;