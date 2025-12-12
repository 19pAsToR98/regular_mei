import React, { useState } from 'react';
import { showError } from '../utils/toastUtils';

interface ChangePasswordFormProps {
    onChangePassword: (newPassword: string) => Promise<boolean>;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onChangePassword }) => {
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

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passForm.new !== passForm.confirm) {
            showError("As novas senhas não coincidem.");
            return;
        }
        if (passForm.new.length < 6) {
            showError("A nova senha deve ter pelo menos 6 caracteres.");
            return;
        }
        
        setIsSavingPass(true);
        // Note: Supabase requires the user to be recently authenticated to change the password.
        // For this simulation, we rely on the parent component's logic.
        const success = await onChangePassword(passForm.new);
        setIsSavingPass(false);
        
        if (success) {
            setPassForm({ current: '', new: '', confirm: '' });
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Alterar Senha</h4>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 max-w-lg">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha Atual</label>
                        <div className="relative">
                            <input 
                                type={showPass.current ? "text" : "password"}
                                value={passForm.current}
                                onChange={(e) => setPassForm({...passForm, current: e.target.value})}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 pr-10"
                                placeholder="Obrigatório para segurança"
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
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 pr-10"
                                    placeholder="Mínimo 6 caracteres"
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
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 pr-10"
                                    placeholder="Confirme a nova senha"
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
                        type="submit" 
                        disabled={isSavingPass || !passForm.current || !passForm.new || passForm.new !== passForm.confirm}
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
            </form>
        </div>
    );
};

export default ChangePasswordForm;