import React, { useState, useRef, useEffect, useMemo } from 'react';
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
    activeTab, notifications, onMarkAsRead, onVote, user,
    onLogout, onNavigateToProfile 
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState<number | null>(null);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const activeNotifications = useMemo(() => {
      const now = new Date();
      return notifications.filter(n => !n.expiresAt || now < new Date(n.expiresAt));
  }, [notifications]);

  const unreadCount = activeNotifications.filter(n => !n.read).length;
  const selectedPoll = selectedPollId ? activeNotifications.find(n => n.id === selectedPollId) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Início';
      case 'cashflow': return 'Meu Caixa';
      case 'invoices': return 'Notas Fiscais';
      case 'calendar': return 'Agenda';
      case 'cnpj': return 'Meu CNPJ';
      case 'tools': return 'Ferramentas';
      case 'news': return 'Notícias';
      case 'offers': return 'Produtos';
      case 'settings': return 'Ajustes';
      case 'more': return 'Menu';
      default: return 'Dashboard';
    }
  };

  return (
    <>
    <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 md:px-8 h-16 md:h-[72px] flex justify-between items-center">
      
      {/* Mobile: Saudação / Desktop: Título */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Olá, {user?.name?.split(' ')[0]}</p>
            <h2 className="text-lg font-black text-slate-900 dark:text-white leading-none">{getPageTitle()}</h2>
        </div>
        
        <div className="hidden lg:block">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{getPageTitle()}</h2>
        </div>
      </div>

      {/* Ações Direitas */}
      <div className="flex items-center gap-2 md:gap-6">
        
        {/* Notificações */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="text-slate-500 dark:text-slate-400 p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
          >
            <span className="material-icons text-2xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-900"></span>
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-[90vw] max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right z-50">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-white">Notificações</h3>
                    {unreadCount > 0 && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black uppercase">{unreadCount} novas</span>}
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    {activeNotifications.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <span className="material-icons text-5xl mb-2 opacity-20">notifications_off</span>
                            <p className="text-sm font-medium">Tudo limpo por aqui!</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-50 dark:divide-slate-800">
                            {activeNotifications.map(n => (
                                <li key={n.id}>
                                    <button 
                                        onClick={() => { if (!n.read) onMarkAsRead(n.id); if (n.type === 'poll') { setSelectedPollId(n.id); setIsNotifOpen(false); } }}
                                        className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex gap-3 ${!n.read ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}
                                    >
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${
                                            n.type === 'poll' ? 'bg-purple-100 text-purple-600' :
                                            n.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                            n.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                            <span className="material-icons text-xl">
                                                {n.type === 'poll' ? 'poll' : n.type === 'warning' ? 'warning' : n.type === 'success' ? 'check_circle' : 'info'}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-snug mb-1 ${!n.read ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {n.text}
                                            </p>
                                            <span className="text-[10px] text-slate-400 font-medium">{n.date}</span>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
          )}
        </div>

        {/* Perfil */}
        <div className="relative" ref={profileRef}>
            <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 rounded-full active:scale-95 transition-transform"
            >
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-700 flex items-center justify-center text-slate-500 overflow-hidden shadow-sm">
                 {user?.name ? <span className="font-black text-xs">{user.name.charAt(0)}</span> : <span className="material-icons">person</span>}
              </div>
            </button>

            {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-right z-50">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{user?.cnpj || 'MEI'}</p>
                    </div>
                    <div className="p-2">
                        <button onClick={() => { onNavigateToProfile(); setIsProfileOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors font-bold">
                            <span className="material-icons text-slate-400">person_outline</span> Perfil
                        </button>
                        <button onClick={() => { onLogout(); setIsProfileOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-colors font-bold">
                            <span className="material-icons">logout</span> Sair
                        </button>
                    </div>
                </div>
            )}
        </div>

      </div>
    </header>

    {selectedPoll && (
        <PollModal notification={selectedPoll} onClose={() => setSelectedPollId(null)} onVote={onVote} />
    )}
    </>
  );
};

export default Header;