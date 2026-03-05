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
import ResetPasswordPage from './components/ResetPasswordPage'; // NOVO IMPORT
import { Offer, NewsItem, MaintenanceConfig, User, AppNotification, Transaction, Category, ConnectionConfig, Appointment, FiscalData, PollVote, CNPJResponse } from './types';
import { supabase } from './src/integrations/supabase/client';
import { showSuccess, showError, showLoading, dismissToast, showWarning } from './utils/toastUtils';
import { scheduleTransactionReminder, scheduleAppointmentReminder, deleteScheduledReminder } from './utils/whatsappUtils';

// --- CATEGORIAS PADRÃO ---
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
  // --- INTRO STATE ---
  const [showIntro, setShowIntro] = useState(false);
  
  // --- AUTH STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isEmbedView, setIsEmbedView] = useState(false);

  // Ref to hold the current user state to avoid stale closures in the auth listener
  const userRef = useRef(user);
  useEffect(() => {
      userRef.current = user;
  }, [user]);

  // Initialize activeTab from localStorage or default to 'home'
  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedTab = localStorage.getItem('activeTab');
      if (!storedTab || storedTab === 'login' || storedTab === 'auth') {
          return 'home';
      }
      return storedTab;
    }
    return 'home';
  });
  
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    localStorage.setItem('activeTab', tab);
  };
  
  // --- DASHBOARD VIEW MODE STATE ---
  const [dashboardViewMode, setDashboardViewMode] = useState<'monthly' | 'annual'>('monthly');

  // --- ASSISTANT STATE ---
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  
  // --- APP STATE ---
  const [cnpj, setCnpj] = useState('');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [readingNewsId, setReadingNewsId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // --- FISCAL DATA STATE (Lifted) ---
  const [fiscalData, setFiscalData] = useState<FiscalData | null>(null);

  // --- USER MANAGEMENT STATE (Used for Admin view) ---
  const [allUsers, setAllUsers] = useState<User[]>([]); 

  // --- CASH FLOW & APPOINTMENT STATE ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [externalTransactions, setExternalTransactions] = useState<Transaction[]>([]);

  // --- CATEGORY STATE (Now includes default + user custom) ---
  const [revenueCats, setRevenueCats] = useState<Category[]>(defaultRevenueCats);
  const [expenseCats, setExpenseCats] = useState<Category[]>(defaultExpenseCats);

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
    whatsappApi: {
        sendTextUrl: 'https://regularmei.uazapi.com/send/text',
        enabled: true,
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
    },
    assistantWebhookUrl: 'https://n8nauto.portalmei360.com/webhook-test/d5c69353-a50b-471b-b518-919af0ced726',
    assistantGifUrl: undefined,
    assistantIconSize: 'w-12 h-12',
    productRedirectWebhookUrl: 'https://n8nwebhook.portalmei360.com/webhook-test/product-redirect-placeholder',
  });
  
  // --- QUICK ADD MODAL STATE ---
  const [quickAddModalType, setQuickAddModalType] = useState<'receita' | 'despesa' | null>(null);
  
  // --- OFFERS STATE (REMOVIDO) ---
  const [offers, setOffers] = useState<Offer[]>([]);

  // --- DATA FETCHING FUNCTIONS ---

  const loadMaintenanceConfig = async () => {
      const { data, error } = await supabase
          .from('app_config')
          .select('maintenance_config')
          .eq('id', 1)
          .single();

      if (error) {
          console.error('Error fetching maintenance config:', error);
          return;
      }
      
      if (data && data.maintenance_config) {
          setMaintenance(data.maintenance_config as MaintenanceConfig);
      }
  };

  const handleUpdateMaintenance = async (config: MaintenanceConfig) => {
      if (user?.role === 'admin') {
          const { error } = await supabase
              .from('app_config')
              .update({ maintenance_config: config })
              .eq('id', 1);

          if (error) {
              console.error('Error updating maintenance config:', error);
              showError('Erro ao salvar configuração de manutenção.');
              return;
          }
          
          setMaintenance(config);
          showSuccess('Configuração de manutenção atualizada!');
      } else {
          showError('Apenas administradores podem alterar a manutenção.');
      }
  };
  
  const loadConnectionConfig = async () => {
      const { data, error } = await supabase
          .from('app_config')
          .select('connection_config')
          .eq('id', 1)
          .single();

      if (error) {
          console.error('Error fetching connection config:', error);
          return;
      }
      
      if (data && data.connection_config) {
          setConnectionConfig(prev => ({
              ...prev,
              ...(data.connection_config as ConnectionConfig),
          }));
      }
  };
  
  const handleUpdateConnectionConfig = async (config: ConnectionConfig) => {
      if (user?.role === 'admin') {
          const { error } = await supabase
              .from('app_config')
              .update({ connection_config: config })
              .eq('id', 1);

          if (error) {
              console.error('Error updating connection config:', error);
              showError('Erro ao salvar configuração de conexões.');
              return;
          }
          
          setConnectionConfig(config);
          showSuccess('Configuração de conexões atualizada!');
      } else {
          showError('Apenas administradores podem alterar as conexões.');
      }
  };


  const loadAllUsers = async () => {
      const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('joined_at', { ascending: false });

      if (error) {
          console.error('Error fetching all users:', error);
          return;
      }
      
      const mappedUsers: User[] = data.map(p => ({
          id: p.id,
          name: p.name || p.email,
          email: p.email,
          phone: p.phone,
          cnpj: p.cnpj,
          isSetupComplete: p.is_setup_complete,
          role: (p.role || 'user') as 'admin' | 'user',
          status: p.status as 'active' | 'inactive' | 'suspended',
          joinedAt: p.joined_at,
          lastActive: p.last_active,
          receiveWeeklySummary: p.receive_weekly_summary ?? true,
          cnpjData: p.cnpj_data,
          fiscalSummary: p.fiscal_summary,
      }));
      setAllUsers(mappedUsers);
  };

  const loadTransactions = async (userId: string) => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
    
    const allTransactions = data.map((t: any) => ({
        id: t.id,
        description: t.description,
        category: t.category,
        type: t.type as 'receita' | 'despesa',
        amount: parseFloat(t.amount as any),
        expectedAmount: t.expected_amount ? parseFloat(t.expected_amount as any) : undefined,
        date: t.date,
        time: t.time,
        status: t.status as 'pago' | 'pendente',
        installments: t.installments,
        isRecurring: t.is_recurring,
        externalApi: t.external_api || false,
        createdAt: t.created_at,
    })) as Transaction[];
    
    const external = allTransactions.filter(t => t.externalApi);
    const internal = allTransactions.filter(t => !t.externalApi);
    
    setExternalTransactions(external);
    return internal;
  };

  const loadAppointments = async (userId: string) => {
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }
    return data.map(a => ({
        ...a,
        id: a.id,
        notify: a.notify || false,
        type: 'compromisso' as const,
    })) as Appointment[];
  };
  
  const loadUserCategories = async (userId: string) => {
      const { data, error } = await supabase
          .from('user_categories')
          .select('name, icon, type')
          .eq('user_id', userId);

      if (error) {
          console.error('Error fetching user categories:', error);
          setRevenueCats(defaultRevenueCats);
          setExpenseCats(defaultExpenseCats);
          return;
      }

      const customRevenue: Category[] = [];
      const customExpense: Category[] = [];

      data.forEach(cat => {
          const category: Category = { name: cat.name, icon: cat.icon };
          if (cat.type === 'receita') {
              customRevenue.push(category);
          } else if (cat.type === 'despesa') {
              customExpense.push(category);
          }
      });
      
      const combinedRevenue = [...defaultRevenueCats, ...customRevenue.filter(c => !defaultRevenueCats.some(d => d.name === c.name))];
      const combinedExpense = [...defaultExpenseCats, ...customExpense.filter(c => !defaultExpenseCats.some(d => d.name === c.name))];

      setRevenueCats(combinedRevenue);
      setExpenseCats(combinedExpense);
  };

  const loadNewsAndOffers = async () => {
    const { data: newsData, error: newsError } = await supabase
        .from('news')
        .select('*')
        .order('date', { ascending: false });
    
    if (!newsError) {
        const mappedNews: NewsItem[] = newsData.map(n => ({
            id: n.id,
            category: n.category,
            title: n.title,
            excerpt: n.excerpt,
            content: n.content,
            date: n.date,
            imageUrl: n.image_url,
            read_time: n.read_time,
            status: n.status as 'published' | 'draft',
            source_url: n.source_url,
            source_name: n.source_name,
        }));
        setNews(mappedNews);
    } else {
        console.error('Error fetching news:', newsError);
    }
  };

  const loadNotifications = async (userId?: string) => {
    const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select(`
            *,
            poll_votes:user_notification_interactions(
                user_id, voted_option_id, voted_at
            )
        `)
        .order('created_at', { ascending: false });
    
    if (notifError) {
        console.error('Error fetching notifications:', notifError);
        return;
    }

    let userInteractions: Record<number, { is_read: boolean, voted_option_id: number | null }> = {};

    if (userId) {
        const { data: interactionsData, error: interactionsError } = await supabase
            .from('user_notification_interactions')
            .select('notification_id, is_read, voted_option_id')
            .eq('user_id', userId);

        if (interactionsError) {
            console.error('Error fetching user interactions:', interactionsError);
        } else {
            interactionsData.forEach(i => {
                userInteractions[i.notification_id] = {
                    is_read: i.is_read,
                    voted_option_id: i.voted_option_id
                };
            });
        }
    }

    const processedNotifications: AppNotification[] = notifData
        .map(n => {
            const interaction = userInteractions[n.id];
            
            const pollVotes: PollVote[] = (n.poll_votes || []).map((v: any) => ({
                userId: v.user_id,
                optionId: v.voted_option_id,
                votedAt: v.voted_at,
                userName: 'N/A', 
                userEmail: 'N/A',
                optionText: n.poll_options?.find((opt: any) => opt.id === v.voted_option_id)?.text || 'N/A'
            }));

            const pollOptionsWithCounts = n.poll_options?.map((opt: any) => ({
                ...opt,
                votes: pollVotes.filter(v => v.optionId === opt.id).length
            }));

            return {
                id: n.id,
                text: n.text,
                type: n.type as 'info' | 'warning' | 'success' | 'poll',
                date: new Date(n.created_at).toLocaleDateString('pt-BR'),
                pollOptions: pollOptionsWithCounts,
                pollVotes: pollVotes,
                active: n.active,
                expiresAt: n.expires_at,
                read: interaction?.is_read || false,
                userVotedOptionId: interaction?.voted_option_id ?? undefined
            } as AppNotification;
        });

    setNotifications(processedNotifications);
  };
  
  const updateLastActive = async (userId: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
        .from('profiles')
        .update({ last_active: now })
        .eq('id', userId);

    if (error) {
        console.error('Error updating last_active:', error);
    } else {
        setUser(prev => {
            if (prev && prev.id === userId) {
                return { ...prev, lastActive: now };
            }
            return prev;
        });
    }
  };
  
  const loadAllUserData = async (userId: string, userRole: 'admin' | 'user') => {
    setLoadingAuth(true);
    await Promise.all([
        loadTransactions(userId).then(setTransactions),
        loadAppointments(userId).then(setAppointments),
        loadUserCategories(userId),
        loadNotifications(userId),
        ...(userRole === 'admin' ? [loadAllUsers()] : []),
    ]);
    setLoadingAuth(false);
  };


  const loadUserProfile = async (supabaseUser: any) => {
    if (userRef.current && userRef.current.id === supabaseUser.id && userRef.current.isSetupComplete) {
        setLoadingAuth(false);
        return;
    }
    
    setLoadingAuth(true);
    
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

    if (profileError) {
        console.error('[loadUserProfile] Error fetching profile:', profileError);
        const appUser: User = {
            id: supabaseUser.id,
            name: supabaseUser.email || 'Usuário',
            email: supabaseUser.email,
            isSetupComplete: false,
            role: 'user',
            status: 'active'
        };
        setUser(appUser);
        setLoadingAuth(false);
        return;
    }
    
    const appUser: User = {
        id: profileData.id,
        email: supabaseUser.email,
        name: profileData.name || supabaseUser.email,
        phone: profileData.phone,
        cnpj: profileData.cnpj,
        isSetupComplete: profileData.is_setup_complete,
        role: (profileData.role || 'user') as 'admin' | 'user',
        status: profileData.status as 'active' | 'inactive' | 'suspended',
        joinedAt: profileData.joined_at,
        lastActive: profileData.last_active,
        receiveWeeklySummary: profileData.receive_weekly_summary ?? true,
        cnpjData: profileData.cnpj_data,
        fiscalSummary: profileData.fiscal_summary,
    };
    
    if (!appUser.email) {
        appUser.email = supabaseUser.email;
    }

    setUser(appUser);
    setCnpj(appUser.cnpj || '');
    setFiscalData(appUser.fiscalSummary || null);
    
    if (appUser.isSetupComplete) {
        loadAllUserData(appUser.id, appUser.role || 'user');
    } else {
        setLoadingAuth(false);
    }
  };

  // --- CALCULATE DASHBOARD METRICS ---
  const dashboardMetrics = useMemo(() => {
    const today = new Date();
    const cMonth = today.getMonth();
    const cYear = today.getFullYear();
    const todayStr = today.toISOString().split('T')[0];

    const relevantTransactions = transactions.filter(t => {
        const [y, m] = t.date.split('-').map(Number);
        const tYear = y;
        const tMonth = m - 1;

        if (tYear !== cYear) return false;

        if (dashboardViewMode === 'monthly') {
            return tMonth === cMonth;
        }
        return true;
    });

    const realizedRevenue = relevantTransactions
      .filter(t => t.type === 'receita' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const realizedExpense = relevantTransactions
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const caixaAtual = realizedRevenue - realizedExpense;

    const pendingTrans = relevantTransactions.filter(t => t.status === 'pendente');

    const aReceber = pendingTrans
      .filter(t => t.type === 'receita')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const aPagar = pendingTrans
      .filter(t => t.type === 'despesa')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const totalExpectedRevenue = realizedRevenue + aReceber;
    const totalExpectedExpense = realizedExpense + aPagar;
    const caixaProjetado = totalExpectedRevenue - totalExpectedExpense;

    let emAtraso = 0;
    let aVencer = 0;

    pendingTrans
      .forEach(t => {
        if (t.date < todayStr) {
          emAtraso += t.amount || 0;
        } else {
          aVencer += t.amount || 0;
        }
      });

    return {
      caixaAtual,
      aReceber,
      aPagar,
      caixaProjetado,
      emAtraso,
      aVencer,
      realizedRevenue,
      realizedExpense,
      totalExpectedRevenue,
      totalExpectedExpense,
    };
  }, [transactions, dashboardViewMode]);

  // --- AUTH MONITORING ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const articleIdParam = params.get('articleId');
        const embedParam = params.get('embed');
        
        if (embedParam === 'news-slider') {
            setIsEmbedView(true);
            setLoadingAuth(false);
            loadNewsAndOffers();
            loadConnectionConfig();
            return () => {};
        }

        if (params.get('page') === 'news') {
            setActiveTabState('news');
            if (articleIdParam) {
                setReadingNewsId(parseInt(articleIdParam));
            }
            setLoadingAuth(false);
            loadNewsAndOffers();
            loadConnectionConfig();
            return () => {};
        }
    }

    loadMaintenanceConfig();
    loadConnectionConfig();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = userRef.current; 
      const isUserAlreadyLoaded = currentUser && currentUser.id === session?.user?.id;
      
      // NOVO: Captura o evento de recuperação de senha
      if (event === 'PASSWORD_RECOVERY') {
          setActiveTab('reset-password');
          setLoadingAuth(false);
          return;
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
        if (event === 'USER_UPDATED' || !isUserAlreadyLoaded) {
            loadUserProfile(session.user);
        } else {
            setLoadingAuth(false);
            if (currentUser.isSetupComplete) {
                updateLastActive(currentUser.id);
            }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoadingAuth(false);
        localStorage.removeItem('activeTab');
        setActiveTabState('home');
      } else if (event === 'INITIAL_SESSION' && session?.user) {
        loadUserProfile(session.user);
      } else if (event === 'INITIAL_SESSION' && !session) {
        setLoadingAuth(false);
      }
    });

    loadNewsAndOffers();
    loadNotifications();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  useEffect(() => {
      if (typeof window !== 'undefined') {
          const hash = window.location.hash;
          const params = new URLSearchParams(hash.substring(1));
          const message = params.get('message') || params.get('error_description');
          
          if (message) {
              const decodedMessage = decodeURIComponent(message.replace(/\+/g, ' '));
              if (decodedMessage.includes('Confirmation link accepted') || decodedMessage.includes('successfully')) {
                  showSuccess(decodedMessage);
              } else {
                  showWarning(decodedMessage);
              }
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
      }
  }, []);


  // --- AUTH HANDLERS ---
  const handleLogin = (userData: User) => {}

  const handleForgotPassword = async (email: string): Promise<boolean> => {
      return true;
  }

  const handleOnboardingComplete = async (newCnpj: string, theme: 'light' | 'dark', companyName: string, receiveWeeklySummary: boolean, cnpjData: CNPJResponse | null) => {
      if (!user) return;
      
      const now = new Date().toISOString();
      const { error } = await supabase
          .from('profiles')
          .update({ 
              cnpj: newCnpj, 
              name: companyName || user.name, 
              is_setup_complete: true,
              last_active: now,
              receive_weekly_summary: receiveWeeklySummary,
              cnpj_data: cnpjData
          })
          .eq('id', user.id);

      if (error) {
          console.error('[OnboardingComplete] Error updating profile during onboarding:', error);
          showError('Erro ao salvar dados. Tente novamente.');
          return;
      }
      
      const updatedUser: User = { 
          ...user, 
          isSetupComplete: true, 
          cnpj: newCnpj,
          name: companyName || user.name,
          lastActive: now,
          receiveWeeklySummary: receiveWeeklySummary,
          cnpjData: cnpjData
      };
      setCnpj(newCnpj);
      setUser(updatedUser);
      
      if (theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
      setShowIntro(true);
      
      loadAllUserData(user.id, updatedUser.role || 'user');
      setActiveTab('dashboard');
  }
  
  const handleLandingLogin = () => {
      setActiveTab('auth');
  };

  const handleLandingGetStarted = () => {
      setActiveTab('auth');
  };
  
  const handleStartCnpjFlow = () => {
      setActiveTab('cnpj-consult');
  };
  
  const handleViewNews = (id: number | undefined) => {
    if (isEmbedView) {
        const baseUrl = window.location.origin;
        const publicUrl = `${baseUrl}/?page=news&articleId=${id}`;
        if (window.top) {
            window.top.location.href = publicUrl;
        } else {
            window.location.href = publicUrl;
        }
        return;
    }
    setReadingNewsId(id || null);
    setActiveTab('news');
  };
  
  const handleBackToLanding = () => {
      setActiveTab('home');
  };


  // --- USER MANAGEMENT HANDLERS (Admin & Settings) ---
  
  const handleUpdateUser = async (updatedUser: User) => {
      const { error } = await supabase
          .from('profiles')
          .update({
              name: updatedUser.name,
              email: updatedUser.email,
              phone: updatedUser.phone,
              cnpj: updatedUser.cnpj,
              role: updatedUser.role,
              status: updatedUser.status,
              receive_weekly_summary: updatedUser.receiveWeeklySummary,
              cnpj_data: updatedUser.cnpjData,
              fiscal_summary: updatedUser.fiscalSummary,
          })
          .eq('id', updatedUser.id);

      if (error) {
          console.error('Error updating user profile:', error);
          showError('Erro ao atualizar perfil do usuário.');
          return;
      }
      
      setAllUsers(allUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (user && user.id === updatedUser.id) {
          setUser(updatedUser);
      }
      showSuccess('Perfil atualizado com sucesso!');
  };
  
  const handleUpdateUserPhone = async (userId: string, newPhone: string): Promise<{ success: boolean, error?: string }> => {
      const cleanPhone = newPhone.replace(/[^\d]/g, '');
      
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
          return { success: false, error: "Número de telefone inválido. O DDD e o número são obrigatórios." };
      }

      const { data: existingPhone, error: phoneCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', cleanPhone)
          .neq('id', userId)
          .maybeSingle();

      if (phoneCheckError) {
          console.error('Phone check error:', phoneCheckError);
          return { success: false, error: 'Erro ao verificar telefone. Por favor, tente novamente.' };
      }

      if (existingPhone) {
          return { success: false, error: 'Este número de telefone já está cadastrado em outra conta.' };
      }
      
      const { error: updateError } = await supabase
          .from('profiles')
          .update({ phone: cleanPhone })
          .eq('id', userId);

      if (updateError) {
          console.error('Error updating phone:', updateError);
          return { success: false, error: 'Erro ao salvar o novo telefone.' };
      }
      
      setUser(prev => {
          if (prev && prev.id === userId) {
              return { ...prev, phone: cleanPhone };
          }
          return prev;
      });
      
      return { success: true };
  };
  
  const handleUpdateUserEmail = async (newEmail: string): Promise<{ success: boolean, error?: string }> => {
      if (!user) return { success: false, error: "Usuário não autenticado." };
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) {
          console.error("Error updating user email:", error);
          return { success: false, error: error.message };
      }
      return { success: true };
  };

  const handleAddUser = (newUser: User) => {
      setAllUsers([...allUsers, newUser]);
      showSuccess('Usuário adicionado com sucesso!');
  };

  const handleChangePassword = async (newPassword: string): Promise<boolean> => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
          console.error("Error changing password:", error);
          showError('Erro ao alterar a senha. Verifique a senha atual.');
          return false;
      }
      showSuccess('Senha alterada com sucesso!');
      return true;
  };

  const handleDeleteUser = (id: string) => {
      console.warn("Admin: Delete user functionality requires Supabase Service Role or Edge Function.");
      setAllUsers(allUsers.filter(u => u.id !== id));
      showSuccess('Usuário excluído (simulado).');
      if (user && user.id === id) {
          handleDeleteAccount();
      }
  };

  // --- ACCOUNT HANDLERS ---
  const handleExportData = () => {
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

    const csvContent = "\uFEFF" + headers.join(";") + "\n" + rows.map(r => r.join(";")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `regularmei_transacoes_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess('Dados exportados com sucesso!');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const loadingToastId = showLoading('Excluindo conta e dados...');

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
        dismissToast(loadingToastId);
        showError('Erro: Não foi possível obter o token de sessão.');
        return;
    }

    const edgeFunctionUrl = `https://ogwjtlkemsqmpvcikrtd.supabase.co/functions/v1/delete-user-data`;

    try {
        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        dismissToast(loadingToastId);

        if (response.ok) {
            await supabase.auth.signOut();
            showSuccess('Conta excluída com sucesso. Você será deslogado.');
            setUser(null);
            setActiveTab('home');
            setTransactions([]);
            setAppointments([]);
            setCnpj('');
            setFiscalData(null);
            setShowIntro(false);
        } else {
            const errorData = await response.json();
            console.error('Edge Function Error:', errorData);
            showError(`Falha ao excluir a conta: ${errorData.error || 'Erro desconhecido.'}`);
        }
    } catch (error) {
        dismissToast(loadingToastId);
        console.error('Network or Fetch Error:', error);
        showError('Erro de conexão ao tentar excluir a conta.');
    }
  };

  const handleLogout = async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
          console.error("Error signing out:", error);
          showError('Erro ao sair.');
      }
      setUser(null);
      setActiveTab('home');
  };

  // --- OFFERS HANDLERS (REMOVIDO) ---
  const handleAddOffer = async (newOffer: Offer) => {
    showError('Funcionalidade de Produtos desativada.');
  };

  const handleUpdateOffer = async (updatedOffer: Offer) => {
    showError('Funcionalidade de Produtos desativada.');
  };

  const handleDeleteOffer = async (id: number) => {
    showError('Funcionalidade de Produtos desativada.');
  };

  // --- NEWS HANDLERS ---
  const handleAddNews = async (newItem: NewsItem) => {
    const payload = {
        category: newItem.category,
        title: newItem.title,
        excerpt: newItem.excerpt,
        content: newItem.content,
        date: newItem.date,
        image_url: newItem.imageUrl,
        read_time: newItem.readTime,
        status: newItem.status,
        source_url: newItem.sourceUrl || null,
        source_name: newItem.sourceName || null,
    };

    const { error } = await supabase
        .from('news')
        .insert(payload);

    if (error) {
        console.error('Error adding news:', error);
        showError('Erro ao publicar notícia.');
        return;
    }
    
    showSuccess('Notícia publicada!');
    loadNewsAndOffers();
  };

  const handleUpdateNews = async (updatedItem: NewsItem) => {
    const payload = {
        category: updatedItem.category,
        title: updatedItem.title,
        excerpt: updatedItem.excerpt,
        content: updatedItem.content,
        date: updatedItem.date,
        image_url: updatedItem.imageUrl,
        read_time: updatedItem.readTime,
        status: updatedItem.status,
        source_url: updatedItem.sourceUrl || null,
        source_name: updatedItem.sourceName || null,
    };

    const { error } = await supabase
        .from('news')
        .update(payload)
        .eq('id', updatedItem.id);

    if (error) {
        console.error('Error updating news:', error);
        showError('Erro ao atualizar notícia.');
        return;
    }
    
    showSuccess('Notícia atualizada!');
    loadNewsAndOffers();
  };

  const handleDeleteNewsClick = async (id: number) => {
    const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting news:', error);
        showError('Erro ao excluir notícia.');
        return;
    }
    
    showSuccess('Notícia excluída.');
    loadNewsAndOffers();
  };

  // --- NOTIFICATION HANDLERS ---
  const handleAddNotification = async (item: AppNotification) => {
      const expiresAtValue = item.expiresAt && item.expiresAt.trim() !== '' ? item.expiresAt : null;
      const payload = {
          text: item.text,
          type: item.type,
          poll_options: item.type === 'poll' ? item.pollOptions : null,
          expires_at: expiresAtValue, 
          active: true,
      };
      const { error } = await supabase
          .from('notifications')
          .insert(payload);
      if (error) {
          console.error('Error adding notification:', error);
          showError('Erro ao publicar notificação.');
          return;
      }
      showSuccess('Notificação publicada!');
      loadNotifications(user?.id);
  }

  const handleUpdateNotification = async (item: AppNotification) => {
      const expiresAtValue = item.expiresAt && item.expiresAt.trim() !== '' ? item.expiresAt : null;
      const payload = {
          text: item.text,
          type: item.type,
          poll_options: item.type === 'poll' ? item.pollOptions : null,
          expires_at: expiresAtValue, 
          active: item.active,
      };
      const { error } = await supabase
          .from('notifications')
          .update(payload)
          .eq('id', item.id);
      if (error) {
          console.error('Error updating notification:', error);
          showError('Erro ao atualizar notificação.');
          return;
      }
      showSuccess('Notificação atualizada!');
      loadNotifications(user?.id);
  }

  const handleDeleteNotification = async (id: number) => {
      const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id);
      if (error) {
          console.error('Error deleting notification:', error);
          showError('Erro ao excluir notificação.');
          return;
      }
      showSuccess('Notificação excluída.');
      loadNotifications(user?.id);
  }

  const handleMarkAsRead = async (id: number) => {
    if (!user) return;
    const { error } = await supabase
        .from('user_notification_interactions')
        .upsert({
            user_id: user.id,
            notification_id: id,
            is_read: true,
        }, { onConflict: 'user_id, notification_id' });
    if (error) {
        console.error('Error marking as read:', error);
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleVote = async (notificationId: number, optionId: number) => {
    if (!user) return;
    const { error } = await supabase
        .from('user_notification_interactions')
        .upsert({
            user_id: user.id,
            notification_id: notificationId,
            voted_option_id: optionId,
            is_read: true,
            voted_at: new Date().toISOString()
        }, { onConflict: 'user_id, notification_id' });
    if (error) {
        console.error('Error recording vote:', error);
        showError('Erro ao registrar voto.');
        return;
    }
    showSuccess('Voto registrado com sucesso!');
    loadNotifications(user.id); 
  };

  // --- CASHFLOW HANDLERS ---
  const handleAddTransaction = async (t: Transaction | Transaction[]) => {
    if (!user) return;
    const transactionsToInsert = Array.isArray(t) ? t : [t];
    const payload = transactionsToInsert.map(tr => ({
        user_id: user.id,
        description: tr.description,
        category: tr.category,
        type: tr.type,
        amount: tr.amount,
        expected_amount: tr.expectedAmount,
        date: tr.date,
        time: tr.time,
        status: tr.status,
        installments: tr.installments,
        is_recurring: tr.isRecurring,
        external_api: tr.externalApi || false,
    }));
    const { data, error } = await supabase
        .from('transactions')
        .insert(payload)
        .select();
    if (error) {
        console.error('Error adding transaction:', error);
        showError('Erro ao adicionar transação.');
        return;
    }
    showSuccess('Transação(ões) adicionada(s) com sucesso!');
    const newTransactions = (data as any[]).map(t => ({
        id: t.id,
        description: t.description,
        category: t.category,
        type: t.type as 'receita' | 'despesa',
        amount: parseFloat(t.amount as any),
        expectedAmount: t.expected_amount ? parseFloat(t.expected_amount as any) : undefined,
        date: t.date,
        time: t.time,
        status: t.status as 'pago' | 'pendente',
        installments: t.installments,
        isRecurring: t.is_recurring,
        externalApi: t.external_api || false,
        createdAt: t.created_at,
    })) as Transaction[];
    setTransactions(prev => [...newTransactions, ...prev]);
    if (user.id && newTransactions.length === 1 && newTransactions[0].status === 'pendente' && !newTransactions[0].isRecurring && !newTransactions[0].installments) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [y, m, d] = newTransactions[0].date.split('-').map(Number);
        const transactionDateOnly = new Date(y, m - 1, d, 0, 0, 0);
        if (transactionDateOnly >= today) {
            scheduleTransactionReminder(user.id, newTransactions[0]);
        }
    }
  };

  const handleUpdateTransaction = async (t: Transaction) => {
    if (!user) return;
    const payload = {
        description: t.description,
        category: t.category,
        type: t.type,
        amount: t.amount,
        expected_amount: t.expectedAmount,
        date: t.date,
        time: t.time,
        status: t.status,
        installments: t.installments,
        is_recurring: t.isRecurring,
        external_api: t.external_api || false,
    };
    const { error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', t.id)
        .eq('user_id', user.id);
    if (error) {
        console.error('Error updating transaction:', error);
        showError('Erro ao atualizar transação.');
        return;
    }
    showSuccess('Transação atualizada com sucesso!');
    setTransactions(prev => prev.map(tr => tr.id === t.id ? t : tr));
    setExternalTransactions(prev => prev.map(tr => tr.id === t.id ? t : tr));
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!user) return;
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    if (error) {
        console.error('Error deleting transaction:', error);
        showError('Erro ao excluir transação.');
        return;
    }
    showSuccess('Transação excluída.');
    setTransactions(prev => prev.filter(tr => tr.id !== id));
    setExternalTransactions(prev => prev.filter(tr => tr.id !== id));
  };
  
  const handleDeleteTransactionSeries = async (t: Transaction) => {
      if (!user) return;
      const loadingToastId = showLoading('Excluindo série de lançamentos...');
      let query = supabase
          .from('transactions')
          .delete()
          .eq('user_id', user.id)
          .eq('description', t.description)
          .eq('category', t.category)
          .eq('type', t.type);
      if (t.isRecurring) {
          query = query.eq('is_recurring', true).eq('status', 'pendente');
      } else if (t.installments) {
          query = query.not('installments', 'is', null);
      } else {
          dismissToast(loadingToastId);
          handleDeleteTransaction(t.id);
          return;
      }
      const { error } = await query;
      dismissToast(loadingToastId);
      if (error) {
          console.error('Error deleting transaction series:', error);
          showError('Erro ao excluir a série de transações.');
          return;
      }
      showSuccess('Série de transações excluída com sucesso!');
      loadTransactions(user.id).then(setTransactions);
  };

  const handleCloseExternalModal = async () => {
      if (!user || externalTransactions.length === 0) {
          setExternalTransactions([]);
          return;
      }
      const idsToMarkAsInternal = externalTransactions.map(t => t.id);
      const { error } = await supabase
          .from('transactions')
          .update({ external_api: false })
          .in('id', idsToMarkAsInternal)
          .eq('user_id', user.id);
      if (error) {
          console.error('Error marking external transactions as internal:', error);
          showError('Erro ao marcar transações como revisadas.');
      }
      setTransactions(prev => [...externalTransactions.map(t => ({...t, externalApi: false})), ...prev]);
      setExternalTransactions([]);
  };

  const handleAddAppointment = async (a: Appointment) => {
    if (!user) return;
    const payload = {
        user_id: user.id,
        title: a.title,
        date: a.date,
        time: a.time,
        notify: a.notify,
        type: a.type,
    };
    const { data, error } = await supabase
        .from('appointments')
        .insert(payload)
        .select();
    if (error) {
        console.error('Error adding compromisso:', error);
        showError('Erro ao adicionar compromisso.');
        return;
    }
    const newAppointment = (data as Appointment[])[0];
    if (newAppointment.notify) {
        await scheduleAppointmentReminder(user.id, newAppointment);
    }
    showSuccess('Compromisso adicionado!');
    setAppointments(prev => [newAppointment, ...prev]);
  };

  const handleUpdateAppointment = async (a: Appointment) => {
    if (!user) return;
    await deleteScheduledReminder(a.id);
    const payload = {
        title: a.title,
        date: a.date,
        time: a.time,
        notify: a.notify,
        type: a.type,
    };
    const { error } = await supabase
        .from('appointments')
        .update(payload)
        .eq('id', a.id)
        .eq('user_id', user.id);
    if (error) {
        console.error('Error updating compromisso:', error);
        showError('Erro ao atualizar compromisso.');
        return;
    }
    if (a.notify) {
        await scheduleAppointmentReminder(user.id, a);
    }
    showSuccess('Compromisso atualizado!');
    setAppointments(prev => prev.map(appt => appt.id === a.id ? a : appt));
  };

  const handleDeleteAppointment = async (id: number) => {
    if (!user) return;
    await deleteScheduledReminder(id);
    const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    if (error) {
        console.error('Error deleting compromisso:', error);
        showError('Erro ao excluir compromisso.');
        return;
    }
    showSuccess('Compromisso excluído.');
    setAppointments(prev => prev.filter(appt => appt.id !== id));
  };

  const handleAddCategory = async (type: 'receita' | 'despesa', cat: Category) => {
    if (!user) return;
    const currentCats = type === 'receita' ? revenueCats : expenseCats;
    if (currentCats.some(c => c.name.toLowerCase() === cat.name.toLowerCase())) {
        showError(`A categoria '${cat.name}' já existe.`);
        return;
    }
    const payload = {
        user_id: user.id,
        name: cat.name,
        icon: cat.icon,
        type: type,
    };
    const { error } = await supabase
        .from('user_categories')
        .insert(payload);
    if (error) {
        console.error('Error adding category:', error);
        showError('Erro ao adicionar categoria.');
        return;
    }
    showSuccess(`Categoria '${cat.name}' adicionada.`);
    loadUserCategories(user.id);
  };

  const handleDeleteCategory = async (type: 'receita' | 'despesa', name: string) => {
    if (!user) return;
    const isDefault = (type === 'receita' ? defaultRevenueCats : defaultExpenseCats).some(c => c.name === name);
    if (isDefault) {
        showError(`A categoria padrão '${name}' não pode ser excluída.`);
        return;
    }
    const { error } = await supabase
        .from('user_categories')
        .delete()
        .eq('user_id', user.id)
        .eq('name', name)
        .eq('type', type);
    if (error) {
        console.error('Error deleting category:', error);
        showError('Erro ao excluir categoria.');
        return;
    }
    showSuccess(`Categoria '${name}' excluída.`);
    loadUserCategories(user.id);
  };
  
  const handleUpdateCnpjData = async (data: CNPJResponse) => {
      if (!user) return;
      const { error } = await supabase
          .from('profiles')
          .update({ cnpj_data: data })
          .eq('id', user.id);
      if (error) {
          console.error('Error updating CNPJ data:', error);
          showError('Erro ao salvar dados cadastrais do CNPJ.');
          return;
      }
      setUser(prev => prev ? { ...prev, cnpjData: data } : null);
      showSuccess('Dados cadastrais atualizados!');
  };

  const handleUpdateFiscalData = async (data: FiscalData) => {
      if (!user) return;
      setFiscalData(data);
      const { error } = await supabase
          .from('profiles')
          .update({ fiscal_summary: data })
          .eq('id', user.id);
      if (error) {
          console.error('Error updating fiscal summary:', error);
          showError('Erro ao salvar diagnóstico fiscal.');
          return;
      }
      setUser(prev => prev ? { ...prev, fiscalSummary: data } : null);
      showSuccess('Diagnóstico fiscal atualizado!');
  };


  // --- RENDER LOGIC ---
  
  if (loadingAuth) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }
  
  if (isEmbedView) {
      return (
          <div className="w-full h-full bg-background-light dark:bg-background-dark overflow-hidden">
              <div className="max-w-full mx-auto p-4">
                  <NewsSlider news={news} onViewNews={handleViewNews} />
              </div>
          </div>
      );
  }

  // NOVO: Renderiza a página de redefinição de senha se o tab estiver ativo
  if (activeTab === 'reset-password') {
      return <ResetPasswordPage onComplete={() => setActiveTab('dashboard')} />;
  }

  if (!user) {
      if (activeTab === 'terms' || activeTab === 'privacy' || activeTab === 'cnpj-consult' || activeTab === 'news') {
          if (activeTab === 'news' && readingNewsId === undefined) {
              setReadingNewsId(null);
          }
          return (
              <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
                  <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 h-[72px] flex items-center justify-between px-6">
                      <div className="flex items-center gap-2">
                          <img 
                            src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
                            alt="Regular MEI" 
                            className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
                          />
                          <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase ml-2">
                              {activeTab === 'terms' ? 'Termos' : activeTab === 'privacy' ? 'Privacidade' : activeTab === 'cnpj-consult' ? 'Consulta CNPJ' : 'Notícias'}
                          </span>
                      </div>
                      <button 
                        onClick={() => {
                            setReadingNewsId(null);
                            setActiveTab('home');
                        }}
                        className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                      >
                          Voltar para a Home <span className="material-icons text-sm">arrow_back</span>
                      </button>
                  </header>
                  <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
                      {activeTab === 'terms' ? <TermsPage /> : 
                       activeTab === 'privacy' ? <PrivacyPage /> :
                       activeTab === 'cnpj-consult' ? <CnpjConsultPage onBack={handleBackToLanding} connectionConfig={connectionConfig} /> :
                       <NewsPage news={news} readingId={readingNewsId} onSelectNews={setReadingNewsId} />
                      }
                  </main>
                  <footer className="mt-8 text-center text-sm text-slate-400 pb-8">
                    <p>&copy; {new Date().getFullYear()} Regular MEI. Todos os direitos reservados.</p>
                  </footer>
              </div>
          );
      }
      if (activeTab === 'auth') {
          return <AuthPage 
              onLogin={handleLogin} 
              onForgotPassword={handleForgotPassword} 
              onNavigate={setActiveTab} 
              onBackToLanding={handleBackToLanding}
          />;
      }
      return <LandingPage 
          onGetStarted={handleLandingGetStarted} 
          onLogin={handleLandingLogin} 
          onViewBlog={handleViewNews} 
          onConsultCnpj={handleStartCnpjFlow}
          news={news}
      />;
  }
  
  if (!user.isSetupComplete) {
      return <OnboardingPage user={user} onComplete={handleOnboardingComplete} />;
  }
  
  if (activeTab === 'home' || activeTab === 'auth' || activeTab === 'cnpj-consult') {
      setActiveTab('dashboard');
      return null;
  }
  
  const isPageInMaintenance = (page: string) => {
      if (user?.role === 'admin') return false;
      if (maintenance.global && page !== 'admin' && page !== 'settings') return true;
      if (maintenance[page as keyof MaintenanceConfig]) return true;
      return false;
  }

  const renderContent = () => {
      if (activeTab === 'admin' && user.role !== 'admin') {
          return (
              <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-8">
                  <span className="material-icons text-6xl text-red-500 mb-4">lock</span>
                  <h2 className="2xl font-bold text-slate-800 dark:text-white mb-2">Acesso Negado</h2>
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
                   {connectionConfig.ai.enabled && (
                       <div className="grid grid-cols-12 mb-6">
                           <AIAnalysis enabled={connectionConfig.ai.enabled} />
                       </div>
                   )}
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
                         <RecentTransactions transactions={transactions} onNavigate={setActiveTab} viewMode={dashboardViewMode} />
                      </div>
                   </div>
                   <div className="mt-8 mb-4">
                      <NewsSlider news={news} onViewNews={handleViewNews} />
                   </div>
                </div>
                <div className="hidden md:block space-y-6">
                  <div className="flex justify-between items-center gap-4">
                      <DashboardViewSelector viewMode={dashboardViewMode} setViewMode={setDashboardViewMode} />
                      <div className="flex gap-4">
                          <button 
                              onClick={() => setQuickAddModalType('receita')}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm font-bold text-sm"
                          >
                              <span className="material-icons text-lg">arrow_upward</span> Nova Receita
                          </button>
                          <button 
                              onClick={() => setQuickAddModalType('despesa')}
                              className="bg-rose-500 hover:bg-rose-600 text-white p-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm font-bold text-sm"
                          >
                              <span className="material-icons text-lg">arrow_downward</span> Nova Despesa
                          </button>
                      </div>
                  </div>
                  <DashboardSummaryCards metrics={dashboardMetrics} />
                  {connectionConfig.ai.enabled && (
                      <div className="grid grid-cols-12">
                          <AIAnalysis enabled={connectionConfig.ai.enabled} />
                      </div>
                  )}
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
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 h-full">
                        <RecentTransactions transactions={transactions} onNavigate={setActiveTab} viewMode={dashboardViewMode} />
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
                onDeleteTransactionSeries={handleDeleteTransactionSeries}
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
                userId={user.id}
            />;
          case 'cnpj': 
            return <CNPJPage 
                cnpj={cnpj} 
                fiscalData={fiscalData} 
                onUpdateFiscalData={handleUpdateFiscalData} 
                onUpdateCnpjData={handleUpdateCnpjData}
                connectionConfig={connectionConfig} 
                cnpjData={user?.cnpjData} 
            />;
          case 'tools': return <ToolsPage user={user} />;
          case 'news': return <NewsPage news={news} readingId={readingNewsId} onSelectNews={(id) => setReadingNewsId(id)} />;
          case 'offers': 
            return <ProductsByCnaePage 
                user={user} 
                productRedirectWebhookUrl={connectionConfig.productRedirectWebhookUrl}
            />;
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
                onUpdateMaintenance={handleUpdateMaintenance}
                connectionConfig={connectionConfig}
                onUpdateConnectionConfig={handleUpdateConnectionConfig}
                users={allUsers}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
            />;
          case 'settings': 
            return <SettingsPage 
              user={user}
              onUpdateUser={handleUpdateUser}
              onUpdateUserPhone={handleUpdateUserPhone}
              onUpdateUserEmail={handleUpdateUserEmail}
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
          case 'more':
            return <MorePage onNavigate={setActiveTab} userRole={user.role} />;
          case 'terms': return <TermsPage />;
          case 'privacy': return <PrivacyPage />;
          default: return null;
      }
  };

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden relative">
      {user && (
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={false} toggleSidebar={() => {}} userRole={user?.role} />
      )}
      <div className={`flex-1 flex flex-col overflow-hidden`}>
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
          <ExternalTransactionModal
              transactions={externalTransactions}
              revenueCats={revenueCats}
              expenseCats={expenseCats}
              onClose={handleCloseExternalModal}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onNavigateToCashflow={() => setActiveTab('cashflow')}
          />
      )}
      {user && user.isSetupComplete && (
          <>
              <VirtualAssistantButton 
                  isOpen={isAssistantOpen} 
                  onClick={() => setIsAssistantOpen(true)} 
                  gifUrl={connectionConfig.assistantGifUrl}
                  iconSizeClass={connectionConfig.assistantIconSize}
              />
              {isAssistantOpen && (
                  <AssistantChat 
                      onClose={() => setIsAssistantOpen(false)} 
                      onNavigate={setActiveTab}
                      connectionConfig={connectionConfig}
                  />
              )}
          </>
      )}
      {user && (
          <MobileBottomNav 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              userRole={user.role} 
          />
      )}
      {quickAddModalType && (
          <TransactionModal
              isOpen={!!quickAddModalType}
              onClose={() => setQuickAddModalType(null)}
              onSave={handleAddTransaction}
              revenueCats={revenueCats}
              expenseCats={expenseCats}
              editingTransaction={null}
              forcedType={quickAddModalType}
          />
      )}
    </div>
  );
};

export default App;