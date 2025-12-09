import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatCard from './components/StatCard';
import RevenueChart from './components/RevenueChart';
import Reminders from './components/Reminders';
import Thermometer from './components/Thermometer';
import RecentTransactions from './components/RecentTransactions';
import AIAnalysis from './components/AIAnalysis';
import NewsSlider from './components/NewsSlider';
import CashFlowPage from './components/CashFlowPage';
import InvoicesPage from './components/InvoicesPage';
import CalendarPage from './components/CalendarPage';
import CNPJPage from './components/CNPJPage';
import ToolsPage from './components/ToolsPage';
import NewsPage from './components/NewsPage';
import OffersPage from './components/OffersPage';
import SettingsPage from './components/SettingsPage';
import AdminPage from './components/AdminPage';
import MaintenanceOverlay from './components/MaintenanceOverlay';
import AuthPage from './components/AuthPage';
import OnboardingPage from './components/OnboardingPage';
import IntroWalkthrough from './components/IntroWalkthrough';
import FinancialScore from './components/FinancialScore';
import MobileDashboard from './components/MobileDashboard';
import { StatData, Offer, NewsItem, MaintenanceConfig, User, AppNotification, Transaction, Category, ConnectionConfig, Appointment, FiscalData, PollVote } from './types';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// --- INITIAL MOCK DATA (Used as fallback/initial structure) ---
const initialOffersData: Offer[] = [];
const initialNewsData: NewsItem[] = [];
const initialNotifications: AppNotification[] = [];
const initialTransactions: Transaction[] = [];
const initialAppointments: Appointment[] = [];
const mockUsers: User[] = []; // Users will be fetched from Supabase profiles table

const App: React.FC = () => {
  // --- AUTH & SESSION STATE ---
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isPublicView, setIsPublicView] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  
  // --- APP DATA STATE ---
  const [cnpj, setCnpj] = useState('');
  const [offers, setOffers] = useState<Offer[]>(initialOffersData);
  const [news, setNews] = useState<NewsItem[]>(initialNewsData);
  const [readingNewsId, setReadingNewsId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [fiscalData, setFiscalData] = useState<FiscalData | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(mockUsers);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);

  // --- CONFIG STATE ---
  const [revenueCats, setRevenueCats] = useState<Category[]>([
    { name: 'Serviços', icon: 'work' }, { name: 'Vendas', icon: 'shopping_cart' }, { name: 'Produtos', icon: 'inventory_2' },
    { name: 'Rendimentos', icon: 'savings' }, { name: 'Outros', icon: 'attach_money' }
  ]);
  const [expenseCats, setExpenseCats] = useState<Category[]>([
    { name: 'Impostos', icon: 'account_balance' }, { name: 'Fornecedores', icon: 'local_shipping' }, { name: 'Infraestrutura', icon: 'wifi' },
    { name: 'Pessoal', icon: 'groups' }, { name: 'Marketing', icon: 'campaign' }, { name: 'Software', icon: 'computer' },
    { name: 'Outros', icon: 'receipt_long' }
  ]);
  const [maintenance, setMaintenance] = useState<MaintenanceConfig>({
    global: false, dashboard: false, cashflow: false, invoices: false, calendar: false, cnpj: false, tools: false, news: false, offers: false
  });
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig>({
    cnpjApi: { baseUrl: 'https://publica.cnpj.ws/cnpj/', token: '', mappings: [] },
    diagnosticApi: { webhookUrl: 'https://n8nwebhook.portalmei360.com/webhook/f0f542f0-c91a-4a61-817d-636af20a7024', headerKey: 'cnpj', mappings: [] },
    smtp: { host: 'smtp.example.com', port: 587, user: 'admin@regularmei.com', pass: '', secure: true, fromEmail: 'noreply@regularmei.com' },
    ai: { enabled: true }
  });

  // --- AUTH EFFECT ---
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoadingAuth(false);
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setLoadingAuth(false);
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('page') === 'news') {
      setIsPublicView(true);
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- DATA FETCHING EFFECT ---
  const fetchUserData = useCallback(async (userId: string) => {
    setLoadingAuth(true);
    
    // 1. Fetch Profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      // Fallback user data if profile is missing (e.g., new signup before trigger runs)
      setUser({ id: userId, name: 'Novo Usuário', email: session?.user.email || '', isSetupComplete: false });
      setLoadingAuth(false);
      return;
    }

    const userProfile: User = {
      id: profileData.id,
      name: profileData.name || session?.user.email?.split('@')[0] || 'Usuário',
      email: profileData.email || session?.user.email || '',
      phone: profileData.phone,
      cnpj: profileData.cnpj,
      isSetupComplete: profileData.is_setup_complete,
      role: profileData.role,
      status: profileData.status,
      lastActive: profileData.last_active,
      joinedAt: profileData.joined_at
    };
    
    setUser(userProfile);
    setCnpj(userProfile.cnpj || '');

    // 2. Fetch All Data (Only if setup is complete)
    if (userProfile.isSetupComplete) {
        await Promise.all([
            fetchTransactions(userId),
            fetchAppointments(userId),
            fetchNews(),
            fetchOffers(),
            fetchNotifications(userId),
            fetchAdminUsers(userProfile.role === 'admin')
        ]);
    }

    setLoadingAuth(false);
  }, [session?.user.email]);

  useEffect(() => {
    if (session?.user) {
      fetchUserData(session.user.id);
    } else if (!loadingAuth) {
      // Reset data if signed out
      setUser(null);
      setTransactions(initialTransactions);
      setAppointments(initialAppointments);
      setNotifications(initialNotifications);
    }
  }, [session, fetchUserData, loadingAuth]);

  // --- DATA FETCHERS ---

  const fetchTransactions = async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) console.error('Error fetching transactions:', error);
    if (data) setTransactions(data as Transaction[]);
  };

  const fetchAppointments = async (userId: string) => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });
    
    if (error) console.error('Error fetching appointments:', error);
    if (data) setAppointments(data as Appointment[]);
  };

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) console.error('Error fetching news:', error);
    if (data) setNews(data as NewsItem[]);
  };

  const fetchOffers = async () => {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .order('is_featured', { ascending: false });
    
    if (error) console.error('Error fetching offers:', error);
    if (data) setOffers(data as Offer[]);
  };

  const fetchNotifications = async (userId: string) => {
    // Fetch all active notifications
    const { data: notifData, error: notifError } = await supabase
      .from('notifications')
      .select('*, user_notification_interactions(is_read, voted_option_id)')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (notifError) {
        console.error('Error fetching notifications:', notifError);
        return;
    }

    // Map interactions to notifications
    const mappedNotifications: AppNotification[] = notifData.map(n => {
        const interaction = n.user_notification_interactions[0];
        
        // Reconstruct pollVotes from interactions (simplified for client side)
        const pollVotes: PollVote[] = []; // We won't fetch all votes here, only the user's interaction status
        
        return {
            id: n.id,
            text: n.text,
            type: n.type,
            date: new Date(n.date).toLocaleString('pt-BR'),
            pollOptions: n.poll_options,
            active: n.active,
            expiresAt: n.expires_at,
            read: interaction?.is_read || false,
            userVotedOptionId: interaction?.voted_option_id || undefined,
            pollVotes: pollVotes // Admin page will need a separate fetch for full votes
        } as AppNotification;
    });

    setNotifications(mappedNotifications);
  };

  const fetchAdminUsers = async (isAdmin: boolean) => {
      if (!isAdmin) return;
      const { data, error } = await supabase
          .from('profiles')
          .select('*');
      
      if (error) console.error('Error fetching admin users:', error);
      if (data) setAllUsers(data as User[]);
  };

  // --- CRUD HANDLERS (Supabase Integration) ---

  // --- USER HANDLERS ---
  const handleUpdateUser = async (updatedUser: User) => {
      if (!session) return false;
      
      const { error } = await supabase
          .from('profiles')
          .update({
              name: updatedUser.name,
              phone: updatedUser.phone,
              cnpj: updatedUser.cnpj,
              is_setup_complete: updatedUser.isSetupComplete,
              role: updatedUser.role,
              status: updatedUser.status,
              email: updatedUser.email // Note: Email change requires special handling in Supabase, simplified here
          })
          .eq('id', updatedUser.id);

      if (error) {
          console.error('Error updating user profile:', error);
          return false;
      }
      
      // Re-fetch data to update state
      if (user && user.id === updatedUser.id) {
          setUser(updatedUser);
          setCnpj(updatedUser.cnpj || '');
      }
      if (user?.role === 'admin') fetchAdminUsers(true);
      return true;
  };

  const handleOnboardingComplete = async (newCnpj: string, theme: 'light' | 'dark', companyName: string) => {
      if (!user) return;
      
      const success = await handleUpdateUser({
          ...user,
          isSetupComplete: true,
          cnpj: newCnpj,
          name: companyName || user.name,
          role: 'user',
          status: 'active',
          joinedAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
      });

      if (success) {
          if (theme === 'dark') {
              document.documentElement.classList.add('dark');
          } else {
              document.documentElement.classList.remove('dark');
          }
          setShowIntro(true);
          // Initial data fetch after setup
          fetchUserData(user.id);
      }
  }

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setUser(null);
  };

  const handleForgotPassword = async (email: string): Promise<boolean> => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`, // Placeholder redirect
      });
      if (error) {
          console.error('Password reset error:', error);
          return false;
      }
      return true;
  }

  const handleChangePassword = async (newPassword: string): Promise<boolean> => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
          console.error('Error changing password:', error);
          return false;
      }
      return true;
  };

  const handleDeleteAccount = async () => {
      if (!user) return;
      // Note: Supabase handles user deletion via RLS policy on profiles table (ON DELETE CASCADE)
      // We only need to delete the user from auth.users, but that requires service role key.
      // For client-side, we simulate by logging out and clearing local state.
      await handleLogout();
      // In a real app, this would trigger a server function or require admin privileges.
      // For now, we rely on the user deleting their own profile via the UI if needed, or admin action.
  };

  // --- TRANSACTION CRUD ---
  const handleAddTransaction = async (t: Transaction | Transaction[]) => {
    if (!user) return;
    const items = Array.isArray(t) ? t : [t];
    
    const payload = items.map(item => ({
        user_id: user.id,
        description: item.description,
        category: item.category,
        type: item.type,
        amount: item.amount,
        date: item.date,
        time: item.time,
        status: item.status,
        installments: item.installments,
        is_recurring: item.isRecurring
    }));

    const { error } = await supabase.from('transactions').insert(payload);
    if (error) console.error('Error adding transaction:', error);
    else fetchTransactions(user.id);
  };

  const handleUpdateTransaction = async (t: Transaction) => {
    if (!user) return;
    const { error } = await supabase
        .from('transactions')
        .update({
            description: t.description,
            category: t.category,
            type: t.type,
            amount: t.amount,
            date: t.date,
            time: t.time,
            status: t.status,
            installments: t.installments,
            is_recurring: t.isRecurring
        })
        .eq('id', t.id)
        .eq('user_id', user.id); // Ensure RLS check

    if (error) console.error('Error updating transaction:', error);
    else fetchTransactions(user.id);
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!user) return;
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) console.error('Error deleting transaction:', error);
    else fetchTransactions(user.id);
  };

  // --- APPOINTMENT CRUD ---
  const handleAddAppointment = async (a: Appointment) => {
    if (!user) return;
    const payload = {
        user_id: user.id,
        title: a.title,
        date: a.date,
        time: a.time,
        notify: a.notify,
        type: a.type
    };
    const { error } = await supabase.from('appointments').insert(payload);
    if (error) console.error('Error adding appointment:', error);
    else fetchAppointments(user.id);
  };

  const handleUpdateAppointment = async (a: Appointment) => {
    if (!user) return;
    const { error } = await supabase
        .from('appointments')
        .update({
            title: a.title,
            date: a.date,
            time: a.time,
            notify: a.notify,
            type: a.type
        })
        .eq('id', a.id)
        .eq('user_id', user.id);

    if (error) console.error('Error updating appointment:', error);
    else fetchAppointments(user.id);
  };

  const handleDeleteAppointment = async (id: number) => {
    if (!user) return;
    const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) console.error('Error deleting appointment:', error);
    else fetchAppointments(user.id);
  };

  // --- NOTIFICATION INTERACTION (READ/VOTE) ---
  const handleMarkAsRead = async (notificationId: number) => {
    if (!user) return;
    const { error } = await supabase
        .from('user_notification_interactions')
        .upsert({
            user_id: user.id,
            notification_id: notificationId,
            is_read: true
        });
    if (error) console.error('Error marking notification as read:', error);
    else fetchNotifications(user.id);
  };

  const handleVote = async (notificationId: number, optionId: number) => {
    if (!user) return;
    
    // 1. Record interaction
    const { error: interactionError } = await supabase
        .from('user_notification_interactions')
        .upsert({
            user_id: user.id,
            notification_id: notificationId,
            is_read: true,
            voted_option_id: optionId,
            voted_at: new Date().toISOString()
        });

    if (interactionError) {
        console.error('Error recording vote interaction:', interactionError);
        return;
    }

    // 2. Update vote count in notifications table (Requires RLS policy to allow update by user, or a function)
    // Since RLS is set to Admin only for notifications, we skip direct update here.
    // In a real scenario, this would trigger a Supabase Function to safely increment the poll_options JSONB.
    
    // For now, we rely on re-fetching the notifications to update the UI state based on the interaction table.
    fetchNotifications(user.id);
  };

  // --- ADMIN CRUD (Simplified: Assumes user is admin and has RLS access) ---
  
  const handleAddOffer = async (newOffer: Offer) => {
    const { error } = await supabase.from('offers').insert(newOffer);
    if (error) console.error('Error adding offer:', error);
    else fetchOffers();
  };

  const handleUpdateOffer = async (updatedOffer: Offer) => {
    const { error } = await supabase.from('offers').update(updatedOffer).eq('id', updatedOffer.id);
    if (error) console.error('Error updating offer:', error);
    else fetchOffers();
  };

  const handleDeleteOffer = async (id: number) => {
    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (error) console.error('Error deleting offer:', error);
    else fetchOffers();
  };

  const handleAddNews = async (newItem: NewsItem) => {
    const { error } = await supabase.from('news').insert(newItem);
    if (error) console.error('Error adding news:', error);
    else fetchNews();
  };

  const handleUpdateNews = async (updatedItem: NewsItem) => {
    const { error } = await supabase.from('news').update(updatedItem).eq('id', updatedItem.id);
    if (error) console.error('Error updating news:', error);
    else fetchNews();
  };

  const handleDeleteNewsClick = async (id: number) => {
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) console.error('Error deleting news:', error);
    else fetchNews();
  };

  const handleAddNotification = async (item: AppNotification) => {
    const payload = {
        text: item.text,
        type: item.type,
        poll_options: item.pollOptions,
        expires_at: item.expiresAt,
        active: item.active
    };
    const { error } = await supabase.from('notifications').insert(payload);
    if (error) console.error('Error adding notification:', error);
    else fetchNotifications(user!.id);
  }

  const handleUpdateNotification = async (item: AppNotification) => {
    const payload = {
        text: item.text,
        type: item.type,
        poll_options: item.pollOptions,
        expires_at: item.expiresAt,
        active: item.active
    };
    const { error } = await supabase.from('notifications').update(payload).eq('id', item.id);
    if (error) console.error('Error updating notification:', error);
    else fetchNotifications(user!.id);
  }

  const handleDeleteNotification = async (id: number) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) console.error('Error deleting notification:', error);
    else fetchNotifications(user!.id);
  }

  // --- UTILITY FUNCTIONS (Unchanged) ---
  const dashboardStats = useMemo(() => {
    // ... (Calculation logic remains the same, using 'transactions' state) ...
    const today = new Date();
    const cMonth = today.getMonth();
    const cYear = today.getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const [y, m] = t.date.split('-').map(Number);
      return (m - 1) === cMonth && y === cYear;
    });

    const totalRevenue = monthlyTransactions
      .filter(t => t.type === 'receita' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const totalExpense = monthlyTransactions
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const currentBalance = totalRevenue - totalExpense;

    const expectedRevenue = monthlyTransactions
      .filter(t => t.type === 'receita')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const expectedExpense = monthlyTransactions
      .filter(t => t.type === 'despesa')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const expectedBalance = expectedRevenue - expectedExpense;

    return [
      {
        label: 'Receita',
        value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        icon: 'arrow_upward',
        colorClass: 'text-green-500',
        iconBgClass: 'bg-green-100 dark:bg-green-900/50',
        iconColorClass: 'text-green-500 dark:text-green-400'
      },
      {
        label: 'Despesas',
        value: `R$ ${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        icon: 'arrow_downward',
        colorClass: 'text-red-500',
        iconBgClass: 'bg-red-100 dark:bg-red-900/50',
        iconColorClass: 'text-red-500 dark:text-red-400'
      },
      {
        label: 'Saldo',
        value: `R$ ${currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        icon: 'account_balance_wallet',
        colorClass: currentBalance >= 0 ? 'text-blue-500' : 'text-red-500',
        iconBgClass: 'bg-blue-100 dark:bg-blue-900/50',
        iconColorClass: currentBalance >= 0 ? 'text-primary' : 'text-red-500'
      },
      {
        label: 'Saldo Previsto',
        value: `R$ ${expectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        icon: 'query_stats',
        colorClass: expectedBalance >= 0 ? 'text-purple-600' : 'text-red-500',
        iconBgClass: 'bg-purple-100 dark:bg-purple-900/50',
        iconColorClass: 'text-purple-600 dark:text-purple-400'
      }
    ];
  }, [transactions]);

  const handleExportData = () => {
    // Generate CSV for transactions
    const headers = [
      "Data", 
      "Descrição", 
      "Categoria", 
      "Tipo", 
      "Status", 
      "Valor", 
      "Detalhes"
    ];

    const rows = transactions.map(t => {
      const dateStr = new Date(t.date).toLocaleDateString('pt-BR');
      const amountStr = (t.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      
      let details = "";
      if (t.installments) details = `Parcela ${t.installments.current}/${t.installments.total}`;
      else if (t.isRecurring) details = "Recorrente";

      return [
        dateStr,
        `"${t.description.replace(/"/g, '""')}"`,
        t.category,
        t.type === 'receita' ? 'Receita' : 'Despesa',
        t.status === 'pago' ? (t.type === 'receita' ? 'Recebido' : 'Pago') : 'Pendente',
        `"${amountStr}"`,
        details
      ].join(';');
    });

    const csvContent = "\uFEFF" + headers.join(";") + "\n" + rows.join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `regularmei_transacoes_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- RENDER LOGIC ---
  if (isPublicView) {
      return (
          <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
              <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 h-[72px] flex items-center justify-between px-6">
                  <div className="flex items-center gap-2">
                      <img 
                        src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
                        alt="Regular MEI" 
                        className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
                      />
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase ml-2">Blog</span>
                  </div>
                  <button 
                    onClick={() => {
                        setIsPublicView(false);
                        const url = new URL(window.location.href);
                        url.searchParams.delete('page');
                        window.history.pushState({}, '', url);
                    }}
                    className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                  >
                      Acessar Plataforma <span className="material-icons text-sm">login</span>
                  </button>
              </header>
              <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
                  <NewsPage news={news} readingId={readingNewsId} onSelectNews={setReadingNewsId} />
              </main>
              <footer className="mt-8 text-center text-sm text-slate-400 pb-8">
                <p>&copy; {new Date().getFullYear()} Regular MEI. Todos os direitos reservados.</p>
              </footer>
          </div>
      );
  }

  if (loadingAuth) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  if (!session || !user) {
      return <AuthPage onLogin={() => {}} onForgotPassword={handleForgotPassword} />;
  }

  if (!user.isSetupComplete) {
      return <OnboardingPage user={user} onComplete={handleOnboardingComplete} />;
  }

  const isPageInMaintenance = (page: string) => {
      if (maintenance.global && page !== 'admin' && page !== 'settings') return true;
      if (maintenance[page as keyof MaintenanceConfig]) return true;
      return false;
  }

  if (maintenance.global && activeTab !== 'admin' && activeTab !== 'settings') {
      return (
        <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
             <div className="flex-1 flex flex-col overflow-hidden">
                 <Header activeTab={activeTab} onMenuClick={() => setIsSidebarOpen(true)} notifications={notifications} onMarkAsRead={handleMarkAsRead} onVote={handleVote} user={user} onLogout={handleLogout} onNavigateToProfile={() => setActiveTab('settings')} />
                 <main className="flex-1 flex items-center justify-center p-4">
                     <MaintenanceOverlay type="global" />
                 </main>
             </div>
        </div>
      );
  }

  const renderContent = () => {
      if (isPageInMaintenance(activeTab)) {
          return <MaintenanceOverlay type="page" />;
      }

      switch (activeTab) {
          case 'dashboard':
              return (
                <>
                {/* --- MOBILE LAYOUT --- */}
                <div className="md:hidden">
                   <div className="grid grid-cols-12 mb-6">
                      <AIAnalysis enabled={connectionConfig.ai.enabled} />
                   </div>
                   <MobileDashboard 
                        transactions={transactions} 
                        user={user} 
                        appointments={appointments}
                        fiscalData={fiscalData}
                        onNavigate={setActiveTab}
                   />
                   
                   <div className="mt-6">
                      <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 px-2">Últimas Movimentações</h3>
                      <div className="h-[400px]">
                         <RecentTransactions transactions={transactions} onNavigate={setActiveTab} />
                      </div>
                   </div>

                   <div className="mt-8 mb-4">
                      <NewsSlider news={news} onViewNews={handleViewNews} />
                   </div>
                </div>

                {/* --- DESKTOP LAYOUT --- */}
                <div className="hidden md:block space-y-6">
                  <div className="grid grid-cols-12">
                    <AIAnalysis enabled={connectionConfig.ai.enabled} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {dashboardStats.map((stat, index) => (
                      <StatCard key={index} data={stat} />
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 xl:col-span-8 h-full">
                      <RevenueChart transactions={transactions} />
                    </div>
                    <div className="col-span-12 xl:col-span-4 h-full">
                        <Reminders transactions={transactions} appointments={appointments} fiscalData={fiscalData} onNavigate={setActiveTab} />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 xl:col-span-6 h-full">
                        <FinancialScore transactions={transactions} />
                    </div>
                    <div className="col-span-12 xl:col-span-6 h-full">
                        <Thermometer transactions={transactions} />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 h-full">
                        <RecentTransactions transactions={transactions} onNavigate={setActiveTab} />
                    </div>
                  </div>

                  <div className="grid grid-cols-12">
                    <NewsSlider news={news} onViewNews={handleViewNews} />
                  </div>
                </div>
              </>
              );
          case 'cashflow': 
            return <CashFlowPage 
                transactions={transactions}
                revenueCats={revenueCats}
                expenseCats={expenseCats}
                onAddTransaction={handleAddTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
            />;
          case 'invoices': return <InvoicesPage />;
          case 'calendar': 
            return <CalendarPage 
                transactions={transactions}
                appointments={appointments}
                revenueCats={revenueCats}
                expenseCats={expenseCats}
                onAddTransaction={handleAddTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onAddAppointment={handleAddAppointment}
                onUpdateAppointment={handleUpdateAppointment}
                onDeleteAppointment={handleDeleteAppointment}
            />;
          case 'cnpj': return <CNPJPage cnpj={cnpj} fiscalData={fiscalData} onUpdateFiscalData={setFiscalData} />;
          case 'tools': return <ToolsPage user={user} />;
          case 'news': return <NewsPage news={news} readingId={readingNewsId} onSelectNews={(id) => setReadingNewsId(id)} />;
          case 'offers': return <OffersPage offers={offers} />;
          case 'admin':
            return <AdminPage 
                offers={offers}
                onAddOffer={handleAddOffer}
                onUpdateOffer={handleUpdateOffer}
                onDeleteOffer={handleDeleteOffer}
                news={news}
                onAddNews={handleAddNews}
                onUpdateNews={handleUpdateNews}
                onDeleteNews={handleDeleteNewsClick}
                notifications={notifications}
                onAddNotification={handleAddNotification}
                onUpdateNotification={handleUpdateNotification}
                onDeleteNotification={handleDeleteNotification}
                maintenance={maintenance}
                onUpdateMaintenance={setMaintenance}
                connectionConfig={connectionConfig}
                onUpdateConnectionConfig={setConnectionConfig}
                users={allUsers}
                onAddUser={() => {}} // Admin user creation is handled via Supabase Auth/Admin panel in real app
                onUpdateUser={handleUpdateUser}
                onDeleteUser={() => {}} // Admin user deletion is handled via Supabase Auth/Admin panel in real app
            />;
          case 'settings': 
            return <SettingsPage 
              user={user}
              onUpdateUser={handleUpdateUser}
              cnpj={cnpj} 
              onCnpjChange={setCnpj}
              revenueCats={revenueCats}
              expenseCats={expenseCats}
              onAddCategory={() => {}} // Categories are currently local state/mocked
              onDeleteCategory={() => {}}
              onExportData={handleExportData}
              onDeleteAccount={handleDeleteAccount}
              onChangePassword={handleChangePassword}
            />;
          default: return null;
      }
  };

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeTab={activeTab} onMenuClick={() => setIsSidebarOpen(true)} notifications={notifications} onMarkAsRead={handleMarkAsRead} onVote={handleVote} user={user} onLogout={handleLogout} onNavigateToProfile={() => setActiveTab('settings')} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth relative">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderContent()}
          </div>
          <footer className="mt-8 text-center text-sm text-slate-400 pb-4">
            <p>&copy; {new Date().getFullYear()} Regular MEI. Todos os direitos reservados.</p>
          </footer>
          {showIntro && <IntroWalkthrough onFinish={() => setShowIntro(false)} />}
        </main>
      </div>
    </div>
  );
};

export default App;