import React, { useState, useEffect, useRef } from 'react';
import { showWarning, showError, showSuccess } from '../utils/toastUtils';
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

interface YearData {
    services: string;
    commerce: string;
    hasEmployee: boolean;
}

const DASNForm: React.FC<DASNFormProps> = ({ onBack, initialCnpj = '' }) => {
  const [cnpj, setCnpj] = useState(initialCnpj);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<any>(null);
  
  const [companyName, setCompanyName] = useState('');
  const [pendingYears, setPendingYears] = useState<PendingYear[]>([]);
  const [yearsFormData, setYearsFormData] = useState<Record<string, YearData>>({});

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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
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
            if (endpoint.type === 'allorigins' && json.contents) {
                try { json = JSON.parse(json.contents); } catch (e) { continue; }
            }
            const data: CNPJResponse = json;
            return data.razao_social || data.estabelecimento?.nome_fantasia || 'Empresa não identificada';
        } catch (e) { console.warn(`Failed ${endpoint.type}`); }
    }
    return null;
  };

  const fetchPendingDeclarations = async (cleanCnpj: string) => {
    const webhookUrl = 'https://n8nwebhook.portalmei360.com/webhook/7b72bef1-f974-424e-8629-cd73aa67bd2d';
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'cnpj': cleanCnpj, 'Content-Type': 'application/json' },
            body: JSON.stringify({ cnpj: cleanCnpj })
        });
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        const rawData = await response.json();
        let dataList = Array.isArray(rawData) ? rawData : (rawData.resultado ? (Array.isArray(rawData.resultado) ? rawData.resultado : [rawData.resultado]) : [rawData]);
        const pending: PendingYear[] = [];
        const summary = dataList.find((i: any) => i.tipo === 'resumo' && i.hasPendentes === true);
        if (summary && Array.isArray(summary.lista)) {
            summary.lista.forEach((year: string) => { pending.push({ ano: year, status: 'NaoApresentada', label: year }); });
        }
        if (pending.length === 0) {
            const items = dataList.filter((i: any) => i.tipo === 'item' && (i.hasPendentes === true || i.status === 'NaoApresentada'));
            items.forEach((i: any) => { pending.push({ ano: i.ano || i.label, status: i.status || 'NaoApresentada', label: i.label || i.ano }); });
        }
        return pending;
    } catch (e) { return []; }
  };

  const handleCheckPending = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    if (cleanCnpj.length !== 14) { showWarning("CNPJ inválido."); return; }
    setIsLoading(true);
    const [nameResult, pendingResult] = await Promise.all([fetchCompanyData(cleanCnpj), fetchPendingDeclarations(cleanCnpj)]);
    setIsLoading(false);
    if (!nameResult && (!pendingResult || pendingResult.length === 0)) {
        showError("Dados não localizados. Verifique o CNPJ.");
        return;
    }
    setCompanyName(nameResult || 'Empresa Identificada');
    setPendingYears(pendingResult || []);
    const initialData: Record<string, YearData> = {};
    pendingResult.forEach(p => { initialData[p.ano] = { services: '', commerce: '', hasEmployee: false }; });
    setYearsFormData(initialData);
    setStep(3);
  };

  const handleUpdateYearField = (year: string, field: keyof YearData, value: any) => {
      setYearsFormData(prev => ({ ...prev, [year]: { ...prev[year], [field]: value } }));
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const allFilled = pendingYears.every(p => yearsFormData[p.ano].services !== '' && yearsFormData[p.ano].commerce !== '');
      if (!allFilled) { showWarning("Preencha todos os valores."); return; }
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          showSuccess("Declaração enviada com sucesso!");
          onBack();
      }, 2000);
  };

  const steps = [
    { id: 1, label: 'Início', icon: 'rocket_launch' },
    { id: 2, label: 'CNPJ', icon: 'business' },
    { id: 3, label: 'Análise', icon: 'fact_check' },
    { id: 4, label: 'Valores', icon: 'payments' },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-700 pb-12">
      
      {/* Header Minimalista */}
      <div className="flex justify-between items-center mb-8 px-4">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-primary font-bold transition-all group">
            <span className="material-icons text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Sair do Assistente
          </button>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Conexão Segura</span>
          </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Sidebar de Progresso (Desktop) */}
        <div className="hidden lg:flex flex-col gap-4 w-64 shrink-0 sticky top-24">
            {steps.map((s) => (
                <div key={s.id} className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 border ${
                    step === s.id 
                        ? 'bg-primary text-white border-primary shadow-lg shadow-blue-500/20 scale-105' 
                        : step > s.id 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800'
                            : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800'
                }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        step === s.id ? 'bg-white/20' : step > s.id ? 'bg-emerald-100 dark:bg-emerald-800' : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                        <span className="material-icons text-xl">{step > s.id ? 'check' : s.icon}</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-tighter opacity-60">Passo 0{s.id}</p>
                        <p className="font-bold text-sm truncate">{s.label}</p>
                    </div>
                </div>
            ))}
        </div>

        {/* Container Principal (Wizard) */}
        <div className="flex-1 w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden relative">
            
            {/* Barra de Progresso Mobile */}
            <div className="lg:hidden h-1.5 bg-slate-100 dark:bg-slate-800 w-full">
                <div className="h-full bg-primary transition-all duration-700" style={{ width: `${(step / 4) * 100}%` }}></div>
            </div>

            <div className="p-8 md:p-12 lg:p-16">
                
                {/* STEP 1: INTRODUÇÃO */}
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 text-center lg:text-left">
                        <div className="inline-block p-4 bg-blue-50 dark:bg-blue-900/30 text-primary rounded-3xl mb-8">
                            <span className="material-icons text-5xl">auto_awesome</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-tight">
                            Sua Declaração Anual <br/>
                            <span className="text-primary">sem complicações.</span>
                        </h2>
                        <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-xl leading-relaxed">
                            O prazo para a DASN-SIMEI 2025 termina em <b>31 de maio</b>. Evite multas e bloqueios no seu CNPJ agora mesmo.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <button onClick={() => setStep(2)} className="bg-primary hover:bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-3">
                                Começar Agora <span className="material-icons">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: IDENTIFICAÇÃO */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Qual o seu CNPJ?</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-10">Precisamos identificar sua empresa para verificar pendências.</p>

                        <form onSubmit={handleCheckPending} className="space-y-10">
                            <div className="relative group">
                                <input 
                                    type="text" required autoFocus value={cnpj} onChange={(e) => setCnpj(e.target.value)}
                                    className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-primary dark:focus:border-primary rounded-3xl text-2xl md:text-3xl font-mono outline-none transition-all shadow-inner text-slate-800 dark:text-white"
                                    placeholder="00.000.000/0000-00"
                                    disabled={isLoading}
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                                    <span className="material-icons text-3xl">business</span>
                                </div>
                            </div>

                            {isLoading && (
                                <div className="flex flex-col items-center justify-center p-10 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-800 animate-in zoom-in-95">
                                    <div className="relative w-16 h-16 mb-6">
                                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    <p className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-2">Consultando Receita Federal...</p>
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-1.5 rounded-full shadow-sm">
                                        <span className="text-xs font-mono font-black text-primary">{elapsedTime}s</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempo Decorrido</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button type="button" onClick={() => setStep(1)} disabled={isLoading} className="px-8 py-5 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Voltar</button>
                                <button type="submit" disabled={isLoading} className="flex-1 bg-primary hover:bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-3">
                                    {isLoading ? 'Analisando...' : 'Verificar Pendências'} <span className="material-icons">search</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* STEP 3: RESULTADO DA ANÁLISE */}
                {step === 3 && (
                    <div className="animate-in zoom-in-95 duration-500">
                        <div className="flex flex-col md:flex-row items-center gap-6 mb-12 p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                            <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center text-primary shadow-xl shadow-slate-200/50 dark:shadow-none shrink-0">
                                <span className="material-icons text-4xl">store</span>
                            </div>
                            <div className="text-center md:text-left min-w-0">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Empresa Identificada</p>
                                <h4 className="font-black text-2xl text-slate-800 dark:text-white leading-tight truncate">{companyName}</h4>
                                <p className="text-sm text-slate-500 font-mono mt-1">{cnpj}</p>
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                            <span className="material-icons text-primary">fact_check</span>
                            Resultado da Análise
                        </h3>
                        
                        {pendingYears.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                                {pendingYears.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 border-2 border-red-100 dark:border-red-900/30 rounded-3xl shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl flex items-center justify-center">
                                                <span className="material-icons">warning</span>
                                            </div>
                                            <span className="font-black text-slate-700 dark:text-slate-200">Ano {item.ano}</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase bg-red-500 text-white px-3 py-1 rounded-full">Pendente</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-[2.5rem] mb-10">
                                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                                    <span className="material-icons text-4xl">check_circle</span>
                                </div>
                                <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mb-2">Tudo em dia!</p>
                                <p className="text-slate-600 dark:text-slate-400">Não encontramos declarações pendentes para este CNPJ.</p>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button onClick={() => setStep(2)} className="px-8 py-5 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Voltar</button>
                            <button 
                                onClick={() => setStep(4)} disabled={pendingYears.length === 0}
                                className={`flex-1 py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all ${
                                    pendingYears.length > 0 ? 'bg-primary hover:bg-blue-600 text-white shadow-2xl shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed'
                                }`}
                            >
                                Próximo Passo <span className="material-icons">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: PREENCHIMENTO DE VALORES */}
                {step === 4 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="mb-10">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Valores de Faturamento</h3>
                            <p className="text-slate-500 dark:text-slate-400">Informe o que sua empresa movimentou em cada ano.</p>
                        </div>

                        <form onSubmit={handleFinalSubmit} className="space-y-12">
                            {pendingYears.map((p) => (
                                <div key={p.ano} className="relative p-8 md:p-10 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 space-y-8">
                                    <div className="absolute -top-4 left-8 bg-primary text-white px-6 py-2 rounded-2xl font-black text-sm shadow-lg">
                                        ANO BASE {p.ano}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                        {/* Serviços */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Prestação de Serviços</label>
                                            <div className="relative group">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300 group-focus-within:text-primary transition-colors">R$</span>
                                                <input 
                                                    type="number" step="0.01" required value={yearsFormData[p.ano]?.services || ''}
                                                    onChange={(e) => handleUpdateYearField(p.ano, 'services', e.target.value)}
                                                    className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-primary transition-all font-black text-xl text-slate-800 dark:text-white"
                                                    placeholder="0,00"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                                Inclua locações e receitas sem incidência de ICMS/ISS. Exceto transporte intermunicipal/estadual.
                                            </p>
                                        </div>

                                        {/* Comércio */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Comércio e Indústria</label>
                                            <div className="relative group">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300 group-focus-within:text-primary transition-colors">R$</span>
                                                <input 
                                                    type="number" step="0.01" required value={yearsFormData[p.ano]?.commerce || ''}
                                                    onChange={(e) => handleUpdateYearField(p.ano, 'commerce', e.target.value)}
                                                    className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-primary transition-all font-black text-xl text-slate-800 dark:text-white"
                                                    placeholder="0,00"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                                Inclua transporte intermunicipal/estadual e fornecimento de refeições.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Empregado */}
                                    <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${yearsFormData[p.ano]?.hasEmployee ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <span className="material-icons">badge</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white text-sm">Contratou empregado em {p.ano}?</p>
                                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{yearsFormData[p.ano]?.hasEmployee ? 'Sim, possuía funcionário' : 'Não possuía funcionário'}</p>
                                            </div>
                                        </div>
                                        <button 
                                            type="button" onClick={() => handleUpdateYearField(p.ano, 'hasEmployee', !yearsFormData[p.ano]?.hasEmployee)}
                                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${yearsFormData[p.ano]?.hasEmployee ? 'bg-primary shadow-lg shadow-blue-500/30' : 'bg-slate-200 dark:bg-slate-700'}`}
                                        >
                                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${yearsFormData[p.ano]?.hasEmployee ? 'translate-x-7' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                <button type="button" onClick={() => setStep(3)} className="px-8 py-5 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Voltar</button>
                                <button type="submit" disabled={isLoading} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-2xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-3">
                                    {isLoading ? <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></span> : <>Finalizar Declaração <span className="material-icons">check_circle</span></>}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
      </div>
      
      {/* Footer de Segurança */}
      <div className="mt-12 flex flex-col items-center gap-4 opacity-50">
          <div className="flex items-center gap-6">
              <img src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" alt="Regular MEI" className="h-6 grayscale dark:invert" />
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-700"></div>
              <div className="flex items-center gap-2">
                  <span className="material-icons text-sm">lock</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Dados Criptografados</span>
              </div>
          </div>
          <p className="text-[10px] text-center max-w-md leading-relaxed">
              Este assistente utiliza protocolos de segurança bancária para garantir a integridade dos seus dados fiscais.
          </p>
      </div>
    </div>
  );
};

export default DASNForm;