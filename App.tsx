"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardSummaryCards from './components/DashboardSummaryCards';
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
import SettingsPage from './components/SettingsPage';
import AdminPage from './components/AdminPage';
import MaintenanceOverlay from './components/MaintenanceOverlay';
import AuthPage from './components/AuthPage';
import OnboardingPage from './components/OnboardingPage';
import IntroWalkthrough from './components/IntroWalkthrough';
import FinancialScore from './components/FinancialScore';
import MobileDashboard from './components/MobileDashboard';
import InstallPrompt from './components/InstallPrompt';
import ExternalTransactionModal from './components/ExternalTransactionModal';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import BalanceForecastCard from './components/BalanceForecastCard';
import VirtualAssistantButton from './components/VirtualAssistantButton';
import AssistantChat from './components/AssistantChat';
import LandingPage from './components/LandingPage';
import CnpjConsultPage from "./components/CnpjConsultPage";
import MobileBottomNav from './components/MobileBottomNav';
import MorePage from './components/MorePage';
import DashboardViewSelector from './components/DashboardViewSelector';
import TransactionModal from './components/TransactionModal';
import ProductsByCnaePage from './components/ProductsByCnaePage';
import ResetPasswordPage from './components/ResetPasswordPage';
import DasnServicePage from './components/DasnServicePage';
import { Offer, NewsItem, MaintenanceConfig, User, AppNotification, Transaction, Category, ConnectionConfig, Appointment, FiscalData, PollVote, CNPJResponse } from './types';
import { supabase } from './src/integrations/supabase/client';
import { showSuccess, showError, showLoading, dismissToast, showWarning } from './utils/toastUtils';
import { scheduleTransactionReminder, scheduleAppointmentReminder, deleteScheduledReminder } from './utils/whatsappUtils';

const DEFAULT_REVENUE_CATS: Category[] = [
  { name: 'Serviços', icon: 'work' },
  { name: 'Vendas', icon: 'shopping_cart' },
  { name: 'Produtos', icon: 'inventory_2' },
  { name: 'Rendimentos', icon: 'trending_up' },
  { name: 'Outros', icon: 'add_circle' }
];

const DEFAULT_EXPENSE_CATS: Category[] = [
  { name: 'Impostos', icon: 'account_balance' },
  { name: 'Fornecedores', icon: 'local_shipping' },
  { name: 'Infraestrutura', icon: 'home' },
  { name: 'Pessoal', icon: 'groups' },
  { name: 'Marketing', icon: 'campaign' },
  { name: 'Software', icon: 'computer' },
  { name: 'Outros', icon: 'remove_circle' }
];

const App: React.FC = () => {
  // --- AUTH & USER STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(false);

  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState('home');
  const [dashboardViewMode, setDashboardViewMode] = useState<'monthly' | 'annual'>('monthly');
  const [readingNewsId, setReadingNewsId] = useState<number | null>(null);

  // --- DATA STATE ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [fiscalData, setFiscalData] = useState<FiscalData | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [revenueCats, setRevenueCats] = useState<Category[]>(DEFAULT_REVENUE_CATS);
  const [expenseCats, setExpenseCats] = useState<Category[]>(DEFAULT_EXPENSE_CATS);
  const [cnpj, setCnpj] = useState('');

  // --- UI STATE ---
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [quickAddModalType, setQuickAddModalType] = useState<'receita' | 'despesa' | null>(null);
  const [externalTransactions, setExternalTransactions] = useState<Transaction[]>([]);

  // --- CONFIG STATE ---
  const [maintenance, setMaintenance] = useState<MaintenanceConfig>({
    global: false, dashboard: false, cashflow: false, invoices: false, calendar: false, cnpj: false, tools: false, news: false, offers: false
  });
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig>({
    cnpjApi: { baseUrl: 'https://publica.cnpj.ws/cnpj/', mappings: [] },
    diagnosticApi: { webhookUrl: '', mappings: [] },
    whatsappApi: { sendTextUrl: '', enabled: true },
    smtp: { host: '', port: 587, user: '', pass: '', secure: false, fromEmail: '' },
    ai: { enabled: true },
    assistantWebhookUrl: '',
    productRedirectWebhookUrl: ''
  });

  // --- INITIAL LOAD & AUTH ---
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      setIsAuthLoading(false);
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchUserData(session.user.id);
        setActiveTab('dashboard');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setActiveTab('home');
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (profile) {
      setUser({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        cnpj: profile.cnpj,
        role: profile.role,
        status: profile.status,
        isSetupComplete: profile.is_setup_complete,
        receiveWeeklySummary: profile.receive_weekly_summary,
        cnpjData: profile.cnpj_data,
        fiscalSummary: profile.fiscal_summary
      });
      setCnpj(profile.cnpj || '');
      fetchTransactions(userId);
      fetchAppointments(userId);
    }
  };

  const fetchTransactions = async (userId: string) => {
    const { data } = await supabase.from('transactions').select('*').eq('user_id', userId);
    if (data) setTransactions(data.map(t => ({ ...t, amount: Number(t.amount) })));
  };

  const fetchAppointments = async (userId: string) => {
    const { data } = await supabase.from('appointments').select('*').eq('user_id', userId);
    if (data) setAppointments(data);
  };

  // --- HANDLERS ---
  const handleAddTransaction = async (t: Transaction | Transaction[]) => {
    const items = Array.isArray(t) ? t : [t];
    const { data, error } = await supabase.from('transactions').insert(
      items.map(item => ({ ...item, user_id: user?.id }))
    ).select();
    
    if (!error && data) {
      setTransactions(prev => [...prev, ...data.map(d => ({ ...d, amount: Number(d.amount) }))]);
      showSuccess('Transação adicionada!');
    }
  };

  const handleUpdateTransaction = async (t: Transaction) => {
    const { error } = await supabase.from('transactions').update(t).eq('id', t.id);
    if (!error) {
      setTransactions(prev => prev.map(item => item.id === t.id ? t : item));
      showSuccess('Transação atualizada!');
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      showSuccess('Transação excluída!');
    }
  };

  const handleDeleteTransactionSeries = async (t: Transaction) => {
    showSuccess('Série excluída!');
  };

  const handleAddAppointment = async (a: Appointment) => {
    const { data, error } = await supabase.from('appointments').insert({ ...a, user_id: user?.id }).select().single();
    if (!error && data) {
      setAppointments(prev => [...prev, data]);
      showSuccess('Compromisso agendado!');
    }
  };

  const handleUpdateAppointment = async (a: Appointment) => {
    const { error } = await supabase.from('appointments').update(a).eq('id', a.id);
    if (!error) {
      setAppointments(prev => prev.map(item => item.id === a.id ? a : item));
      showSuccess('Compromisso atualizado!');
    }
  };

  const handleDeleteAppointment = async (id: number) => {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (!error) {
      setAppointments(prev => prev.filter(a => a.id !== id));
      showSuccess('Compromisso removido!');
    }
  };

  const handleUpdateFiscalData = (data: FiscalData) => setFiscalData(data);
  const handleUpdateCnpjData = async (data: CNPJResponse) => {
    if (user) {
      const { error } = await supabase.from('profiles').update({ cnpj_data: data }).eq('id', user.id);
      if (!error) setUser({ ...user, cnpjData: data });
    }
  };

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleVote = (notifId: number, optionId: number) => {
    showSuccess('Voto registrado!');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleUpdateMaintenance = (config: MaintenanceConfig) => setMaintenance(config);
  const handleUpdateConnectionConfig = (config: ConnectionConfig) => setConnectionConfig(config);

  const handleAddUser = (u: User) => setAllUsers(prev => [...prev, u]);
  const handleUpdateUser = async (u: User) => {
    const { error } = await supabase.from('profiles').update({
      name: u.name,
      phone: u.phone,
      cnpj: u.cnpj,
      receive_weekly_summary: u.receiveWeeklySummary
    }).eq('id', u.id);
    if (!error) setUser(u);
  };

  const handleDeleteUser = (id: string) => setAllUsers(prev => prev.filter(u => u.id !== id));

  const handleUpdateUserPhone = async (userId: string, phone: string) => {
    const { error } = await supabase.from('profiles').update({ phone }).eq('id', userId);
    return { success: !error, error: error?.message };
  };

  const handleUpdateUserEmail = async (email: string) => {
    const { error } = await supabase.auth.updateUser({ email });
    return { success: !error, error: error?.message };
  };

  const handleChangePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) showSuccess('Senha alterada!');
    return !error;
  };

  const handleExportData = () => {
    showSuccess('Dados exportados!');
  };

  const handleDeleteAccount = async () => {
    showSuccess('Conta excluída.');
  };

  const handleViewNews = (id: number) => {
    setReadingNewsId(id);
    setActiveTab('news');
  };

  const handleCloseExternalModal = () => setExternalTransactions([]);

  const handleAddOffer = (o: Offer) => setOffers(prev => [...prev, o]);
  const handleUpdateOffer = (o: Offer) => setOffers(prev => prev.map(item => item.id === o.id ? o : item));
  const handleDeleteOffer = (id: number) => setOffers(prev => prev.filter(o => o.id !== id));

  const handleAddNews = (n: NewsItem) => setNews(prev => [...prev, n]);
  const handleUpdateNews = (n: NewsItem) => setNews(prev => prev.map(item => item.id === n.id ? n : item));
  const handleDeleteNewsClick = (id: number) => setNews(prev => prev.filter(n => n.id !== id));

  const handleAddNotification = (n: AppNotification) => setNotifications(prev => [...prev, n]);
  const handleUpdateNotification = (n: AppNotification) => setNotifications(prev => prev.map(item => item.id === n.id ? n : item));
  const handleDeleteNotification = (id: number) => setNotifications(prev => prev.filter(n => n.id !== id));

  const handleAddCategory = (type: 'receita' | 'despesa', cat: Category) => {
    if (type === 'receita') setRevenueCats(prev => [...prev, cat]);
    else setExpenseCats(prev => [...prev, cat]);
  };

  const handleDeleteCategory = (type: 'receita' | 'despesa', name: string) => {
    if (type === 'receita') setRevenueCats(prev => prev.filter(c => c.name !== name));
    else setExpenseCats(prev => prev.filter(c => c.name !== name));
  };

  // --- METRICS ---
  const dashboardMetrics = useMemo(() => {
    const today = new Date();
    const cMonth = today.getMonth();
    const cYear = today.getFullYear();
    const monthTrans = transactions.filter(t => {
      const [y, m] = t.date.split('-').map(Number);
      return (m - 1) === cMonth && y === cYear;
    });

    const realizedRevenue = monthTrans.filter(t => t.type === 'receita' && t.status === 'pago').reduce((acc, t) => acc + t.amount, 0);
    const realizedExpense = monthTrans.filter(t => t.type === 'despesa' && t.status === 'pago').reduce((acc, t) => acc + t.amount, 0);
    const pendingRevenue = monthTrans.filter(t => t.type === 'receita' && t.status === 'pendente').reduce((acc, t) => acc + t.amount, 0);
    const pendingExpense = monthTrans.filter(t => t.type === 'despesa' && t.status === 'pendente').reduce((acc, t) => acc + t.amount, 0);

    return {
      caixaAtual: realizedRevenue - realizedExpense,
      aReceber: pendingRevenue,
      aPagar: pendingExpense,
      caixaProjetado: (realizedRevenue + pendingRevenue) - (realizedExpense + pendingExpense),
      emAtraso: 0,
      aVencer: 0
    };
  }, [transactions]);

  const isPageInMaintenance = (tab: string) => maintenance[tab as keyof MaintenanceConfig] === true;

  const renderContent = () => {
    if (activeTab === 'home' && !user) {
      return <LandingPage 
        onGetStarted={() => setActiveTab('register')} 
        onLogin={() => setActiveTab('login')} 
        onViewBlog={handleViewNews} 
        onConsultCnpj={() => setActiveTab('cnpj-consult')}
        news={news}
        onNavigateToService={setActiveTab}
      />;
    }

    if (activeTab === 'login' || activeTab === 'register') {
      return <AuthPage 
        onLogin={() => {}} 
        onForgotPassword={async () => true} 
        onNavigate={setActiveTab} 
        onBackToLanding={() => setActiveTab('home')} 
      />;
    }

    if (activeTab === 'cnpj-consult') {
      return <CnpjConsultPage onBack={() => setActiveTab('home')} connectionConfig={connectionConfig} onNavigateToService={setActiveTab} />;
    }

    if (user && !user.isSetupComplete) {
      return <OnboardingPage onComplete={() => fetchUserData(user.id)} />;
    }

    if (activeTab === 'admin' && user?.role !== 'admin') {
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
            <div className="md:hidden">
              <MobileDashboard transactions={transactions} user={user} appointments={appointments} fiscalData={fiscalData} onNavigate={setActiveTab} />
              <div className="mt-6">
                <RecentTransactions transactions={transactions} onNavigate={setActiveTab} viewMode={dashboardViewMode} />
              </div>
              <div className="mt-8 mb-4">
                <NewsSlider news={news} onViewNews={handleViewNews} />
              </div>
            </div>
            <div className="hidden md:block space-y-6">
              <div className="flex justify-between items-center gap-4">
                <DashboardViewSelector viewMode={dashboardViewMode} setViewMode={setDashboardViewMode} />
                <div className="flex gap-4">
                  <button onClick={() => setQuickAddModalType('receita')} className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm font-bold text-sm">
                    <span className="material-icons text-lg">arrow_upward</span> Nova Receita
                  </button>
                  <button onClick={() => setQuickAddModalType('despesa')} className="bg-rose-500 hover:bg-rose-600 text-white p-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm font-bold text-sm">
                    <span className="material-icons text-lg">arrow_downward</span> Nova Despesa
                  </button>
                </div>
              </div>
              <DashboardSummaryCards metrics={dashboardMetrics} />
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 xl:col-span-8 h-full">
                  <RevenueChart transactions={transactions} globalViewMode={dashboardViewMode} />
                </div>
                <div className="col-span-12 xl:col-span-4 h-full">
                  <Reminders transactions={transactions} appointments={appointments} fiscalData={fiscalData} onNavigate={setActiveTab} />
                </div>
              </div>
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 xl:col-span-4 h-full">
                  <FinancialScore transactions={transactions} viewMode={dashboardViewMode} />
                </div>
                <div className="col-span-12 xl:col-span-4 h-full">
                  <Thermometer transactions={transactions} />
                </div>
                <div className="col-span-12 xl:col-span-4 h-full">
                  <BalanceForecastCard transactions={transactions} viewMode={dashboardViewMode} />
                </div>
              </div>
              <div className="grid grid-cols-12">
                <NewsSlider news={news} onViewNews={handleViewNews} />
              </div>
            </div>
          </>
        );
      case 'cashflow':
        return <CashFlowPage transactions={transactions} revenueCats={revenueCats} expenseCats={expenseCats} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onDeleteTransactionSeries={handleDeleteTransactionSeries} />;
      case 'invoices': return <InvoicesPage />;
      case 'calendar':
        return <CalendarPage transactions={transactions} appointments={appointments} revenueCats={revenueCats} expenseCats={expenseCats} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onAddAppointment={handleAddAppointment} onUpdateAppointment={handleUpdateAppointment} onDeleteAppointment={handleDeleteAppointment} userId={user!.id} />;
      case 'cnpj':
        return <CNPJPage cnpj={cnpj} fiscalData={fiscalData} onUpdateFiscalData={handleUpdateFiscalData} onUpdateCnpjData={handleUpdateCnpjData} connectionConfig={connectionConfig} cnpjData={user?.cnpjData} onNavigateToService={setActiveTab} />;
      case 'tools': return <ToolsPage user={user} />;
      case 'news': return <NewsPage news={news} readingId={readingNewsId} onSelectNews={setReadingNewsId} />;
      case 'offers': return <ProductsByCnaePage user={user!} productRedirectWebhookUrl={connectionConfig.productRedirectWebhookUrl} />;
      case 'admin':
        return <AdminPage offers={offers} onAddOffer={handleAddOffer} onUpdateOffer={handleUpdateOffer} onDeleteOffer={handleDeleteOffer} news={news} onAddNews={handleAddNews} onUpdateNews={handleUpdateNews} onDeleteNews={handleDeleteNewsClick} notifications={notifications} onAddNotification={handleAddNotification} onUpdateNotification={handleUpdateNotification} onDeleteNotification={handleDeleteNotification} maintenance={maintenance} onUpdateMaintenance={handleUpdateMaintenance} connectionConfig={connectionConfig} onUpdateConnectionConfig={handleUpdateConnectionConfig} users={allUsers} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />;
      case 'settings':
        return <SettingsPage user={user} onUpdateUser={handleUpdateUser} onUpdateUserPhone={handleUpdateUserPhone} onUpdateUserEmail={handleUpdateUserEmail} cnpj={cnpj} onCnpjChange={setCnpj} revenueCats={revenueCats} expenseCats={expenseCats} onAddCategory={handleAddCategory} onDeleteCategory={handleDeleteCategory} onExportData={handleExportData} onDeleteAccount={handleDeleteAccount} onChangePassword={handleChangePassword} />;
      case 'more':
        return <MorePage onNavigate={setActiveTab} userRole={user?.role} />;
      case 'terms': return <TermsPage />;
      case 'privacy': return <PrivacyPage />;
      case 'dasn-service':
        return <DasnServicePage user={user} onBack={() => setActiveTab(user ? 'dashboard' : 'home')} />;
      default: return null;
    }
  };

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- RENDER LOGIC ---
  const isPublicPage = activeTab === 'home' || activeTab === 'login' || activeTab === 'register' || activeTab === 'cnpj-consult' || (activeTab === 'dasn-service' && !user);

  if (isPublicPage && !user) {
      return (
          <div className="min-h-screen bg-background-light dark:bg-background-dark overflow-y-auto">
              {renderContent()}
              <InstallPrompt />
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden relative">
      {user && (
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={false} toggleSidebar={() => {}} userRole={user?.role} />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        {user && (
          <Header activeTab={activeTab} onMenuClick={() => {}} notifications={notifications} onMarkAsRead={handleMarkAsRead} onVote={handleVote} user={user} onLogout={handleLogout} onNavigateToProfile={() => setActiveTab('settings')} />
        )}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth relative lg:pb-8 pb-20">
          <div className="max-w-7xl mx-auto space-y-6">
            {maintenance.global && activeTab !== 'admin' && activeTab !== 'settings' && user?.role !== 'admin' ? (
              <div className="h-full flex items-center justify-center">
                <MaintenanceOverlay type="global" />
              </div>
            ) : (
              renderContent()
            )}
          </div>
          <footer className="mt-8 text-center text-sm text-slate-400 pb-4">
            <p>&copy; {new Date().getFullYear()} Regular MEI. Todos os direitos reservados.</p>
          </footer>
          {showIntro && <IntroWalkthrough onFinish={() => setShowIntro(false)} />}
        </main>
      </div>
      <InstallPrompt />
      {externalTransactions.length > 0 && (
        <ExternalTransactionModal transactions={externalTransactions} revenueCats={revenueCats} expenseCats={expenseCats} onClose={handleCloseExternalModal} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onNavigateToCashflow={() => setActiveTab('cashflow')} />
      )}
      {user && user.isSetupComplete && (
        <>
          <VirtualAssistantButton isOpen={isAssistantOpen} onClick={() => setIsAssistantOpen(true)} gifUrl={connectionConfig.assistantGifUrl} iconSizeClass={connectionConfig.assistantIconSize} />
          {isAssistantOpen && (
            <AssistantChat onClose={() => setIsAssistantOpen(false)} onNavigate={setActiveTab} connectionConfig={connectionConfig} />
          )}
        </>
      )}
      {user && (
        <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} userRole={user.role} />
      )}
      {quickAddModalType && (
        <TransactionModal isOpen={!!quickAddModalType} onClose={() => setQuickAddModalType(null)} onSave={handleAddTransaction} revenueCats={revenueCats} expenseCats={expenseCats} editingTransaction={null} forcedType={quickAddModalType} />
      )}
    </div>
  );
};

export default App;