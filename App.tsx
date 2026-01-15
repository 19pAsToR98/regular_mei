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
import MorePage from './components/MorePage'; // NEW IMPORT
import DashboardViewSelector from './components/DashboardViewSelector'; // NEW IMPORT
import TransactionModal from './components/TransactionModal'; // UPDATED IMPORT
import ProductsByCnaePage from './components/ProductsByCnaePage'; // NEW IMPORT
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
  const [showIntro, setShowIntro] = useState(false); // <-- FIX: Added missing state
  
  // --- AUTH STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isPublicView, setIsPublicView] = useState(false);
  const [isEmbedView, setIsEmbedView] = useState(false);
  // Removed: const [pendingCnpjFlow, setPendingCnpjFlow] = useState(false); 

  // Ref to hold the current user state to avoid stale closures in the auth listener
  const userRef = useRef(user);
  useEffect(() => {
      userRef.current = user;
  }, [user]);

  // Initialize activeTab from localStorage or default to 'home'
  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedTab = localStorage.getItem('activeTab');
      // If no stored tab or it's an old auth tab, default to 'home' (LandingPage)
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
    whatsappApi: { // NEW: WhatsApp API Configuration
        sendTextUrl: 'https://regularmei.uazapi.com/send/text',
        token: 'b201c8c5-08fb-4d7e-adef-f9d4113922b5',
        enabled: true, // NEW: Default to enabled
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
    assistantWebhookUrl: 'https://n8nauto.portalmei360.com/webhook-test/d5c69353-a50b-471b-b518-919af0ced726', // NEW DEFAULT URL
    assistantGifUrl: undefined, // NEW FIELD
    assistantIconSize: 'w-12 h-12', // NEW FIELD
    productRedirectWebhookUrl: 'https://n8nwebhook.portalmei360.com/webhook-test/product-redirect-placeholder', // NEW FIELD
  });
  
  // --- QUICK ADD MODAL STATE ---
  const [quickAddModalType, setQuickAddModalType] = useState<'receita' | 'despesa' | null>(null);
  
  // --- OFFERS STATE (REMOVIDO) ---
  const [offers, setOffers] = useState<Offer[]>([]); // Kept for loadNewsAndOffers compatibility, will be removed later

  // --- DATA FETCHING FUNCTIONS ---

  const loadMaintenanceConfig = async () => {
      const { data, error } = await supabase
          .from('app_config')
          .select('maintenance_config')
          .eq('id', 1)
          .single();

      if (error) {
          console.error('Error fetching maintenance config:', error);
          // Fallback to default state if fetch fails
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
          // Merge fetched config with current state to ensure robustness
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
          cnpjData: p.cnpj_data, // NEW: Load CNPJ data
          fiscalSummary: p.fiscal_summary, // NEW: Load fiscal summary
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
    
    // Separate transactions added externally that haven't been reviewed yet
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
          // Fallback to defaults if fetch fails
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
      
      // Combine defaults with custom categories, ensuring no duplicates by name
      const combinedRevenue = [...defaultRevenueCats, ...customRevenue.filter(c => !defaultRevenueCats.some(d => d.name === c.name))];
      const combinedExpense = [...defaultExpenseCats, ...customExpense.filter(c => !defaultExpenseCats.some(d => d.name === c.name))];

      setRevenueCats(combinedRevenue);
      setExpenseCats(combinedExpense);
  };

  const loadNewsAndOffers = async () => {
    // News (Publicly readable via RLS)
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
            readTime: n.read_time,
            status: n.status as 'published' | 'draft',
            sourceUrl: n.source_url,
            sourceName: n.source_name,
        }));
        setNews(mappedNews);
    } else {
        console.error('Error fetching news:', newsError);
    }

    // Offers (REMOVED LOGIC)
    // const { data: offersData, error: offersError } = await supabase
    //     .from('offers')
    //     .select('*')
    //     .order('is_featured', { ascending: false });
    
    // if (!offersError) {
    //     const mappedOffers: Offer[] = offersData.map(o => ({
    //         id: o.id,
    //         partnerName: o.partner_name,
    //         partnerColor: o.partner_color,
    //         partnerIcon: o.partner_icon,
    //         discount: o.discount,
    //         title: o.title,
    //         description: o.description,
    //         category: o.category,
    //         code: o.code,
    //         link: o.link,
    //         expiry: o.expiry,
    //         isExclusive: o.is_exclusive,
    //         isFeatured: o.is_featured,
    //     }));
    //     setOffers(mappedOffers);
    // } else {
    //     console.error('Error fetching offers:', offersError);
    // }
  };

  const loadNotifications = async (userId?: string) => {
    // 1. Fetch all notifications (Admin needs to see all, active or inactive)
    const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select(`
            *,
            poll_votes:user_notification_interactions(
                user_id, voted_option_id, voted_at
            )
        `)
        // REMOVED .eq('active', true) to fetch all notifications for Admin management
        .order('created_at', { ascending: false });
    
    if (notifError) {
        console.error('Error fetching notifications:', notifError);
        return;
    }

    let userInteractions: Record<number, { is_read: boolean, voted_option_id: number | null }> = {};

    // 2. If user is logged in, fetch their specific interactions
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

    // 3. Process and map notifications
    const processedNotifications: AppNotification[] = notifData
        .map(n => {
            const interaction = userInteractions[n.id];
            
            // Process poll votes for Admin view (if needed)
            const pollVotes: PollVote[] = (n.poll_votes || []).map((v: any) => ({
                userId: v.user_id,
                optionId: v.voted_option_id,
                votedAt: v.voted_at,
                // Note: userName/userEmail are not fetched here for simplicity/RLS reasons
                userName: 'N/A', 
                userEmail: 'N/A',
                optionText: n.poll_options?.find((opt: any) => opt.id === v.voted_option_id)?.text || 'N/A'
            }));

            // Update poll options with current vote counts for Admin view
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
                userVotedOptionId: interaction?.voted_option_id ?? undefined // FIX: Use ?? to handle 0 correctly
            } as AppNotification;
        });

    setNotifications(processedNotifications);
  };
  
  // NEW: Function to update last active timestamp
  const updateLastActive = async (userId: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
        .from('profiles')
        .update({ last_active: now })
        .eq('id', userId);

    if (error) {
        console.error('Error updating last_active:', error);
    } else {
        // Update local state to reflect the change
        setUser(prev => {
            if (prev && prev.id === userId) {
                return { ...prev, lastActive: now };
            }
            return prev;
        });
    }
  };
  
  // NEW: Function to load all user-specific data after login/onboarding
  const loadAllUserData = async (userId: string, userRole: 'admin' | 'user') => {
    // console.log('[loadAllUserData] Starting data load for user:', userId, 'Role:', userRole); // REMOVIDO LOG
    setLoadingAuth(true);
    await Promise.all([
        loadTransactions(userId).then(setTransactions),
        loadAppointments(userId).then(setAppointments),
        loadUserCategories(userId),
        loadNotifications(userId),
        // Only load all users if admin
        ...(userRole === 'admin' ? [loadAllUsers()] : []),
    ]);
    // console.log('[loadAllUserData] Data load complete.'); // REMOVIDO LOG
    setLoadingAuth(false);
  };


  const loadUserProfile = async (supabaseUser: any) => {
    // console.log('[loadUserProfile] Attempting to load profile for:', supabaseUser.email); // REMOVIDO LOG
    
    // Optimization: Check if the user is already fully loaded and set up based on the ref
    if (userRef.current && userRef.current.id === supabaseUser.id && userRef.current.isSetupComplete) {
        // console.log('[loadUserProfile] Profile already loaded and setup complete. Skipping full fetch.'); // REMOVIDO LOG
        setLoadingAuth(false);
        return;
    }
    
    setLoadingAuth(true);
    
    // FIX: Adicionando filtro pelo ID do usuário autenticado para garantir que apenas 1 perfil seja retornado.
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id) // <-- CORREÇÃO AQUI
        .single();

    if (profileError) {
        console.error('[loadUserProfile] Error fetching profile:', profileError);
        // Fallback to basic user data if profile fetch fails
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
    
    // console.log('[loadUserProfile] Raw Profile Data:', profileData); // REMOVIDO LOG

    const appUser: User = {
        id: profileData.id,
        name: profileData.name || supabaseUser.email,
        email: supabaseUser.email, // <-- CORREÇÃO: Usando o email do perfil do DB (que é atualizado pelo trigger)
        phone: profileData.phone,
        cnpj: profileData.cnpj,
        isSetupComplete: profileData.is_setup_complete,
        role: (profileData.role || 'user') as 'admin' | 'user', // FIX: Ensure role is a string, defaulting to 'user'
        status: profileData.status as 'active' | 'inactive' | 'suspended',
        joinedAt: profileData.joined_at,
        lastActive: profileData.last_active, // Keep existing last_active from DB
        receiveWeeklySummary: profileData.receive_weekly_summary ?? true,
        cnpjData: profileData.cnpj_data, // NEW: Load CNPJ data
        fiscalSummary: profileData.fiscal_summary, // NEW: Load fiscal summary
    };
    
    // Se o email do perfil estiver vazio (o que não deveria acontecer após o trigger), usamos o email de autenticação.
    if (!appUser.email) {
        appUser.email = supabaseUser.email;
    }

    setUser(appUser);
    setCnpj(appUser.cnpj || '');
    setFiscalData(appUser.fiscalSummary || null); // Initialize fiscal data from profile
    
    if (appUser.isSetupComplete) {
        // console.log('[loadUserProfile] Setup complete. Loading user data.'); // REMOVIDO LOG
        loadAllUserData(appUser.id, appUser.role || 'user');
    } else {
        // console.log('[loadUserProfile] Setup not complete. Showing onboarding.'); // REMOVIDO LOG
        setLoadingAuth(false);
    }
  };

  // --- CALCULATE DASHBOARD METRICS ---
  const dashboardMetrics = useMemo(() => {
    const today = new Date();
    const cMonth = today.getMonth();
    const cYear = today.getFullYear();
    const todayStr = today.toISOString().split('T')[0];

    // 1. Filter transactions based on the current view mode
    const relevantTransactions = transactions.filter(t => {
        const [y, m] = t.date.split('-').map(Number);
        const tYear = y;
        const tMonth = m - 1;

        if (tYear !== cYear) return false;

        if (dashboardViewMode === 'monthly') {
            // Monthly: Only include current month transactions
            return tMonth === cMonth;
        }
        // Annual: Include all transactions from the current year
        return true;
    });

    // Realized (Paid Only)
    const realizedRevenue = relevantTransactions
      .filter(t => t.type === 'receita' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const realizedExpense = relevantTransactions
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const caixaAtual = realizedRevenue - realizedExpense;

    // Pending Transactions (Filtered by view mode)
    const pendingTrans = relevantTransactions.filter(t => t.status === 'pendente');

    // A Receber (Pending Revenue)
    const aReceber = pendingTrans
      .filter(t => t.type === 'receita')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // A Pagar (Pending Expense)
    const aPagar = pendingTrans
      .filter(t => t.type === 'despesa')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Caixa Projetado do Mês (Expected Balance)
    const totalExpectedRevenue = realizedRevenue + aReceber;
    const totalExpectedExpense = realizedExpense + aPagar;
    const caixaProjetado = totalExpectedRevenue - totalExpectedExpense;

    // Em Atraso (Overdue) & A Vencer (Upcoming) - Only for pending transactions
    let emAtraso = 0;
    let aVencer = 0;

    // Overdue/Upcoming calculation is typically only relevant for the current month/short term, 
    // but we apply the viewMode filter for consistency in the metric calculation context.
    pendingTrans
      .forEach(t => {
        if (t.date < todayStr) {
          // Sum of all overdue pending items (both revenue and expense)
          emAtraso += t.amount || 0;
        } else {
          // Sum of all upcoming pending items (both revenue and expense)
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
    // 0. Check for public route access before anything else
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const articleIdParam = params.get('articleId');
        const embedParam = params.get('embed'); // CHECK FOR EMBED PARAM
        
        if (embedParam === 'news-slider') {
            setIsEmbedView(true);
            setLoadingAuth(false);
            loadNewsAndOffers();
            loadConnectionConfig(); // Ensure config loads even in embed view
            return () => {};
        }

        if (params.get('page') === 'news') {
            setIsPublicView(true);
            setLoadingAuth(false);
            // Set readingNewsId if provided in URL
            if (articleIdParam) {
                setReadingNewsId(parseInt(articleIdParam));
            }
            // Ensure public data is loaded
            loadNewsAndOffers();
            loadConnectionConfig(); // Ensure config loads for public news view
            return () => {}; // Return empty cleanup function
        }
    }

    // Load maintenance config first, as it affects rendering
    loadMaintenanceConfig();
    // Load connection config unconditionally for all users (including public routes like cnpj-consult)
    loadConnectionConfig(); // <-- ADDED HERE

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = userRef.current; 
      const isUserAlreadyLoaded = currentUser && currentUser.id === session?.user?.id;
      
      // console.log(`[onAuthStateChange] Event: ${event}, Session Exists: ${!!session}, User Loaded: ${isUserAlreadyLoaded}`); // REMOVIDO LOG

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
        // Se o usuário foi atualizado (ex: email mudou), forçamos o recarregamento do perfil
        if (event === 'USER_UPDATED' || !isUserAlreadyLoaded) {
            loadUserProfile(session.user);
        } else {
            setLoadingAuth(false);
            // If user is already loaded and setup is complete, update last active time on refresh
            if (currentUser.isSetupComplete) {
                updateLastActive(currentUser.id);
            }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoadingAuth(false);
        // Clear persisted tab on sign out
        localStorage.removeItem('activeTab');
        setActiveTabState('home'); // Explicitly navigate to home view
      } else if (event === 'INITIAL_SESSION' && session?.user) {
        loadUserProfile(session.user);
      } else if (event === 'INITIAL_SESSION' && !session) {
        setLoadingAuth(false);
      }
    });

    // Load public data (News/Offers) even if not logged in
    loadNewsAndOffers();
    loadNotifications(); // Load public notifications (without user context)

    // Cleanup listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Dependency array remains empty
  
  // NEW: Effect to handle URL hash messages (Supabase confirmations)
  useEffect(() => {
      if (typeof window !== 'undefined') {
          const hash = window.location.hash;
          
          // 1. Tenta extrair parâmetros do hash
          const params = new URLSearchParams(hash.substring(1));
          const message = params.get('message') || params.get('error_description');
          
          if (message) {
              const decodedMessage = decodeURIComponent(message.replace(/\+/g, ' '));
              
              // Check for specific success messages related to email change or general confirmation
              if (decodedMessage.includes('Confirmation link accepted') || decodedMessage.includes('successfully')) {
                  showSuccess(decodedMessage);
              } else {
                  showWarning(decodedMessage);
              }
              
              // 2. Limpa o hash fragment para limpar a URL
              // Usamos replaceState para não adicionar uma entrada no histórico
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
      }
  }, []);


  // --- AUTH HANDLERS ---
  const handleLogin = (userData: User) => {
      // Redundant now, kept for AuthPage prop compatibility
  }

  const handleForgotPassword = async (email: string): Promise<boolean> => {
      // Handled by AuthPage using Supabase client
      return true;
  }

  const handleOnboardingComplete = async (newCnpj: string, theme: 'light' | 'dark', companyName: string, receiveWeeklySummary: boolean, cnpjData: CNPJResponse | null) => {
      if (!user) return;
      
      // console.log('[OnboardingComplete] Starting profile update...'); // REMOVIDO LOG
      
      // 1. Update Supabase Profile
      const now = new Date().toISOString(); // Capture current time for lastActive
      const { error } = await supabase
          .from('profiles')
          .update({ 
              cnpj: newCnpj, 
              name: companyName || user.name, 
              is_setup_complete: true,
              last_active: now, // Set last_active on completion
              receive_weekly_summary: receiveWeeklySummary,
              cnpj_data: cnpjData // NEW: Save the full CNPJ data
          })
          .eq('id', user.id);

      if (error) {
          console.error('[OnboardingComplete] Error updating profile during onboarding:', error);
          showError('Erro ao salvar dados. Tente novamente.');
          return;
      }
      
      // console.log('[OnboardingComplete] Profile updated successfully in DB.'); // REMOVIDO LOG

      // 2. Update Local State
      const updatedUser: User = { 
          ...user, 
          isSetupComplete: true, 
          cnpj: newCnpj,
          name: companyName || user.name,
          lastActive: now,
          receiveWeeklySummary: receiveWeeklySummary,
          cnpjData: cnpjData // NEW: Update local user state
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
      
      // 4. Load data for the first time
      loadAllUserData(user.id, updatedUser.role || 'user');
      
      // console.log('[OnboardingComplete] Local state updated. Navigating to dashboard.'); // REMOVIDO LOG
      setActiveTab('dashboard');
  }
  
  // NEW HANDLERS for Landing Page
  const handleLandingLogin = () => {
      setActiveTab('auth');
  };

  const handleLandingGetStarted = () => {
      setActiveTab('auth');
  };
  
  const handleStartCnpjFlow = () => {
      setActiveTab('cnpj-consult'); // Navigate to the new public page
  };
  
  const handleViewNews = (id: number) => {
    // console.log('Attempting to view news ID:', id); // REMOVIDO LOG
    
    // If in embed view, force parent navigation
    if (isEmbedView) {
        const baseUrl = window.location.origin;
        const publicUrl = `${baseUrl}/?page=news&articleId=${id}`;
        
        // Use window.top.location.href to break out of the iframe and navigate the parent window
        if (window.top) {
            window.top.location.href = publicUrl;
        } else {
            window.location.href = publicUrl;
        }
        return;
    }
    
    // If in dashboard or public view, update internal state
    setReadingNewsId(id);
    setActiveTab('news');
  };
  
  const handleBackToLanding = () => {
      setActiveTab('home');
  };


  // --- USER MANAGEMENT HANDLERS (Admin & Settings) ---
  
  const handleUpdateUser = async (updatedUser: User) => {
      // 1. Update Supabase Profile (only mutable fields)
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
              cnpj_data: updatedUser.cnpjData, // NEW: Update CNPJ data
              fiscal_summary: updatedUser.fiscalSummary, // NEW: Update fiscal summary
          })
          .eq('id', updatedUser.id);

      if (error) {
          console.error('Error updating user profile:', error);
          showError('Erro ao atualizar perfil do usuário.');
          return;
      }
      
      // 2. Update Local State
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

      // 1. Check if phone number already exists for another user
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
      
      // 2. Update the profile
      const { error: updateError } = await supabase
          .from('profiles')
          .update({ phone: cleanPhone })
          .eq('id', userId);

      if (updateError) {
          console.error('Error updating phone:', updateError);
          return { success: false, error: 'Erro ao salvar o novo telefone.' };
      }
      
      // 3. Update local state
      setUser(prev => {
          if (prev && prev.id === userId) {
              return { ...prev, phone: cleanPhone };
          }
          return prev;
      });
      
      return { success: true };
  };
  
  // NOVO: Função para atualizar o e-mail de autenticação
  const handleUpdateUserEmail = async (newEmail: string): Promise<{ success: boolean, error?: string }> => {
      if (!user) return { success: false, error: "Usuário não autenticado." };
      
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      
      if (error) {
          console.error("Error updating user email:", error);
          return { success: false, error: error.message };
      }
      
      // O Supabase envia um e-mail de confirmação. A alteração só é efetiva após o clique no link.
      // Não atualizamos o estado local do email aqui, apenas o notificamos.
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
      // Requires Service Role or Edge Function
      console.warn("Admin: Delete user functionality requires Supabase Service Role or Edge Function.");
      setAllUsers(allUsers.filter(u => u.id !== id));
      showSuccess('Usuário excluído (simulado).');
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

    // 1. Get the current session token
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
        dismissToast(loadingToastId);
        showError('Erro: Não foi possível obter o token de sessão.');
        return;
    }

    // 2. Call the Edge Function to delete the user and associated data
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
            // 3. Sign out locally after successful deletion by the server
            await supabase.auth.signOut();
            showSuccess('Conta excluída com sucesso. Você será deslogado.');
            
            // Reset local state immediately
            setUser(null);
            setActiveTab('home'); // Redirect to home
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
      setActiveTab('home'); // Explicitly navigate to home view
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
    loadNewsAndOffers(); // Reload news list
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
    loadNewsAndOffers(); // Reload news list
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
    loadNewsAndOffers(); // Reload news list
  };

  // --- NOTIFICATION HANDLERS ---
  const handleAddNotification = async (item: AppNotification) => {
      // FIX: Ensure empty string is converted to null for timestamp fields
      const expiresAtValue = item.expiresAt && item.expiresAt.trim() !== '' ? item.expiresAt : null;
      
      const payload = {
          text: item.text,
          type: item.type,
          poll_options: item.type === 'poll' ? item.pollOptions : null,
          expires_at: expiresAtValue, 
          active: true,
      };
      
      console.log('Payload de Inserção de Notificação:', payload);

      const { error } = await supabase
          .from('notifications')
          .insert(payload);

      if (error) {
          console.error('Error adding notification:', error);
          console.error('Detalhes do Erro:', error.message, error.details);
          showError('Erro ao publicar notificação. Verifique o console para detalhes.');
          return;
      }
      
      showSuccess('Notificação publicada!');
      loadNotifications(user?.id);
  }

  const handleUpdateNotification = async (item: AppNotification) => {
      // FIX: Ensure empty string is converted to null for timestamp fields
      const expiresAtValue = item.expiresAt && item.expiresAt.trim() !== '' ? item.expiresAt : null;
      
      const payload = {
          text: item.text,
          type: item.type,
          poll_options: item.type === 'poll' ? item.pollOptions : null,
          expires_at: expiresAtValue, 
          active: item.active,
      };
      
      console.log('Payload de Atualização de Notificação:', payload);

      const { error } = await supabase
          .from('notifications')
          .update(payload)
          .eq('id', item.id);

      if (error) {
          console.error('Error updating notification:', error);
          console.error('Detalhes do Erro:', error.message, error.details);
          showError('Erro ao atualizar notificação. Verifique o console para detalhes.');
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

    // Insert or update interaction to mark as read
    const { error } = await supabase
        .from('user_notification_interactions')
        .upsert({
            user_id: user.id,
            notification_id: id,
            is_read: true,
        }, { onConflict: 'user_id, notification_id' });

    if (error) {
        console.error('Error marking as read:', error);
        // Continue without showing error, as it's a background task
    }
    
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleVote = async (notificationId: number, optionId: number) => {
    if (!user) return;

    // Insert or update interaction to record vote
    const { error } = await supabase
        .from('user_notification_interactions')
        .upsert({
            user_id: user.id,
            notification_id: notificationId,
            voted_option_id: optionId,
            is_read: true, // Mark as read upon voting
            voted_at: new Date().toISOString()
        }, { onConflict: 'user_id, notification_id' });

    if (error) {
        console.error('Error recording vote:', error);
        showError('Erro ao registrar voto.');
        return;
    }
    
    showSuccess('Voto registrado com sucesso!');
    // FIX: Reload notifications to update vote counts and userVoted status
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
        external_api: tr.externalApi || false, // Ensure internal additions are FALSE
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
    // Update local state with new data returned from insert
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
    
    // NEW: Schedule reminder for the first pending transaction if it's not recurring/installment
    if (user.id && newTransactions.length === 1 && newTransactions[0].status === 'pendente' && !newTransactions[0].isRecurring && !newTransactions[0].installments) {
        
        // Adicionando verificação de data aqui também, embora a função scheduleTransactionReminder também verifique
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
        external_api: t.externalApi || false,
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
    
    // Update local state immutably
    setTransactions(prev => prev.map(tr => tr.id === t.id ? t : tr));
    // Also update external transactions list if the updated transaction was there
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
    // Update local state directly
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

      // For recurring transactions, delete all future entries
      if (t.isRecurring) {
          // Delete all entries with the same description/category/type that are PENDING
          query = query.eq('is_recurring', true).eq('status', 'pendente');
      } 
      // For installment transactions, delete all entries in the series
      else if (t.installments) {
          // Delete all entries with the same description/category/type regardless of status
          // NOTE: This assumes the user wants to delete the entire installment series, including paid ones.
          // If we only wanted to delete future ones, we'd need a unique series ID.
          // For simplicity, we delete all matching the core fields.
          query = query.not('installments', 'is', null);
      } else {
          // Should not happen if called correctly, but fallback to single delete
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
      
      // Reload transactions to reflect changes
      loadTransactions(user.id).then(setTransactions);
  };

  // --- EXTERNAL TRANSACTION MODAL HANDLER ---
  const handleCloseExternalModal = async () => {
      if (!user || externalTransactions.length === 0) {
          setExternalTransactions([]);
          return;
      }
      
      const idsToMarkAsInternal = externalTransactions.map(t => t.id);
      
      // Mark all currently displayed external transactions as internal (reviewed)
      const { error } = await supabase
          .from('transactions')
          .update({ external_api: false })
          .in('id', idsToMarkAsInternal)
          .eq('user_id', user.id);

      if (error) {
          console.error('Error marking external transactions as internal:', error);
          showError('Erro ao marcar transações como revisadas.');
          // We still clear the modal locally to avoid blocking the user
      }
      
      // Move transactions from external list to main list
      setTransactions(prev => [...externalTransactions.map(t => ({...t, externalApi: false})), ...prev]);
      setExternalTransactions([]);
  };

  // --- APPOINTMENT HANDLERS (Needs to be updated for Supabase) ---
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
    
    // NEW: Schedule reminder if notify is true
    if (newAppointment.notify) {
        await scheduleAppointmentReminder(user.id, newAppointment);
    }
    
    showSuccess('Compromisso adicionado!');
    setAppointments(prev => [newAppointment, ...prev]);
  };

  const handleUpdateAppointment = async (a: Appointment) => {
    if (!user) return;
    
    // 1. Delete existing reminder (if any)
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
    
    // 2. Re-schedule reminder if notify is true
    if (a.notify) {
        await scheduleAppointmentReminder(user.id, a);
    }

    showSuccess('Compromisso atualizado!');
    setAppointments(prev => prev.map(appt => appt.id === a.id ? a : appt));
  };

  const handleDeleteAppointment = async (id: number) => {
    if (!user) return;
    
    // 1. Delete existing reminder (if any)
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

  // --- CATEGORY HANDLERS (Now uses Supabase) ---
  const handleAddCategory = async (type: 'receita' | 'despesa', cat: Category) => {
    if (!user) return;
    
    // Check if category already exists locally (including defaults)
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
        showError('Erro ao adicionar categoria. Verifique se ela já existe.');
        return;
    }
    
    showSuccess(`Categoria '${cat.name}' adicionada.`);
    // Optimistic update + reload to ensure consistency
    loadUserCategories(user.id);
  };

  const handleDeleteCategory = async (type: 'receita' | 'despesa', name: string) => {
    if (!user) return;
    
    // Prevent deletion of default categories
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
    // Optimistic update + reload to ensure consistency
    loadUserCategories(user.id);
  };
  
  // --- CNPJ/FISCAL DATA HANDLERS (NEW PERSISTENCE LOGIC) ---
  
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
      
      // Update local user state
      setUser(prev => prev ? { ...prev, cnpjData: data } : null);
      showSuccess('Dados cadastrais atualizados!');
  };

  const handleUpdateFiscalData = async (data: FiscalData) => {
      if (!user) return;
      
      // 1. Update local state first
      setFiscalData(data);
      
      // 2. Persist to Supabase
      const { error } = await supabase
          .from('profiles')
          .update({ fiscal_summary: data })
          .eq('id', user.id);

      if (error) {
          console.error('Error updating fiscal summary:', error);
          showError('Erro ao salvar diagnóstico fiscal.');
          return;
      }
      
      // Update local user state
      setUser(prev => prev ? { ...prev, fiscalSummary: data } : null);
      showSuccess('Diagnóstico fiscal atualizado!');
  };


  // --- RENDER LOGIC ---
  
  if (loadingAuth) {
      // console.log('[Render] Loading Auth...'); // REMOVIDO LOG
      return (
          <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }
  
  // NEW: Render Embed View
  if (isEmbedView) {
      // console.log('[Render] Embed View Active.'); // REMOVIDO LOG
      return (
          <div className="w-full h-full bg-background-light dark:bg-background-dark overflow-hidden">
              <div className="max-w-full mx-auto p-4">
                  <NewsSlider news={news} onViewNews={handleViewNews} />
              </div>
          </div>
      );
  }

  if (isPublicView) {
      // console.log('[Render] Public News View Active.'); // REMOVIDO LOG
      return (
          <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
              <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 h-[72px] flex items-center justify-between px-6">
                  <div className="flex items-center gap-2">
                      <img 
                        src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
                        alt="Regular MEI" 
                        className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
                      />
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase ml-2">{activeTab === 'terms' ? 'Termos' : 'Privacidade'}</span>
                  </div>
                  <button 
                    onClick={() => {
                        setIsPublicView(false);
                        setReadingNewsId(null); // Clear article ID when navigating back
                        const url = new URL(window.location.href);
                        url.searchParams.delete('page');
                        url.searchParams.delete('articleId'); // Clear article ID from URL
                        window.history.pushState({}, '', url);
                        setActiveTab('home'); // Redirect to home/landing
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

  // Handle public pages (Terms and Privacy) when not logged in
  if (!user && (activeTab === 'terms' || activeTab === 'privacy')) {
      // console.log('[Render] Public Terms/Privacy View Active.'); // REMOVIDO LOG
      return (
          <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
              <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 h-[72px] flex items-center justify-between px-6">
                  <div className="flex items-center gap-2">
                      <img 
                        src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
                        alt="Regular MEI" 
                        className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
                      />
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase ml-2">{activeTab === 'terms' ? 'Termos' : 'Privacidade'}</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('auth')}
                    className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                  >
                      Voltar ao Login <span className="material-icons text-sm">login</span>
                  </button>
              </header>
              <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
                  {activeTab === 'terms' ? <TermsPage /> : <PrivacyPage />}
              </main>
              <footer className="mt-8 text-center text-sm text-slate-400 pb-8">
                <p>&copy; {new Date().getFullYear()} Regular MEI. Todos os direitos reservados.</p>
              </footer>
          </div>
      );
  }
  
  // NEW: Handle public CNPJ Consult Page
  if (!user && activeTab === 'cnpj-consult') {
      // console.log('[Render] Public CNPJ Consult View Active.'); // REMOVIDO LOG
      return <CnpjConsultPage onBack={handleBackToLanding} connectionConfig={connectionConfig} />;
  }

  // If not logged in, show LandingPage or AuthPage
  if (!user) {
      if (activeTab === 'auth') {
          // console.log('[Render] Auth Page Active.'); // REMOVIDO LOG
          return <AuthPage 
              onLogin={handleLogin} 
              onForgotPassword={handleForgotPassword} 
              onNavigate={setActiveTab} 
              onBackToLanding={handleBackToLanding}
          />;
      }
      // Default to LandingPage
      // console.log('[Render] Landing Page Active.'); // REMOVIDO LOG
      return <LandingPage 
          onGetStarted={handleLandingGetStarted} 
          onLogin={handleLandingLogin} 
          onViewBlog={handleViewNews} 
          onConsultCnpj={handleStartCnpjFlow}
          news={news} // PASSING NEWS DATA HERE
      />;
  }
  
  // console.log(`[Render] Logged In User: ${user.name}, Setup Complete: ${user.isSetupComplete}, Role: ${user.role}, Active Tab: ${activeTab}`); // REMOVIDO LOG

  if (!user.isSetupComplete) {
      // console.log('[Render] Showing Onboarding Page.'); // REMOVIDO LOG
      return <OnboardingPage user={user} onComplete={handleOnboardingComplete} />;
  }
  
  // Logged in user: Redirect if on a public-only tab
  if (activeTab === 'home' || activeTab === 'auth' || activeTab === 'cnpj-consult') {
      // console.log(`[Render] Redirecting from public tab (${activeTab}) to dashboard.`); // REMOVIDO LOG
      setActiveTab('dashboard');
      return null; // Prevent rendering until state updates
  }
  
  const isPageInMaintenance = (page: string) => {
      // Admins bypass all maintenance checks
      if (user?.role === 'admin') return false;

      // Global maintenance check
      if (maintenance.global && page !== 'admin' && page !== 'settings') return true;
      
      // Per-page maintenance check
      if (maintenance[page as keyof MaintenanceConfig]) return true;
      
      return false;
  }

  const renderContent = () => {
      // Permission check for Admin page
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
                {/* --- MOBILE LAYOUT --- */}
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

                {/* --- DESKTOP LAYOUT --- */}
                <div className="hidden md:block space-y-6">
                  
                  {/* TOP BAR: Selector and Quick Actions */}
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

                  {/* STAT CARDS MOVED HERE */}
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
                onUpdateCnpjData={handleUpdateCnpjData} // NEW PROP
                connectionConfig={connectionConfig} 
                cnpjData={user?.cnpjData} 
            />;
          case 'tools': return <ToolsPage user={user} />;
          case 'news': return <NewsPage news={news} readingId={readingNewsId} onSelectNews={(id) => setReadingNewsId(id)} />;
          case 'offers': 
            return <ProductsByCnaePage 
                user={user} 
                productRedirectWebhookUrl={connectionConfig.productRedirectWebhookUrl} // PASSANDO A URL AQUI
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
              onUpdateUserEmail={handleUpdateUserEmail} // <--- NEW PROP
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
          case 'more': // NEW CASE
            return <MorePage onNavigate={setActiveTab} userRole={user.role} />;
          case 'terms': return <TermsPage />;
          case 'privacy': return <PrivacyPage />;
          default: return null;
      }
  };

  // Main App Structure
  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark overflow-hidden relative">
      {/* Sidebar (Desktop Only) */}
      {user && (
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={false} toggleSidebar={() => {}} userRole={user?.role} />
      )}
      
      <div className={`flex-1 flex flex-col overflow-hidden`}>
        {user && (
            <Header activeTab={activeTab} onMenuClick={() => {}} notifications={notifications} onMarkAsRead={handleMarkAsRead} onVote={handleVote} user={user} onLogout={handleLogout} onNavigateToProfile={() => setActiveTab('settings')} />
        )}
        
        {/* Main Content Area - Added pb-20 for mobile to prevent content being hidden by bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth relative lg:pb-8 pb-20">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Conditional rendering for global maintenance */}
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
      
      {/* External Transaction Modal */}
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
      
      {/* VIRTUAL ASSISTANT UI */}
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
      
      {/* Mobile Bottom Navigation (Mobile Only) */}
      {user && (
          <MobileBottomNav 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              userRole={user.role} 
          />
      )}
      
      {/* QUICK ADD / EDIT TRANSACTION MODAL */}
      {quickAddModalType && (
          <TransactionModal
              type={quickAddModalType}
              isOpen={!!quickAddModalType}
              onClose={() => setQuickAddModalType(null)}
              onSave={handleAddTransaction}
              revenueCats={revenueCats}
              expenseCats={expenseCats}
              editingTransaction={null} // Always null for quick add
              forcedType={quickAddModalType}
          />
      )}
    </div>
  );
};

export default App;