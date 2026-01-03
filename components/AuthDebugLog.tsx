import React from 'react';
import { User } from '../types';

interface AuthDebugLogProps {
  user: User | null;
  loadingAuth: boolean;
  activeTab: string;
}

const AuthDebugLog: React.FC<AuthDebugLogProps> = ({ user, loadingAuth, activeTab }) => {
  // Removida a condição de ocultação para fixar o log na tela
  // if (!loadingAuth && user?.isSetupComplete) return null;

  const logEntries = [
    `Status de Carregamento: ${loadingAuth ? 'Carregando...' : 'Concluído'}`,
    `Aba Ativa: ${activeTab}`,
    `ID do Usuário: ${user ? user.id.substring(0, 8) + '...' : 'N/A'}`,
    `Email: ${user?.email || 'N/A'}`,
    `Setup Completo (isSetupComplete): ${user?.isSetupComplete ? 'TRUE' : 'FALSE'}`,
    `Role: ${user?.role || 'N/A'}`,
    `Próxima Ação Esperada: ${!user ? 'Login/Landing' : user.isSetupComplete ? 'Dashboard' : 'Onboarding'}`,
  ];

  return (
    <div className="fixed bottom-0 left-0 z-[9999] w-full bg-slate-900 text-green-400 p-2 font-mono text-[10px] shadow-2xl border-t border-green-800 overflow-x-auto">
      <p className="font-bold mb-1 uppercase text-white">Auth/Onboarding Debug Log</p>
      <div className="flex gap-4">
        {logEntries.map((entry, index) => (
          <span key={index} className="whitespace-nowrap px-2 py-0.5 bg-slate-800 rounded">
            {entry}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AuthDebugLog;