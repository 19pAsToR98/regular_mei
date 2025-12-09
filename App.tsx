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
import { supabase } from './src/integrations/supabase/client';
import { showSuccess, showError, showLoading, dismissToast } from './utils/toastUtils';

// --- MOCK DATA REMOVED ---

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isPublicView, setIsPublicView] = useState(false);

  // Initialize activeTab from localStorage or default to 'dashboard'
  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activeTab') || 'dashboard';
    }
    return 'dashboard';
  });
  
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    localStorage.setItem('activeTab', tab);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  
  // --- APP STATE ---
  const [cnpj, setCnpj] = useState('');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [readingNewsId, setReadingNewsId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // --- FISCAL DATA STATE (Lifted) ---
  const [fiscalData, setFiscalData] = useState<FiscalData | null>(null);

  // --- USER MANAGEMENT STATE (Used for Admin view) ---
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
          role: p.role as 'admin' | 'user',
          status: p.status as 'active' | 'inactive' | 'suspended',
          joinedAt: p.joined_at,
          lastActive: p.last_active
      }));
      setAllUsers(mappedUsers);
  };

  const loadTransactions = async (userId: string) => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
    // Map Supabase data to local Transaction type (assuming Supabase columns match)
    return data.map(t => ({
        ...t,
        id: t.id, // Assuming ID is number/bigint
        amount: parseFloat(t.amount),
        expectedAmount: t.expected_amount ? parseFloat(t.expected_amount) : undefined,
        isRecurring: t.is_recurring,
        installments: t.installments,
        // Ensure date is in YYYY-MM-DD format if needed
    })) as Transaction[];
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
        }));
        setNews(mappedNews);
    } else {
        console.error('Error fetching news:', newsError);
    }

    // Offers (Publicly readable via RLS)
    const { data: offersData, error: offersError } = await supabase
        .from('offers')
        .select('*')
        .order('is_featured', { ascending: false });
    
    if (!offersError) {
        setOffers(offersData as Offer[]);
    } else {
        console.error('Error fetching offers:', offersError);
    }
  };

  const loadNotifications = async () => {
    // Notifications (Publicly readable via RLS, but we need user interaction data)
    const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
    
    if (notifError) {
        console.error('Error fetching notifications:', notifError);
        return;
    }

    const currentUserId = user?.id;
    const processedNotifications: AppNotification[] = notifData.map(n => {
        let userVotedOptionId: number | undefined = undefined;
        let read = false;

        // Simulate fetching user interaction (read status and vote)
        // NOTE: In a real app, we would fetch user_notification_interactions separately for efficiency
        
        // For now, we simulate the interaction data based on the existing structure
        if (currentUserId) {
            // Check if read (simplification: assume read if interaction exists)
            // Check if voted (if poll, check if user_notification_interactions has a vote)
            // Since we don't have the interaction data here, we leave read/voted as default false/undefined
        }

        return {
            id: n.id,
            text: n.text,
            type: n.type as 'info' | 'warning' | 'success' | 'poll',
            date: new Date(n.created_at).toLocaleDateString('pt-BR'),
            pollOptions: n.poll_options,
            pollVotes: [], // Detailed votes are complex to fetch here, keep empty for now
            active: n.active,
            expiresAt: n.expires_at,
            read: read,
            userVotedOptionId: userVotedOptionId
        } as AppNotification;
    });

    setNotifications(processedNotifications);
  };

  const loadAllUserData = async (userId: string, userRole: 'admin' | 'user') => {
      setLoadingAuth(true);
      
      const promises = [
          loadTransactions(userId),
          loadAppointments(userId),
          loadNewsAndOffers(),
          loadNotifications()
      ];

      if (userRole === 'admin') {
          promises.push(loadAllUsers() as any);
      }

      const [trans, appts] = await Promise.all(promises);

      setTransactions(trans as Transaction[]);
      setAppointments(appts as Appointment[]);
      setLoadingAuth(false);
  };

  const loadUserProfile = async (supabaseUser: any) => {
    setLoadingAuth(true);
    
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
        lastActive: profileData.last_active
    };

    setUser(appUser);
    setCnpj(appUser.cnpj || '');
    
    if (appUser.isSetupComplete) {
        loadAllUserData(appUser.id, appUser.role || 'user');
    } else {
        setLoadingAuth(false);
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
        // Clear persisted tab on sign out
        localStorage.removeItem('activeTab');
        setActiveTabState('dashboard');
      } else if (event === 'INITIAL_SESSION' && session?.user) {
        loadUserProfile(session.user);
      } else if (event === 'INITIAL_SESSION' && !session) {
        setLoadingAuth(false);
      }
    });

    // Load public data (News/Offers) even if not logged in
    loadNewsAndOffers();
    loadNotifications(); // Load public notifications

    // Cleanup listener
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- CALCULATE DASHBOARD STATS (Remains the same) ---
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

  // --- AUTH HANDLERS ---
  const handleLogin = (userData: User) => {
      // Redundant now, kept for AuthPage prop compatibility
  }

  const handleForgotPassword = async (email: string): Promise<boolean> => {
      // Handled by AuthPage using Supabase client
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
          showError('Erro ao salvar dados. Tente novamente.');
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
      
      // 4. Load data for the first time
      loadAllUserData(user.id, updatedUser.role || 'user');
  }

  // --- USER MANAGEMENT HANDLERS (Admin) ---
  const handleAddUser = (newUser: User) => {
      setAllUsers([...allUsers, newUser]);
      showSuccess('Usuário adicionado com sucesso!');
  };

  const handleUpdateUser = (updatedUser: User) => {
      setAllUsers(allUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (user && user.id === updatedUser.id) {
          setUser(updatedUser);
      }
      showSuccess('Perfil atualizado com sucesso!');
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
            setActiveTab('dashboard');
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
  };

  // --- OFFERS HANDLERS ---
  const handleAddOffer = async (newOffer: Offer) => {
    const payload = {
        partner_name: newOffer.partnerName,
        partner_color: newOffer.partnerColor,
        partner_icon: newOffer.partnerIcon,
        discount: newOffer.discount,
        title: newOffer.title,
        description: newOffer.description,
        category: newOffer.category,
        code: newOffer.code,
        link: newOffer.link,
        expiry: newOffer.expiry,
        is_exclusive: newOffer.isExclusive,
        is_featured: newOffer.isFeatured,
    };

    const { error } = await supabase
        .from('offers')
        .insert(payload);

    if (error) {
        console.error('Error adding offer:', error);
        showError('Erro ao adicionar oferta.');
        return;
    }
    
    showSuccess('Oferta adicionada!');
    loadNewsAndOffers();
  };

  const handleUpdateOffer = async (updatedOffer: Offer) => {
    const payload = {
        partner_name: updatedOffer.partnerName,
        partner_color: updatedOffer.partnerColor,
        partner_icon: updatedOffer.partnerIcon,
        discount: updatedOffer.discount,
        title: updatedOffer.title,
        description: updatedOffer.description,
        category: updatedOffer.category,
        code: updatedOffer.code,
        link: updatedOffer.link,
        expiry: updatedOffer.expiry,
        is_exclusive: updatedOffer.isExclusive,
        is_featured: updatedOffer.isFeatured,
    };

    const { error } = await supabase
        .from('offers')
        .update(payload)
        .eq('id', updatedOffer.id);

    if (error) {
        console.error('Error updating offer:', error);
        showError('Erro ao atualizar oferta.');
        return;
    }
    
    showSuccess('Oferta atualizada!');
    loadNewsAndOffers();
  };

  const handleDeleteOffer = async (id: number) => {
    const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting offer:', error);
        showError('Erro ao excluir oferta.');
        return;
    }
    
    showSuccess('Oferta excluída.');
    loadNewsAndOffers();
  };

  // --- NEWS HANDLERS ---
  const handleViewNews = (id: number) => {
    setReadingNewsId(id);
    setActiveTab('news');
  };

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
  const handleAddNotification = (item: AppNotification) => {
      setNotifications([item, ...notifications]);
      showSuccess('Notificação publicada!');
  }

  const handleUpdateNotification = (item: AppNotification) => {
      setNotifications(notifications.map(n => n.id === item.id ? item : n));
      showSuccess('Notificação atualizada!');
  }

  const handleDeleteNotification = (id: number) => {
      setNotifications((prev) => prev.filter(n => n.id !== id));
      showSuccess('Notificação excluída.');
  }

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleVote = (notificationId: number, optionId: number) => {
    // This requires a database interaction to record the vote in user_notification_interactions
    console.warn("Voting functionality requires database interaction (user_notification_interactions).");
    
    setNotifications(prev => prev.map(n => {
      if (n.id === notificationId && n.pollOptions && user) {
        
        // 1. Update Vote Count (Optimistic UI update)
        const updatedOptions = n.pollOptions.map(opt => 
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        );

        // 2. Record User Vote (Simulated local update)
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
    showSuccess('Voto registrado com sucesso!');
  };

  // --- CASHFLOW HANDLERS (Needs to be updated for Supabase) ---
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
    // Reload data to update UI
    loadAllUserData(user.id, user.role || 'user');
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
    };

    const { error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', t.id)
        .eq('user_id', user.id); // Ensure RLS compliance

    if (error) {
        console.error('Error updating transaction:', error);
        showError('Erro ao atualizar transação.');
        return;
    }
    
    showSuccess('Transação atualizada com sucesso!');
    // Reload data to update UI
    loadAllUserData(user.id, user.role || 'user');
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!user) return;

    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure RLS compliance

    if (error) {
        console.error('Error deleting transaction:', error);
        showError('Erro ao excluir transação.');
        return;
    }
    
    showSuccess('Transação excluída.');
    // Reload data to update UI
    loadAllUserData(user.id, user.role || 'user');
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

    const { error } = await supabase
        .from('appointments')
        .insert(payload);

    if (error) {
        console.error('Error adding appointment:', error);
        showError('Erro ao adicionar compromisso.');
        return;
    }
    showSuccess('Compromisso adicionado!');
    loadAllUserData(user.id, user.role || 'user');
  };

  const handleUpdateAppointment = async (a: Appointment) => {
    if (!user) return;

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
        console.error('Error updating appointment:', error);
        showError('Erro ao atualizar compromisso.');
        return;
    }
    showSuccess('Compromisso atualizado!');
    loadAllUserData(user.id, user.role || 'user');
  };

  const handleDeleteAppointment = async (id: number) => {
    if (!user) return;

    const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting appointment:', error);
        showError('Erro ao excluir compromisso.');
        return;
    }
    showSuccess('Compromisso excluído.');
    loadAllUserData(user.id, user.role || 'user');
  };

  // --- CATEGORY HANDLERS (Local state for now) ---
  const handleAddCategory = (type: 'receita' | 'despesa', cat: Category) => {
    if (type === 'receita') {
      setRevenueCats([...revenueCats, cat]);
    } else {
      setExpenseCats([...expenseCats, cat]);
    }
    showSuccess(`Categoria '${cat.name}' adicionada.`);
  };

  const handleDeleteCategory = (type: 'receita' | 'despesa', name: string) => {
    if (type === 'receita') {
      setRevenueCats(revenueCats.filter(c => c.name !== name));
    } else {
      setExpenseCats(expenseCats.filter(c => c.name !== name));
    }
    showSuccess(`Categoria '${name}' excluída.`);
  };

  // --- RENDER LOGIC ---
  
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