import React, { useState, useEffect, useRef } from 'react';
import { showWarning, showError } from '../utils/toastUtils';
import { CNPJResponse } from '../types';

interface DASNFormProps {
  onBack: () => void;
  initialCnpj?: string;
}

interface PendingYear {
    ano: string;
    status: string;
    label: string;
}

const DASNForm: React.FC<DASNFormProps> = ({ onBack, initialCnpj = '' }) => {
  const [cnpj, setCnpj] = useState(initialCnpj);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<any>(null);
  
  // Data States
  const [companyName, setCompanyName] = useState('');
  const [pendingYears, setPendingYears] = useState<PendingYear[]>([]);

  // Timer logic for loading
  useEffect(() => {
    if (isLoading) {
        const startTime = Date.now();
        timerRef.current = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
    } else {
        if (timerRef.current) clearInterval(timerRef.current);
        setElapsedTime(0);
    }
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading]);

  const fetchCompanyData = async (cleanCnpj: string) => {
    const targetUrl = `https://publica.cnpj.ws/cnpj/${cleanCnpj}`;
    
    const endpoints = [
      { url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`, type: 'corsproxy' },
      { url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, type: 'allorigins' },
      { url: targetUrl, type: 'direct' }
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint.url);
            if (!response.ok) continue;

            let json = await response.json();

            if (endpoint.type === 'allorigins') {
                if (json.contents) {
                    try {
                        const content = JSON.parse(json.contents);
                        json = content;
                    } catch (e) { continue; }
                } else { continue; }
            }

            const data: CNPJResponse = json;
            return data.razao_social || data.estabelecimento?.nome_fantasia || 'Empresa não identificada';
        } catch (e) {
            console.warn(`Failed ${endpoint.type}`);
        }
    }
    return null;
  };

  const fetchPendingDeclarations = async (cleanCnpj: string) => {
    const webhookUrl = 'https://n8nwebhook.portalmei360.com/webhook/7b72bef1-f974-424e-8629-cd73aa67bd2d';
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'cnpj': cleanCnpj,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cnpj: cleanCnpj })
        });

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

        const rawData = await response.json();
        
        let dataList = [];
        if (Array.isArray(rawData)) {
            dataList = rawData;
        } else if (rawData && rawData.resultado) {
            dataList = Array.isArray(rawData.resultado) ? rawData.resultado : [rawData.resultado];
        } else {
            dataList = [rawData];
        }
        
        const pending: PendingYear[] = [];

        const summary = dataList.find((i: any) => i.tipo === 'resumo' && i.hasPendentes === true);
        if (summary && Array.isArray(summary.lista)) {
            summary.lista.forEach((year: string) => {
                pending.push({
                    ano: year,
                    status: 'NaoApresentada',
                    label: year
                });
            });
        }

        if (pending.length === 0) {
            const items = dataList.filter((i: any) => 
                i.tipo === 'item' && 
                (i.hasPendentes === true || i.status === 'NaoApresentada')
            );
            items.forEach((i: any) => {
                pending.push({
                    ano: i.ano || i.label,
                    status: i.status || 'NaoApresentada',
                    label: i.label || i.ano
                });
            });
        }
        
        return pending;
    } catch (e) {
        console.error("Erro ao buscar pendências:", e);
        return [];
    }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cleanCnpj.length !== 14) {
      showWarning("Por favor, insira um CNPJ válido com 14 dígitos.");
      return;
    }

    setIsLoading(true);
    
    const [nameResult, pendingResult] = await Promise.all([
        fetchCompanyData(cleanCnpj),
        fetchPendingDeclarations(cleanCnpj)
    ]);

    setIsLoading(false);

    if (!nameResult && (!pendingResult || pendingResult.length === 0)) {
        showError("Não foi possível localizar dados para este CNPJ. Verifique o número e tente novamente.");
        return;
    }

    setCompanyName(nameResult || 'Empresa Identificada');
    setPendingYears(pendingResult || []);
    setStep(3);
  };

  const steps = [
    { id: 1, label: 'Introdução', icon: 'info' },
    { id: 2, label: 'Identificação', icon: 'business' },
    { id: 3, label: 'Pendências', icon: 'fact_check' },
  ];

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500 pb-12">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-slate-400 hover:text-primary transition-colors font-semibold text-sm group"
      >
        <span className="material-icons text-sm mr-1 group-hover:-translate-x-1 transition-transform">arrow_back</span> 
        Voltar para o início
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-blue-500/5 border border-slate-100 dark:border-slate-800 overflow-hidden">
        
        <div className="bg-slate-50/50 dark:bg-slate-800/50 px-8 py-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0"></div>
                {steps.map((s) => (
                    <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                            step >= s.id ? 'bg-primary text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-slate-800 text-slate-400 border-2 border-slate-200 dark:border-slate-700'
                        }`}>
                            <span className="material-icons text-lg">{step > s.id ? 'check' : s.icon}</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= s.id ? 'text-primary' : 'text-slate-400'}`}>
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>

        <div className="p-8 md:p-12">
            {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
                            <span className="material-icons text-4xl">assignment</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">Declaração Anual 2025</h2>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                            Evite multas e mantenha seu CNPJ regularizado com a entrega da DASN-SIMEI.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-start gap-3">
                            <span className="material-icons text-orange-500">event</span>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white text-sm">Prazo Final</p>
                                <p className="text-xs text-slate-500">Até 31 de Maio de 2025</p>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-start gap-3">
                            <span className="material-icons text-red-500">warning</span>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white text-sm">Multa por Atraso</p>
                                <p className="text-xs text-slate-500">A partir de R$ 50,00</p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setStep(2)}
                        className="w-full bg-primary hover:bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/25 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        Iniciar Declaração <span className="material-icons">play_arrow</span>
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Identificação da Empresa</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Confirme o CNPJ para o qual deseja realizar a declaração.</p>

                    <form onSubmit={handleNext} className="space-y-8">
                        <div className="relative group">
                            <label className="absolute -top-2.5 left-4 px-2 bg-white dark:bg-slate-900 text-xs font-bold text-primary z-10">CNPJ da MEI</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors material-icons text-2xl">business</span>
                                <input 
                                    type="text" 
                                    required
                                    autoFocus
                                    value={cnpj}
                                    onChange={(e) => setCnpj(e.target.value)}
                                    className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-xl font-mono outline-none focus:border-primary transition-all shadow-sm"
                                    placeholder="00.000.000/0000-00"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {isLoading && (
                            <div className="flex flex-col items-center justify-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 animate-in zoom-in-95">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">Consultando situação fiscal...</p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 text-center mb-3">Este processo pode levar até 60 segundos. Por favor, não feche esta página.</p>
                                <div className="bg-white dark:bg-slate-800 px-4 py-1 rounded-full text-xs font-mono font-bold text-primary shadow-sm">
                                    Tempo decorrido: {elapsedTime}s
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                                type="button"
                                onClick={() => setStep(1)}
                                disabled={isLoading}
                                className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                            >
                                Voltar
                            </button>
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="flex-[2] bg-primary hover:bg-blue-600 disabled:bg-slate-300 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>Aguarde...</>
                                ) : (
                                    <>Verificar Pendências <span className="material-icons">search</span></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {step === 3 && (
                <div className="animate-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-4 mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-primary shadow-sm">
                            <span className="material-icons">store</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Empresa Identificada</p>
                            <h4 className="font-bold text-slate-800 dark:text-white leading-tight">{companyName}</h4>
                            <p className="text-xs text-slate-500 font-mono">{cnpj}</p>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Situação das Declarações</h3>
                    
                    {pendingYears.length > 0 ? (
                        <div className="space-y-3 mb-8">
                            {pendingYears.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <span className="material-icons text-red-500">warning</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-200">Ano Base {item.ano}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase bg-red-100 text-red-700 px-2 py-1 rounded-md">Pendente</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-3xl mb-8">
                            <span className="material-icons text-green-500 text-4xl mb-2">check_circle</span>
                            <p className="font-bold text-green-800 dark:text-green-300">Tudo em dia!</p>
                            <p className="text-sm text-green-700 dark:text-green-400">Não encontramos declarações pendentes para este CNPJ.</p>
                        </div>
                    )}

                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 mb-8">
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                            {pendingYears.length > 0 
                                ? 'O próximo passo é informar os valores de faturamento para cada ano pendente listado acima.'
                                : 'Seu CNPJ está regularizado quanto à entrega das declarações anuais.'}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setStep(2)}
                            className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            Voltar
                        </button>
                        <button 
                            disabled={pendingYears.length === 0}
                            className={`flex-[2] py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                                pendingYears.length > 0 
                                ? 'bg-primary hover:bg-blue-600 text-white shadow-xl shadow-blue-500/25' 
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            Preencher Valores {pendingYears.length === 0 && <span className="material-icons">lock</span>}
                        </button>
                    </div>
                </div>
            )}
        </div>

        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Ambiente Seguro & Criptografado</p>
        </div>
      </div>
    </div>
  );
};

export default DASNForm;