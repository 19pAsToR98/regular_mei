import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { Offer, NewsItem, MaintenanceConfig, User, AppNotification, Transaction, Category, ConnectionConfig, Appointment, FiscalData, PollVote, CNPJResponse } from './types';
import { supabase } from './src/integrations/supabase/client';
import { showSuccess, showError, showLoading, dismissToast, showWarning } from './utils/toastUtils';
import { scheduleTransactionReminder, scheduleAppointmentReminder, deleteScheduledReminder } from './utils/whatsappUtils';

const defaultRevenueCats: Category[] = [
    { name: 'Serviços', icon: 'work' },
    { name: 'Vendas', icon: 'shopping_cart' },
    { name: 'Produtos', icon: 'inventory_2' },
    { name: 'Rendimentos', icon: 'savings' },
    { name: 'Outros', icon: 'attach_money' }
];

const defaultExpenseCats: Category[] = [
    { name: 'Impostos', icon: 'account_balance' },
    { name: 'Fornecedores', icon: 'local_shipping' },
    { name: 'Infraestrutura', icon: 'wifi' },
    { name: 'Pessoal', icon: 'groups' },
    { name: 'Marketing', icon: 'campaign' },
    { name: 'Software', icon: 'computer' },
    { name: 'Outros', icon: 'receipt_long' }
];

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isEmbedView, setIsEmbedView] = useState(false);

  const userRef = useRef(user);
  useEffect(() => {
      userRef.current = user;
  }, [user]);

  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedTab = localStorage.getItem('activeTab');
      if (!storedTab || storedTab === 'login' || storedTab === 'auth' || storedTab === 'home') return 'home';
      return storedTab;
    }
    return 'home';
  });
  
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    localStorage.setItem('activeTab', tab);
  };
  
  const [dashboardViewMode, setDashboardViewMode] = useState<'monthly' | 'annual'>('monthly');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [cnpj, setCnpj] = useState('');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [readingNewsId, setReadingNewsId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [fiscalData, setFiscalData] = useState<FiscalData | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]); 
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [externalTransactions, setExternalTransactions] = useState<Transaction[]>([]);
  const [revenueCats, setRevenueCats] = useState<Category[]>(defaultRevenueCats);
  const [expenseCats, setExpenseCats] = useState<Category[]>(defaultExpenseCats);

  const [maintenance, setMaintenance] = useState<MaintenanceConfig>({
    global: false, dashboard: false, cashflow: false, invoices: false, calendar: false, cnpj: false, tools: false, news: false, offers: false
  });
  
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig>({
    cnpjApi: { baseUrl: 'https://publica.cnpj.ws/cnpj/', token: '', mappings: [] },
    diagnosticApi: { webhookUrl: '', mappings: [] },
    whatsappApi: { sendTextUrl: '', enabled: true },
    smtp: { host: '', port: 587, user: '', pass: '', secure: true, fromEmail: '' },
    ai: { enabled: true },
    assistantWebhookUrl: '',
    productRedirectWebhookUrl: '',
  });
  
  const [quickAddModalType, setQuickAddModalType] = useState<'receita' | 'despesa' | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);

  const loadMaintenanceConfig = async () => {
      const { data, error } = await supabase.from('app_config').select('maintenance_config').eq('id', 1).single();
      if (!error && data?.maintenance_config) setMaintenance(data.maintenance_config as MaintenanceConfig);
  };

  const handleUpdateMaintenance = async (config: MaintenanceConfig) => {
      if (user?.role === 'admin') {
          const { error } = await supabase.from('app_config').update({ maintenance_config: config }).eq('id', 1);
          if (!error) { setMaintenance(config); showSuccess('Manutenção atualizada!'); }
      }
  };
  
  const loadConnectionConfig = async () => {
      const { data, error } = await supabase.from('app_config').select('connection_config').eq('id', 1).single();
      if (!error && data?.connection_config) setConnectionConfig(prev => ({ ...prev, ...(data.connection_config as ConnectionConfig) }));
  };
  
  const handleUpdateConnectionConfig = async (config: ConnectionConfig) => {
      if (user?.role === 'admin') {
          const { error } = await supabase.from('app_config').update({ connection_config: config }).eq('id', 1);
          if (!error) { setConnectionConfig(config); showSuccess('Conexões atualizadas!'); }
      }
  };

  const loadAllUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('joined_at', { ascending: false });
      if (!error) setAllUsers(data.map(p => ({ id: p.id, name: p.name || p.email, email: p.email, phone: p.phone, cnpj: p.cnpj, isSetupComplete: p.is_setup_complete, role: p.role as any, status: p.status as any, joinedAt: p.joined_at, lastActive: p.last_active, receiveWeeklySummary: p.receive_weekly_summary ?? true, cnpjData: p.cnpj_data, fiscalSummary: p.fiscal_summary })));
  };

  const loadTransactions = async (userId: string) => {
    const { data, error } = await supabase.from('transactions').select('*, created_at').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) return [];
    const all = data.map((t: any) => ({ id: t.id, description: t.description, category: t.category, type: t.type as any, amount: parseFloat(t.amount as any), expectedAmount: t.expected_amount ? parseFloat(t.expected_amount as any) : undefined, date: t.date, time: t.time, status: t.status as any, installments: t.installments, isRecurring: t.is_recurring, externalApi: t.external_api || false, createdAt: t.created_at }));
    setExternalTransactions(all.filter(t => t.externalApi));
    return all.filter(t => !t.externalApi);
  };

  const loadAppointments = async (userId: string) => {
    const { data, error } = await supabase.from('appointments').select('*').eq('user_id', userId).order('date', { ascending: true });
    if (error) return [];
    return data.map(a => ({ ...a, id: a.id, notify: a.notify || false, type: 'compromisso' as const }));
  };
  
  const loadUserCategories = async (userId: string) => {
      const { data, error } = await supabase.from('user_categories').select('name, icon, type').eq('user_id', userId);
      if (error) { setRevenueCats(defaultRevenueCats); setExpenseCats(defaultExpenseCats); return; }
      const customRevenue = data.filter(c => c.type === 'receita').map(c => ({ name: c.name, icon: c.icon }));
      const customExpense = data.filter(c => c.type === 'despesa').map(c => ({ name: c.name, icon: c.icon }));
      setRevenueCats([...defaultRevenueCats, ...customRevenue.filter(c => !defaultRevenueCats.some(d => d.name === c.name))]);
      setExpenseCats([...defaultExpenseCats, ...customExpense.filter(c => !defaultExpenseCats.some(d => d.name === c.name))]);
  };

  const loadNewsAndOffers = async () => {
    const { data, error } = await supabase.from('news').select('*').order('date', { ascending: false });
    if (!error) setNews(data.map(n => ({ id: n.id, category: n.category, title: n.title, excerpt: n.excerpt, content: n.content, date: n.date, imageUrl: n.image_url, readTime: n.read_time, status: n.status as any, sourceUrl: n.source_url, sourceName: n.source_name })));
  };

  const loadNotifications = async (userId?: string) => {
    const { data: notifData, error: notifError } = await supabase.from('notifications').select(`*, poll_votes:user_notification_interactions(user_id, voted_option_id, voted_at)`).order('created_at', { ascending: false });
    if (notifError) return;
    let userInteractions: Record<number, { is_read: boolean, voted_option_id: number | null }> = {};
    if (userId) {
        const { data } = await supabase.from('user_notification_interactions').select('notification_id, is_read, voted_option_id').eq('user_id', userId);
        data?.forEach(i => { userInteractions[i.notification_id] = { is_read: i.is_read, voted_option_id: i.voted_option_id }; });
    }
    setNotifications(notifData.map(n => {
        const interaction = userInteractions[n.id];
        const pollVotes = (n.poll_votes || []).map((v: any) => ({ userId: v.user_id, optionId: v.voted_option_id, votedAt: v.voted_at, userName: 'N/A', userEmail: 'N/A', optionText: n.poll_options?.find((opt: any) => opt.id === v.voted_option_id)?.text || 'N/A' }));
        return { id: n.id, text: n.text, type: n.type as any, date: new Date(n.created_at).toLocaleDateString('pt-BR'), pollOptions: n.poll_options?.map((opt: any) => ({ ...opt, votes: pollVotes.filter(v => v.optionId === opt.id).length })), pollVotes, active: n.active, expiresAt: n.expires_at, read: interaction?.is_read || false, userVotedOptionId: interaction?.voted_option_id ?? undefined };
    }));
  };
  
  const updateLastActive = async (userId: string) => {
    const now = new Date().toISOString();
    await supabase.from('profiles').update({ last_active: now }).eq('id', userId);
    setUser(prev => prev?.id === userId ? { ...prev, lastActive: now } : prev);
  };
  
  const loadAllUserData = async (userId: string, userRole: 'admin' | 'user') => {
    setLoadingAuth(true);
    await Promise.all([loadTransactions(userId).then(setTransactions), loadAppointments(userId).then(setAppointments), loadUserCategories(userId), loadNotifications(userId), ...(userRole === 'admin' ? [loadAllUsers()] : [])]);
    setLoadingAuth(false);
  };

  const loadUserProfile = async (supabaseUser: any) => {
    if (userRef.current?.id === supabaseUser.id && userRef.current.isSetupComplete) { setLoadingAuth(false); return; }
    setLoadingAuth(true);
    const { data: profileData, error } = await supabase.from('profiles').select('*').eq('id', supabaseUser.id).single();
    if (error) { setUser({ id: supabaseUser.id, name: supabaseUser.email || 'Usuário', email: supabaseUser.email, isSetupComplete: false, role: 'user', status: 'active' }); setLoadingAuth(false); return; }
    const appUser: User = { id: profileData.id, email: supabaseUser.email, name: profileData.name || supabaseUser.email, phone: profileData.phone, cnpj: profileData.cnpj, isSetupComplete: profileData.is_setup_complete, role: (profileData.role || 'user') as any, status: profileData.status as any, joinedAt: profileData.joined_at, lastActive: profileData.last_active, receiveWeeklySummary: profileData.receive_weekly_summary ?? true, cnpjData: profileData.cnpj_data, fiscalSummary: profileData.fiscal_summary };
    setUser(appUser); setCnpj(appUser.cnpj || ''); setFiscalData(appUser.fiscalSummary || null);
    if (appUser.isSetupComplete) loadAllUserData(appUser.id, appUser.role || 'user'); else setLoadingAuth(false);
  };

  const dashboardMetrics = useMemo(() => {
    const today = new Date();
    const cMonth = today.getMonth();
    const cYear = today.getFullYear();
    const todayStr = today.toISOString().split('T')[0];
    const relevant = transactions.filter(t => {
        const [y, m] = t.date.split('-').map(Number);
        if (y !== cYear) return false;
        return dashboardViewMode === 'monthly' ? (m - 1) === cMonth : true;
    });
    const realizedRevenue = relevant.filter(t => t.type === 'receita' && t.status === 'pago').reduce((acc, t) => acc + (t.amount || 0), 0);
    const realizedExpense = relevant.filter(t => t.type === 'despesa' && t.status === 'pago').reduce((acc, t) => acc + (t.amount || 0), 0);
    const pending = relevant.filter(t => t.status === 'pendente');
    const aReceber = pending.filter(t => t.type === 'receita').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const aPagar = pending.filter(t => t.type === 'despesa').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    let emAtraso = 0, aVencer = 0;
    pending.forEach(t => { if (t.date < todayStr) emAtraso += t.amount || 0; else aVencer += t.amount || 0; });
    return { caixaAtual: realizedRevenue - realizedExpense, aReceber, aPagar, caixaProjetado: (realizedRevenue + aReceber) - (realizedExpense + aPagar), emAtraso, aVencer, realizedRevenue, realizedExpense, totalExpectedRevenue: realizedRevenue + aReceber, totalExpectedExpense: realizedExpense + aPagar };
  }, [transactions, dashboardViewMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('embed') === 'news-slider') { setIsEmbedView(true); setLoadingAuth(false); loadNewsAndOffers(); loadConnectionConfig(); return; }
        if (params.get('page') === 'news') { setActiveTabState('news'); const id = params.get('articleId'); if (id) setReadingNewsId(parseInt(id)); setLoadingAuth(false); loadNewsAndOffers(); loadConnectionConfig(); return; }
    }
    loadMaintenanceConfig();
    loadConnectionConfig();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) loadUserProfile(session.user);
      else if (event === 'SIGNED_OUT') { setUser(null); setLoadingAuth(false); localStorage.removeItem('activeTab'); setActiveTabState('home'); }
      else if (event === 'INITIAL_SESSION') { if (session?.user) loadUserProfile(session.user); else setLoadingAuth(false); }
    });
    loadNewsAndOffers();
    loadNotifications();
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleOnboardingComplete = async (newCnpj: string, theme: 'light' | 'dark', companyName: string, receiveWeeklySummary: boolean, cnpjData: CNPJResponse | null) => {
      if (!user) return;
      const now = new Date().toISOString();
      const { error } = await supabase.from('profiles').update({ cnpj: newCnpj, name: companyName || user.name, is_setup_complete: true, last_active: now, receive_weekly_summary: receiveWeeklySummary, cnpj_data: cnpjData }).eq('id', user.id);
      if (error) { showError('Erro ao salvar dados.'); return; }
      const updated: User = { ...user, isSetupComplete: true, cnpj: newCnpj, name: companyName || user.name, lastActive: now, receiveWeeklySummary, cnpjData };
      setCnpj(newCnpj); setUser(updated);
      if (theme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
      setShowIntro(true); loadAllUserData(user.id, updated.role || 'user'); setActiveTab('dashboard');
  }
  
  const handleViewNews = (id: number | undefined) => {
    if (isEmbedView) { const url = `${window.location.origin}/?page=news&articleId=${id}`; if (window.top) window.top.location.href = url; else window.location.href = url; return; }
    setReadingNewsId(id || null); setActiveTab('news');
  };

  const handleUpdateUser = async (updatedUser: User) => {
      const { error } = await supabase.from('profiles').update({ name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone, cnpj: updatedUser.cnpj, role: updatedUser.role, status: updatedUser.status, receive_weekly_summary: updatedUser.receiveWeeklySummary, cnpj_data: updatedUser.cnpjData, fiscal_summary: updatedUser.fiscalSummary }).eq('id', updatedUser.id);
      if (!error) { setAllUsers(allUsers.map(u => u.id === updatedUser.id ? updatedUser : u)); if (user?.id === updatedUser.id) setUser(updatedUser); showSuccess('Perfil atualizado!'); }
  };
  
  const handleUpdateUserPhone = async (userId: string, newPhone: string) => {
      const clean = newPhone.replace(/[^\d]/g, '');
      if (clean.length < 10) return { success: false, error: "Telefone inválido." };
      const { data } = await supabase.from('profiles').select('id').eq('phone', clean).neq('id', userId).maybeSingle();
      if (data) return { success: false, error: 'Telefone já cadastrado.' };
      const { error } = await supabase.from('profiles').update({ phone: clean }).eq('id', userId);
      if (!error) setUser(prev => prev?.id === userId ? { ...prev, phone: clean } : prev);
      return { success: !error };
  };
  
  const handleUpdateUserEmail = async (newEmail: string) => {
      if (!user) return { success: false };
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      return { success: !error, error: error?.message };
  };

  const handleAddTransaction = async (t: Transaction | Transaction[]) => {
    if (!user) return;
    const list = Array.isArray(t) ? t : [t];
    const { data, error } = await supabase.from('transactions').insert(list.map(tr => ({ user_id: user.id, description: tr.description, category: tr.category, type: tr.type, amount: tr.amount, expected_amount: tr.expectedAmount, date: tr.date, time: tr.time, status: tr.status, installments: tr.installments, is_recurring: tr.isRecurring, external_api: tr.externalApi || false }))).select();
    if (!error) {
        const added = (data as any[]).map(t => ({ id: t.id, description: t.description, category: t.category, type: t.type as any, amount: parseFloat(t.amount as any), expectedAmount: t.expected_amount ? parseFloat(t.expected_amount as any) : undefined, date: t.date, time: t.time, status: t.status as any, installments: t.installments, is_recurring: t.is_recurring, externalApi: t.external_api || false, createdAt: t.created_at }));
        setTransactions(prev => [...added, ...prev]);
        if (added.length === 1 && added[0].status === 'pendente') scheduleTransactionReminder(user.id, added[0]);
        showSuccess('Transação adicionada!');
    }
  };

  const handleUpdateTransaction = async (t: Transaction) => {
    if (!user) return;
    const { error } = await supabase.from('transactions').update({ description: t.description, category: t.category, type: t.type, amount: t.amount, expected_amount: t.expectedAmount, date: t.date, time: t.time, status: t.status, installments: t.installments, is_recurring: t.isRecurring, external_api: t.external_api || false }).eq('id', t.id).eq('user_id', user.id);
    if (!error) { setTransactions(prev => prev.map(tr => tr.id === t.id ? t : tr)); showSuccess('Atualizado!'); }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!user) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);
    if (!error) { setTransactions(prev => prev.filter(tr => tr.id !== id)); showSuccess('Excluído!'); }
  };

  const handleMarkAsRead = async (id: number) => {
      if (!user) return;
      const { error } = await supabase.from('user_notification_interactions').upsert({ user_id: user.id, notification_id: id, is_read: true }, { onConflict: 'user_id,notification_id' });
      if (!error) setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleVote = async (notificationId: number, optionId: number) => {
      if (!user) return;
      const { error } = await supabase.from('user_notification_interactions').upsert({ user_id: user.id, notification_id: notificationId, voted_option_id: optionId, voted_at: new Date().toISOString() }, { onConflict: 'user_id,notification_id' });
      if (!error) {
          setNotifications(prev => prev.map(n => {
              if (n.id === notificationId) {
                  const newOptions = n.pollOptions?.map(opt => opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt);
                  return { ...n, pollOptions: newOptions, userVotedOptionId: optionId };
              }
              return n;
          }));
          showSuccess('Voto registrado!');
      }
  };

  const handleAddCategory = async (type: 'receita' | 'despesa', cat: Category) => {
      if (!user) return;
      const { error } = await supabase.from('user_categories').insert({ user_id: user.id, name: cat.name, icon: cat.icon, type });
      if (!error) {
          if (type === 'receita') setRevenueCats(prev => [...prev, cat]);
          else setExpenseCats(prev => [...prev, cat]);
          showSuccess('Categoria adicionada!');
      }
  };

  const handleDeleteCategory = async (type: 'receita' | 'despesa', name: string) => {
      if (!user) return;
      const { error } = await supabase.from('user_categories').delete().eq('user_id', user.id).eq('name', name).eq('type', type);
      if (!error) {
          if (type === 'receita') setRevenueCats(prev => prev.filter(c => c.name !== name));
          else setExpenseCats(prev => prev.filter(c => c.name !== name));
          showSuccess('Categoria removida!');
      }
  };

  const renderContent = () => {
      if (activeTab === 'admin' && user?.role !== 'admin') return <div className="p-8 text-center">Acesso Negado</div>;
      if (isPageInMaintenance(activeTab)) return <MaintenanceOverlay type="page" />;

      switch (activeTab) {
          case 'dashboard':
              return (
                <div className="lg:space-y-6">
                    {/* Mobile View */}
                    <div className="lg:hidden">
                        <MobileDashboard transactions={transactions} user={user} appointments={appointments} fiscalData={fiscalData} onNavigate={setActiveTab} />
                    </div>
                    {/* Desktop View */}
                    <div className="hidden lg:block space-y-6">
                        <div className="flex justify-between items-center gap-4">
                            <DashboardViewSelector viewMode={dashboardViewMode} setViewMode={setDashboardViewMode} />
                            <div className="flex gap-4">
                                <button onClick={() => setQuickAddModalType('receita')} className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-xl flex items-center gap-2 font-bold text-sm"><span className="material-icons">arrow_upward</span> Nova Receita</button>
                                <button onClick={() => setQuickAddModalType('despesa')} className="bg-rose-500 hover:bg-rose-600 text-white p-3 rounded-xl flex items-center gap-2 font-bold text-sm"><span className="material-icons">arrow_downward</span> Nova Despesa</button>
                            </div>
                        </div>
                        <DashboardSummaryCards metrics={dashboardMetrics} />
                        {connectionConfig.ai.enabled && <AIAnalysis enabled={true} />}
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-8"><RevenueChart transactions={transactions} globalViewMode={dashboardViewMode} /></div>
                            <div className="col-span-4"><Reminders transactions={transactions} appointments={appointments} fiscalData={fiscalData} onNavigate={setActiveTab} /></div>
                        </div>
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-4"><FinancialScore transactions={transactions} viewMode={dashboardViewMode} /></div>
                            <div className="col-span-4"><Thermometer transactions={transactions} /></div>
                            <div className="col-span-4"><BalanceForecastCard transactions={transactions} viewMode={dashboardViewMode} /></div>
                        </div>
                        <RecentTransactions transactions={transactions} onNavigate={setActiveTab} viewMode={dashboardViewMode} />
                        <NewsSlider news={news} onViewNews={handleViewNews} />
                    </div>
                </div>
              );
          case 'cashflow': return <CashFlowPage transactions={transactions} revenueCats={revenueCats} expenseCats={expenseCats} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onDeleteTransactionSeries={() => {}} />;
          case 'invoices': return <InvoicesPage />;
          case 'calendar': return <CalendarPage transactions={transactions} appointments={appointments} revenueCats={revenueCats} expenseCats={expenseCats} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onAddAppointment={() => {}} onUpdateAppointment={() => {}} onDeleteAppointment={() => {}} userId={user!.id} />;
          case 'cnpj': return <CNPJPage cnpj={cnpj} fiscalData={fiscalData} onUpdateFiscalData={setFiscalData} onUpdateCnpjData={() => {}} connectionConfig={connectionConfig} cnpjData={user?.cnpjData} />;
          case 'tools': return <ToolsPage user={user} />;
          case 'news': return <NewsPage news={news} readingId={readingNewsId} onSelectNews={setReadingNewsId} />;
          case 'offers': return <ProductsByCnaePage user={user!} productRedirectWebhookUrl={connectionConfig.productRedirectWebhookUrl} />;
          case 'settings': return <SettingsPage user={user} onUpdateUser={handleUpdateUser} onUpdateUserPhone={handleUpdateUserPhone} onUpdateUserEmail={handleUpdateUserEmail} cnpj={cnpj} onCnpjChange={setCnpj} revenueCats={revenueCats} expenseCats={expenseCats} onAddCategory={handleAddCategory} onDeleteCategory={handleDeleteCategory} />;
          case 'more': return <MorePage onNavigate={setActiveTab} userRole={user?.role} />;
          case 'terms': return <TermsPage />;
          case 'privacy': return <PrivacyPage />;
          default: return null;
      }
  };

  const isPageInMaintenance = (page: string) => { if (user?.role === 'admin') return false; if (maintenance.global && page !== 'admin' && page !== 'settings') return true; return maintenance[page as keyof MaintenanceConfig] || false; };

  if (loadingAuth) return <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  if (!user && activeTab === 'home') return <LandingPage onGetStarted={() => setActiveTab('auth')} onLogin={() => setActiveTab('auth')} onViewBlog={handleViewNews} onConsultCnpj={() => setActiveTab('cnpj_consult')} news={news} />;
  if (!user && activeTab === 'cnpj_consult') return <CnpjConsultPage onBack={() => setActiveTab('home')} connectionConfig={connectionConfig} />;
  if (!user) return <AuthPage onLogin={() => {}} onForgotPassword={async () => true} onNavigate={setActiveTab} onBackToLanding={() => setActiveTab('home')} />;
  if (user && !user.isSetupComplete) return <OnboardingPage onComplete={handleOnboardingComplete} />;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      {user && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={false} toggleSidebar={() => {}} userRole={user?.role} />}
      <div className="flex-1 flex flex-col overflow-hidden">
        {user && <Header activeTab={activeTab} onMenuClick={() => {}} notifications={notifications} onMarkAsRead={handleMarkAsRead} onVote={handleVote} user={user} onLogout={() => supabase.auth.signOut()} onNavigateToProfile={() => setActiveTab('settings')} />}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:pb-8 pb-24 relative">
          <div className="max-w-7xl mx-auto">
            {maintenance.global && activeTab !== 'admin' && activeTab !== 'settings' && user?.role !== 'admin' ? <div className="h-full flex items-center justify-center"><MaintenanceOverlay type="global" /></div> : renderContent()}
          </div>
          {showIntro && <IntroWalkthrough onFinish={() => setShowIntro(false)} />}
        </main>
      </div>
      <InstallPrompt />
      {user && user.isSetupComplete && (
          <>
              <VirtualAssistantButton isOpen={isAssistantOpen} onClick={() => setIsAssistantOpen(true)} gifUrl={connectionConfig.assistantGifUrl} iconSizeClass={connectionConfig.assistantIconSize} />
              {isAssistantOpen && <AssistantChat onClose={() => setIsAssistantOpen(false)} onNavigate={setActiveTab} connectionConfig={connectionConfig} />}
              <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} userRole={user.role} />
          </>
      )}
      {quickAddModalType && <TransactionModal isOpen={!!quickAddModalType} onClose={() => setQuickAddModalType(null)} onSave={handleAddTransaction} revenueCats={revenueCats} expenseCats={expenseCats} forcedType={quickAddModalType} />}
    </div>
  );
};

export default App;