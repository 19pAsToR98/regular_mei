import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Offer, NewsItem, MaintenanceConfig, AppNotification, PollOption, ConnectionConfig, ApiFieldMapping, User } from '../types';
import NewsEditor from './NewsEditor'; // Importando o novo editor
import FileUpload from './FileUpload'; // IMPORTANDO O NOVO COMPONENTE

interface AdminPageProps {
  offers: Offer[];
  onAddOffer: (offer: Offer) => void;
  onUpdateOffer: (offer: Offer) => void;
  onDeleteOffer: (id: number) => void;
  
  news: NewsItem[];
  onAddNews: (news: NewsItem) => void;
  onUpdateNews: (news: NewsItem) => void;
  onDeleteNews: (id: number) => void;

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

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
};

// Helper to format ISO date string to readable format
const formatLastActive = (isoDate?: string) => {
    if (!isoDate) return 'Nunca';
    try {
        const date = new Date(isoDate);
        // Check if date is valid
        if (isNaN(date.getTime())) return 'Inválido';
        
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        }
        if (diffDays === 1) {
            return `Ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        }
        if (diffDays < 7) {
            return `Há ${diffDays} dias`;
        }
        
        return date.toLocaleDateString('pt-BR');
    } catch (e) {
        return 'Inválido';
    }
};


const AdminPage: React.FC<AdminPageProps> = ({ 
    offers, onAddOffer, onUpdateOffer, onDeleteOffer,
    news, onAddNews, onUpdateNews, onDeleteNews,
    notifications, onAddNotification, onUpdateNotification, onDeleteNotification,
    maintenance, onUpdateMaintenance,
    connectionConfig, onUpdateConnectionConfig,
    users, onAddUser, onUpdateUser, onDeleteUser
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'news' | 'offers' | 'notifications' | 'maintenance' | 'connections'>('users');
  const [isSubmitting, setIsSubmitting] = useState(false); // Global loading state for forms

  // --- USERS STATE ---
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<Partial<User>>({
      name: '', email: '', phone: '', role: 'user', status: 'active', cnpj: '', receiveWeeklySummary: true
  });
  
  // User Filters & Pagination
  const [userSearch, setUserSearch] = useState('');
  const [userFilterType, setUserFilterType] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 5;

  // --- NEWS STATE ---
  const initialNewsForm: Omit<NewsItem, 'id'> = {
    title: '', category: 'Legislação', excerpt: '', content: '', imageUrl: '', readTime: '', date: getTodayDateString(), status: 'draft',
    sourceUrl: '', // NEW
    sourceName: '' // NEW
  };
  const [newsForm, setNewsForm] = useState(initialNewsForm);
  const [editingNewsId, setEditingNewsId] = useState<number | null>(null);
  const [showNewsPreview, setShowNewsPreview] = useState(false);
  
  // News Pagination
  const [newsPage, setNewsPage] = useState(1);
  const newsPerPage = 5;

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
    expiresAt: string; // Now used for all types
  } = {
    text: '', type: 'info', pollOptions: ['Sim', 'Não'], expiresAt: ''
  };
  const [notifForm, setNotifForm] = useState(initialNotifForm);
  const [editingNotifId, setEditingNotifId] = useState<number | null>(null);
  const [viewingResultsPoll, setViewingResultsPoll] = useState<AppNotification | null>(null);

  // --- CONNECTIONS FORM STATE ---
  const [localConnConfig, setLocalConnConfig] = useState<ConnectionConfig>(connectionConfig);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testType, setTestType] = useState<'cnpj' | 'diagnostic' | 'whatsapp' | 'assistant'>('cnpj'); // ADDED 'assistant'
  const [testCnpj, setTestCnpj] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testParsedData, setTestParsedData] = useState<any | null>(null);
  
  // WhatsApp Test State
  const [testWhatsappNumber, setTestWhatsappNumber] = useState('553199664201');
  const [testWhatsappMessage, setTestWhatsappMessage] = useState('Olá! Teste de conexão bem-sucedido.');
  
  // Assistant Test State
  const [testAssistantQuery, setTestAssistantQuery] = useState('Qual o limite do MEI?');

  // Sync local state with prop changes (e.g., after saving in App.tsx)
  useEffect(() => {
      setLocalConnConfig(connectionConfig);
  }, [connectionConfig]);

  // --- UTILS ---
  const isNotificationExpired = (n: AppNotification) => {
      if (!n.expiresAt) return false;
      return new Date(n.expiresAt) < new Date();
  };

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
          status: user.status || 'active',
          receiveWeeklySummary: user.receiveWeeklySummary ?? true
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
      const originalUser = users.find(u => u.id === editingUserId);
      const isNewUser = !editingUserId;
      
      const payload: User = {
          id: editingUserId || Date.now().toString(),
          name: userForm.name || '',
          email: userForm.email || '',
          phone: userForm.phone,
          cnpj: userForm.cnpj,
          role: userForm.role as 'admin' | 'user',
          status: userForm.status as 'active' | 'inactive' | 'suspended',
          // Preservar o status de setup se estiver editando, ou forçar false se for novo
          isSetupComplete: isNewUser ? false : (originalUser?.isSetupComplete ?? false),
          lastActive: originalUser?.lastActive || now,
          joinedAt: originalUser?.joinedAt || now,
          receiveWeeklySummary: userForm.receiveWeeklySummary ?? (originalUser?.receiveWeeklySummary ?? true)
      };

      if (editingUserId) {
          onUpdateUser(payload);
      } else {
          onAddUser(payload);
      }
      setIsSubmitting(false);
      setUserModalOpen(false);
      setEditingUserId(null);
      setUserForm({ name: '', email: '', phone: '', role: 'user', status: 'active', cnpj: '', receiveWeeklySummary: true });
  };

  // --- NEWS LOGIC & HANDLERS ---
  
  // Reset pagination when filter changes
  useEffect(() => {
      setNewsPage(1);
  }, [news]);

  // Paginated News List
  const paginatedNews = useMemo(() => {
      // Sort news by date descending first
      const sortedNews = [...news].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const startIndex = (newsPage - 1) * newsPerPage;
      return sortedNews.slice(startIndex, startIndex + newsPerPage);
  }, [news, newsPage]);

  const totalNewsPages = Math.ceil(news.length / newsPerPage);

  const handleEditNewsClick = (e: React.MouseEvent, item: NewsItem) => {
      e.stopPropagation();
      setEditingNewsId(item.id);
      setNewsForm({
          title: item.title, category: item.category, excerpt: item.excerpt, 
          content: item.content, imageUrl: item.imageUrl, readTime: item.readTime, 
          date: item.date, status: item.status,
          sourceUrl: item.sourceUrl || '', // NEW
          sourceName: item.sourceName || '' // NEW
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelNewsEdit = () => {
      setEditingNewsId(null);
      setNewsForm(initialNewsForm);
  };

  const handleDeleteNewsClick = (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      e.preventDefault();
      if(window.confirm('Tem certeza que deseja excluir esta notícia?')) {
          onDeleteNews(id);
          if (editingNewsId === id) handleCancelNewsEdit();
      }
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));

    // Use the date from the form, or today's date if not set (should be set by initial state)
    const finalDate = newsForm.date || getTodayDateString();
    // Quill outputs clean HTML, no need for manual normalization
    const finalContent = newsForm.content; 
    
    const newsPayload: Omit<NewsItem, 'id'> = { 
        ...newsForm, 
        date: finalDate, 
        content: finalContent,
        sourceUrl: newsForm.sourceUrl || undefined, // Ensure undefined if empty
        sourceName: newsForm.sourceName || undefined // Ensure undefined if empty
    };

    if (editingNewsId) {
        onUpdateNews({ id: editingNewsId, ...newsPayload });
    } else {
        onAddNews({ id: Date.now(), ...newsPayload });
    }
    setIsSubmitting(false);
    handleCancelNewsEdit();
  };

  // Prepare content for preview (Quill output is already HTML)
  const previewContent = useMemo(() => newsForm.content, [newsForm.content]);

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
          expiresAt: item.expiresAt || '' // Use empty string if null
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
        // Map string options back to PollOption structure for DB storage
        pollData = notifForm.pollOptions.map((opt, idx) => ({ id: idx, text: opt, votes: 0 }));
    }

    const payload: AppNotification = {
        id: editingNotifId || Date.now(),
        text: notifForm.text,
        type: notifForm.type,
        date: editingNotifId ? (notifications.find(n => n.id === editingNotifId)?.date || dateStr) : dateStr,
        active: true,
        pollOptions: pollData,
        expiresAt: notifForm.expiresAt || null, // Ensure null if empty string
        // pollVotes and read status are handled by DB/interactions, not set here
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

      // UPDATED HEADERS to include Name and Email
      const headers = ["Data/Hora", "Nome do Usuário", "Email do Usuário", "Voto (Opção)"];
      
      const rows = viewingResultsPoll.pollVotes.map(v => [
          new Date(v.votedAt).toLocaleString('pt-BR'),
          `"${v.userName.replace(/"/g, '""')}"`, // Wrap in quotes and escape internal quotes
          v.userEmail,
          `"${v.optionText.replace(/"/g, '""')}"`
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
      alert('Configurações de conexão salvas com sucesso!');
  };

  // Helper to extract nested values
  const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const handleTestConnection = async () => {
      setTestLoading(true);
      setTestResponse(null);
      setTestParsedData(null);
      
      try {
          if (testType === 'whatsapp') {
              if (!localConnConfig.whatsappApi.enabled) {
                  throw new Error('A integração WhatsApp está desativada globalmente.');
              }
              if (!testWhatsappNumber || !testWhatsappMessage) {
                  throw new Error('Número e mensagem são obrigatórios para o teste do WhatsApp.');
              }
              
              const url = localConnConfig.whatsappApi.sendTextUrl;
              // NOTE: Token is now read from Deno.env in the Edge Function, but here we test the direct API call
              // Since we removed the token from the client config, we cannot test the direct API call from the client anymore.
              // We will simulate a successful response for the client test, or instruct the user to test via the Edge Function.
              
              // For simplicity in the client, we will assume the user needs to test the Edge Function endpoint instead.
              throw new Error('Teste direto da API WhatsApp desabilitado por segurança. Use o Edge Function para testes de envio.');
              
          } else if (testType === 'assistant') {
              if (!localConnConfig.assistantWebhookUrl) {
                  throw new Error('A URL do Webhook do Assistente não está configurada.');
              }
              
              const url = localConnConfig.assistantWebhookUrl;
              
              // Simular payload mínimo que a Edge Function enviaria
              const payload = {
                  userId: 'TEST_USER_ID',
                  query: testAssistantQuery,
                  timestamp: new Date().toISOString(),
                  messageType: 'text',
              };
              
              const response = await fetch(url, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(payload)
              });
              
              const rawText = await response.text();
              let json;
              try {
                  json = JSON.parse(rawText);
              } catch {
                  json = { error: "Could not parse JSON", raw: rawText };
              }
              
              setTestResponse(JSON.stringify(json, null, 2));
              setTestParsedData({
                  Status: response.ok ? 'Sucesso' : 'Falha',
                  'HTTP Status': response.status,
                  Resposta: json.text || json.error || 'Verifique a resposta JSON.'
              });

          } else {
              // CNPJ or Diagnostic API logic
              if (!testCnpj) {
                  throw new Error('Por favor, insira um CNPJ para teste.');
              }
              
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
          }

      } catch (error: any) {
          setTestResponse(`Error: ${error.message}`);
          setTestParsedData(null);
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
  
  // NEW: Handler for successful GIF upload
  const handleGifUploadSuccess = (url: string) => {
      setLocalConnConfig(prev => ({
          ...prev,
          assistantGifUrl: url // Assuming we add this field to ConnectionConfig
      }));
      // Note: The user must click 'Salvar Configurações' to persist this change to the DB
  };
  
  // NEW: Handler for icon size change
  const handleIconSizeChange = (value: string) => {
      // Simple validation for Tailwind classes (e.g., w-12 h-12)
      const cleanValue = value.trim().toLowerCase();
      setLocalConnConfig(prev => ({
          ...prev,
          assistantIconSize: cleanValue
      }));
  };

  const MappingEditor = ({ mappings, apiType }: { mappings: ApiFieldMapping[], apiType: 'cnpj' | 'diagnostic' }) => (
      <div className="mt-4 border rounded-lg overflow-hidden border-slate-200 dark:border-slate-700">
          <div className="bg-slate-50 dark:bg-slate-800 p-3 text-xs font-bold text-slate-500 uppercase flex gap-4">
              <div className="flex-1">Campo do Sistema</div>
              <div className="flex-1">Caminho JSON (Path)</div>
              <div className="flex-1">Rótulo de Exibição</div>
              <div className="w-16 text-center">Visível</div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 max-h-60 overflow-y-auto">
              {mappings.map((m, idx) => (
                  <div key={m.key} className="p-3 flex gap-4 items-center">
                      <div className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">{m.key}</div>
                      <div className="flex-1">
                          <input 
                              type="text" 
                              value={m.jsonPath} 
                              onChange={(e) => handleUpdateMapping(apiType, idx, 'jsonPath', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded text-sm bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          />
                      </div>
                      <div className="flex-1">
                          <input 
                              type="text" 
                              value={m.label} 
                              onChange={(e) => handleUpdateMapping(apiType, idx, 'label', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 dark:border-slate-700 rounded text-sm bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          />
                      </div>
                      <div className="w-16 flex justify-center">
                          <input 
                              type="checkbox" 
                              checked={m.visible} 
                              onChange={(e) => handleUpdateMapping(apiType, idx, 'visible', e.target.checked)}
                              className="rounded text-primary focus:ring-primary"
                          />
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8 max-w-6xl mx-auto">
      
      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto self-start inline-flex">
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
          Usuários
        </button>
        <button onClick={() => setActiveTab('news')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'news' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
          Notícias
        </button>
        <button onClick={() => setActiveTab('offers')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'offers' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
          Ofertas
        </button>
        <button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'notifications' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
          Notificações
        </button>
        <button onClick={() => setActiveTab('connections')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'connections' ? 'bg-white dark:bg-slate-700 text-blue-500 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
          Conexões
        </button>
        <button onClick={() => setActiveTab('maintenance')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'maintenance' ? 'bg-white dark:bg-slate-700 text-red-500 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
          Manutenção
        </button>
      </div>

      {/* --- CONTENT: USERS --- */}
      {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {/* ... User Stats & Table code remains same ... */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total de Usuários</p>
                      <div className="flex items-end gap-2">
                          <span className="text-3xl font-bold text-slate-800 dark:text-white">{userStats.total}</span>
                          <span className="text-xs text-green-500 font-bold mb-1">+{userStats.newThisMonth} este mês</span>
                      </div>
                  </div>
                  {/* ... other stats ... */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Ativos (24h)</p>
                      <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{userStats.active24h}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Ativos (7 dias)</p>
                      <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{userStats.activeWeek}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Ativos (30 dias)</p>
                      <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">{userStats.activeMonth}</span>
                  </div>
              </div>

              {/* Users Table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  {/* ... Toolbar ... */}
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mr-auto">
                          <span className="material-icons text-primary">groups</span>
                          Gestão de Usuários
                      </h3>
                      <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                          {/* Search */}
                          <div className="relative w-full md:w-64">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons text-sm">search</span>
                              <input 
                                type="text" 
                                placeholder="Buscar nome, email ou CNPJ..." 
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/50"
                              />
                          </div>
                          {/* Filter */}
                          <select 
                            value={userFilterType}
                            onChange={(e) => setUserFilterType(e.target.value)}
                            className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/50"
                          >
                              <option value="all">Todos os Status</option>
                              <option value="active">Ativos</option>
                              <option value="inactive">Inativos</option>
                              <option value="suspended">Suspensos</option>
                              <option value="admin">Administradores</option>
                              <option value="inactive_30d">Inativos {'>'} 30 dias</option>
                              <option value="inactive_90d">Inativos {'>'} 90 dias</option>
                          </select>
                          {/* New User Button */}
                          <button 
                              onClick={() => {
                                  setEditingUserId(null);
                                  setUserForm({ name: '', email: '', phone: '', role: 'user', status: 'active', cnpj: '', receiveWeeklySummary: true });
                                  setUserModalOpen(true);
                              }}
                              className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-colors whitespace-nowrap"
                          >
                              <span className="material-icons text-sm">person_add</span>
                              Novo
                          </button>
                      </div>
                  </div>
                  
                  {/* Table Body */}
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                                  <th className="px-6 py-3">Usuário</th>
                                  <th className="px-6 py-3">CNPJ</th>
                                  <th className="px-6 py-3">Função</th>
                                  <th className="px-6 py-3">Status</th>
                                  <th className="px-6 py-3">Último Acesso</th>
                                  <th className="px-6 py-3 text-right">Ações</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {paginatedUsers.length === 0 ? (
                                  <tr>
                                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                          Nenhum usuário encontrado com os filtros atuais.
                                      </td>
                                  </tr>
                              ) : (
                                  paginatedUsers.map(user => (
                                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                          <td className="px-6 py-3">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 text-xs font-bold">
                                                      {user.name.charAt(0).toUpperCase()}
                                                  </div>
                                                  <div>
                                                      <p className="text-sm font-bold text-slate-800 dark:text-white">{user.name}</p>
                                                      <p className="text-xs text-slate-500">{user.email}</p>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300 font-mono">
                                              {user.cnpj || '-'}
                                          </td>
                                          <td className="px-6 py-3">
                                              <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                                                  user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                              }`}>
                                                  {user.role}
                                              </span>
                                          </td>
                                          <td className="px-6 py-3">
                                              <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                                                  user.status === 'active' ? 'bg-green-100 text-green-700' : 
                                                  user.status === 'inactive' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                              }`}>
                                                  {user.status}
                                              </span>
                                          </td>
                                          <td className="px-6 py-3 text-xs text-slate-500">
                                              {formatLastActive(user.lastActive)}
                                          </td>
                                          <td className="px-6 py-3 text-right">
                                              <div className="flex justify-end gap-1">
                                                  <button 
                                                      onClick={() => handleEditUserClick(user)}
                                                      className="p-1.5 text-slate-400 hover:text-primary rounded hover:bg-blue-50 dark:hover:bg-slate-800"
                                                      title="Editar"
                                                  >
                                                      <span className="material-icons text-sm">edit</span>
                                                  </button>
                                                  <button 
                                                      onClick={() => handleDeleteUserClick(user.id)}
                                                      className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-slate-800"
                                                      title="Excluir"
                                                  >
                                                      <span className="material-icons text-sm">delete</span>
                                                  </button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))
                              )}
                          </tbody>
                      </table>
                  </div>

                  {/* Pagination Footer */}
                  {totalUserPages > 1 && (
                      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                              Página <span className="font-bold text-slate-800 dark:text-white">{userPage}</span> de {totalUserPages}
                          </span>
                          <div className="flex gap-2">
                              <button 
                                  onClick={() => setUserPage(p => Math.max(1, p - 1))}
                                  disabled={userPage === 1}
                                  className="px-3 py-1 text-xs font-medium rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                  Anterior
                              </button>
                              <button 
                                  onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                                  disabled={userPage === totalUserPages}
                                  className="px-3 py-1 text-xs font-medium rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                  Próxima
                              </button>
                          </div>
                      </div>
                  )}
              </div>

              {/* User Modal */}
              {userModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800">
                          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                                  {editingUserId ? 'Editar Usuário' : 'Novo Usuário'}
                              </h3>
                              <button onClick={() => setUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                  <span className="material-icons">close</span>
                              </button>
                          </div>
                          
                          <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                              {/* ... User Form Fields ... */}
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                                  <input 
                                      type="text" 
                                      required 
                                      value={userForm.name} 
                                      onChange={e => setUserForm({...userForm, name: e.target.value})}
                                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                  <input 
                                      type="email" 
                                      required 
                                      value={userForm.email} 
                                      onChange={e => setUserForm({...userForm, email: e.target.value})}
                                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50"
                                  />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                                      <input 
                                          type="text" 
                                          value={userForm.phone} 
                                          onChange={e => setUserForm({...userForm, phone: e.target.value})}
                                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CNPJ</label>
                                      <input 
                                          type="text" 
                                          value={userForm.cnpj} 
                                          onChange={e => setUserForm({...userForm, cnpj: e.target.value})}
                                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50"
                                      />
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Função</label>
                                      <select 
                                          value={userForm.role}
                                          onChange={e => setUserForm({...userForm, role: e.target.value as any})}
                                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50"
                                      >
                                          <option value="user">Usuário</option>
                                          <option value="admin">Administrador</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                      <select 
                                          value={userForm.status}
                                          onChange={e => setUserForm({...userForm, status: e.target.value as any})}
                                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50"
                                      >
                                          <option value="active">Ativo</option>
                                          <option value="inactive">Inativo</option>
                                          <option value="suspended">Suspensos</option>
                                      </select>
                                  </div>
                              </div>
                              
                              {/* NEW: Receive Weekly Summary Toggle */}
                              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Receber Resumo Semanal</label>
                                  <button 
                                      type="button"
                                      onClick={() => setUserForm(prev => ({
                                          ...prev,
                                          receiveWeeklySummary: !prev.receiveWeeklySummary
                                      }))}
                                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${userForm.receiveWeeklySummary ? 'bg-green-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                  >
                                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${userForm.receiveWeeklySummary ? 'translate-x-6' : 'translate-x-1'}`} />
                                  </button>
                              </div>

                              <div className="flex justify-end gap-3 pt-4">
                                  <button 
                                      type="button" 
                                      onClick={() => setUserModalOpen(false)}
                                      className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                                  >
                                      Cancelar
                                  </button>
                                  <button 
                                      type="submit" 
                                      disabled={isSubmitting}
                                      className="px-6 py-2 bg-primary hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"
                                  >
                                      {isSubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Salvar'}
                                  </button>
                              </div>
                          </form>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* --- CONTENT: NEWS --- */}
      {activeTab === 'news' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* News Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            {/* ... News Form content ... */}
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                {editingNewsId ? 'Editar Notícia' : 'Publicar Nova Notícia'}
            </h3>
            
            {editingNewsId && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg flex justify-between items-center">
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Editando notícia...</span>
                    <button type="button" onClick={handleCancelNewsEdit} className="text-xs font-bold text-blue-600 hover:underline">Cancelar</button>
                </div>
            )}

            <form onSubmit={handleSaveNews} className="space-y-4">
              {/* ... News Form Fields ... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título do Artigo</label>
                  <input type="text" required value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                  <select value={newsForm.category} onChange={e => setNewsForm({...newsForm, category: e.target.value})} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none">
                    <option>Legislação</option><option>Finanças</option><option>Gestão</option><option>Marketing</option><option>Tecnologia</option><option>Benefícios</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tempo de Leitura</label>
                  <input type="text" placeholder="Ex: 5 min leitura" value={newsForm.readTime} onChange={e => setNewsForm({...newsForm, readTime: e.target.value})} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL da Imagem de Capa</label>
                  <input type="text" placeholder="https://..." value={newsForm.imageUrl} onChange={e => setNewsForm({...newsForm, imageUrl: e.target.value})} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resumo (Excerpt)</label>
                   <textarea rows={2} required value={newsForm.excerpt} onChange={e => setNewsForm({...newsForm, excerpt: e.target.value})} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" placeholder="Breve descrição que aparece no card..."></textarea>
                </div>
                
                {/* NEW: Source Fields */}
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Fonte (Opcional)</label>
                        <input type="text" placeholder="Ex: SEBRAE" value={newsForm.sourceName} onChange={e => setNewsForm({...newsForm, sourceName: e.target.value})} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL da Fonte (Opcional)</label>
                        <input type="url" placeholder="https://fonte.com.br" value={newsForm.sourceUrl} onChange={e => setNewsForm({...newsForm, sourceUrl: e.target.value})} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
                    </div>
                </div>

                {/* Enhanced Content Editor (Jodit) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Conteúdo do Artigo</label>
                  <NewsEditor 
                    value={newsForm.content} 
                    onChange={(content) => setNewsForm({...newsForm, content: content})}
                  />
                  <p className="text-xs text-slate-500 mt-1">Use o editor acima para formatar o conteúdo.</p>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                   <select value={newsForm.status} onChange={e => setNewsForm({...newsForm, status: e.target.value as any})} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none">
                     <option value="draft">Rascunho</option>
                     <option value="published">Publicado</option>
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Publicação</label>
                   <input type="date" value={newsForm.date} onChange={e => setNewsForm({...newsForm, date: e.target.value})} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
                </div>
              </div>
              <div className="flex justify-end pt-2 gap-2">
                <button type="button" onClick={() => setShowNewsPreview(true)} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                    Pré-visualizar
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-blue-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2">
                  {isSubmitting ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                      <span className="material-icons text-sm">{editingNewsId ? 'save_as' : 'publish'}</span> 
                  )}
                  {editingNewsId ? 'Salvar Alterações' : 'Publicar Notícia'}
                </button>
              </div>
            </form>
          </div>

          {/* News List */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Gerenciar Notícias</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {news.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">Nenhuma notícia cadastrada.</p>
              ) : (
                  paginatedNews.map(item => (
                    <div key={item.id} onClick={(e) => handleEditNewsClick(e, item)} className={`p-3 rounded-lg border cursor-pointer transition-colors ${editingNewsId === item.id ? 'bg-blue-50 border-blue-200' : 'border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'}`}>
                      <h4 className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-1">{item.title}</h4>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex gap-2">
                            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{item.category}</span>
                            {item.status === 'draft' && <span className="text-xs text-slate-500 bg-yellow-100 px-2 py-0.5 rounded">Rascunho</span>}
                        </div>
                        <div className="flex gap-1">
                          <button type="button" onClick={(e) => handleEditNewsClick(e, item)} className="p-1 text-slate-400 hover:text-primary"><span className="material-icons text-sm">edit</span></button>
                          <button type="button" onClick={(e) => handleDeleteNewsClick(e, item.id)} className="p-1 text-slate-400 hover:text-red-500"><span className="material-icons text-sm">delete</span></button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
            
            {/* Pagination Footer */}
            {totalNewsPages > 1 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        Página <span className="font-bold text-slate-800 dark:text-white">{newsPage}</span> de {totalNewsPages}
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setNewsPage(p => Math.max(1, p - 1))}
                            disabled={newsPage === 1}
                            className="px-3 py-1 text-xs font-medium rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>
                        <button 
                            onClick={() => setNewsPage(p => Math.min(totalNewsPages, p + 1))}
                            disabled={newsPage === totalNewsPages}
                            className="px-3 py-1 text-xs font-medium rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}

      {/* --- CONTENT: OFFERS --- */}
      {activeTab === 'offers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Offers Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            {/* ... Offer Form Content ... */}
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                {editingOfferId ? 'Editar Oferta Existente' : 'Cadastrar Oferta ou Cupom'}
            </h3>
            
            {editingOfferId && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg flex justify-between items-center">
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Editando oferta...</span>
                    <button type="button" onClick={handleCancelOfferEdit} className="text-xs font-bold text-blue-600 hover:underline">Cancelar</button>
                </div>
            )}

            <form onSubmit={handleSaveOffer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Identidade do Parceiro</label>
                    <div className="flex gap-4 items-center">
                        <button type="button" onClick={() => setShowIconPicker(!showIconPicker)} className={`w-12 h-12 rounded-lg ${offerForm.partnerColor} text-white flex items-center justify-center`}><span className="material-icons">{offerForm.partnerIcon}</span></button>
                         {showIconPicker && (
                         <div className="absolute mt-16 p-2 bg-white border rounded shadow-xl z-50 grid grid-cols-5 gap-1 h-32 overflow-y-auto">
                           {availableIcons.map(icon => <button key={icon} type="button" onClick={() => { setOfferForm({...offerForm, partnerIcon: icon}); setShowIconPicker(false); }} className="p-1 hover:bg-slate-100"><span className="material-icons text-sm">{icon}</span></button>)}
                         </div>
                       )}
                        <div className="flex flex-wrap gap-1">
                            {tailwindColors.map(c => <button key={c.name} type="button" onClick={() => setOfferForm({...offerForm, partnerColor: c.class})} className={`w-6 h-6 rounded-full ${c.class} ring-1 ring-offset-1 ${offerForm.partnerColor === c.class ? 'ring-slate-400' : 'ring-transparent'}`}></button>)}
                        </div>
                    </div>
                 </div>
                 {/* ... Other inputs ... */}
                 <div className="md:col-span-1"><label className="text-sm block mb-1">Parceiro</label><input type="text" required value={offerForm.partnerName} onChange={e => setOfferForm({...offerForm, partnerName: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800" /></div>
                 <div className="md:col-span-1"><label className="text-sm block mb-1">Desconto</label><input type="text" required value={offerForm.discount} onChange={e => setOfferForm({...offerForm, discount: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800" /></div>
                 <div className="md:col-span-2"><label className="text-sm block mb-1">Título</label><input type="text" required value={offerForm.title} onChange={e => setOfferForm({...offerForm, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800" /></div>
                 <div className="md:col-span-2"><label className="text-sm block mb-1">Descrição</label><textarea required rows={2} value={offerForm.description} onChange={e => setOfferForm({...offerForm, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800" /></div>
                 <div className="md:col-span-1"><label className="text-sm block mb-1">Cupom</label><input type="text" value={offerForm.code} onChange={e => setOfferForm({...offerForm, code: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800" /></div>
                 <div className="md:col-span-1"><label className="text-sm block mb-1">Validade</label><input type="text" required value={offerForm.expiry} onChange={e => setOfferForm({...offerForm, expiry: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800" /></div>
                 <div className="md:col-span-1"><label className="text-sm block mb-1">Link</label><input type="text" value={offerForm.link} onChange={e => setOfferForm({...offerForm, link: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800" /></div>
                 <div className="md:col-span-1"><label className="text-sm block mb-1">Categoria</label><select value={offerForm.category} onChange={e => setOfferForm({...offerForm, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800"><option>Finanças</option><option>Software</option><option>Serviços</option><option>Educação</option></select></div>
                 <div className="md:col-span-2 flex gap-4">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={offerForm.isExclusive} onChange={e => setOfferForm({...offerForm, isExclusive: e.target.checked})} /> Exclusivo</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={offerForm.isFeatured} onChange={e => setOfferForm({...offerForm, isFeatured: e.target.checked})} /> Destaque</label>
                 </div>
              </div>
              <div className="flex justify-end pt-2 gap-3">
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-blue-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                    {isSubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : null}
                    {editingOfferId ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Offers List */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Ofertas Ativas</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {offers.map(offer => (
                <div key={offer.id} onClick={(e) => handleEditOfferClick(e, offer)} className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center group ${editingOfferId === offer.id ? 'bg-blue-50 border-blue-200' : 'border-slate-100 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded ${offer.partnerColor} flex items-center justify-center text-white text-xs`}><span className="material-icons text-sm">{offer.partnerIcon}</span></div>
                     <div><h4 className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-1">{offer.title}</h4></div>
                  </div>
                  <div className="flex gap-1">
                      <button type="button" onClick={(e) => handleEditOfferClick(e, offer)} className="p-1 text-slate-400 hover:text-primary"><span className="material-icons text-sm">edit</span></button>
                      <button type="button" onClick={(e) => handleDeleteOfferClick(e, offer.id)} className="p-1 text-slate-400 hover:text-red-500"><span className="material-icons text-sm">delete</span></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- CONTENT: NOTIFICATIONS --- */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                {/* ... Notification Form Content ... */}
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                    {editingNotifId ? 'Editar Notificação' : 'Criar Notificação ou Enquete'}
                </h3>
                
                {editingNotifId && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg flex justify-between items-center">
                      <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Editando notificação...</span>
                      <button type="button" onClick={handleCancelNotifEdit} className="text-xs font-bold text-blue-600 hover:underline">Cancelar</button>
                  </div>
                )}

                <form onSubmit={handleSaveNotification} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Mensagem</label>
                           <div className="grid grid-cols-4 gap-2">
                              {([
                                  {val: 'info', icon: 'info', label: 'Info', color: 'bg-blue-100 text-blue-600'},
                                  {val: 'warning', icon: 'warning', label: 'Aviso', color: 'bg-yellow-100 text-yellow-600'},
                                  {val: 'success', icon: 'check_circle', label: 'Sucesso', color: 'bg-green-100 text-green-600'},
                                  {val: 'poll', icon: 'poll', label: 'Enquete', color: 'bg-purple-100 text-purple-600'}
                              ] as const).map(opt => (
                                <button 
                                  key={opt.val}
                                  type="button" 
                                  onClick={() => setNotifForm({...notifForm, type: opt.val})} 
                                  className={`flex flex-col items-center p-3 rounded-lg border transition-all ${notifForm.type === opt.val ? `border-current ${opt.color} ring-1 ring-offset-1` : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                                >
                                    <span className="material-icons mb-1">{opt.icon}</span>
                                    <span className="text-xs font-bold">{opt.label}</span>
                                </button>
                              ))}
                           </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                {notifForm.type === 'poll' ? 'Pergunta da Enquete' : 'Mensagem'}
                            </label>
                            <textarea 
                                required 
                                rows={notifForm.type === 'poll' ? 2 : 4} 
                                value={notifForm.text} 
                                onChange={e => setNotifForm({...notifForm, text: e.target.value})} 
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50" 
                                placeholder={notifForm.type === 'poll' ? "Ex: Qual funcionalidade você quer ver primeiro?" : "Escreva o conteúdo da notificação..."}
                            />
                        </div>
                        
                        {/* Expiration Date Field (for all types) */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Validade / Expiração (Opcional)</label>
                            <input 
                                type="datetime-local" 
                                value={notifForm.expiresAt} 
                                onChange={e => setNotifForm({...notifForm, expiresAt: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-sm"
                            />
                            <p className="text-xs text-slate-500 mt-1">A notificação será automaticamente ocultada após esta data/hora.</p>
                        </div>

                        {/* Poll Options Builder (Only for poll type) */}
                        {notifForm.type === 'poll' && (
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Opções de Resposta</label>
                                <div className="space-y-2">
                                    {notifForm.pollOptions.map((opt, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={opt} 
                                                onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                                                className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-sm"
                                                placeholder={`Opção ${idx + 1}`}
                                            />
                                            {notifForm.pollOptions.length > 2 && (
                                                <button type="button" onClick={() => handleRemovePollOption(idx)} className="p-2 text-slate-400 hover:text-red-500">
                                                    <span className="material-icons">close</span>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    type="button" 
                                    onClick={handleAddPollOption}
                                    className="mt-3 text-sm text-primary font-medium hover:underline flex items-center gap-1"
                                >
                                    <span className="material-icons text-sm">add</span> Adicionar Opção
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                         <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="bg-primary hover:bg-blue-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
                         >
                            {isSubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : null}
                            {editingNotifId ? 'Atualizar' : 'Publicar'}
                         </button>
                    </div>
                </form>
            </div>
             
             {/* ... Notifications List ... */}
             <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-fit">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4">Todas as Notificações</h3>
                <div className="space-y-4">
                    {notifications.length === 0 ? <p className="text-slate-400 text-sm text-center py-4">Nenhuma notificação.</p> : null}
                    {notifications.map(n => {
                        const isExpired = isNotificationExpired(n);
                        
                        return (
                        <div key={n.id} onClick={() => handleEditNotifClick(n)} className={`p-4 rounded-lg border border-l-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                            n.type === 'info' ? 'border-l-blue-500' :
                            n.type === 'warning' ? 'border-l-yellow-500' :
                            n.type === 'success' ? 'border-l-green-500' : 'border-l-purple-500 bg-purple-50/50'
                        } ${isExpired ? 'opacity-50 grayscale' : ''}`}>
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <span className={`material-icons text-sm ${
                                        n.type === 'info' ? 'text-blue-500' :
                                        n.type === 'warning' ? 'text-yellow-500' :
                                        n.type === 'success' ? 'text-green-500' : 'text-purple-500'
                                    }`}>
                                        {n.type === 'poll' ? 'poll' : n.type === 'warning' ? 'warning' : n.type === 'success' ? 'check_circle' : 'info'}
                                    </span>
                                    <span className="text-xs font-bold uppercase text-slate-400">{n.type === 'poll' ? 'Enquete' : 'Aviso'}</span>
                                    {isExpired && <span className="text-xs font-bold uppercase text-red-500 ml-2">EXPIRADA</span>}
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); handleEditNotifClick(n); }} className="text-slate-300 hover:text-primary">
                                    <span className="material-icons text-sm">edit</span>
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteNotifClick(n.id); }} className="text-slate-300 hover:text-red-500">
                                      <span className="material-icons text-sm">close</span>
                                  </button>
                                </div>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-2">{n.text}</p>
                            
                            {n.type === 'poll' && (
                                <div className="flex justify-between items-end">
                                  {n.expiresAt && <p className="text-[10px] text-red-500 mb-1">Expira em: {new Date(n.expiresAt).toLocaleString()}</p>}
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setViewingResultsPoll(n); }}
                                    className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded hover:bg-purple-200 font-bold flex items-center gap-1"
                                  >
                                    <span className="material-icons text-sm">bar_chart</span> Ver Resultados
                                  </button>
                                </div>
                            )}
                            
                            {n.expiresAt && n.type !== 'poll' && (
                                <p className="text-[10px] text-slate-400 mt-1">Expira em: {new Date(n.expiresAt).toLocaleString('pt-BR')}</p>
                            )}

                            <p className="text-[10px] text-slate-400 text-right mt-1">{n.date}</p>
                        </div>
                    );})}
                </div>
             </div>
        </div>
      )}

      {/* POLL RESULTS MODAL */}
      {viewingResultsPoll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-6 text-center relative border-b border-purple-200 dark:border-purple-800">
                      <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100">Resultados da Enquete</h3>
                      <button onClick={() => setViewingResultsPoll(null)} className="absolute top-4 right-4 text-purple-700 dark:text-purple-300 hover:text-purple-900">
                          <span className="material-icons">close</span>
                      </button>
                  </div>
                  <div className="p-6">
                      <h4 className="font-bold text-slate-800 dark:text-white mb-4 text-center">{viewingResultsPoll.text}</h4>
                      
                      <div className="space-y-4">
                          {viewingResultsPoll.pollOptions?.map(opt => {
                              const totalVotes = viewingResultsPoll.pollOptions!.reduce((acc, curr) => acc + curr.votes, 0);
                              const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                              
                              return (
                                  <div key={opt.id}>
                                      <div className="flex justify-between text-sm mb-1">
                                          <span className="text-slate-700 dark:text-slate-300 font-medium">{opt.text}</span>
                                          <span className="text-slate-500 font-bold">{opt.votes} votos ({percent}%)</span>
                                      </div>
                                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                          <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                          <button 
                              onClick={handleExportPollVotes}
                              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-bold transition-colors"
                          >
                              <span className="material-icons text-sm">download</span>
                              Exportar Dados (CSV)
                          </button>
                          <p className="text-xs text-center text-slate-400 mt-2">Baixa planilha com lista de usuários e votos.</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- CONTENT: CONNECTIONS --- */}
      {activeTab === 'connections' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Configuração de Conexões (APIs)</h3>
              <form onSubmit={handleSaveConnection} className="space-y-6">
                  
                  {/* ASSISTANT WEBHOOK & GIF UPLOAD */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                          <span className="material-icons text-primary">smart_toy</span> Webhook do Assistente Dyad
                      </h4>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL do Webhook</label>
                              <input 
                                  type="url" 
                                  required
                                  value={localConnConfig.assistantWebhookUrl} 
                                  onChange={e => setLocalConnConfig({...localConnConfig, assistantWebhookUrl: e.target.value})}
                                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                                  placeholder="https://seu-webhook.com/assistant"
                              />
                          </div>
                          
                          {/* NEW: GIF Upload Field */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ícone do Assistente (GIF)</label>
                              <FileUpload
                                  bucket="assets"
                                  path="assistant/icon.gif"
                                  onUploadSuccess={handleGifUploadSuccess}
                                  accept="image/gif"
                                  currentUrl={localConnConfig.assistantGifUrl}
                              />
                              <p className="text-xs text-slate-500 mt-2">O GIF será armazenado no Supabase Storage e usado como ícone flutuante.</p>
                          </div>
                          
                          {/* NEW: Icon Size Field */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tamanho do Ícone (Classes Tailwind)</label>
                              <input 
                                  type="text" 
                                  value={localConnConfig.assistantIconSize || ''} 
                                  onChange={e => handleIconSizeChange(e.target.value)}
                                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                                  placeholder="Ex: w-12 h-12 (Padrão)"
                              />
                              <p className="text-xs text-slate-500 mt-1">Use classes Tailwind como 'w-10 h-10', 'w-16 h-16', etc.</p>
                          </div>

                          <button type="button" onClick={() => { setTestType('assistant'); setTestModalOpen(true); }} className="mt-2 text-sm font-medium text-primary hover:underline flex items-center gap-1">
                              <span className="material-icons text-sm">science</span> Testar Conexão
                          </button>
                      </div>
                  </div>

                  {/* CNPJ API */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                          <span className="material-icons text-blue-500">business</span> API de Dados Cadastrais (CNPJ)
                      </h4>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Base URL</label>
                              <input 
                                  type="text" 
                                  value={localConnConfig.cnpjApi.baseUrl} 
                                  onChange={e => setLocalConnConfig({...localConnConfig, cnpjApi: {...localConnConfig.cnpjApi, baseUrl: e.target.value}})}
                                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Token (Opcional)</label>
                              <input 
                                  type="text" 
                                  value={localConnConfig.cnpjApi.token || ''} 
                                  onChange={e => setLocalConnConfig({...localConnConfig, cnpjApi: {...localConnConfig.cnpjApi, token: e.target.value}})}
                                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                              />
                          </div>
                          <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-4">Mapeamento de Campos</h5>
                          <MappingEditor mappings={localConnConfig.cnpjApi.mappings} apiType="cnpj" />
                          <button type="button" onClick={() => { setTestType('cnpj'); setTestModalOpen(true); }} className="mt-4 text-sm font-medium text-primary hover:underline flex items-center gap-1">
                              <span className="material-icons text-sm">science</span> Testar Conexão
                          </button>
                      </div>
                  </div>

                  {/* Diagnostic API */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                          <span className="material-icons text-purple-500">analytics</span> API de Diagnóstico Fiscal (Webhook)
                      </h4>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Webhook URL</label>
                              <input 
                                  type="text" 
                                  value={localConnConfig.diagnosticApi.webhookUrl} 
                                  onChange={e => setLocalConnConfig({...localConnConfig, diagnosticApi: {...localConnConfig.diagnosticApi, webhookUrl: e.target.value}})}
                                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Header Key para CNPJ (Opcional)</label>
                              <input 
                                  type="text" 
                                  value={localConnConfig.diagnosticApi.headerKey || ''} 
                                  onChange={e => setLocalConnConfig({...localConnConfig, diagnosticApi: {...localConnConfig.diagnosticApi, headerKey: e.target.value}})}
                                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                              />
                          </div>
                          <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-4">Mapeamento de Campos</h5>
                          <MappingEditor mappings={localConnConfig.diagnosticApi.mappings} apiType="diagnostic" />
                          <button type="button" onClick={() => { setTestType('diagnostic'); setTestModalOpen(true); }} className="mt-4 text-sm font-medium text-primary hover:underline flex items-center gap-1">
                              <span className="material-icons text-sm">science</span> Testar Conexão
                          </button>
                      </div>
                  </div>
                  
                  {/* WhatsApp API */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                          <span className="material-icons text-green-500">whatsapp</span> API de Mensagens (WhatsApp)
                      </h4>
                      
                      {/* Global Toggle */}
                      <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                              <span className="material-icons text-xl text-green-600">toggle_on</span>
                              <div>
                                  <p className="font-medium text-slate-800 dark:text-white">Integração WhatsApp</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Ativa/desativa todos os envios de notificação e resumo.</p>
                              </div>
                          </div>
                          <button 
                              type="button"
                              onClick={() => setLocalConnConfig(prev => ({
                                  ...prev,
                                  whatsappApi: {
                                      ...prev.whatsappApi,
                                      enabled: !prev.whatsappApi.enabled
                                  }
                              }))}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localConnConfig.whatsappApi.enabled ? 'bg-green-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                          >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localConnConfig.whatsappApi.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                      </div>
                      
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL de Envio de Texto</label>
                              <input 
                                  type="text" 
                                  value={localConnConfig.whatsappApi.sendTextUrl} 
                                  onChange={e => setLocalConnConfig({...localConnConfig, whatsappApi: {...localConnConfig.whatsappApi, sendTextUrl: e.target.value}})}
                                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                              />
                          </div>
                          {/* REMOVED TOKEN INPUT FIELD (Issue 5) */}
                          <p className="text-xs text-slate-500 mt-2">O token de autenticação é gerenciado como um segredo Deno (`WHATSAPP_API_TOKEN`).</p>
                          <button type="button" onClick={() => { setTestType('whatsapp'); setTestModalOpen(true); }} className="mt-4 text-sm font-medium text-primary hover:underline flex items-center gap-1">
                              <span className="material-icons text-sm">science</span> Testar Envio
                          </button>
                      </div>
                  </div>

                  {/* SMTP Config */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                          <span className="material-icons text-emerald-500">mail</span> Configuração de E-mail (SMTP)
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-sm mb-1">Host</label><input type="text" value={localConnConfig.smtp.host} onChange={e => setLocalConnConfig({...localConnConfig, smtp: {...localConnConfig.smtp, host: e.target.value}})} className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-sm" /></div>
                          <div><label className="block text-sm mb-1">Porta</label><input type="number" value={localConnConfig.smtp.port} onChange={e => setLocalConnConfig({...localConnConfig, smtp: {...localConnConfig.smtp, port: parseInt(e.target.value)}})} className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-sm" /></div>
                          <div><label className="block text-sm mb-1">Usuário</label><input type="text" value={localConnConfig.smtp.user} onChange={e => setLocalConnConfig({...localConnConfig, smtp: {...localConnConfig.smtp, user: e.target.value}})} className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-sm" /></div>
                          <div><label className="block text-sm mb-1">Senha</label><input type="password" value={localConnConfig.smtp.pass} onChange={e => setLocalConnConfig({...localConnConfig, smtp: {...localConnConfig.smtp, pass: e.target.value}})} className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-sm" /></div>
                          <div className="col-span-2 flex items-center gap-4">
                              <label className="flex items-center gap-2 text-sm">
                                  <input type="checkbox" checked={localConnConfig.smtp.secure} onChange={e => setLocalConnConfig({...localConnConfig, smtp: {...localConnConfig.smtp, secure: e.target.checked}})} className="rounded text-primary focus:ring-primary" />
                                  Conexão Segura (SSL/TLS)
                              </label>
                          </div>
                          <div className="col-span-2"><label className="block text-sm mb-1">E-mail Remetente</label><input type="email" value={localConnConfig.smtp.fromEmail} onChange={e => setLocalConnConfig({...localConnConfig, smtp: {...localConnConfig.smtp, fromEmail: e.target.value}})} className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-sm" /></div>
                      </div>
                  </div>

                  {/* AI Config */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                          <span className="material-icons text-indigo-500">auto_awesome</span> Configuração de IA (Gemini)
                      </h4>
                      <label className="flex items-center gap-3 text-sm font-medium">
                          <input 
                              type="checkbox" 
                              checked={localConnConfig.ai.enabled} 
                              onChange={e => setLocalConnConfig({...localConnConfig, ai: {...localConnConfig.ai, enabled: e.target.checked}})}
                              className="rounded text-primary focus:ring-primary"
                          />
                          Habilitar Análise Financeira Inteligente
                      </label>
                      <p className="text-xs text-slate-500 mt-2">A chave de API deve ser configurada no arquivo `.env.local`.</p>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                      <button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="bg-primary hover:bg-blue-600 disabled:bg-slate-300 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                      >
                          {isSubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : 'Salvar Configurações'}
                      </button>
                  </div>
              </form>
          </div>
      )}

      {/* --- CONTENT: MAINTENANCE --- */}
      {activeTab === 'maintenance' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Controle de Manutenção</h3>
              <p className="text-slate-500 dark:text-slate-400">Ative o modo de manutenção para desabilitar temporariamente partes da aplicação ou o sistema inteiro.</p>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                          <span className="material-icons">warning</span> Manutenção Global
                      </h4>
                      <button 
                          onClick={() => toggleMaintenance('global')}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${maintenance.global ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                      >
                          <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${maintenance.global ? 'translate-x-7' : 'translate-x-1'}`} />
                      </button>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Se ativado, todos os usuários (exceto Admin) verão a tela de manutenção global.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Manutenção por Módulo</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(maintenance).filter(([key]) => key !== 'global').map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center p-3 border border-slate-100 dark:border-slate-800 rounded-lg">
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{key}</span>
                              <button 
                                  onClick={() => toggleMaintenance(key as keyof MaintenanceConfig)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-yellow-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                              >
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* NEWS PREVIEW MODAL */}
      {showNewsPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white">Pré-visualização: {newsForm.title}</h3>
                      <button onClick={() => setShowNewsPreview(false)} className="text-slate-400 hover:text-slate-600">
                          <span className="material-icons">close</span>
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 md:p-10">
                      <div className="relative h-48 w-full mb-6 rounded-lg overflow-hidden">
                          <img src={newsForm.imageUrl} alt="Capa" className="w-full h-full object-cover" />
                          <div className="absolute top-4 left-4">
                             <span className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm">
                                {newsForm.category}
                              </span>
                          </div>
                      </div>
                      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">{newsForm.title}</h1>
                      <p className="text-lg text-slate-600 dark:text-slate-300 font-medium mb-6 leading-relaxed border-l-4 border-primary pl-4 italic">
                         {newsForm.excerpt}
                      </p>
                      <div 
                         className="prose prose-slate dark:prose-invert max-w-none prose-a:text-primary prose-headings:text-slate-800 dark:prose-headings:text-white"
                         dangerouslySetInnerHTML={{ __html: previewContent }}
                      />
                  </div>
              </div>
          </div>
      )}
      
      {/* API TEST MODAL */}
      {testModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                          Teste de Conexão: {testType === 'cnpj' ? 'CNPJ' : testType === 'diagnostic' ? 'Diagnóstico Fiscal' : testType === 'whatsapp' ? 'WhatsApp' : 'Assistente Dyad'}
                      </h3>
                      <button onClick={() => setTestModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <span className="material-icons">close</span>
                      </button>
                  </div>
                  
                  <div className="p-6 flex-1 overflow-y-auto">
                      
                      {/* Test Input Form */}
                      <div className="mb-6 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <h4 className="font-bold text-slate-800 dark:text-white mb-3">Parâmetros de Teste</h4>
                          
                          {testType === 'cnpj' || testType === 'diagnostic' ? (
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CNPJ</label>
                                  <input 
                                      type="text" 
                                      value={testCnpj} 
                                      onChange={e => setTestCnpj(e.target.value)}
                                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-sm"
                                      placeholder="00.000.000/0001-00"
                                  />
                              </div>
                          ) : testType === 'whatsapp' ? (
                              <div className="space-y-4">
                                  <div className="p-3 bg-yellow-50 rounded-lg text-yellow-700 text-xs">
                                      O teste direto da API WhatsApp foi desabilitado por segurança. Este botão agora serve apenas como placeholder.
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número de Destino (Ex: 5531999999999)</label>
                                      <input 
                                          type="text" 
                                          value={testWhatsappNumber} 
                                          onChange={e => setTestWhatsappNumber(e.target.value)}
                                          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-sm"
                                          placeholder="55..."
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mensagem</label>
                                      <textarea 
                                          rows={3}
                                          value={testWhatsappMessage} 
                                          onChange={e => setTestWhatsappMessage(e.target.value)}
                                          className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-sm"
                                          placeholder="Mensagem de teste..."
                                      />
                                  </div>
                              </div>
                          ) : (
                              // Assistant Test
                              <div>
                                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pergunta de Teste</label>
                                  <input 
                                      type="text" 
                                      value={testAssistantQuery} 
                                      onChange={e => setTestAssistantQuery(e.target.value)}
                                      className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-sm"
                                      placeholder="Qual o limite do MEI?"
                                  />
                              </div>
                          )}

                          <button 
                              onClick={handleTestConnection}
                              disabled={testLoading || (testType !== 'whatsapp' && testType !== 'assistant' && !testCnpj) || testType === 'whatsapp'}
                              className="mt-4 w-full bg-primary hover:bg-blue-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                          >
                              {testLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <span className="material-icons text-sm">send</span>}
                              {testLoading ? 'Testando...' : 'Executar Teste'}
                          </button>
                      </div>

                      {/* Test Results */}
                      {testResponse && (
                          <div className="mt-6 space-y-4 animate-in fade-in">
                              <h4 className="font-bold text-slate-800 dark:text-white">Resultado da Chamada</h4>
                              
                              {/* Parsed Data (CNPJ/Diagnostic/Assistant) */}
                              {testParsedData && (
                                  <div className={`p-4 border rounded-lg ${testParsedData.Status === 'Sucesso' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                      <h5 className={`text-sm font-bold mb-2 ${testParsedData.Status === 'Sucesso' ? 'text-green-700' : 'text-red-700'}`}>Status: {testParsedData.Status}</h5>
                                      {Object.entries(testParsedData).filter(([key]) => key !== 'Status' && key !== 'HTTP Status').map(([label, value]) => (
                                          <div key={label} className="text-xs text-slate-600">
                                              <span className="font-semibold">{label}:</span> {value as string}
                                          </div>
                                      ))}
                                      <p className="text-xs text-slate-600 mt-2">HTTP: {testParsedData['HTTP Status']}</p>
                                  </div>
                              )}

                              <h4 className="font-bold text-slate-800 dark:text-white">Resposta Bruta (JSON)</h4>
                              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto max-h-64 border border-slate-700">
                                  {testResponse}
                              </pre>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default AdminPage;