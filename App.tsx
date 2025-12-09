import React, { useState, useMemo, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // New state for initial auth check
  const [isPublicView, setIsPublicView] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  
  // --- APP STATE ---
  const [cnpj, setCnpj] = useState(''); // CNPJ starts empty
  const [offers, setOffers] = useState<Offer[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [readingNewsId, setReadingNewsId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // --- FISCAL DATA STATE (Lifted) ---
  const [fiscalData, setFiscalData] = useState<FiscalData | null>(null);

  // --- USER MANAGEMENT STATE (Used for Admin view, but primary user data comes from Supabase) ---
  const [allUsers, setAllUsers] = useState<User[]>([]); 

  // --- CONNECTION STATE (ADMIN) ---
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig>({
    cnpjApi: {
      baseUrl: 'https://publica.cnpj.ws/cnpj/',
      token: '',
      mappings: [
        { key: 'razaoSocial', jsonPath: 'razao_social', label: 'Razão Social', visible: true },
        { key: 'nomeFantasia', jsonPath: 'estabelecimento.nome_fantasia', label: 'Nome Fantasia', visible: true },
        { key: 'situacao', jsonPath: 'estabelecimento.situacao_cadastral', label: 'Situação Cadastral', visible: true },
        { key: 'dataAbertura', jsonPath: 'estabelecimento.data_inicio_atividade', label: 'Data de Abertura', visible: true },
        { key: 'cnae', jsonPath: 'estabelecimento.atividade_principal.descricao', label: 'Atividade Principal', visible: true },
        { key: 'naturezaJuridica', jsonPath: 'natureza_juridica.descricao', label: 'Natureza Jurídica', visible: true },
        { key: 'logradouro', jsonPath: 'estabelecimento.logradouro', label: 'Endereço', visible: true }
      ]
    },
    diagnosticApi: {
      webhookUrl: 'https://n8nwebhook.portalmei360.com/webhook/f0f542f0-c91a-4a61-817d-636af20a7024',
      headerKey: 'cnpj',
      mappings: [
        { key: 'dasList', jsonPath: 'dAS.anos', label: 'Lista de Guias DAS', visible: true },
        { key: 'dasnList', jsonPath: 'dASN.anos', label: 'Lista de Declarações (DASN)', visible: true },
        { key: 'totalDebt', jsonPath: 'total_divida', label: 'Dívida Total (Calculada)', visible: true }
      ]
    },
    smtp: {
      host: 'smtp.example.com',
      port: 587,
      user: 'admin@regularmei.com',
      pass: '',
      secure: true,
      fromEmail: 'noreply@regularmei.com'
    },
    ai: {
      enabled: true
    }
  });

  // --- CASH FLOW & APPOINTMENT STATE ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [revenueCats, setRevenueCats] = useState<Category[]>([
    { name: 'Serviços', icon: 'work' },
    { name: 'Vendas', icon: 'shopping_cart' },
    { name: 'Produtos', icon: 'inventory_2' },
    { name: 'Rendimentos', icon: 'savings' },
    { name: 'Outros', icon: 'attach_money' }
  ]);
  const [expenseCats, setExpenseCats] = useState<Category[]>([
    { name: 'Impostos', icon: 'account_balance' },
    { name: 'Fornecedores', icon: 'local_shipping' },
    { name: 'Infraestrutura', icon: 'wifi' },
    { name: 'Pessoal', icon: 'groups' },
    { name: 'Marketing', icon: 'campaign' },
    { name: 'Software', icon: 'computer' },
    { name: 'Outros', icon: 'receipt_long' }
  ]);

  // --- MAINTENANCE STATE ---
  const [maintenance, setMaintenance] = useState<MaintenanceConfig>({
    global: false,
    dashboard: false,
    cashflow: false,
    invoices: false,
    calendar: false,
    cnpj: false,
    tools: false,
    news: false,
    offers: false
  });

  // --- DATA FETCHING FUNCTIONS ---

  const loadUserProfile = async (supabaseUser: any) => {
    setLoadingAuth(true);
    
    // 1. Fetch Profile Data
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Fallback to basic user data if profile fetch fails
        setUser({
            id: supabaseUser.id,
            name: supabaseUser.email || 'Usuário',
            email: supabaseUser.email,
            isSetupComplete: false,
            role: 'user',
            status: 'active'
        });
        setLoadingAuth(false);
        return;
    }

    const appUser: User = {
        id: profileData.id,
        name: profileData.name || supabaseUser.email,
        email: profileData.email || supabaseUser.email,
        phone: profileData.phone,
        cnpj: profileData.cnpj,
        isSetupComplete: profileData.is_setup_complete,
        role: profileData.role as 'admin' | 'user',
        status: profileData.status as 'active' | 'inactive' | 'suspended',
        joinedAt: profileData.joined_at,
        lastActive: new Date().toISOString()
    };

    setUser(appUser);
    setCnpj(appUser.cnpj || '');
    setLoadingAuth(false);
    
    // If setup is complete, load other data (transactions, news, etc.)
    if (appUser.isSetupComplete) {
        // TODO: Implement data loading functions here (transactions, appointments, etc.)
        // For now, we rely on mock data handlers below until full integration
    }
  };

  // --- AUTH MONITORING ---
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoadingAuth(false);
      } else if (event === 'INITIAL_SESSION' && session?.user) {
        loadUserProfile(session.user);
      } else if (event === 'INITIAL_SESSION' && !session) {
        setLoadingAuth(false);
      }
    });

    // Cleanup listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- CHECK PUBLIC URL ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('page') === 'news') {
      setIsPublicView(true);
    }
  }, []);

  // --- CALCULATE DASHBOARD STATS (Remains the same, relies on `transactions` state) ---
  const dashboardStats = useMemo(() => {
    const today = new Date();
    const cMonth = today.getMonth();
    const cYear = today.getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const [y, m] = t.date.split('-').map(Number);
      return (m - 1) === cMonth && y === cYear;
    });

    // Realized (Only Status = 'pago')
    const totalRevenue = monthlyTransactions
      .filter(t => t.type === 'receita' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const totalExpense = monthlyTransactions
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const currentBalance = totalRevenue - totalExpense;

    // Expected (Total amount from all transactions in month, assuming pending will be paid)
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

  // --- AUTH HANDLERS (Simplified/Removed mock logic) ---
  const handleLogin = (userData: User) => {
      // This function is now mostly redundant as onAuthStateChange handles successful login
      // It remains here to satisfy the AuthPage prop requirement, but the actual user state update happens in loadUserProfile
  }

  const handleForgotPassword = async (email: string): Promise<boolean> => {
      // This function is now handled directly by AuthPage using supabase.auth.resetPasswordForEmail
      return true;
  }

  const handleOnboardingComplete = async (newCnpj: string, theme: 'light' | 'dark', companyName: string) => {
      if (!user) return;
      
      // 1. Update Supabase Profile
      const { error } = await supabase
          .from('profiles')
          .update({ 
              cnpj: newCnpj, 
              name: companyName || user.name, 
              is_setup_complete: true 
          })
          .eq('id', user.id);

      if (error) {
          console.error('Error updating profile during onboarding:', error);
          alert('Erro ao salvar dados. Tente novamente.');
          return;
      }

      // 2. Update Local State
      const updatedUser = { 
          ...user, 
          isSetupComplete: true, 
          cnpj: newCnpj,
          name: companyName || user.name,
          lastActive: new Date().toISOString()
      };
      setCnpj(newCnpj);
      setUser(updatedUser);
      
      // 3. Apply Theme
      if (theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
      setShowIntro(true);
  }

  // --- USER MANAGEMENT HANDLERS (Admin) ---
  // These handlers remain local for now, but should eventually interact with Supabase Admin API or RLS policies
  const handleAddUser = (newUser: User) => {
      setAllUsers([...allUsers, newUser]);
  };

  const handleUpdateUser = (updatedUser: User) => {
      setAllUsers(allUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (user && user.id === updatedUser.id) {
          setUser(updatedUser);
      }
  };

  const handleChangePassword = async (newPassword: string): Promise<boolean> => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
          console.error("Error changing password:", error);
          return false;
      }
      return true;
  };

  const handleDeleteUser = (id: string) => {
      // In a real app, this would require a Service Role Key or an Edge Function
      console.warn("Admin: Delete user functionality requires Supabase Service Role or Edge Function.");
      setAllUsers(allUsers.filter(u => u.id !== id));
      if (user && user.id === id) {
          handleDeleteAccount();
      }
  };

  // --- ACCOUNT HANDLERS ---
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    // In a real app, this requires a Service Role Key or an Edge Function to delete the auth user
    // For now, we simulate logout and local state reset
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error signing out:", error);
    }

    setUser(null);
    setActiveTab('dashboard');
    setTransactions([]);
    setAppointments([]);
    setCnpj('');
    setFiscalData(null);
    setShowIntro(false);
  };

  const handleLogout = async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
          console.error("Error signing out:", error);
      }
      setUser(null);
  };

  // --- OFFERS HANDLERS (Remaining handlers omitted for brevity, assuming they use local state for now) ---
  const handleAddOffer = (newOffer: Offer) => {
    setOffers([newOffer, ...offers]);
  };

  const handleUpdateOffer = (updatedOffer: Offer) => {
    setOffers(offers.map(o => o.id === updatedOffer.id ? updatedOffer : o));
  };

  const handleDeleteOffer = (id: number) => {
    setOffers((prevOffers) => prevOffers.filter(o => o.id !== id));
  };

  // --- NEWS HANDLERS ---
  const handleViewNews = (id: number) => {
    setReadingNewsId(id);
    setActiveTab('news');
  };

  const handleAddNews = (newItem: NewsItem) => {
    setNews([newItem, ...news]);
  };

  const handleUpdateNews = (updatedItem: NewsItem) => {
    setNews(news.map(n => n.id === updatedItem.id ? updatedItem : n));
  };

  const handleDeleteNewsClick = (id: number) => {
    setNews((prevNews) => prevNews.filter(n => n.id !== id));
  };

  // --- NOTIFICATION HANDLERS ---
  const handleAddNotification = (item: AppNotification) => {
      setNotifications([item, ...notifications]);
  }

  const handleUpdateNotification = (item: AppNotification) => {
      setNotifications(notifications.map(n => n.id === item.id ? item : n));
  }

  const handleDeleteNotification = (id: number) => {
      setNotifications((prev) => prev.filter(n => n.id !== id));
  }

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleVote = (notificationId: number, optionId: number) => {
    setNotifications(prev => prev.map(n => {
      if (n.id === notificationId && n.pollOptions && user) {
        
        // 1. Update Vote Count
        const updatedOptions = n.pollOptions.map(opt => 
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        );

        // 2. Record User Vote
        const pollVote: PollVote = {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            optionId: optionId,
            optionText: n.pollOptions.find(o => o.id === optionId)?.text || '',
            votedAt: new Date().toISOString()
        };

        const updatedVotes = [...(n.pollVotes || []), pollVote];

        return { 
            ...n, 
            pollOptions: updatedOptions, 
            pollVotes: updatedVotes,
            userVotedOptionId: optionId, 
            read: true 
        };
      }
      return n;
    }));
  };

  // --- CASHFLOW HANDLERS ---
  const handleAddTransaction = (t: Transaction | Transaction[]) => {
    if (array.isArray(t)) {
        setTransactions([...t, ...transactions]);
    } else {
        setTransactions([t, ...transactions]);
    }
  };

  const handleUpdateTransaction = (t: Transaction) => {
    setTransactions(transactions.map(tr => tr.id === t.id ? t : tr));
  };

  const handleDeleteTransaction = (id: number) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  // --- APPOINTMENT HANDLERS ---
  const handleAddAppointment = (a: Appointment) => {
      setAppointments([...appointments, a]);
  };

  const handleUpdateAppointment = (a: Appointment) => {
      setAppointments(appointments.map(app => app.id === a.id ? a : app));
  };

  const handleDeleteAppointment = (id: number) => {
      setAppointments(appointments.filter(a => a.id !== id));
  };

  // --- CATEGORY HANDLERS ---
  const handleAddCategory = (type: 'receita' | 'despesa', cat: Category) => {
    if (type === 'receita') {
      setRevenueCats([...revenueCats, cat]);
    } else {
      setExpenseCats([...expenseCats, cat]);
    }
  };

  const handleDeleteCategory = (type: 'receita' | 'despesa', name: string) => {
    if (type === 'receita') {
      setRevenueCats(revenueCats.filter(c => c.name !== name));
    } else {
      setExpenseCats(expenseCats.filter(c => c.name !== name));
    }
  };

  // --- RENDER LOGIC ---
  
  // Show loading screen while checking auth state
  if (loadingAuth) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

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

  if (!user) {
      return <AuthPage onLogin={handleLogin} onForgotPassword={handleForgotPassword} />;
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
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} userRole={user?.role} />
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
      // Permission check for Admin page
      if (activeTab === 'admin' && user.role !== 'admin') {
          return (
              <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-8">
                  <span className="material-icons text-6xl text-red-500 mb-4">lock</span>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Acesso Negado</h2>
                  <p className="text-slate-500 dark:text-slate-400">Você não tem permissão para acessar a área de administração.</p>
                  <button onClick={() => setActiveTab('dashboard')} className="mt-4 text-primary font-medium hover:underline">Voltar ao Dashboard</button>
              </div>
          );
      }

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
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
            />;
          case 'settings': 
            return <SettingsPage 
              user={user}
              onUpdateUser={handleUpdateUser}
              cnpj={cnpj} 
              onCnpjChange={setCnpj}
              revenueCats={revenueCats}
              expenseCats={expenseCats}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onExportData={handleExportData}
              onDeleteAccount={handleDeleteAccount}
              onChangePassword={handleChangePassword}
            />;
          default: return null;
      }
  };

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} userRole={user?.role} />
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