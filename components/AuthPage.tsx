import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../src/integrations/supabase/client';

interface AuthPageProps {
  onLogin: (user: User) => void;
  onForgotPassword: (email: string) => Promise<boolean>;
  onNavigate: (tab: string) => void; // Added navigation prop
  onBackToLanding: () => void; // NEW PROP
}

type AuthMode = 'login' | 'register' | 'forgot';

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onForgotPassword, onNavigate, onBackToLanding }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false); // Global loading state for forms
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  // Legal Acceptance States
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // --- UTILS ---
  const formatPhone = (value: string): string => {
    const cleanValue = value.replace(/[^\d]/g, '');
    const length = cleanValue.length;

    if (length <= 2) return `(${cleanValue}`;
    if (length <= 7) return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`;
    if (length <= 11) return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7, 11)}`;
    
    return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatPhone(rawValue);
    setPhone(formattedValue);
  };
  // --- END UTILS ---

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    setIsLoading(false);

    if (error) {
        setAuthError(error.message.includes('Invalid login credentials') ? 'Credenciais inválidas. Verifique seu email e senha.' : error.message);
    } else {
        // onAuthStateChange in App.tsx handles successful login and user state update
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    
    if (!acceptTerms || !acceptPrivacy) {
        setAuthError("Você deve aceitar os Termos de Uso e a Política de Privacidade.");
        return;
    }

    if (regPassword !== regConfirmPassword) {
        setAuthError("As senhas não coincidem. Por favor, verifique.");
        return;
    }
    if (regPassword.length < 6) {
        setAuthError("A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    setIsLoading(true);
    
    // 1. Clean and Validate Phone Number
    const cleanPhone = phone.replace(/[^\d]/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) { // Requires 10 (DDD + 8 digitos) or 11 (DDD + 9 digitos)
        setAuthError("Número de telefone inválido. O DDD e o número são obrigatórios.");
        setIsLoading(false);
        return;
    }

    // 2. Check if phone number already exists in profiles table
    const { data: existingPhone, error: phoneCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', cleanPhone) // Use cleanPhone for lookup
        .maybeSingle();

    if (phoneCheckError) {
        console.error('Phone check error:', phoneCheckError);
        setAuthError('Erro ao verificar telefone. Por favor, tente novamente ou contate o suporte.');
        setIsLoading(false);
        return;
    }

    if (existingPhone) {
        // MENSAGEM DE ERRO MELHORADA PARA TELEFONE DUPLICADO
        setAuthError('Este número de telefone já está cadastrado. Se você já tem uma conta, tente fazer login ou contate o suporte.');
        setIsLoading(false);
        return;
    }

    // 3. Proceed with Supabase Sign Up
    const { error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
            data: {
                name: name,
                phone: cleanPhone, // Use clean phone number for storage
            }
        }
    });
    
    setIsLoading(false);

    if (error) {
        // Melhorando a mensagem de erro do Supabase
        let errorMessage = error.message;
        if (errorMessage.includes('User already registered')) {
            // MENSAGEM DE ERRO MELHORADA PARA EMAIL DUPLICADO
            errorMessage = 'Este e-mail já está cadastrado. Tente fazer login ou use a opção "Esqueceu a senha?".';
        } else if (errorMessage.includes('Password should be at least 6 characters')) {
            errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
        }
        setAuthError(errorMessage);
    } else {
        // Supabase sends a confirmation email by default.
        // Se não houve erro, exibe a mensagem de sucesso e muda para login.
        setAuthSuccess("Cadastro realizado! Verifique seu e-mail para confirmar sua conta antes de fazer login.");
        setMode('login');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setForgotLoading(true);
      setAuthError(null);
      setAuthSuccess(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
          redirectTo: window.location.origin, // Redirects back to the app after reset
      });

      setForgotLoading(false);
      
      if (error) {
          setAuthError(error.message);
      } else {
          setForgotSuccess(true);
      }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Left Side - Image/Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800 opacity-90 z-10"></div>
        <img 
            src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1500" 
            alt="Office" 
            className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 text-white p-12 text-center">
            <img 
                src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
                alt="Regular MEI" 
                className="h-16 mx-auto mb-8 object-contain brightness-0 invert"
            />
            <h2 className="text-3xl font-bold mb-4">Simplifique sua vida de MEI</h2>
            <p className="text-blue-100 text-lg max-w-md mx-auto">
                Gestão financeira, fiscal e benefícios em um único lugar. Feito para você crescer.
            </p>
        </div>
        {/* Decorative Circles */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-10 rounded-full z-10"></div>
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white opacity-10 rounded-full z-10"></div>
      </div>

      {/* Right Side - Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="max-w-md w-full">
            
            {/* NEW: Back to Landing Button */}
            <button 
                onClick={onBackToLanding} 
                className="mb-6 flex items-center text-slate-500 hover:text-primary transition-colors font-medium"
            >
                <span className="material-icons text-sm mr-1">arrow_back</span> Voltar para a Home
            </button>

            <div className="text-center mb-8 lg:hidden">
                <img 
                    src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
                    alt="Regular MEI" 
                    className="h-10 mx-auto dark:brightness-0 dark:invert"
                />
            </div>

            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 text-center">
                {mode === 'login' ? 'Acesse sua conta' : mode === 'register' ? 'Crie sua conta grátis' : 'Recuperar Senha'}
            </h2>
            <p className="text-slate-500 text-center mb-8">
                {mode === 'login' 
                    ? 'Bem-vindo de volta! Insira seus dados abaixo.' 
                    : mode === 'register' 
                    ? 'Comece a organizar seu negócio hoje mesmo.'
                    : 'Enviaremos as instruções para seu e-mail.'}
            </p>
            
            {authError && (
                <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg border border-red-200 text-sm text-center animate-in fade-in">
                    {authError}
                </div>
            )}
            
            {authSuccess && (
                <div className="p-3 mb-4 bg-green-100 text-green-700 rounded-lg border border-green-200 text-sm text-center animate-in fade-in">
                    {authSuccess}
                </div>
            )}

            {mode === 'login' && (
                // LOGIN FORM
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email ou Usuário</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons text-lg">person</span>
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons text-lg">lock</span>
                            <input 
                                type={showLoginPass ? "text" : "password"} 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowLoginPass(!showLoginPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                            >
                                <span className="material-icons text-lg">
                                    {showLoginPass ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex justify-end">
                        <button type="button" onClick={() => { setMode('forgot'); setAuthError(null); setAuthSuccess(null); }} className="text-sm text-primary hover:underline">Esqueceu a senha?</button>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Entrando...
                            </>
                        ) : 'Entrar'}
                    </button>
                    
                    <p className="text-center text-slate-500 mt-6">
                        Não tem uma conta? <button type="button" onClick={() => { setMode('register'); setAuthError(null); setAuthSuccess(null); }} className="text-primary font-bold hover:underline">Cadastre-se</button>
                    </p>
                </form>
            )}

            {mode === 'register' && (
                // REGISTER FORM
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons text-lg">badge</span>
                            <input 
                                type="text" 
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Maria Silva"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons text-lg">email</span>
                            <input 
                                type="email" 
                                required
                                value={regEmail}
                                onChange={(e) => setRegEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="maria@exemplo.com"
                            />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone (WhatsApp)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons text-lg">smartphone</span>
                            <input 
                                type="tel" 
                                required
                                value={phone}
                                onChange={handlePhoneChange}
                                inputMode="numeric"
                                maxLength={15} // Max length for (99) 99999-9999
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="(11) 99999-9999"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons text-lg">lock</span>
                            <input 
                                type={showRegPass ? "text" : "password"}
                                required
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowRegPass(!showRegPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                            >
                                <span className="material-icons text-lg">
                                    {showRegPass ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar Senha</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons text-lg">lock_reset</span>
                            <input 
                                type={showConfirmPass ? "text" : "password"}
                                required
                                value={regConfirmPassword}
                                onChange={(e) => setRegConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPass(!showConfirmPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                            >
                                <span className="material-icons text-lg">
                                    {showConfirmPass ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>
                    
                    {/* Legal Checkboxes */}
                    <div className="space-y-2 pt-2">
                        <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <input 
                                type="checkbox" 
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="mt-1 rounded text-primary focus:ring-primary"
                            />
                            <span>
                                Eu li e aceito os <button type="button" onClick={() => onNavigate('terms')} className="text-primary font-semibold hover:underline">Termos de Uso</button>.
                            </span>
                        </label>
                        <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <input 
                                type="checkbox" 
                                checked={acceptPrivacy}
                                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                                className="mt-1 rounded text-primary focus:ring-primary"
                            />
                            <span>
                                Eu concordo com a <button type="button" onClick={() => onNavigate('privacy')} className="text-primary font-semibold hover:underline">Política de Privacidade</button>.
                            </span>
                        </label>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading || !acceptTerms || !acceptPrivacy}
                        className="w-full bg-primary hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold shadow-sm transition-colors mt-2 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Criando conta...
                            </>
                        ) : 'Cadastrar'}
                    </button>
                    
                    <p className="text-center text-slate-500 mt-6">
                        Já tem uma conta? <button type="button" onClick={() => { setMode('login'); setAuthError(null); setAuthSuccess(null); }} className="text-primary font-bold hover:underline">Faça login</button>
                    </p>
                </form>
            )}

            {mode === 'forgot' && (
                // FORGOT PASSWORD FORM
                <div className="space-y-6">
                    {forgotSuccess ? (
                        <div className="text-center animate-in fade-in">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-icons text-3xl">mark_email_read</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">E-mail Enviado!</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                                Se o e-mail <strong>{forgotEmail}</strong> estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
                            </p>
                            <button 
                                onClick={() => { setMode('login'); setForgotSuccess(false); setForgotEmail(''); setAuthError(null); setAuthSuccess(null); }} 
                                className="w-full bg-primary hover:bg-blue-600 text-white py-3 rounded-lg font-bold shadow-sm transition-colors"
                            >
                                Voltar para o Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleForgotSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Cadastrado</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons text-lg">email</span>
                                    <input 
                                        type="email" 
                                        required
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/50"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={forgotLoading}
                                className="w-full bg-primary hover:bg-blue-600 disabled:bg-slate-300 text-white py-3 rounded-lg font-bold shadow-sm transition-colors flex justify-center items-center gap-2"
                            >
                                {forgotLoading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        Enviando...
                                    </>
                                ) : 'Recuperar Senha'}
                            </button>
                            
                            <p className="text-center text-slate-500 mt-6">
                                Lembrou a senha? <button type="button" onClick={() => { setMode('login'); setAuthError(null); setAuthSuccess(null); }} className="text-primary font-bold hover:underline">Voltar</button>
                            </p>
                        </form>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;