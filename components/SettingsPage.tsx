
import React, { useState, useEffect, useRef } from 'react';
import { Category, User } from '../types';

const availableIcons = [
  'work', 'shopping_cart', 'shopping_bag', 'inventory_2', 'savings', 
  'account_balance', 'payments', 'attach_money', 'receipt_long', 'credit_card',
  'local_shipping', 'wifi', 'computer', 'phone_iphone', 'build', 
  'restaurant', 'flight', 'directions_car', 'home', 'apartment',
  'school', 'health_and_safety', 'fitness_center', 'groups', 'campaign',
  'content_cut', 'palette', 'camera_alt', 'music_note', 'pets'
];

interface SettingsPageProps {
  user?: User | null;
  onUpdateUser?: (user: User) => void;
  cnpj?: string;
  onCnpjChange?: (cnpj: string) => void;
  revenueCats: Category[];
  expenseCats: Category[];
  onAddCategory: (type: 'receita' | 'despesa', cat: Category) => void;
  onDeleteCategory: (type: 'receita' | 'despesa', name: string) => void;
  onExportData?: () => void;
  onDeleteAccount?: () => void;
  onChangePassword?: (newPassword: string) => Promise<boolean>;
}

type SettingsSection = 'profile' | 'categories' | 'appearance';

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  user, onUpdateUser,
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
      phone: user?.phone || '',
      email: user?.email || ''
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

  // Email Verification State
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  
  // Category State
  const [activeCatTab, setActiveCatTab] = useState<'receita' | 'despesa'>('receita');
  const [newCatInput, setNewCatInput] = useState('');
  const [selectedNewIcon, setSelectedNewIcon] = useState('sell');
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  // Feedback State
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  const iconPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setTheme('dark');
    } else {
      setTheme('light');
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
        setShowIconPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update local form when user prop updates
  useEffect(() => {
      if (user) {
          setProfileForm({
              name: user.name,
              phone: user.phone || '',
              email: user.email
          });
      }
  }, [user]);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleAddCategory = () => {
    if (!newCatInput.trim()) return;
    
    const newCategory: Category = {
      name: newCatInput.trim(),
      icon: selectedNewIcon
    };

    onAddCategory(activeCatTab, newCategory);
    setNewCatInput('');
    setShowIconPicker(false);
    setSelectedNewIcon('sell');
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000)); // Simulate save delay

    // 1. Save CNPJ
    if (onCnpjChange) {
      onCnpjChange(localCnpj);
    }

    // 2. Check for Email Change
    if (user && profileForm.email !== user.email) {
        setPendingEmail(profileForm.email);
        setIsVerifyingEmail(true);
        setIsSaving(false);
        // Simulate sending email
        alert(`[SIMULAÇÃO] Um código de verificação foi enviado para: ${profileForm.email}\n\nCódigo: 123456`);
        return;
    }

    // 3. Save Basic Info (Name/Phone) if email didn't change
    if (user && onUpdateUser) {
        onUpdateUser({
            ...user,
            name: profileForm.name,
            phone: profileForm.phone
        });
        showSuccessFeedback();
    }
    setIsSaving(false);
  };

  const handleVerifyEmail = () => {
      if (verificationCode === '123456') {
          if (user && onUpdateUser) {
              onUpdateUser({
                  ...user,
                  name: profileForm.name,
                  phone: profileForm.phone,
                  email: pendingEmail
              });
          }
          setIsVerifyingEmail(false);
          setVerificationCode('');
          setPendingEmail('');
          showSuccessFeedback();
      } else {
          alert("Código incorreto. Tente novamente.");
      }
  };

  const handlePasswordSubmit = async () => {
      if (passForm.new !== passForm.confirm) {
          alert("As novas senhas não coincidem.");
          return;
      }
      if (passForm.new.length < 6) {
          alert("A nova senha deve ter pelo menos 6 caracteres.");
          return;
      }
      
      if (onChangePassword) {
          setIsSavingPass(true);
          const success = await onChangePassword(passForm.new);
          setIsSavingPass(false);
          
          if (success) {
              alert("Senha alterada com sucesso!");
              setPassForm({ current: '', new: '', confirm: '' });
          } else {
              alert("Erro ao alterar a senha. Verifique a senha atual.");
          }
      }
  };

  const showSuccessFeedback = () => {
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleExportDataClick = async () => {
      if (onExportData) {
          setIsExporting(true);
          await new Promise(r => setTimeout(r, 1500)); // Simulate generation
          onExportData();
          setIsExporting(false);
      }
  };

  const handleDeleteAccountClick = () => {
      const confirmDelete = window.confirm("ATENÇÃO: Tem certeza que deseja excluir sua conta permanentemente? Todos os dados serão perdidos. Esta ação não pode ser desfeita.");
      if (confirmDelete && onDeleteAccount) {
          onDeleteAccount();
      }
  }

  const menuItems = [
    { id: 'profile', label: 'Perfil e Dados', icon: 'person', desc: 'Dados Pessoais e CNPJ' },
    { id: 'categories', label: 'Categorias', icon: 'category', desc: 'Gerenciar Financeiro' },
    { id: 'appearance', label: 'Aparência', icon: 'palette', desc: 'Tema e Cores' },
  ];

  return (
     <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-8 flex flex-col md:flex-row gap-6 max-w-6xl mx-auto items-start">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2 md:sticky md:top-0 z-20 bg-background-light dark:bg-background-dark py-2 md:py-0">
            {/* Mobile Horizontal / Desktop Vertical Menu */}
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
           
           {/* Header do Content */}
           <div className="px-6 py-4 md:px-8 md:py-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
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
                                onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="(00) 00000-0000"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">E-mail</label>
                            <input 
                                type="email" 
                                value={profileForm.email}
                                onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                            {user && profileForm.email !== user.email && (
                                <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                                    <span className="material-icons text-xs">warning</span>
                                    Será necessário verificar o novo e-mail.
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
                                    className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors w-full shadow-sm"
                                >
                                    Excluir Conta
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
              )}

              {/* --- APPEARANCE SECTION --- */}
              {activeSection === 'appearance' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                     <p className="text-slate-500 dark:text-slate-400">Escolha como você prefere visualizar a plataforma.</p>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                        <button 
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

                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Adicionar Nova Categoria</label>
                        <div className="flex flex-col sm:flex-row gap-2 items-stretch" ref={iconPickerRef}>
                            <div className="relative">
                                <button 
                                    onClick={() => setShowIconPicker(!showIconPicker)}
                                    className="w-full sm:w-auto h-full px-4 py-2 sm:py-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-600 dark:text-slate-300 gap-2 min-w-[80px]"
                                    title="Escolher ícone"
                                >
                                    <span className="material-icons text-xl">{selectedNewIcon}</span>
                                    <span className="material-icons text-sm opacity-50">expand_more</span>
                                </button>
                                
                                {showIconPicker && (
                                    <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 w-72 grid grid-cols-6 gap-2 animate-in fade-in zoom-in-95 duration-200">
                                        {availableIcons.map((icon) => (
                                        <button
                                            key={icon}
                                            onClick={() => {
                                            setSelectedNewIcon(icon);
                                            setShowIconPicker(false);
                                            }}
                                            className={`p-2 rounded-lg flex items-center justify-center transition-all ${selectedNewIcon === icon ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                        >
                                            <span className="material-icons text-xl">{icon}</span>
                                        </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <input 
                                type="text" 
                                value={newCatInput}
                                onChange={(e) => setNewCatInput(e.target.value)}
                                placeholder={`Nome da categoria...`}
                                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                            />
                            <button 
                                onClick={handleAddCategory}
                                className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-sm"
                            >
                                <span className="hidden sm:inline">Adicionar</span>
                                <span className="sm:hidden material-icons">add</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-slate-700 dark:text-white mb-3">Categorias Ativas</h4>
                        <div className="flex flex-wrap gap-2 md:gap-3">
                            {(activeCatTab === 'receita' ? revenueCats : expenseCats).map((cat, idx) => (
                                <div key={idx} className="group flex items-center gap-3 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-sm hover:shadow-md transition-all text-sm md:text-base">
                                    <div className={`p-1.5 rounded-md ${activeCatTab === 'receita' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        <span className="material-icons text-sm block">{cat.icon}</span>
                                    </div>
                                    <span className="font-medium">{cat.name}</span>
                                    <button 
                                        onClick={() => onDeleteCategory(activeCatTab, cat.name)}
                                        className="ml-1 text-slate-300 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                        title="Remover"
                                    >
                                        <span className="material-icons text-sm">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
              )}

           </div>
        </div>

        {/* Verification Modal */}
        {isVerifyingEmail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 border border-slate-200 dark:border-slate-800">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-icons text-3xl">mark_email_read</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Verificar E-mail</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Enviamos um código para <strong>{pendingEmail}</strong>. Digite-o abaixo para confirmar.
                        </p>
                    </div>
                    
                    <input 
                        type="text" 
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="w-full px-4 py-3 text-center text-xl font-bold tracking-widest border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 mb-6"
                        placeholder="000000"
                        maxLength={6}
                    />

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsVerifyingEmail(false)}
                            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleVerifyEmail}
                            className="flex-1 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg font-bold shadow-sm transition-colors"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        )}
     </div>
  );
};

export default SettingsPage;
