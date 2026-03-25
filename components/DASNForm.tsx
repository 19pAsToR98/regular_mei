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

interface ValidationError {
    year: string;
    total: number;
    limit: number;
    message: string;
}

const DASNForm: React.FC<DASNFormProps> = ({ onBack, initialCnpj = '' }) => {
  const [cnpj, setCnpj] = useState(initialCnpj);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<any>(null);
  
  // Data States
  const [companyName, setCompanyName] = useState('');
  const [fullCompanyData, setFullCompanyData] = useState<CNPJResponse | null>(null);
  const [pendingYears, setPendingYears] = useState<PendingYear[]>([]);
  const [activeYearIndex, setActiveYearIndex] = useState(0);
  
  // Form Data for each year
  const [yearsFormData, setYearsFormData] = useState<Record<string, YearData>>({});
  
  // Validation Error State
  const [validationError, setValidationError] = useState<ValidationError | null>(null);

  // Timer logic for loading
  useEffect(() => {
    if (isLoading || isValidating) {
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
  }, [isLoading, isValidating]);

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
            setFullCompanyData(data);
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
            summary.lista.forEach((year: string) => {
                pending.push({ ano: year, status: 'NaoApresentada', label: year });
            });
        }
        if (pending.length === 0) {
            const items = dataList.filter((i: any) => i.tipo === 'item' && (i.hasPendentes === true || i.status === 'NaoApresentada'));
            items.forEach((i: any) => {
                pending.push({ ano: i.ano || i.label, status: i.status || 'NaoApresentada', label: i.label || i.ano });
            });
        }
        return pending;
    } catch (e) {
        console.error("Erro ao buscar pendências:", e);
        return [];
    }
  };

  const handleCheckPending = async (e: React.FormEvent) => {
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
    
    const initialData: Record<string, YearData> = {};
    pendingResult.forEach(p => {
        initialData[p.ano] = { services: '', commerce: '', hasEmployee: false };
    });
    setYearsFormData(initialData);
    setActiveYearIndex(0);
    setStep(3);
  };

  const validateYearLimit = async (year: string): Promise<boolean> => {
      const data = yearsFormData[year];
      const cleanCnpj = cnpj.replace(/[^\d]/g, '');
      
      setIsValidating(true);
      setValidationError(null);
      
      const webhookUrl = 'https://n8nwebhook.portalmei360.com/webhook/afa6dc8e-1a87-443f-bc69-b6918d1a9d7a';
      
      const payload = {
          submittedAt: new Date().toISOString(),
          "Group #2": "Iniciar Declaração Anual",
          "Group #4": "Sei meu CNPJ",
          cnpj: cleanCnpj,
          "Group #8": "Prosseguir",
          _anoescolhido: year,
          _prestação: data.services || "0",
          _comercio: data.commerce || "0",
          _funcionário: data.hasEmployee ? "Sim" : "Não",
          "#nome": companyName,
          "#abertura": fullCompanyData?.estabelecimento?.data_inicio_atividade ? new Date(fullCompanyData.estabelecimento.data_inicio_atividade).toLocaleDateString('pt-BR') : "",
          "#atividade": fullCompanyData?.estabelecimento?.atividade_principal?.descricao || "",
          "#endereço": fullCompanyData?.estabelecimento?.logradouro || "",
          "#bairro": fullCompanyData?.estabelecimento?.bairro || "",
          "#cidade": fullCompanyData?.estabelecimento?.cidade?.nome || "",
          "#estado": fullCompanyData?.estabelecimento?.estado?.sigla || "",
          "#cep": fullCompanyData?.estabelecimento?.cep || ""
      };

      try {
          const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error("Falha na validação do limite.");

          const result = await response.json();
          const validation = Array.isArray(result) ? result[0] : result;

          if (validation.estaDentroDoLimite === false) {
              setValidationError({
                  year,
                  total: validation.faturamentoTotal,
                  limit: validation.limiteFaturamento,
                  message: "O faturamento informado ultrapassa o limite permitido para o MEI neste período."
              });
              setIsValidating(false);
              return false;
          }

          setIsValidating(false);
          return true;
      } catch (e) {
          console.error("Erro na validação:", e);
          showError("Erro ao validar limite de faturamento. Tente novamente.");
          setIsValidating(false);
          return false;
      }
  };

  const handleUpdateYearField = (year: string, field: keyof YearData, value: any) => {
      setValidationError(null); // Limpa erro ao alterar valores
      setYearsFormData(prev => ({
          ...prev,
          [year]: { ...prev[year], [field]: value }
      }));
  };

  const handleNextYear = async () => {
      const year = pendingYears[activeYearIndex].ano;
      if (yearsFormData[year].services === '' || yearsFormData[year].commerce === '') {
          showWarning("Preencha os valores antes de prosseguir.");
          return;
      }

      const isValid = await validateYearLimit(year);
      if (isValid) {
          setActiveYearIndex(activeYearIndex + 1);
      }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const year = pendingYears[activeYearIndex].ano;
      
      const isValid = await validateYearLimit(year);
      if (!isValid) return;

      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          showSuccess("Dados da declaração enviados com sucesso! Nossa equipe processará seu pedido.");
          onBack();
      }, 2000);
  };

  const steps = [
    { id: 1, label: 'Início', icon: 'info' },
    { id: 2, label: 'CNPJ', icon: 'business' },
    { id: 3, label: 'Pendências', icon: 'fact_check' },
    { id: 4, label: 'Valores', icon: 'payments' },
  ];

  const activeYear = pendingYears[activeYearIndex];

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-500 pb-12">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-slate-400 hover:text-primary transition-colors font-semibold text-sm group"
      >
        <span className="material-icons text-sm mr-1 group-hover:-translate-x-1 transition-transform">arrow_back</span> 
        Voltar para o início
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-blue-500/10 border border-slate-100 dark:border-slate-800 overflow-hidden">
        
        {/* Progress Header */}
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

                    <form onSubmit={handleCheckPending} className="space-y-8">
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
                            onClick={() => setStep(4)}
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

            {step === 4 && activeYear && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    
                    {/* Year Tabs / Progress */}
                    <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                        {pendingYears.map((p, idx) => (
                            <button
                                key={p.ano}
                                type="button"
                                disabled={isValidating}
                                onClick={() => {
                                    setValidationError(null);
                                    setActiveYearIndex(idx);
                                }}
                                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-2 ${
                                    activeYearIndex === idx 
                                    ? 'bg-primary text-white border-primary shadow-md' 
                                    : (yearsFormData[p.ano]?.services !== '' && yearsFormData[p.ano]?.commerce !== '' 
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                        : 'bg-slate-50 text-slate-400 border-slate-100')
                                }`}
                            >
                                {p.ano} {yearsFormData[p.ano]?.services !== '' && <span className="material-icons text-[10px] ml-1">check_circle</span>}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Ano Base {activeYear.ano}</h3>
                        <span className="text-xs font-bold text-slate-400 uppercase">Passo {activeYearIndex + 1} de {pendingYears.length}</span>
                    </div>

                    <form onSubmit={handleFinalSubmit} className="space-y-8">
                        
                        {/* Serviços */}
                        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border-2 border-slate-50 dark:border-slate-800 shadow-sm hover:border-primary/20 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                                    <span className="material-icons">work</span>
                                </div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Prestação de Serviços
                                </label>
                            </div>
                            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                                Exceto transporte intermunicipal e interestadual. Inclua também receitas de locação e demais receitas da atividade sem incidência de ICMS e ISS.
                            </p>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-lg">R$</span>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    value={yearsFormData[activeYear.ano]?.services || ''}
                                    onChange={(e) => handleUpdateYearField(activeYear.ano, 'services', e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all text-xl font-black text-slate-800 dark:text-white"
                                    placeholder="0,00"
                                    disabled={isValidating}
                                />
                            </div>
                        </div>

                        {/* Comércio */}
                        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border-2 border-slate-50 dark:border-slate-800 shadow-sm hover:border-primary/20 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                                    <span className="material-icons">shopping_cart</span>
                                </div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Comércio e Indústria
                                </label>
                            </div>
                            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                                Inclua também receitas de transporte intermunicipal e interestadual e fornecimento de refeições.
                            </p>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-lg">R$</span>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    value={yearsFormData[activeYear.ano]?.commerce || ''}
                                    onChange={(e) => handleUpdateYearField(activeYear.ano, 'commerce', e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none transition-all text-xl font-black text-slate-800 dark:text-white"
                                    placeholder="0,00"
                                    disabled={isValidating}
                                />
                            </div>
                        </div>

                        {/* Empregado */}
                        <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${yearsFormData[activeYear.ano]?.hasEmployee ? 'bg-primary text-white' : 'bg-white dark:bg-slate-700 text-slate-400'}`}>
                                    <span className="material-icons">badge</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Possuiu empregado contratado?</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Ano Base {activeYear.ano}</p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                disabled={isValidating}
                                onClick={() => handleUpdateYearField(activeYear.ano, 'hasEmployee', !yearsFormData[activeYear.ano]?.hasEmployee)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shadow-inner ${yearsFormData[activeYear.ano]?.hasEmployee ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${yearsFormData[activeYear.ano]?.hasEmployee ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {/* VALIDATION ERROR ALERT (ACCESSIBLE) */}
                        {validationError && (
                            <div role="alert" className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-900/50 rounded-[2rem] animate-in zoom-in-95 duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <span className="material-icons text-3xl">warning</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-black text-red-800 dark:text-red-300 mb-1">Limite Excedido!</h4>
                                        <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed mb-4">
                                            {validationError.message}
                                        </p>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                            <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                                                <p className="text-[10px] font-black uppercase text-red-400 tracking-widest mb-1">Faturamento Informado</p>
                                                <p className="text-lg font-black text-red-600 dark:text-red-400">R$ {validationError.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Limite Permitido</p>
                                                <p className="text-lg font-black text-slate-700 dark:text-slate-300">R$ {validationError.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button 
                                                type="button"
                                                onClick={() => setValidationError(null)}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-500/20"
                                            >
                                                Revisar Valores
                                            </button>
                                            <a 
                                                href="https://wa.me/5531972366801?text=Olá! Meu faturamento ultrapassou o limite do MEI e preciso de orientação."
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 py-2.5 rounded-xl font-bold text-sm text-center hover:bg-red-50 transition-all"
                                            >
                                                Falar com Consultor
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isValidating && (
                            <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 animate-in zoom-in-95">
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Validando limite de faturamento... ({elapsedTime}s)</p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            {activeYearIndex > 0 ? (
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setValidationError(null);
                                        setActiveYearIndex(activeYearIndex - 1);
                                    }}
                                    disabled={isValidating}
                                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                                >
                                    Ano Anterior
                                </button>
                            ) : (
                                <button 
                                    type="button"
                                    onClick={() => setStep(3)}
                                    disabled={isValidating}
                                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                                >
                                    Voltar
                                </button>
                            )}

                            {activeYearIndex < pendingYears.length - 1 ? (
                                <button 
                                    type="button"
                                    disabled={isValidating || !!validationError}
                                    onClick={handleNextYear}
                                    className="flex-[2] bg-primary hover:bg-blue-600 disabled:bg-slate-300 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                                >
                                    {isValidating ? 'Validando...' : <>Próximo Ano <span className="material-icons">arrow_forward</span></>}
                                </button>
                            ) : (
                                <button 
                                    type="submit"
                                    disabled={isLoading || isValidating || !!validationError}
                                    className="flex-[2] bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading || isValidating ? (
                                        <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <>Finalizar Declaração <span className="material-icons">check_circle</span></>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
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