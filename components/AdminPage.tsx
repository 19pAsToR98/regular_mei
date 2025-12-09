import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Offer, NewsItem, MaintenanceConfig, AppNotification, PollOption, ConnectionConfig, ApiFieldMapping, User } from '../types';
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toastUtils';

interface AdminPageProps {
  offers: Offer[];
  onAddOffer: (offer: Offer) => void;
  onUpdateOffer: (offer: Offer) => void;
  onDeleteOffer: (id: number) => void;
  
  news: NewsItem[];
  onAddNews: (news: NewsItem) => Promise<void>; // Updated to async
  onUpdateNews: (news: NewsItem) => Promise<void>; // Updated to async
  onDeleteNews: (id: number) => Promise<void>; // Updated to async

  notifications: AppNotification[];
  onAddNotification: (n: AppNotification) => void;
  onUpdateNotification: (n: AppNotification) => void;
  onDeleteNotification: (id: number) => void;

  maintenance: MaintenanceConfig;
  onUpdateMaintenance: (config: MaintenanceConfig) => void;

  connectionConfig: ConnectionConfig;
  onUpdateConnectionConfig: (config: ConnectionConfig) => void;

  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

// ... Icons and Colors definitions omitted for brevity ...
const availableIcons = [
  'work', 'shopping_cart', 'shopping_bag', 'inventory_2', 'savings', 
  'account_balance', 'payments', 'attach_money', 'receipt_long', 'credit_card',
  'local_shipping', 'wifi', 'computer', 'phone_iphone', 'build', 
  'restaurant', 'flight', 'directions_car', 'home', 'apartment',
  'school', 'health_and_safety', 'fitness_center', 'groups', 'campaign',
  'content_cut', 'palette', 'camera_alt', 'music_note', 'pets', 'store', 
  'laptop_mac', 'verified_user', 'analytics'
];

const tailwindColors = [
  { name: 'Purple', class: 'bg-purple-600', text: 'text-purple-600' },
  { name: 'Blue', class: 'bg-blue-500', text: 'text-blue-500' },
  { name: 'Emerald', class: 'bg-emerald-500', text: 'text-emerald-500' },
  { name: 'Orange', class: 'bg-orange-500', text: 'text-orange-500' },
  { name: 'Red', class: 'bg-red-500', text: 'text-red-500' },
  { name: 'Slate', class: 'bg-slate-800', text: 'text-slate-800' },
  { name: 'Cyan', class: 'bg-cyan-600', text: 'text-cyan-600' },
  { name: 'Pink', class: 'bg-pink-500', text: 'text-pink-500' },
];

const AdminPage: React.FC<AdminPageProps> = ({ 
    offers, onAddOffer, onUpdateOffer, onDeleteOffer,
    news, onAddNews, onUpdateNews, onDeleteNews,
    notifications, onAddNotification, onUpdateNotification, onDeleteNotification,
    maintenance, onUpdateMaintenance,
    connectionConfig, onUpdateConnectionConfig,
    users, onAddUser, onUpdateUser, onDeleteUser
}) => {
  // Initialize activeTab from localStorage or default to 'users'
  const [activeTab, setActiveTabState] = useState<'users' | 'news' | 'offers' | 'notifications' | 'maintenance' | 'connections'>(() => {
      if (typeof window !== 'undefined') {
          return (localStorage.getItem('adminActiveTab') as any) || 'users';
      }
      return 'users';
  });
  
  const setActiveTab = (tab: typeof activeTab) => {
      setActiveTabState(tab);
      localStorage.setItem('adminActiveTab', tab);
  };

  const [isSubmitting, setIsSubmitting] = useState(false); // Global loading state for admin actions

  // --- USERS STATE ---
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<Partial<User>>({
      name: '', email: '', phone: '', role: 'user', status: 'active', cnpj: ''
  });
  
  // User Filters & Pagination
  const [userSearch, setUserSearch] = useState('');
  const [userFilterType, setUserFilterType] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 5;

  // --- NEWS STATE ---
  const initialNewsForm: Omit<NewsItem, 'id'> = {
    title: '', category: 'Legislação', excerpt: '', content: '', imageUrl: '', readTime: '', date: '', status: 'draft'
  };
  const [newsForm, setNewsForm] = useState(initialNewsForm);
  const [editingNewsId, setEditingNewsId] = useState<number | null>(null);
  const [showNewsPreview, setShowNewsPreview] = useState(false);
  
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  // --- OFFERS STATE ---
  const initialOfferForm: Omit<Offer, 'id'> = {
    partnerName: '', partnerColor: 'bg-blue-500', partnerIcon: 'store', discount: '',
    title: '', description: '', category: 'Finanças', code: '', link: '',
    expiry: '', isExclusive: false, isFeatured: false
  };
  const [offerForm, setOfferForm] = useState(initialOfferForm);
  const [editingOfferId, setEditingOfferId] = useState<number | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // --- NOTIFICATIONS STATE ---
  const initialNotifForm: {
    text: string;
    type: 'info' | 'warning' | 'success' | 'poll';
    pollOptions: string[];
    expiresAt: string;
  } = {
    text: '', type: 'info', pollOptions: ['Sim', 'Não'], expiresAt: ''
  };
  const [notifForm, setNotifForm] = useState(initialNotifForm);
  const [editingNotifId, setEditingNotifId] = useState<number | null>(null);
  const [viewingResultsPoll, setViewingResultsPoll] = useState<AppNotification | null>(null);

  // --- CONNECTIONS FORM STATE ---
  const [localConnConfig, setLocalConnConfig] = useState<ConnectionConfig>(connectionConfig);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testType, setTestType] = useState<'cnpj' | 'diagnostic'>('cnpj');
  const [testCnpj, setTestCnpj] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testParsedData, setTestParsedData] = useState<any | null>(null);

  // --- USERS LOGIC & HANDLERS ---
  
  // Reset pagination when filter changes
  useEffect(() => {
      setUserPage(1);
  }, [userSearch, userFilterType]);

  const userStats = useMemo(() => {
      const now = new Date();
      const oneDay = 24 * 60 * 60 * 1000;
      const oneWeek = 7 * oneDay;
      const oneMonth = 30 * oneDay;

      const active24h = users.filter(u => u.lastActive && (now.getTime() - new Date(u.lastActive).getTime()) < oneDay).length;
      const activeWeek = users.filter(u => u.lastActive && (now.getTime() - new Date(u.lastActive).getTime()) < oneWeek).length;
      const activeMonth = users.filter(u => u.lastActive && (now.getTime() - new Date(u.lastActive).getTime()) < oneMonth).length;
      const newThisMonth = users.filter(u => u.joinedAt && (now.getTime() - new Date(u.joinedAt).getTime()) < oneMonth).length;

      return { total: users.length, active24h, activeWeek, activeMonth, newThisMonth };
  }, [users]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
      const now = new Date();
      const dayMs = 1000 * 60 * 60 * 24;

      return users.filter(user => {
          // 1. Text Search
          const searchLower = userSearch.toLowerCase();
          const matchesSearch = 
              user.name.toLowerCase().includes(searchLower) ||
              user.email.toLowerCase().includes(searchLower) ||
              (user.cnpj && user.cnpj.includes(searchLower));
          
          if (!matchesSearch) return false;

          // 2. Dropdown Filter
          if (userFilterType === 'all') return true;
          if (userFilterType === 'active') return user.status === 'active';
          if (userFilterType === 'inactive') return user.status === 'inactive';
          if (userFilterType === 'suspended') return user.status === 'suspended';
          if (userFilterType === 'admin') return user.role === 'admin';
          
          // Time-based filters
          if (userFilterType === 'inactive_30d') {
              if (!user.lastActive) return true; // Never active matches inactive
              const daysInactive = (now.getTime() - new Date(user.lastActive).getTime()) / dayMs;
              return daysInactive > 30;
          }
          if (userFilterType === 'inactive_90d') {
              if (!user.lastActive) return true;
              const daysInactive = (now.getTime() - new Date(user.lastActive).getTime()) / dayMs;
              return daysInactive > 90;
          }

          return true;
      });
  }, [users, userSearch, userFilterType]);

  // Paginated Users List
  const paginatedUsers = useMemo(() => {
      const startIndex = (userPage - 1) * usersPerPage;
      return filteredUsers.slice(startIndex, startIndex + usersPerPage);
  }, [filteredUsers, userPage]);

  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleEditUserClick = (user: User) => {
      setEditingUserId(user.id);
      setUserForm({
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          cnpj: user.cnpj || '',
          role: user.role || 'user',
          status: user.status || 'active'
      });
      setUserModalOpen(true);
  };

  const handleDeleteUserClick = (id: string) => {
      if (window.confirm("ATENÇÃO: Excluir este usuário removerá todo o acesso dele à plataforma. Continuar?")) {
          onDeleteUser(id);
      }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      await new Promise(r => setTimeout(r, 1000));

      const now = new Date().toISOString();
      
      const payload: User = {
          id: editingUserId || Date.now().toString(),
          name: userForm.name || '',
          email: userForm.email || '',
          phone: userForm.phone,
          cnpj: userForm.cnpj,
          role: userForm.role as 'admin' | 'user',
          status: userForm.status as 'active' | 'inactive' | 'suspended',
          isSetupComplete: true, // Assuming manual admin creation implies setup
          lastActive: editingUserId ? (users.find(u => u.id === editingUserId)?.lastActive) : undefined,
          joinedAt: editingUserId ? (users.find(u => u.id === editingUserId)?.joinedAt) : now
      };

      if (editingUserId) {
          onUpdateUser(payload);
      } else {
          onAddUser(payload);
      }
      setIsSubmitting(false);
      setUserModalOpen(false);
      setEditingUserId(null);
      setUserForm({ name: '', email: '', phone: '', role: 'user', status: 'active', cnpj: '' });
  };

  // --- NEWS HANDLERS ---
  const handleEditNewsClick = (e: React.MouseEvent, item: NewsItem) => {
      e.stopPropagation();
      setEditingNewsId(item.id);
      setNewsForm({
          title: item.title, category: item.category, excerpt: item.excerpt, 
          content: item.content, imageUrl: item.imageUrl, readTime: item.readTime, 
          date: item.date, status: item.status
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelNewsEdit = () => {
      setEditingNewsId(null);
      setNewsForm(initialNewsForm);
  };

  const handleDeleteNewsClick = async (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      e.preventDefault();
      if(window.confirm('Tem certeza que deseja excluir esta notícia?')) {
          await onDeleteNews(id);
          if (editingNewsId === id) handleCancelNewsEdit();
      }
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    
    const newsPayload: NewsItem = { 
        id: editingNewsId || Date.now(), 
        ...newsForm, 
        date: newsForm.date || dateStr 
    };

    if (editingNewsId) {
        await onUpdateNews(newsPayload);
    } else {
        await onAddNews(newsPayload);
    }
    
    setIsSubmitting(false);
    handleCancelNewsEdit();
  };

  const handleFormat = (tagStart: string, tagEnd: string) => {
    if (contentInputRef.current) {
        const start = contentInputRef.current.selectionStart;
        const end = contentInputRef.current.selectionEnd;
        const text = newsForm.content;
        const newText = text.substring(0, start) + tagStart + text.substring(start, end) + tagEnd + text.substring(end);
        setNewsForm({ ...newsForm, content: newText });
        
        setTimeout(() => {
            contentInputRef.current?.focus();
            contentInputRef.current?.setSelectionRange(start + tagStart.length, end + tagStart.length);
        }, 10);
    }
  };

  // --- OFFERS HANDLERS ---
  const handleEditOfferClick = (e: React.MouseEvent, offer: Offer) => {
    e.stopPropagation();
    setEditingOfferId(offer.id);
    setOfferForm({
        partnerName: offer.partnerName, partnerColor: offer.partnerColor, partnerIcon: offer.partnerIcon,
        discount: offer.discount, title: offer.title, description: offer.description, category: offer.category,
        code: offer.code || '', link: offer.link || '', expiry: offer.expiry,
        isExclusive: offer.isExclusive || false, isFeatured: offer.isFeatured || false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelOfferEdit = () => {
      setEditingOfferId(null);
      setOfferForm(initialOfferForm);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));

    if (editingOfferId) {
        onUpdateOffer({ id: editingOfferId, ...offerForm });
    } else {
        onAddOffer({ id: Date.now(), ...offerForm });
    }
    setIsSubmitting(false);
    handleCancelOfferEdit();
  };

  const handleDeleteOfferClick = (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      e.preventDefault();
      if(window.confirm('Tem certeza que deseja excluir esta oferta?')) {
          onDeleteOffer(id);
          if (editingOfferId === id) handleCancelOfferEdit();
      }
  }

  // --- NOTIFICATION HANDLERS ---
  const handleAddPollOption = () => {
      setNotifForm({...notifForm, pollOptions: [...notifForm.pollOptions, `Opção ${notifForm.pollOptions.length + 1}`]});
  }

  const handleRemovePollOption = (index: number) => {
      const newOptions = notifForm.pollOptions.filter((_, i) => i !== index);
      setNotifForm({...notifForm, pollOptions: newOptions});
  }

  const handlePollOptionChange = (index: number, value: string) => {
      const newOptions = [...notifForm.pollOptions];
      newOptions[index] = value;
      setNotifForm({...notifForm, pollOptions: newOptions});
  }

  const handleEditNotifClick = (item: AppNotification) => {
      setEditingNotifId(item.id);
      setNotifForm({
          text: item.text,
          type: item.type,
          pollOptions: item.pollOptions ? item.pollOptions.map(o => o.text) : ['Sim', 'Não'],
          expiresAt: item.expiresAt || ''
      });
  }

  const handleCancelNotifEdit = () => {
      setEditingNotifId(null);
      setNotifForm(initialNotifForm);
  }

  const handleDeleteNotifClick = (id: number) => {
      if(window.confirm("Excluir esta notificação?")) {
          onDeleteNotification(id);
          if (editingNotifId === id) handleCancelNotifEdit();
      }
  }

  const handleSaveNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));

    const dateStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('pt-BR');
    
    let pollData: PollOption[] | undefined = undefined;
    if (notifForm.type === 'poll') {
        pollData = notifForm.pollOptions.map((opt, idx) => ({ id: idx, text: opt, votes: 0 }));
    }

    const payload: AppNotification = {
        id: editingNotifId || Date.now(),
        text: notifForm.text,
        type: notifForm.type,
        date: editingNotifId ? (notifications.find(n => n.id === editingNotifId)?.date || dateStr) : dateStr,
        active: true,
        pollOptions: pollData,
        expiresAt: notifForm.expiresAt,
        // Preserve existing votes if updating
        pollVotes: editingNotifId ? (notifications.find(n => n.id === editingNotifId)?.pollVotes || []) : []
    };

    if (editingNotifId) {
        onUpdateNotification(payload);
    } else {
        onAddNotification(payload);
    }
    setIsSubmitting(false);
    handleCancelNotifEdit();
  };

  const handleExportPollVotes = () => {
      if (!viewingResultsPoll || !viewingResultsPoll.pollVotes) return;

      const headers = ["Data/Hora", "Usuário", "Email", "Voto (Opção)"];
      const rows = viewingResultsPoll.pollVotes.map(v => [
          new Date(v.votedAt).toLocaleString('pt-BR'),
          v.userName,
          v.userEmail,
          v.optionText
      ]);

      const csvContent = "\uFEFF" + headers.join(";") + "\n" + rows.map(r => r.join(";")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `enquete_${viewingResultsPoll.id}_resultados.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- MAINTENANCE HANDLER ---
  const toggleMaintenance = (key: keyof MaintenanceConfig) => {
    onUpdateMaintenance({ ...maintenance, [key]: !maintenance[key] });
  };

  // --- CONNECTION HANDLERS ---
  const handleSaveConnection = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      await new Promise(r => setTimeout(r, 1000));
      onUpdateConnectionConfig(localConnConfig);
      setIsSubmitting(false);
      showSuccess('Configurações de conexão salvas com sucesso!');
  };

  // Helper to extract nested values
  const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const handleTestConnection = async () => {
      if (!testCnpj) {
          showWarning('Por favor, insira um CNPJ para teste.');
          return;
      }
      
      setTestLoading(true);
      setTestResponse(null);
      setTestParsedData(null);
      
      try {
          const cleanCnpj = testCnpj.replace(/[^\d]/g, '');
          let url = '';
          let options: RequestInit = {};

          if (testType === 'cnpj') {
              url = `https://corsproxy.io/?${encodeURIComponent(localConnConfig.cnpjApi.baseUrl + cleanCnpj)}`;
          } else {
              // Diagnostic API logic
              const webhookUrl = localConnConfig.diagnosticApi.webhookUrl;
              const urlWithParams = `${webhookUrl}?cnpj=${cleanCnpj}`;
              url = `https://corsproxy.io/?${encodeURIComponent(urlWithParams)}`;
              options = {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      [localConnConfig.diagnosticApi.headerKey || 'cnpj']: cleanCnpj
                  },
                  body: JSON.stringify({ cnpj: cleanCnpj })
              };
          }

          const response = await fetch(url, options);
          const rawText = await response.text();
          let json;
          try {
              json = JSON.parse(rawText);
          } catch {
              json = { error: "Could not parse JSON", raw: rawText };
          }

          setTestResponse(JSON.stringify(json, null, 2));

          // Parse based on mappings
          const mappings = testType === 'cnpj' ? localConnConfig.cnpjApi.mappings : localConnConfig.diagnosticApi.mappings;
          
          let dataToMap = json;
          if (Array.isArray(json) && json.length > 0) dataToMap = json[0];
          if (dataToMap?.resultado) dataToMap = dataToMap.resultado;

          const parsed: Record<string, any> = {};
          mappings.forEach(m => {
              if (m.visible) {
                  let val = getNestedValue(dataToMap, m.jsonPath);
                  if (typeof val === 'object') val = JSON.stringify(val);
                  parsed[m.label] = val !== undefined ? val : 'N/A';
              }
          });
          setTestParsedData(parsed);

      } catch (error: any) {
          setTestResponse(`Error: ${error.message}`);
      } finally {
          setTestLoading(false);
      }
  };

  const handleUpdateMapping = (apiType: 'cnpj' | 'diagnostic', index: number, field: keyof ApiFieldMapping, value: any) => {
      const newConfig = { ...localConnConfig };
      const mappings = apiType === 'cnpj' ? newConfig.cnpjApi.mappings : newConfig.diagnosticApi.mappings;
      mappings[index] = { ...mappings[index], [field]: value };
      setLocalConnConfig(newConfig);
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
          case 'news': return <NewsPage news={news} readingId={readingNewsId} onSelectNews={setReadingNewsId} />;
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