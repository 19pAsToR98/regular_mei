import React, { useState, useEffect, useCallback } from 'react';
import { showSuccess, showError } from '../utils/toastUtils';

// Define a interface para o evento de instalação (que é um objeto DeferredPrompt)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
  prompt: () => Promise<void>;
}

declare global {
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
  }
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Verifica se o aplicativo já está rodando como PWA (instalado)
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (navigator as any).standalone) { // Para iOS
      setIsInstalled(true);
    }
  }, []);

  // 1. Captura o evento de instalação
  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      // Previne que o mini-infobar padrão do Chrome apareça
      e.preventDefault();
      // Armazena o evento para que possa ser acionado mais tarde
      setDeferredPrompt(e);
      return false;
    };

    window.addEventListener('beforeinstallprompt', handler as any);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as any);
    };
  }, []);

  // 2. Lida com o clique do usuário para instalar
  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) {
      showError("A instalação não está disponível no momento ou já foi solicitada.");
      return;
    }

    // Mostra o prompt de instalação
    deferredPrompt.prompt();

    // Espera pela resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      showSuccess('Instalação aceita! O aplicativo será adicionado à sua tela inicial.');
      setIsInstalled(true);
    } else {
      showWarning('Instalação cancelada pelo usuário.');
    }

    // Limpa o prompt armazenado
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  // Não exibe nada se já estiver instalado ou se o prompt não estiver disponível
  if (isInstalled || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="material-icons text-primary text-3xl">download_for_offline</span>
          <div>
            <p className="font-bold text-slate-800 dark:text-white">Instale o Regular MEI</p>
            <p className="text-sm text-slate-500">Acesse o dashboard diretamente da sua tela inicial, mesmo offline.</p>
          </div>
        </div>
        <button
          onClick={handleInstallClick}
          className="flex-shrink-0 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors"
        >
          Instalar App
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;