import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Category, User } from '../types';
import { showSuccess, showError, showWarning } from '../utils/toastUtils';
import CategoryModal from './CategoryModal'; // Importando o novo modal

// Mapeamento de ícones e termos em Português (mantido apenas para referência de exclusão de código)
const categorizedIcons = {
  'Financeiro': [
    'payments', 'attach_money', 'credit_card', 'account_balance_wallet', 'savings', 'receipt_long', 'paid', 'sell', 'trending_up', 'trending_down', 'pie_chart', 'sync', 'query_stats', 'account_balance', 'money_off', 'price_check', 'redeem', 'local_offer'
  ],
  'Negócios': [
    'work', 'store', 'business', 'groups', 'campaign', 'local_shipping', 'inventory_2', 'construction', 'gavel', 'verified_user', 'badge', 'handshake', 'person_add', 'support_agent', 'domain', 'factory', 'warehouse', 'content_cut', 'palette', 'brush'
  ],
  'Casa & Pessoal': [
    'home', 'apartment', 'directions_car', 'local_gas_station', 'fastfood', 'restaurant', 'pets', 'school', 'medical_services', 'fitness_center', 'shopping_bag', 'shopping_cart', 'local_cafe', 'local_bar', 'luggage', 'child_care', 'flight', 'pool', 'park'
  ],
  'Tecnologia': [
    'computer', 'phone_iphone', 'wifi', 'router', 'cloud', 'subscriptions', 'bolt', 'lightbulb', 'build', 'settings', 'laptop_mac', 'security', 'storage', 'developer_mode', 'code', 'print', 'smartphone', 'tv', 'gamepad'
  ],
  'Datas & Eventos': [
    'event', 'schedule', 'calendar_today', 'alarm', 'watch_later', 'hourglass_empty', 'date_range', 'notifications', 'celebration', 'public', 'music_note', 'camera_alt', 'mic', 'movie'
  ],
  'Diversos': [
    'category', 'more_horiz', 'attach_file', 'edit', 'delete', 'check_circle', 'warning', 'error', 'volunteer_activism', 'info', 'help', 'lock', 'star', 'favorite'
  ]
};

const portugueseIconMap: Record<string, string[]> = {
    'dinheiro': ['payments', 'attach_money', 'paid', 'savings'],
    'pagamento': ['payments', 'paid', 'credit_card'],
    'cartão': ['credit_card'],
    'casa': ['home', 'apartment'],
    'carro': ['directions_car', 'local_gas_station'],
    'comida': ['fastfood', 'restaurant'],
    'trabalho': ['work', 'business', 'store'],
    'loja': ['store', 'shopping_cart', 'shopping_bag'],
    'imposto': ['account_balance', 'gavel'],
    'saúde': ['medical_services', 'fitness_center'],
    'escola': ['school'],
    'viagem': ['flight', 'luggage'],
    'data': ['event', 'calendar_today', 'date_range'],
    'alerta': ['warning', 'error', 'notifications'],
    'config': ['settings', 'build'],
    'computador': ['computer', 'laptop_mac'],
    'celular': ['phone_iphone', 'smartphone'],
    'internet': ['wifi', 'router', 'cloud'],
    'serviço': ['work', 'build', 'support_agent'],
    'venda': ['sell', 'shopping_cart', 'inventory_2'],
    'compra': ['shopping_cart', 'shopping_bag'],
    'presente': ['redeem', 'local_offer'],
    'ajuda': ['help', 'info', 'support_agent'],
    'segurança': ['security', 'lock', 'verified_user'],
    'ferramenta': ['build', 'construction'],
    'equipe': ['groups', 'person_add'],
    'marketing': ['campaign'],
    'corte': ['content_cut'],
    'pintura': ['palette', 'brush'],
};

interface SettingsPageProps {
  user?: User | null;
  onUpdateUser?: (user: User) => void;
  onUpdateUserPhone?: (userId: string, newPhone: string) => Promise<{ success: boolean, error?: string }>;
  onUpdateUserEmail?: (newEmail: string) => Promise<{ success: boolean, error?: string }>; // <--- NEW PROP
  cnpj?: string;
  onCnpjChange?: (cnpj: string) => void;
  revenueCats: Category[];
  expenseCats: Category[];
  onAddCategory: (type: 'receita' | 'despesa', cat: Category) => void;
  onDeleteCategory: (type: 'receita' | 'despesa', name: string) => void;
  onExportData?: () => void;
  onDeleteAccount?: () => Promise<void>;
  onChangePassword?: (newPassword: string) => Promise<boolean>;
}

type SettingsSection = 'profile' | 'categories' | 'appearance';

// --- UTILS ---
const formatPhone = (value: string): string => {
    const cleanValue = value.replace(/[^\d]/g, '');
    const length = cleanValue.length;

    if (length <= 2) return `(${cleanValue}`;
    if (length <= 7) return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`;
    if (length <= 11) return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7, 11)}`;
    
    return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7, 11)}`;
};
// --- END UTILS ---


const SettingsPage: React.FC<SettingsPageProps> = ({ 
  user, onUpdateUser, onUpdateUserPhone, onUpdateUserEmail,
  cnpj, onCnpjChange, 
  revenueCats, expenseCats, onAddCategory, onDeleteCategory,
  onExportData, onDeleteAccount, onChangePassword
}) => {
  // State
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [localCnpj, setLocalCnpj] = useState(cnpj || '');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
      name: user?.name || '',
      phone: user?.phone ? formatPhone(user.phone) : '', // Format phone on load
      email: user?.email || '',
      receiveWeeklySummary: user?.receiveWeeklySummary ?? true // NEW FIELD
  });

  // Password Form State
  const [passForm, setPassForm] = useState({
      current: '',
      new: '',
      confirm: ''
  });
  const [showPass, setShowPass] = useState({
      current: false,
      new: false,
      confirm: false
  });
  const [isSavingPass, setIsSavingPass] = useState(false);

  // REMOVIDO: Email Verification State
  // const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  // const [verificationCode, setVerificationCode] = useState('');
  // const [pendingEmail, setPendingEmail] = useState('');
  
  // Category State
  const [activeCatTab, setActiveCatTab] = useState<'receita' | 'despesa'>('receita');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); // Novo estado para o modal
  
  // Feedback State
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // New state for deletion
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  // Lista de categorias padrão (para bloquear exclusão)
  const defaultCategories = {
      receita: ['Serviços', 'Vendas', 'Produtos', 'Rendimentos', 'Outros'],
      despesa: ['Impostos', 'Fornecedores', 'Infraestrutura', 'Pessoal', 'Marketing', 'Software', 'Outros']
  };

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  // Update local form when user prop updates
  useEffect(() => {
      if (user) {
          setProfileForm({
              name: user.name,
              phone: user.phone ? formatPhone(user.phone) : '', // Format phone on user update
              email: user.email,
              receiveWeeklySummary: user.receiveWeeklySummary ?? true // Update on user change
          });
      }
  }, [user]);
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatPhone(rawValue);
    setProfileForm({...profileForm, phone: formattedValue});
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !onUpdateUser || !onUpdateUserPhone || !onUpdateUserEmail) return;
    
    setIsSaving(true);
    
    const originalPhone = user.phone ? formatPhone(user.phone) : '';
    const newPhone = profileForm.phone;
    const isPhoneChanged = originalPhone !== newPhone;
    
    const originalEmail = user.email;
    const newEmail = profileForm.email;
    const isEmailChanged = originalEmail !== newEmail;
    
    let phoneUpdateSuccess = true;
    let emailUpdateSuccess = true;
    
    // 1. Handle Phone Change
    if (isPhoneChanged) {
        const { success, error } = await onUpdateUserPhone(user.id, newPhone);
        if (!success) {
            showError(error || "Erro ao atualizar telefone.");
            phoneUpdateSuccess = false;
        }
    }

    // 2. Handle Email Change (Updates Auth Credential)
    if (isEmailChanged) {
        const { success, error } = await onUpdateUserEmail(newEmail);
        if (success) {
            showWarning(`Um link de confirmação foi enviado para ${newEmail}. Clique no link para finalizar a alteração do seu e-mail de login.`);
            // We do NOT update the local user state yet, as the change is pending confirmation.
        } else {
            showError(error || "Erro ao iniciar a alteração de e-mail.");
            emailUpdateSuccess = false;
        }
    }

    // 3. Handle CNPJ Change
    if (onCnpjChange) {
      onCnpjChange(localCnpj);
    }

    // 4. Save Basic Info (Name/Summary Preference) and update profile table email if email wasn't changed (or if it was, we only update name/phone/summary)
    if (phoneUpdateSuccess && emailUpdateSuccess) {
        // Create a partial user object for fields that don't require special checks
        const partialUpdate: Partial<User> = {
            name: profileForm.name,
            receiveWeeklySummary: profileForm.receiveWeeklySummary
        };
        
        // If email was NOT changed, we update the profile table email field too (redundant but safe)
        if (!isEmailChanged) {
             partialUpdate.email = profileForm.email;
        }
        
        // We call onUpdateUser which handles the DB update for these fields.
        onUpdateUser({
            ...user,
            ...partialUpdate,
        });
        
        // Only show success feedback if no critical errors occurred
        if (!isEmailChanged) {
            showSuccessFeedback();
        }
    }
    
    setIsSaving(false);
  };

  // REMOVIDO: handleVerifyEmail function

  const handlePasswordSubmit = async () => {
      if (passForm.new !== passForm.confirm) {
          showError("As novas senhas não coincidem.");
          return;
      }
      if (passForm.new.length < 6) {
          showError("A nova senha deve ter pelo menos 6 caracteres.");
          return;
      }
      
      if (onChangePassword) {
          setIsSavingPass(true);
          // Note: App.tsx handles success/error toasts for password change
          const success = await onChangePassword(passForm.new);
          setIsSavingPass(false);
          
          if (success) {
              setPassForm({ current: '', new: '', confirm: '' });
          }
      }
  };

  const showSuccessFeedback = () => {
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };
  
  const isDefaultCategory = (name: string, type: 'receita' | 'despesa') => {
      return defaultCategories[type].includes(name);
  };

  const handleExportDataClick = async () => {
      if (onExportData) {
          setIsExporting(true);
          // App.tsx handles the actual export and success toast
          await onExportData();
          setIsExporting(false);
      }
  };

  const handleDeleteAccountClick = async () => {
      const confirmDelete = window.confirm("ATENÇÃO: Tem certeza que deseja excluir sua conta permanentemente? Todos os dados serão perdidos. Esta ação não pode ser desfeita.");
      if (confirmDelete && onDeleteAccount) {
          setIsDeleting(true);
          try {
              // App.tsx handles the deletion and redirects/toasts
              await onDeleteAccount();
          } catch (e) {
              // If App.tsx fails to catch and display error, we catch here
              showError("Falha crítica ao iniciar a exclusão da conta.");
          } finally {
              setIsDeleting(false);
          }
      }
  }

  const menuItems = [
    { id: 'profile', label: 'Perfil e Dados', icon: 'person', desc: 'Dados Pessoais e CNPJ' },
    { id: 'categories', label: 'Categorias', icon: 'category', desc: 'Gerenciar Financeiro' },
    { id: 'appearance', label: 'Aparência', icon: 'palette', desc: 'Tema e Cores' },
  ];

  return (
     <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-8 flex flex-col md:flex-row gap-6 max-w-6xl mx-auto items-start">
        
        {/* --- MOBILE/TABLET TABS (Visible on small screens) --- */}
        <div className="w-full lg:hidden flex flex-col gap-4">
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id as SettingsSection)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all flex-shrink-0 border ${
                            activeSection === item.id 
                                ? 'bg-primary text-white border-primary shadow-md' 
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        <span className="material-icons text-lg">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </div>
        </div>

        {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
        <div className="hidden lg:flex w-full lg:w-64 flex-shrink-0 flex-col gap-2 md:sticky md:top-0 z-20 py-2 md:py-0">
            <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-2 md:pb-0 scrollbar-hide sticky top-0 md:static">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as SettingsSection)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left min-w-[150px] md:min-w-0 flex-shrink-0 border md:border-transparent ${
                    activeSection === item.id 
                      ? 'bg-white dark:bg-slate-800 text-primary shadow-sm border-slate-200 dark:border-slate-700' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 border-transparent bg-slate-50/50 dark:bg-slate-800/30'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${activeSection === item.id ? 'bg-primary/10' : 'bg-slate-200 dark:bg-slate-700'}`}>
                     <span className="material-icons text-xl">{item.icon}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-sm">{item.label}</span>
                    <span className="block text-[10px] opacity-70 hidden md:block">{item.desc}</span>
                  </div>
                </button>
              ))}
            </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
           
           {/* Header do Content (Hidden on Mobile if using tabs) */}
           <div className="px-6 py-4 md:px-8 md:py-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hidden lg:block">
              <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="material-icons text-slate-400">
                  {menuItems.find(i => i.id === activeSection)?.icon}
                </span>
                {menuItems.find(i => i.id === activeSection)?.label}
              </h3>
           </div>

           <div className="p-4 md:p-8 flex-1">
              
              {/* --- PROFILE SECTION --- */}
              {activeSection === 'profile' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nome Completo</label>
                            <input 
                                type="text" 
                                required
                                value={profileForm.name}
                                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Telefone</label>
                            <input 
                                type="tel" 
                                value={profileForm.phone}
                                onChange={handlePhoneChange} // Use custom handler
                                maxLength={15} // Max length for (99) 99999-9999
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="(00) 00000-0000"
                            />
                            {user?.phone && formatPhone(user.phone) !== profileForm.phone && (
                                <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                                    <span className="material-icons text-xs">warning</span>
                                    O telefone será atualizado após salvar.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">E-mail (Login)</label>
                            <input 
                                type="email" 
                                value={profileForm.email}
                                onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                            {user && profileForm.email !== user.email && (
                                <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                                    <span className="material-icons text-xs">warning</span>
                                    Será enviado um link de confirmação para o novo e-mail.
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">CNPJ Principal</label>
                            <input 
                                type="text" 
                                value={localCnpj}
                                onChange={(e) => setLocalCnpj(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none font-mono tracking-wide"
                            />
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                <span className="material-icons text-xs">info</span>
                                Usado para monitoramento fiscal automático.
                            </p>
                        </div>
                    </div>
                    
                    {/* Weekly Summary Preference (IMPROVED SECTION) */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-icons text-orange-500">notifications_active</span>
                            Preferências de Notificação
                        </h4>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 gap-4">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                    <span className="material-icons text-xl text-green-600">whatsapp</span>
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-white">Resumo Semanal de Contas</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Receber resumo de contas a pagar/receber todo domingo.</p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setProfileForm(prev => ({
                                    ...prev,
                                    receiveWeeklySummary: !prev.receiveWeeklySummary
                                }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${profileForm.receiveWeeklySummary ? 'bg-green-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profileForm.receiveWeeklySummary ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="pt-2 pb-8 border-b border-slate-100 dark:border-slate-800">
                         <button 
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="w-full md:w-auto bg-primary hover:bg-blue-600 disabled:bg-slate-300 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                         >
                            {isSaving ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Salvando...
                                </>
                            ) : showSaveSuccess ? (
                                <>
                                    <span className="material-icons">check_circle</span> Salvo!
                                </>
                            ) : (
                                <>
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>

                    {/* Security Section (Change Password) */}
                    <div>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Segurança</h4>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="grid grid-cols-1 gap-4 max-w-lg">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha Atual</label>
                                    <div className="relative">
                                        <input 
                                            type={showPass.current ? "text" : "password"}
                                            value={passForm.current}
                                            onChange={(e) => setPassForm({...passForm, current: e.target.value})}
                                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 pr-10"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPass({...showPass, current: !showPass.current})}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        >
                                            <span className="material-icons text-lg">{showPass.current ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nova Senha</label>
                                        <div className="relative">
                                            <input 
                                                type={showPass.new ? "text" : "password"}
                                                value={passForm.new}
                                                onChange={(e) => setPassForm({...passForm, new: e.target.value})}
                                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 pr-10"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPass({...showPass, new: !showPass.new})}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            >
                                                <span className="material-icons text-lg">{showPass.new ? 'visibility_off' : 'visibility'}</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar Senha</label>
                                        <div className="relative">
                                            <input 
                                                type={showPass.confirm ? "text" : "password"}
                                                value={passForm.confirm}
                                                onChange={(e) => setPassForm({...passForm, confirm: e.target.value})}
                                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 pr-10"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPass({...showPass, confirm: !showPass.confirm})}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        >
                                            <span className="material-icons text-lg">{showPass.confirm ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={handlePasswordSubmit}
                                    disabled={isSavingPass || !passForm.current || !passForm.new}
                                    className="mt-2 w-full md:w-auto self-start px-6 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {isSavingPass ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Atualizando...
                                        </>
                                    ) : 'Alterar Senha'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Dados e Privacidade Section */}
                    <div>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Dados e Privacidade</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Export Card */}
                            <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center mb-3">
                                    <span className="material-icons">table_view</span>
                                </div>
                                <h5 className="font-bold text-slate-800 dark:text-white mb-1">Exportar Transações</h5>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                    Baixe o histórico completo de receitas e despesas em formato CSV (Excel).
                                </p>
                                <button 
                                    onClick={handleExportDataClick}
                                    disabled={isExporting}
                                    className="text-sm font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors w-full flex items-center justify-center gap-2"
                                >
                                    {isExporting ? (
                                        <>
                                            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                            Gerando...
                                        </>
                                    ) : 'Baixar Planilha'}
                                </button>
                            </div>

                            {/* Delete Card */}
                            <div className="p-5 border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 rounded-xl">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center mb-3">
                                    <span className="material-icons">warning</span>
                                </div>
                                <h5 className="font-bold text-red-700 dark:text-red-400 mb-1">Zona de Perigo</h5>
                                <p className="text-sm text-red-600/80 dark:text-red-400/70 mb-4">
                                    Excluir permanentemente sua conta e todos os dados associados. Esta ação é irreversível.
                                </p>
                                <button 
                                    onClick={handleDeleteAccountClick}
                                    disabled={isDeleting}
                                    className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors w-full shadow-sm flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Excluindo...
                                        </>
                                    ) : 'Excluir Conta'}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
              )}

              {/* --- APPEARANCE SECTION --- */}
              {activeSection === 'appearance' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 lg:hidden">Aparência</h2>
                     <p className="text-slate-500 dark:text-slate-400">Escolha como você prefere visualizar a plataforma.</p>
                     
                     {/* ALTERADO: grid-cols-1 md:grid-cols-2 */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                        <button 
                            type="button"
                            onClick={() => handleThemeChange('light')}
                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${theme === 'light' ? 'border-primary bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                        >
                            <div className="w-full h-32 bg-slate-100 rounded-lg border border-slate-200 relative overflow-hidden shadow-sm">
                                <div className="absolute top-0 left-0 w-full h-4 bg-white border-b border-slate-200"></div>
                                <div className="absolute top-8 left-4 w-24 h-12 bg-white rounded shadow-sm"></div>
                                <div className="absolute bottom-4 right-4 w-8 h-8 bg-blue-500 rounded-full"></div>
                            </div>
                            <div className="flex items-center gap-2">
                                {theme === 'light' && <span className="material-icons text-primary text-sm">radio_button_checked</span>}
                                {theme !== 'light' && <span className="material-icons text-slate-400 text-sm">radio_button_unchecked</span>}
                                <span className={`font-bold ${theme === 'light' ? 'text-primary' : 'text-slate-500'}`}>Modo Claro</span>
                            </div>
                        </button>

                        <button 
                            type="button"
                            onClick={() => handleThemeChange('dark')}
                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${theme === 'dark' ? 'border-primary bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                        >
                            <div className="w-full h-32 bg-slate-900 rounded-lg border border-slate-700 relative overflow-hidden shadow-sm">
                                <div className="absolute top-0 left-0 w-full h-4 bg-slate-800 border-b border-slate-700"></div>
                                <div className="absolute top-8 left-4 w-24 h-12 bg-slate-800 rounded shadow-sm"></div>
                                <div className="absolute bottom-4 right-4 w-8 h-8 bg-blue-500 rounded-full"></div>
                            </div>
                            <div className="flex items-center gap-2">
                                {theme === 'dark' && <span className="material-icons text-primary text-sm">radio_button_checked</span>}
                                {theme !== 'dark' && <span className="material-icons text-slate-400 text-sm">radio_button_unchecked</span>}
                                <span className={`font-bold ${theme === 'dark' ? 'text-primary' : 'text-slate-500'}`}>Modo Escuro</span>
                            </div>
                        </button>
                    </div>
                  </div>
              )}

              {/* --- CATEGORIES SECTION --- */}
              {activeSection === 'categories' && (
                 <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 lg:hidden">Categorias</h2>
                    
                    {/* Tabs and Add Button */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl inline-flex w-full md:w-auto">
                            <button
                                onClick={() => setActiveCatTab('receita')}
                                className={`flex-1 md:flex-none px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeCatTab === 'receita' ? 'bg-white dark:bg-slate-700 text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Receitas
                            </button>
                            <button
                                onClick={() => setActiveCatTab('despesa')}
                                className={`flex-1 md:flex-none px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeCatTab === 'despesa' ? 'bg-white dark:bg-slate-700 text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Despesas
                            </button>
                        </div>
                        
                        <button 
                            onClick={() => setIsCategoryModalOpen(true)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors shadow-sm text-sm whitespace-nowrap ${activeCatTab === 'receita' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                        >
                            <span className="material-icons text-lg">add</span>
                            Nova Categoria
                        </button>
                    </div>

                    {/* Category Grid */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 dark:text-white mb-3">Categorias Ativas</h4>
                        <div className="flex flex-wrap gap-2 md:gap-3">
                            {(activeCatTab === 'receita' ? revenueCats : expenseCats).map((cat, idx) => (
                                <div key={idx} className="group flex items-center gap-3 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-sm hover:shadow-md transition-all text-sm md:text-base">
                                    <div className={`p-1.5 rounded-md ${activeCatTab === 'receita' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        <span className="material-icons text-sm block">{cat.icon}</span>
                                    </div>
                                    <span className="font-medium">{cat.name}</span>
                                    
                                    {/* Only show delete button if it's NOT a default category */}
                                    {!isDefaultCategory(cat.name, activeCatTab) && (
                                        <button 
                                            type="button"
                                            onClick={() => onDeleteCategory(activeCatTab, cat.name)}
                                            className="ml-1 text-slate-300 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                            title="Remover"
                                        >
                                            <span className="material-icons text-sm">close</span>
                                        </button>
                                    )}
                                    {isDefaultCategory(cat.name, activeCatTab) && (
                                        <span className="ml-1 text-slate-300 cursor-help" title="Categoria padrão não pode ser removida.">
                                            <span className="material-icons text-sm">lock</span>
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
              )}

           </div>
        </div>

        {/* Category Modal */}
        <CategoryModal 
            type={activeCatTab}
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            onSave={onAddCategory}
        />

        {/* REMOVIDO: Verification Modal */}
     </div>
  );
};

export default SettingsPage;