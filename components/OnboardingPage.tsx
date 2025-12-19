import React, { useState } from 'react';
import { User, CNPJResponse } from '../types';

interface OnboardingPageProps {
  user: User;
  onComplete: (cnpj: string, theme: 'light' | 'dark', companyName: string, receiveWeeklySummary: boolean) => void;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [cnpj, setCnpj] = useState(''); // CNPJ inicializado como vazio
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [receiveWeeklySummary, setReceiveWeeklySummary] = useState(true); // NEW STATE
  
  // CNPJ Fetch State
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [fetchedCompany, setFetchedCompany] = useState<{name: string, tradeName: string, status: string} | null>(null);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  
  // Finish Loading State
  const [isFinishing, setIsFinishing] = useState(false);

  const handleNext = () => {
    if (step === 1 && !fetchedCompany && !cnpjError) {
        fetchCompanyData();
        return; 
    }
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleThemePreview = (t: 'light' | 'dark') => {
      setTheme(t);
      if (t === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }

  const handleFinish = async () => {
    setIsFinishing(true);
    await new Promise(r => setTimeout(r, 1500)); // Simulate processing
    // Pass the fetched company name (Razão Social) or fallback to trade name/empty
    const companyName = fetchedCompany?.name || fetchedCompany?.tradeName || '';
    onComplete(cnpj, theme, companyName, receiveWeeklySummary); // PASS NEW STATE
  };

  const fetchCompanyData = async () => {
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    if (cleanCnpj.length !== 14) {
        setCnpjError("CNPJ inválido. Digite apenas números.");
        return;
    }

    setLoadingCnpj(true);
    setCnpjError(null);
    setFetchedCompany(null);

    const targetUrl = `https://publica.cnpj.ws/cnpj/${cleanCnpj}`;
    const endpoints = [
      { url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`, type: 'corsproxy' },
      { url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, type: 'allorigins' },
      { url: targetUrl, type: 'direct' }
    ];

    let success = false;

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint.url);
            if (!response.ok) continue;

            let json = await response.json();

            // Handle AllOrigins wrapper
            if (endpoint.type === 'allorigins') {
                if (json.contents) {
                    try {
                        const content = JSON.parse(json.contents);
                        if (content.status && content.status !== 200) continue;
                        json = content;
                    } catch (e) { continue; }
                } else { continue; }
            }

            const data: CNPJResponse = json;
            setFetchedCompany({
                name: data.razao_social || '',
                tradeName: data.estabelecimento?.nome_fantasia || data.razao_social || '',
                status: data.estabelecimento?.situacao_cadastral || 'Desconhecida'
            });
            success = true;
            break;
        } catch (e) {
            console.warn(`Failed ${endpoint.type}`);
        }
    }

    if (!success) {
        setCnpjError("Não foi possível encontrar este CNPJ. Verifique os números ou tente novamente.");
    }
    setLoadingCnpj(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
       <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col min-h-[550px]">
          
          {/* Progress Bar */}
          <div className="h-2 bg-slate-100 dark:bg-slate-800 w-full">
            <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>

          <div className="p-8 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-8">
                 <img 
                    src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
                    alt="Regular MEI" 
                    className="h-8 object-contain dark:brightness-0 dark:invert"
                />
                <span className="text-sm font-medium text-slate-400">Passo {step} de 3</span>
            </div>

            {/* Step 1: CNPJ */}
            {step === 1 && (
                <div className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-right-8">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Vamos configurar seu negócio</h2>
                    <p className="text-slate-500 mb-6">Para começarmos, informe o CNPJ da sua MEI para carregarmos seus dados.</p>
                    
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">CNPJ</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={cnpj}
                            onChange={(e) => setCnpj(e.target.value)}
                            className="flex-1 px-4 py-3 text-lg border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                            placeholder="00.000.000/0000-00"
                        />
                        <button 
                            onClick={fetchCompanyData}
                            disabled={loadingCnpj}
                            className="bg-primary hover:bg-blue-600 text-white px-6 rounded-xl font-bold transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-700 min-w-[100px]"
                        >
                            {loadingCnpj ? <span className="material-icons animate-spin">refresh</span> : 'Buscar'}
                        </button>
                    </div>
                    
                    {cnpjError && (
                        <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                            <span className="material-icons text-sm">error</span> {cnpjError}
                        </p>
                    )}

                    {fetchedCompany && (
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl animate-in zoom-in-95">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-300">
                                    <span className="material-icons">store</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white">{fetchedCompany.tradeName}</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{fetchedCompany.name}</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                            fetchedCompany.status === 'ATIVA' 
                                            ? 'bg-green-100 text-green-700 border-green-200' 
                                            : 'bg-red-100 text-red-700 border-red-200'
                                        }`}>
                                            {fetchedCompany.status}
                                        </span>
                                        <span className="text-xs text-slate-400">Dados confirmados</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!fetchedCompany && !loadingCnpj && (
                        <p className="text-xs text-slate-400 mt-2">Clique em "Buscar" para validar sua empresa.</p>
                    )}
                </div>
            )}

            {/* Step 2: Theme */}
            {step === 2 && (
                <div className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-right-8">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Escolha seu tema</h2>
                    <p className="text-slate-500 mb-6">Como você prefere visualizar o dashboard?</p>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <button 
                            type="button"
                            onClick={() => handleThemePreview('light')}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${theme === 'light' ? 'border-primary bg-blue-50 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                            <div className="w-full h-24 bg-slate-100 rounded-lg border border-slate-200 relative overflow-hidden shadow-inner">
                                <div className="absolute top-0 left-0 w-full h-3 bg-white border-b border-slate-200"></div>
                                <div className="absolute top-5 left-2 w-16 h-8 bg-white rounded shadow-sm"></div>
                            </div>
                            <span className="font-bold text-slate-700">Modo Claro</span>
                        </button>

                        <button 
                            type="button"
                            onClick={() => handleThemePreview('dark')}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${theme === 'dark' ? 'border-primary bg-slate-800 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                            <div className="w-full h-24 bg-slate-900 rounded-lg border border-slate-700 relative overflow-hidden shadow-inner">
                                <div className="absolute top-0 left-0 w-full h-3 bg-slate-800 border-b border-slate-700"></div>
                                <div className="absolute top-5 left-2 w-16 h-8 bg-slate-800 rounded shadow-sm"></div>
                            </div>
                            <span className="font-bold text-slate-700 dark:text-white">Modo Escuro</span>
                        </button>
                    </div>
                </div>
            )}
            
            {/* Step 3: Weekly Summary Preference (NEW STEP) */}
            {step === 3 && (
                <div className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-right-8">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Resumo Semanal</h2>
                    <p className="text-slate-500 mb-6">Deseja receber um resumo semanal das suas contas a pagar e a receber via WhatsApp?</p>
                    
                    <div className="space-y-4">
                        <button 
                            type="button"
                            onClick={() => setReceiveWeeklySummary(true)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${receiveWeeklySummary ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                        >
                            <span className={`material-icons text-2xl ${receiveWeeklySummary ? 'text-green-600' : 'text-slate-400'}`}>
                                {receiveWeeklySummary ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white">Sim, quero receber</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Receba um resumo inteligente todo domingo.</p>
                            </div>
                        </button>
                        <button 
                            type="button"
                            onClick={() => setReceiveWeeklySummary(false)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${!receiveWeeklySummary ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                        >
                            <span className={`material-icons text-2xl ${!receiveWeeklySummary ? 'text-red-600' : 'text-slate-400'}`}>
                                {!receiveWeeklySummary ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white">Não, obrigado</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Você pode ativar isso nas configurações a qualquer momento.</p>
                            </div>
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-4">O resumo será enviado para o número de telefone cadastrado.</p>
                </div>
            )}

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                {step > 1 ? (
                    <button onClick={handlePrev} className="px-6 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium transition-colors">
                        Voltar
                    </button>
                ) : (
                    <div></div> // Spacer
                )}
                
                {step < 3 ? (
                    <button 
                        onClick={handleNext} 
                        disabled={step === 1 && !fetchedCompany} // Bloquear se não buscou CNPJ
                        className="bg-primary hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        Próximo <span className="material-icons text-sm">arrow_forward</span>
                    </button>
                ) : (
                    <button 
                        onClick={handleFinish} 
                        disabled={isFinishing}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        {isFinishing ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Configurando...
                            </>
                        ) : (
                            <>
                                Concluir <span className="material-icons">check</span>
                            </>
                        )}
                    </button>
                )}
            </div>
          </div>
       </div>
    </div>
  );
};

export default OnboardingPage;