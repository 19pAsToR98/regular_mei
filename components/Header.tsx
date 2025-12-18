import React, { useState, useRef, useEffect } from 'react';
import { AppNotification, User } from '../types';
import PollModal from './PollModal';

interface HeaderProps {
  activeTab: string;
  onMenuClick: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: number) => void;
  onVote: (notificationId: number, optionId: number) => void;
  user?: User | null;
  onLogout: () => void;
  onNavigateToProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    activeTab, onMenuClick, notifications, onMarkAsRead, onVote, user,
    onLogout, onNavigateToProfile 
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  // Store ID to keep sync with parent state updates (e.g. after voting)
  const [selectedPollId, setSelectedPollId] = useState<number | null>(null);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Filter notifications to only show non-expired ones
  const activeNotifications = useMemo(() => {
      const now = new Date();
      return notifications.filter(n => {
          if (n.expiresAt) {
              const expiryDate = new Date(n.expiresAt);
              return now < expiryDate;
          }
          return true;
      });
  }, [notifications]);

  const unreadCount = activeNotifications.filter(n => !n.read).length;
  
  // Derive the selected poll object from the current props
  const selectedPoll = selectedPollId ? activeNotifications.find(n => n.id === selectedPollId) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.read) onMarkAsRead(n.id);
    
    if (n.type === 'poll') {
        setSelectedPollId(n.id);
        setIsNotifOpen(false);
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'cashflow': return 'Fluxo de Caixa';
      case 'invoices': return 'Notas Fiscais';
      case 'calendar': return 'Calendário';
      case 'cnpj': return 'Meu CNPJ';
      case 'tools': return 'Ferramentas';
      case 'news': return 'Notícias';
      case 'offers': return 'Ofertas e Cupons';
      case 'admin': return 'Administração';
      case 'settings': return 'Configurações';
      default: return 'Dashboard';
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Olá, seja bem-vindo de volta!';
      case 'cashflow': return 'Gestão financeira completa.';
      case 'invoices': return 'Emissão e gestão de NFS-e.';
      case 'calendar': return 'Sua agenda e obrigações.';
      case 'cnpj': return 'Monitoramento fiscal.';
      case 'tools': return 'Utilitários para o dia a dia.';
      case 'news': return 'Atualizações do mercado.';
      case 'offers': return 'Benefícios exclusivos.';
      case 'admin': return 'Gestão da plataforma.';
      case 'settings': return 'Preferências do sistema.';
      default: return '';
    }
  };

  return (
    <>
    <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 h-[72px] flex justify-between items-center transition-all">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden text-slate-500 hover:text-slate-700">
          <span className="material-icons">menu</span>
        </button>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-none">{getPageTitle()}</h2>
          <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400 mt-1">{getPageSubtitle()}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 rounded-full ${isNotifOpen ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
          >
            <span className="material-icons text-2xl">notifications</span>
          </button>
          
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-3 w-3 translate-x-1/4 -translate-y-1/4 pointer-events-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-slate-900"></span>
            </span>
          )}

          {/* Dropdown Notifications */}
          {isNotifOpen && (
            <div className="absolute right-0 md:right-0 -mr-16 md:mr-0 mt-3 w-[90vw] max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right z-50">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-white">Notificações</h3>
                    {unreadCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{unreadCount} novas</span>}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {activeNotifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <span className="material-icons text-4xl mb-2 opacity-50">notifications_off</span>
                            <p className="text-sm">Nenhuma notificação ativa no momento.</p>
                        </div>
                    ) : (
                        <ul>
                            {activeNotifications.map(n => (
                                <li key={n.id}>
                                    <button 
                                        onClick={() => handleNotificationClick(n)}
                                        className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex gap-3 ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                            n.type === 'poll' ? 'bg-purple-100 text-purple-600' :
                                            n.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                            n.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                            <span className="material-icons text-sm">
                                                {n.type === 'poll' ? 'poll' : n.type === 'warning' ? 'warning' : n.type === 'success' ? 'check_circle' : 'info'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-xs font-bold uppercase tracking-wider ${
                                                     n.type === 'poll' ? 'text-purple-600' : 'text-slate-500'
                                                }`}>
                                                    {n.type === 'poll' ? 'Enquete' : 'Aviso'}
                                                </span>
                                                <span className="text-[10px] text-slate-400">{n.date.split(',')[0]}</span>
                                            </div>
                                            <p className={`text-sm leading-snug mb-1 ${!n.read ? 'font-semibold text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                                {n.text}
                                            </p>
                                            {n.type === 'poll' && (
                                                <span className="inline-flex items-center gap-1 text-xs text-purple-600 font-medium mt-1 hover:underline">
                                                    {n.userVotedOptionId !== undefined ? 'Ver resultados' : 'Participar agora'} 
                                                    <span className="material-icons text-[10px]">arrow_forward</span>
                                                </span>
                                            )}
                                            {n.expiresAt && (
                                                <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wide text-red-500">
                                                    Expira em: {new Date(n.expiresAt).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                        {!n.read && <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5"></div>}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="p-2 border-t border-slate-200 dark:border-slate-800 text-center">
                    <button className="text-xs text-primary font-medium hover:underline">Ver todas</button>
                </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
            <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 rounded-lg transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center ring-2 ring-slate-100 dark:ring-slate-800 text-slate-500 dark:text-slate-400 group-hover:ring-blue-100 dark:group-hover:ring-slate-700 transition-all">
                 <span className="material-icons text-2xl">person</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="font-semibold text-sm text-slate-800 dark:text-white leading-tight max-w-[150px] truncate group-hover:text-primary transition-colors">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.cnpj || 'MEI'}</p>
              </div>
              <span className={`material-icons text-slate-400 text-sm hidden md:block transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right z-50">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 md:hidden">
                        <p className="font-bold text-slate-800 dark:text-white">{user?.name}</p>
                        <p className="text-xs text-slate-500">{user?.cnpj}</p>
                    </div>
                    <div className="p-2">
                        <button
                            onClick={() => {
                                onNavigateToProfile();
                                setIsProfileOpen(false);
                            }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium"
                        >
                            <span className="material-icons text-lg text-slate-400">person</span>
                            Meu Perfil
                        </button>
                        <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>
                        <button
                            onClick={() => {
                                onLogout();
                                setIsProfileOpen(false);
                            }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
                        >
                            <span className="material-icons text-lg">logout</span>
                            Sair
                        </button>
                    </div>
                </div>
            )}
        </div>

      </div>
    </header>

    {/* Poll Modal */}
    {selectedPoll && (
        <PollModal 
            notification={selectedPoll} 
            onClose={() => setSelectedPollId(null)}
            onVote={onVote}
        />
    )}
    </>
  );
};

export default Header;