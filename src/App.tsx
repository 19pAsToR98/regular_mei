"use client";

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
import ResetPasswordPage from './components/ResetPasswordPage';
import ServiceFormModal from './components/ServiceFormModal';
import AnnualDeclarationForm from './components/AnnualDeclarationForm';
import { Offer, NewsItem, MaintenanceConfig, User, AppNotification, Transaction, Category, ConnectionConfig, Appointment, FiscalData, PollVote, CNPJResponse } from './types';
import { supabase } from './src/integrations/supabase/client';
import { showSuccess, showError, showLoading, dismissToast, showWarning } from './utils/toastUtils';
import { scheduleTransactionReminder, scheduleAppointmentReminder, deleteScheduledReminder } from './utils/whatsappUtils';

const defaultRevenueCats: Category[] = [
    { name: 'Serviços', icon: 'work' }, { name: 'Vendas', icon: 'shopping_cart' }, { name: 'Produtos', icon: 'inventory_2' }, { name: 'Rendimentos', icon: 'savings' }, { name: 'Outros', icon: 'attach_money' }
];

const defaultExpenseCats: Category[] = [
    { name: 'Impostos', icon: 'account_balance' }, { name: 'Fornecedores', icon: 'local_shipping' }, { name: 'Infraestrutura', icon: 'wifi' }, { name: 'Pessoal', icon: 'groups' }, { name: 'Marketing', icon: 'campaign' }, { name: 'Software', icon: 'computer' }, { name: 'Outros', icon: 'receipt_long' }
];

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isEmbedView, setIsEmbedView] = useState(false);
  const [activeServiceForm, setActiveServiceForm] = useState<string | null>(null);
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedTab = localStorage.getItem('activeTab');
      if (!storedTab || storedTab === 'login' || storedTab === 'auth') return 'home';
      return storedTab;
    }
    return 'home';
  });
  
  const setActiveTab = (tab: string) => { setActiveTabState(tab); localStorage.setItem('activeTab', tab); };
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
  const [maintenance, setMaintenance] = useState<MaintenanceConfig>({ global: false, dashboard: false, cashflow: false, invoices: false, calendar: false, cnpj: false, tools: false, news: false, offers: false });
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig>({
    cnpjApi: { baseUrl: 'https://publica.cnpj.ws/cnpj/', token: '', mappings: [{ key: 'razaoSocial', jsonPath: 'razao_social', label: 'Razão Social', visible: true }, { key: 'nomeFantasia', jsonPath: 'estabelecimento.nome_fantasia', label: 'Nome Fantasia', visible: true }, { key: 'situacao', jsonPath: 'estabelecimento.situacao_cadastral', label: 'Situação Cadastral', visible: true }, { key: 'dataAbertura', jsonPath: 'estabelecimento.data_inicio_atividade', label: 'Data de Abertura', visible: true }, { key: 'cnae', jsonPath: 'estabelecimento.atividade_principal.descricao', label: 'Atividade Principal', visible: true }, { key: 'naturezaJuridica', jsonPath: 'natureza_juridica.descricao', label: 'Natureza Jurídica', visible: true }, { key: 'logradouro', jsonPath: 'estabelecimento.logradouro', label: 'Endereço', visible: true }] },
    diagnosticApi: { webhookUrl: 'https://n8nwebhook.portalmei360.com/webhook/f0f542f0-c91a-4a61-817d-636af20a7024', headerKey: 'cnpj', mappings: [{ key: 'dasList', jsonPath: 'dAS.anos', label: 'Lista de Guias DAS', visible: true }, { key: 'dasnList', jsonPath: 'dASN.anos', label: 'Lista de Declarações (DASN)', visible: true }, { key: 'totalDebt', jsonPath: 'total_divida', label: 'Dívida Total (Calculada)', visible: true }] },
    whatsappApi: { sendTextUrl: 'https://regularmei.uazapi.com/send/text', enabled: true },
    smtp: { host: 'smtp.example.com', port: 587, user: 'admin@regularmei.com', pass: '', secure: true, fromEmail: 'noreply@regularmei.com' },
    ai: { enabled: true },
    assistantWebhookUrl: 'https://n8nauto.portalmei360.com/webhook-test/d5c69353-a50b-471b-b518-919af0ced726',
    assistantGifUrl: undefined,
    assistantIconSize: 'w-12 h-12',
    productRedirectWebhookUrl: 'https://n8nwebhook.portalmei360.com/webhook-test/product-redirect-placeholder',
  });
  const [quickAddModalType, setQuickAddModalType] = useState<'receita' | 'despesa' | null>(null);

  const handleOpenServiceForm = (serviceKey: string) => { setActiveServiceForm(serviceKey); };
  const handleCloseServiceForm = () => { setActiveServiceForm(null); };

  // ... (Funções de carregamento e handlers permanecem iguais)
  const loadMaintenanceConfig = async () => { const { data, error } = await supabase.from('app_config').select('maintenance_config').eq(1).single(); if (!error && data) setMaintenance(data.maintenance_config as MaintenanceConfig); };
  const loadConnectionConfig = async () => { const { data, error } = await supabase.from('app_config').select('connection_config').eq(1).single(); if (!error && data) setConnectionConfig(prev => ({ ...prev, ...(data.connection_config as ConnectionConfig) })); };
  const loadTransactions = async (userId: string) => { const { data, error } = await supabase.from('transactions').select('*, created_at').eq('user_id', userId).order('created_at', { ascending: false }); if (error) return []; const all = data.map((t: any) => ({ id: t.id, description: t.description, category: t.category, type: t.type, amount: parseFloat(t.amount), expectedAmount: t.expected_amount ? parseFloat(t.expected_amount) : undefined, date: t.date, time: t.time, status: t.status, installments: t.installments, isRecurring: t.is_recurring, externalApi: t.external_api || false, createdAt: t.created_at })); setExternalTransactions(all.filter(t => t.externalApi)); return all.filter(t => !t.externalApi); };
  const loadAppointments = async (userId: string) => { const { data, error } = await supabase.from('appointments').select('*').eq('user_id', userId); if (error) return []; return data.map(a => ({ ...a, type: 'compromisso' })); };
  const loadUserCategories = async (userId: string) => { const { data, error } = await supabase.from('user_categories').select('name, icon, type').eq('user_id', userId); if (error) return; const rev: Category[] = []; const exp: Category[] = []; data.forEach(cat => { if (cat.type === 'receita') rev.push({ name: cat.name, icon: cat.icon }); else exp.push({ name: cat.name, icon: cat.icon }); }); setRevenueCats([...defaultRevenueCats, ...rev.filter(c => !defaultRevenueCats.some(d => d.name === c.name))]); setExpenseCats([...defaultExpenseCats, ...exp.filter(c => !defaultExpenseCats.some(d => d.name === c.name))]); };
  const loadNewsAndOffers = async () => { const { data, error } = await supabase.from('news').select('*').order('date', { ascending: false }); if (!error) setNews(data.map(n => ({ id: n.id, category: n.category, title: n.title, excerpt: n.excerpt, content: n.content, date: n.date, imageUrl: n.image_url, readTime: n.read_time, status: n.status, sourceUrl: n.source_url, sourceName: n.source_name }))); };
  const loadNotifications = async (userId?: string) => { const { data: notifData, error: notifError } = await supabase.from('notifications').select(`*, poll_votes:user_notification_interactions(user_id, voted_option_id, voted_at)`).order('created_at', { ascending: false }); if (notifError) return; let userInteractions: Record<number, any> = {}; if (userId) { const { data } = await supabase.from('user_notification_interactions').select('notification_id, is_read, voted_option_id').eq('user_id', userId); data?.forEach(i => { userInteractions[i.notification_id] = i; }); } setNotifications(notifData.map(n => { const interaction = userInteractions[n.id]; return { id: n.id, text: n.text, type: n.type, date: new Date(n.created_at).toLocaleDateString('pt-BR'), pollOptions: n.poll_options?.map((opt: any) => ({ ...opt, votes: (n.poll_votes || []).filter((v: any) => v.voted_option_id === opt.id).length })), active: n.active, expiresAt: n.expires_at, read: interaction?.is_read || false, userVotedOptionId: interaction?.voted_option_id ?? undefined }; })); };
  const loadUserProfile = async (supabaseUser: any) => { setLoadingAuth(true); const { data: profileData, error } = await supabase.from('profiles').select('*').eq('id', supabaseUser.id).single(); if (error) { setUser({ id: supabaseUser.id, name: supabaseUser.email, email: supabaseUser.email, isSetupComplete: false, role: 'user', status: 'active' }); setLoadingAuth(false); return; } const appUser: User = { id: profileData.id, email: supabaseUser.email, name: profileData.name || supabaseUser.email, phone: profileData.phone, cnpj: profileData.cnpj, isSetupComplete: profileData.is_setup_complete, role: profileData.role || 'user', status: profileData.status || 'active', joinedAt: profileData.joined_at, lastActive: profileData.last_active, receiveWeeklySummary: profileData.receive_weekly_summary ?? true, cnpjData: profileData.cnpj_data, fiscalSummary: profileData.fiscal_summary }; setUser(appUser); setCnpj(appUser.cnpj || ''); setFiscalData(appUser.fiscalSummary || null); if (appUser.isSetupComplete) loadAllUserData(appUser.id, appUser.role); else setLoadingAuth(false); };
  const loadAllUserData = async (userId: string, role: string) => { await Promise.all([loadTransactions(userId).then(setTransactions), loadAppointments(userId).then(setAppointments), loadUserCategories(userId), loadNotifications(userId)]); setLoadingAuth(false); };

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('embed') === 'news-slider') { setIsEmbedView(true); setLoadingAuth(false); loadNewsAndOffers(); return; }
        if (params.get('page') === 'news') { setActiveTabState('news'); if (params.get('articleId')) setReadingNewsId(parseInt(params.get('articleId')!)); }
    }
    loadMaintenanceConfig(); loadConnectionConfig();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') { setActiveTab('reset-password'); setLoadingAuth(false); return; }
      if (session?.user) loadUserProfile(session.user);
      else { setUser(null); setLoadingAuth(false); if (activeTab !== 'news' && activeTab !== 'terms' && activeTab !== 'privacy') setActiveTabState('home'); }
    });
    loadNewsAndOffers(); loadNotifications();
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleOnboardingComplete = async (newCnpj: string, theme: 'light' | 'dark', companyName: string, receiveWeeklySummary: boolean, cnpjData: CNPJResponse | null) => { if (!user) return; const now = new Date().toISOString(); const { error } = await supabase.from('profiles').update({ cnpj: newCnpj, name: companyName || user.name, is_setup_complete: true, last_active: now, receive_weekly_summary: receiveWeeklySummary, cnpj_data: cnpjData }).eq('id', user.id); if (!error) { setUser({ ...user, isSetupComplete: true, cnpj: newCnpj, name: companyName || user.name, lastActive: now, receiveWeeklySummary, cnpjData }); setCnpj(newCnpj); if (theme === 'dark') document.documentElement.classList.add('dark'); setShowIntro(true); loadAllUserData(user.id, user.role || 'user'); setActiveTab('dashboard'); } };
  const handleAddTransaction = async (t: Transaction | Transaction[]) => { if (!user) return; const all = Array.isArray(t) ? t : [t]; const { data, error } = await supabase.from('transactions').insert(all.map(tr => ({ user_id: user.id, description: tr.description, category: tr.category, type: tr.type, amount: tr.amount, expected_amount: tr.expectedAmount, date: tr.date, time: tr.time, status: tr.status, installments: tr.installments, is_recurring: tr.isRecurring, external_api: tr.externalApi || false }))).select(); if (!error) setTransactions(prev => [...(data as any[]).map(t => ({ id: t.id, description: t.description, category: t.category, type: t.type, amount: parseFloat(t.amount), expectedAmount: t.expected_amount ? parseFloat(t.expected_amount) : undefined, date: t.date, time: t.time, status: t.status, installments: t.installments, isRecurring: t.is_recurring, externalApi: t.external_api || false, createdAt: t.created_at })), ...prev]); };
  const handleUpdateTransaction = async (t: Transaction) => { if (!user) return; const { error } = await supabase.from('transactions').update({ description: t.description, category: t.category, type: t.type, amount: t.amount, expected_amount: t.expectedAmount, date: t.date, time: t.time, status: t.status, installments: t.installments, is_recurring: t.is_recurring }).eq('id', t.id); if (!error) setTransactions(prev => prev.map(tr => tr.id === t.id ? t : tr)); };
  const handleDeleteTransaction = async (id: number) => { if (!user) return; const { error } = await supabase.from('transactions').delete().eq('id', id); if (!error) setTransactions(prev => prev.filter(tr => tr.id !== id)); };
  const handleAddAppointment = async (a: Appointment) => { if (!user) return; const { data, error } = await supabase.from('appointments').insert({ user_id: user.id, title: a.title, date: a.date, time: a.time, notify: a.notify, type: a.type }).select(); if (!error) setAppointments(prev => [(data as any)[0], ...prev]); };
  const handleUpdateAppointment = async (a: Appointment) => { if (!user) return; const { error } = await supabase.from('appointments').update({ title: a.title, date: a.date, time: a.time, notify: a.notify }).eq('id', a.id); if (!error) setAppointments(prev => prev.map(appt => appt.id === a.id ? a : appt)); };
  const handleDeleteAppointment = async (id: number) => { if (!user) return; const { error } = await supabase.from('appointments').delete().eq('id', id); if (!error) setAppointments(prev => prev.filter(appt => appt.id !== id)); };
  const handleAddCategory = async (type: 'receita' | 'despesa', cat: Category) => { if (!user) return; const { error } = await supabase.from('user_categories').insert({ user_id: user.id, name: cat.name, icon: cat.icon, type }); if (!error) loadUserCategories(user.id); };
  const handleDeleteCategory = async (type: 'receita' | 'despesa', name: string) => { if (!user) return; const { error } = await supabase.from('user_categories').delete().eq('user_id', user.id).eq('name', name).eq('type', type); if (!error) loadUserCategories(user.id); };
  const handleUpdateCnpjData = async (data: CNPJResponse) => { if (!user) return; const { error } = await supabase.from('profiles').update({ cnpj_data: data }).eq('id', user.id); if (!error) setUser({ ...user, cnpjData: data }); };
  const handleUpdateFiscalData = async (data: FiscalData) => { if (!user) return; const { error } = await supabase.from('profiles').update({ fiscal_summary: data }).eq('id', user.id); if (!error) { setFiscalData(data); setUser({ ...user, fiscalSummary: data }); } };

  const dashboardMetrics = useMemo(() => { const today = new Date(); const cMonth = today.getMonth(); const cYear = today.getFullYear(); const todayStr = today.toISOString().split('T')[0]; const relevantTransactions = transactions.filter(t => { const [y, m] = t.date.split('-').map(Number); const tYear = y; const tMonth = m - 1; if (tYear !== cYear) return false; if (dashboardViewMode === 'monthly') { return tMonth === cMonth; } return true; }); const realizedRevenue = relevantTransactions.filter(t => t.type === 'receita' && t.status === 'pago').reduce((acc, t) => acc + (t.amount || 0), 0); const realizedExpense = relevantTransactions.filter(t => t.type === 'despesa' && t.status === 'pago').reduce((acc, t) => acc + (t.amount || 0), 0); const caixaAtual = realizedRevenue - realizedExpense; const pendingTrans = relevantTransactions.filter(t => t.status === 'pendente'); const aReceber = pendingTrans.filter(t => t.type === 'receita').reduce((acc, curr) => acc + (curr.amount || 0), 0); const aPagar = pendingTrans.filter(t => t.type === 'despesa').reduce((acc, curr) => acc + (curr.amount || 0), 0); const totalExpectedRevenue = realizedRevenue + aReceber; const totalExpectedExpense = realizedExpense + aPagar; const caixaProjetado = totalExpectedRevenue - totalExpectedExpense; let emAtraso = 0; let aVencer = 0; pendingTrans.forEach(t => { if (t.date < todayStr) { emAtraso += t.amount || 0; } else { aVencer += t.amount || 0; } }); return { caixaAtual, aReceber, aPagar, caixaProjetado, emAtraso, aVencer, realizedRevenue, realizedExpense, totalExpectedRevenue, totalExpectedExpense, }; }, [transactions, dashboardViewMode]);

  const renderMainContent = () => {
      if (!user) {
          if (activeTab === 'auth') return <AuthPage onLogin={() => {}} onForgotPassword={async () => true} onNavigate={setActiveTab} onBackToLanding={() => setActiveTab('home')} />;
          if (activeTab === 'cnpj-consult') return <CnpjConsultPage onBack={() => setActiveTab('home')} connectionConfig={connectionConfig} />;
          if (activeTab === 'news' || activeTab === 'terms' || activeTab === 'privacy') {
              return (
                  <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
                      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 h-[72px] flex items-center justify-between px-6">
                          <img src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" alt="Regular MEI" className="h-8 w-auto dark:brightness-0 dark:invert" />
                          <button onClick={() => setActiveTab('home')} className="text-sm font-bold text-primary hover:underline flex items-center gap-1"> Voltar <span className="material-icons text-sm">arrow_back</span> </button>
                      </header>
                      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
                          {activeTab === 'terms' ? <TermsPage /> : activeTab === 'privacy' ? <PrivacyPage /> : <NewsPage news={news} readingId={readingNewsId} onSelectNews={setReadingNewsId} />}
                      </main>
                  </div>
              );
          }
          return <LandingPage onGetStarted={() => setActiveTab('auth')} onLogin={() => setActiveTab('auth')} onViewBlog={handleViewNews} onConsultCnpj={() => setActiveTab('cnpj-consult')} news={news} onOpenServiceForm={handleOpenServiceForm} />;
      }
      if (!user.isSetupComplete) return <OnboardingPage user={user} onComplete={handleOnboardingComplete} />;
      
      if (maintenance.global && user.role !== 'admin' && activeTab !== 'settings') return <MaintenanceOverlay type="global" />;
      if (maintenance[activeTab as keyof MaintenanceConfig] && user.role !== 'admin') return <MaintenanceOverlay type="page" />;

      switch (activeTab) {
          case 'dashboard': return (
              <div className="space-y-6">
                  <div className="md:hidden"> <AIAnalysis enabled={connectionConfig.ai.enabled} /> <MobileDashboard transactions={transactions} user={user} appointments={appointments} fiscalData={fiscalData} onNavigate={setActiveTab} /> <RecentTransactions transactions={transactions} onNavigate={setActiveTab} viewMode={dashboardViewMode} /> <NewsSlider news={news} onViewNews={handleViewNews} /> </div>
                  <div className="hidden md:block space-y-6">
                      <div className="flex justify-between items-center"> <DashboardViewSelector viewMode={dashboardViewMode} setViewMode={setDashboardViewMode} /> <div className="flex gap-4"> <button onClick={() => setQuickAddModalType('receita')} className="bg-emerald-500 text-white p-3 rounded-xl font-bold text-sm">Nova Receita</button> <button onClick={() => setQuickAddModalType('despesa')} className="bg-rose-500 text-white p-3 rounded-xl font-bold text-sm">Nova Despesa</button> </div> </div>
                      <DashboardSummaryCards metrics={dashboardMetrics} /> <AIAnalysis enabled={connectionConfig.ai.enabled} />
                      <div className="grid grid-cols-12 gap-6"> <div className="col-span-8"> <RevenueChart transactions={transactions} globalViewMode={dashboardViewMode} /> </div> <div className="col-span-4"> <Reminders transactions={transactions} appointments={appointments} fiscalData={fiscalData} onNavigate={setActiveTab} /> </div> </div>
                      <div className="grid grid-cols-12 gap-6"> <div className="col-span-4"> <FinancialScore transactions={transactions} viewMode={dashboardViewMode} /> </div> <div className="col-span-4"> <Thermometer transactions={transactions} /> </div> <div className="col-span-4"> <BalanceForecastCard transactions={transactions} viewMode={dashboardViewMode} /> </div> </div>
                      <RecentTransactions transactions={transactions} onNavigate={setActiveTab} viewMode={dashboardViewMode} /> <NewsSlider news={news} onViewNews={handleViewNews} />
                  </div>
              </div>
          );
          case 'cashflow': return <CashFlowPage transactions={transactions} revenueCats={revenueCats} expenseCats={expenseCats} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onDeleteTransactionSeries={() => {}} />;
          case 'cnpj': return <CNPJPage cnpj={cnpj} fiscalData={fiscalData} onUpdateFiscalData={handleUpdateFiscalData} onUpdateCnpjData={handleUpdateCnpjData} connectionConfig={connectionConfig} cnpjData={user.cnpjData} onOpenServiceForm={handleOpenServiceForm} />;
          case 'calendar': return <CalendarPage transactions={transactions} appointments={appointments} revenueCats={revenueCats} expenseCats={expenseCats} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onAddAppointment={handleAddAppointment} onUpdateAppointment={handleUpdateAppointment} onDeleteAppointment={handleDeleteAppointment} userId={user.id} />;
          case 'tools': return <ToolsPage user={user} />;
          case 'news': return <NewsPage news={news} readingId={readingNewsId} onSelectNews={setReadingNewsId} />;
          case 'offers': return <ProductsByCnaePage user={user} productRedirectWebhookUrl={connectionConfig.productRedirectWebhookUrl} />;
          case 'settings': return <SettingsPage user={user} onUpdateUser={handleUpdateUser} onUpdateUserPhone={handleUpdateUserPhone} onUpdateUserEmail={handleUpdateUserEmail} cnpj={cnpj} onCnpjChange={setCnpj} revenueCats={revenueCats} expenseCats={expenseCats} onAddCategory={handleAddCategory} onDeleteCategory={handleDeleteCategory} onExportData={() => {}} onDeleteAccount={async () => {}} onChangePassword={handleChangePassword} />;
          case 'admin': return <AdminPage offers={[]} onAddOffer={() => {}} onUpdateOffer={() => {}} onDeleteOffer={() => {}} news={news} onAddNews={handleAddNews} onUpdateNews={handleUpdateNews} onDeleteNews={handleDeleteNewsClick} notifications={notifications} onAddNotification={handleAddNotification} onUpdateNotification={handleUpdateNotification} onDeleteNotification={handleDeleteNotification} maintenance={maintenance} onUpdateMaintenance={handleUpdateMaintenance} connectionConfig={connectionConfig} onUpdateConnectionConfig={handleUpdateConnectionConfig} users={allUsers} onAddUser={() => {}} onUpdateUser={() => {}} onDeleteUser={() => {}} />;
          case 'more': return <MorePage onNavigate={setActiveTab} userRole={user.role} />;
          default: return null;
      }
  };

  if (loadingAuth) return <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark"> <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div> </div>;
  if (isEmbedView) return <div className="w-full h-full bg-background-light dark:bg-background-dark p-4"> <NewsSlider news={news} onViewNews={handleViewNews} /> </div>;
  if (activeTab === 'reset-password') return <ResetPasswordPage onComplete={() => setActiveTab('dashboard')} />;

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden relative">
      {user && user.isSetupComplete && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={false} toggleSidebar={() => {}} userRole={user.role} />}
      <div className="flex-1 flex flex-col overflow-hidden">
        {user && user.isSetupComplete && <Header activeTab={activeTab} onMenuClick={() => {}} notifications={notifications} onMarkAsRead={handleMarkAsRead} onVote={handleVote} user={user} onLogout={handleLogout} onNavigateToProfile={() => setActiveTab('settings')} />}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth relative lg:pb-8 pb-20">
          <div className="max-w-7xl mx-auto"> {renderMainContent()} </div>
          <footer className="mt-8 text-center text-sm text-slate-400 pb-4"> <p>&copy; {new Date().getFullYear()} Regular MEI. Todos os direitos reservados.</p> </footer>
          {showIntro && <IntroWalkthrough onFinish={() => setShowIntro(false)} />}
        </main>
      </div>
      <InstallPrompt />
      {user && user.isSetupComplete && ( <> <VirtualAssistantButton isOpen={isAssistantOpen} onClick={() => setIsAssistantOpen(true)} gifUrl={connectionConfig.assistantGifUrl} iconSizeClass={connectionConfig.assistantIconSize} /> {isAssistantOpen && <AssistantChat onClose={() => setIsAssistantOpen(false)} onNavigate={setActiveTab} connectionConfig={connectionConfig} />} <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} userRole={user.role} /> </> )}
      {quickAddModalType && <TransactionModal isOpen={!!quickAddModalType} onClose={() => setQuickAddModalType(null)} onSave={handleAddTransaction} revenueCats={revenueCats} expenseCats={expenseCats} editingTransaction={null} forcedType={quickAddModalType} />}
      
      {/* MODAL DE SERVIÇOS NATIVOS - AGORA FORA DE QUALQUER CONDICIONAL DE RENDERIZAÇÃO */}
      <ServiceFormModal 
        isOpen={!!activeServiceForm} 
        onClose={handleCloseServiceForm}
        title={activeServiceForm === 'declaracao' ? 'Declaração Anual' : 'Serviço'}
      >
        {activeServiceForm === 'declaracao' && (
            <AnnualDeclarationForm 
                initialCnpj={cnpj} 
                onSuccess={handleCloseServiceForm} 
            />
        )}
      </ServiceFormModal>
    </div>
  );
};

export default App;