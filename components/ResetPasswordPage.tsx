import React, { useState } from 'react';
import { supabase } from '../src/integrations/supabase/client';
import { showSuccess, showError } from '../utils/toastUtils';

interface ResetPasswordPageProps {
  onComplete: () => void;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      showError("As senhas não coincidem.");
      return;
    }
    
    if (password.length < 6) {
      showError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password });
    
    setIsLoading(false);

    if (error) {
      showError(error.message);
    } else {
      showSuccess("Senha redefinida com sucesso!");
      onComplete();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <img 
            src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
            alt="Regular MEI" 
            className="h-10 mx-auto mb-6 dark:brightness-0 dark:invert"
          />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Redefinir Senha</h2>
          <p className="text-slate-500 mt-2">Crie uma nova senha segura para sua conta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nova Senha</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons text-lg">lock</span>
              <input 
                type={showPass ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar Nova Senha</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons text-lg">lock_reset</span>
              <input 
                type={showPass ? "text" : "password"} 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
              >
                <span className="material-icons text-lg">
                  {showPass ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-primary hover:bg-blue-600 disabled:bg-blue-400 text-white py-3 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Salvando...
              </>
            ) : 'Redefinir Senha'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;