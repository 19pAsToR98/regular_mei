import React from 'react';
import { NavItem } from '../types';

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '#' },
  { id: 'cashflow', label: 'Fluxo de Caixa', icon: 'swap_horiz', href: '#' },
  { id: 'invoices', label: 'Notas Fiscais', icon: 'receipt', href: '#' },
  { id: 'calendar', label: 'Calendário', icon: 'calendar_today', href: '#' },
  { id: 'cnpj', label: 'Meu CNPJ', icon: 'business', href: '#' },
  { id: 'tools', label: 'Ferramentas', icon: 'build', href: '#' },
  { id: 'news', label: 'Notícias', icon: 'article', href: '#' },
  { id: 'offers', label: 'Ofertas', icon: 'local_offer', href: '#' },
  // { id: 'admin', label: 'Admin', icon: 'admin_panel_settings', href: '#' }, // REMOVIDO
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  isOpen: boolean; // Mantido para compatibilidade, mas ignorado no desktop
  toggleSidebar: () => void; // Mantido para compatibilidade, mas ignorado no desktop
  userRole?: 'admin' | 'user';
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole }) => {
  
  // O item 'admin' não está mais na lista principal, então o filtro é simplificado.
  const filteredNavItems = navItems;

  return (
    <>
      {/* 
        Sidebar Container 
        Visível apenas em telas grandes (lg:block)
      */}
      <aside 
        className={`
          hidden lg:flex lg:flex-col lg:w-72 lg:h-screen lg:shrink-0
          bg-slate-800 dark:bg-slate-900 
          border-r border-slate-700 dark:border-slate-800
        `}
      >
          
        {/* Header */}
        <div className="h-[72px] flex items-center justify-between px-6 border-b border-slate-700 dark:border-slate-800 shrink-0">
          <img 
            src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
            alt="Regular MEI" 
            className="h-8 w-auto object-contain brightness-0 invert transition-all"
          />
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
                    }}
                    className={`
                      group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200
                      ${isActive 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }
                    `}
                  >
                    <span className={`material-icons text-[20px] ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                      {item.icon}
                    </span>
                    
                    <span className="flex-1">{item.label}</span>
                    
                    {item.id === 'invoices' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-300'}`}>
                          Novo
                        </span>
                    )}
                  </a>
                </li>
              );
            })}
            {/* Adicionando o link Admin aqui, se for admin, para manter o acesso no desktop */}
            {userRole === 'admin' && (
                <li>
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab('admin');
                        }}
                        className={`
                            group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200
                            ${activeTab === 'admin' 
                                ? 'bg-red-600 text-white shadow-sm' 
                                : 'text-red-300 hover:bg-slate-700 hover:text-red-100'
                            }
                        `}
                    >
                        <span className={`material-icons text-[20px] ${activeTab === 'admin' ? 'text-white' : 'text-red-400 group-hover:text-red-100'}`}>
                            admin_panel_settings
                        </span>
                        <span className="flex-1">Admin</span>
                    </a>
                </li>
            )}
          </ul>
        </nav>

        {/* Footer (Settings) */}
        <div className="p-4 border-t border-slate-700 dark:border-slate-800 bg-slate-700 dark:bg-slate-800/20">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('settings');
            }}
            className={`
              flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-md transition-all duration-200
              ${activeTab === 'settings' 
                ? 'bg-slate-600 text-primary border border-slate-500 shadow-sm' 
                : 'text-slate-300 hover:bg-slate-700 hover:shadow-sm hover:text-white'
              }
            `}
          >
            <div className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${activeTab === 'settings' ? 'bg-primary/10 text-primary' : 'bg-slate-600 text-slate-400'}`}>
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