import React, { useState, useEffect, useRef } from 'react';
import { CNPJResponse, DasItem, DasnItem, FiscalData, ServiceCTA, ConnectionConfig } from '../types';
import { showSuccess, showError } from '../utils/toastUtils';

interface CnpjConsultPageProps {
  onBack: () => void;
  connectionConfig: ConnectionConfig;
}

// Redefining servicesData locally for CNPJPage to function independently
const servicesData: ServiceCTA[] = [
  {
    id: 'declaracao',
    title: 'Declaração Anual (DASN)',
    description: 'Envio rápido e seguro da sua DASN-SIMEI, garantindo conformidade e evitando multas.',
    icon: 'event_note',
    colorClass: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
  },
  {
    id: 'cancelamento',
    title: 'Cancelamento MEI',
    description: 'Encerre seu MEI com orientação completa e sem dores de cabeça futuras.',
    icon: 'cancel',
    colorClass: 'text-red-500 bg-red-100 dark:bg-red-900/30'
  },
  {
    id: 'parcelamento',
    title: 'Parcelamento de Débitos',
    description: 'Negocie e parcele seus débitos em condições acessíveis para regularizar sua situação.',
    icon: 'account_balance_wallet',
    colorClass: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30'
  },
  {
    id: 'consulta',
    title: 'Consulta de Débitos',
    description: 'Verifique pendências no CNPJ e receba orientação sobre os próximos passos.',
    icon: 'search',
    colorClass: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30'
  },
  {
    id: 'alterar',
    title: 'Alterar MEI',
    description: 'Atualize dados do seu MEI, como endereço, atividades, nome fantasia e outras informações.',
    icon: 'edit_note',
    colorClass: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30'
  },
  {
    id: 'abrir',
    title: 'Abrir MEI',
    description: 'Abra seu MEI com orientação completa, evitando erros e começando o negócio do jeito certo.',
    icon: 'store',
    colorClass: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30'
  }
];

// --- HOLIDAY CALCULATION HELPERS (Copied from Reminders.tsx for DAS calculation) ---
const getEasterDate = (year: number): Date => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month, day);
};

const getBrazilianHolidays = (year: number) => {
    const easter = getEasterDate(year);
    const carnival = new Date(easter); carnival.setDate(easter.getDate() - 47);
    const goodFriday = new Date(easter); goodFriday.setDate(easter.getDate() - 2);
    const corpusChristi = new Date(easter); corpusChristi.setDate(easter.getDate() + 60);

    return [
        new Date(year, 0, 1),
        carnival,
        goodFriday,
        easter,
        new Date(year, 3, 21),
        new Date(year, 4, 1),
        corpusChristi,
        new Date(year, 8, 7),
        new Date(year, 9, 12),
        new Date(year, 10, 2),
        new Date(year, 10, 15),
        new Date(year, 11, 25),
    ];
};

const isHolidayOrWeekend = (date: Date): boolean => {
    const day = date.getDay();
    if (day === 0 || day === 6) return true; // Sunday or Saturday
    
    const holidays = getBrazilianHolidays(date.getFullYear());
    return holidays.some(h => 
        h.getDate() === date.getDate() && h.getMonth() === date.getMonth()
    );
};

const getNextBusinessDay = (date: Date): Date => {
    let checkDate = new Date(date);
    while (isHolidayOrWeekend(checkDate)) {
        checkDate.setDate(checkDate.getDate() + 1);
    }
    return checkDate;
};
// --- END HOLIDAY HELPERS ---


const CnpjConsultPage: React.FC<CnpjConsultPageProps> = ({ onBack, connectionConfig }) => {
  const [cnpjInput, setCnpjInput] = useState('');
  const [cnpj, setCnpj] = useState(''); // CNPJ after validation/search
  
  // --- DADOS CADASTRAIS STATE ---
  const [loadingData, setLoadingData] = useState(false);
  const [lastUpdateData, setLastUpdateData] = useState('');
  const [errorData, setErrorData] = useState<string | null>(null);
  
  const [companyData, setCompanyData] = useState({
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    situacao: '',
    dataAbertura: '',
    cnae: '',
    endereco: '',
    naturezaJuridica: '',
  });

  // --- DIAGNÓSTICO FISCAL STATE ---
  const [loadingFiscal, setLoadingFiscal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [errorFiscal, setErrorFiscal] = useState<string | null>(null);
  const [fiscalData, setFiscalData] = useState<FiscalData | null>(null);
  
  // RESOLUTION MODAL STATE
  const [resolveUrl, setResolveUrl] = useState<string | null>(null);
  
  // LOGGING STATE
  const [fetchLogs, setFetchLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  const [activeTab, setActiveTab] = useState<'das' | 'dasn'>('das');

  // Auto-scroll logs
  useEffect(() => {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [fetchLogs]);

  // Timer logic
  useEffect(() => {
      if (loadingFiscal) {
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
  }, [loadingFiscal]);

  const addLog = (msg: string) => {
    setFetchLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // --- FETCH DADOS CADASTRAIS ---
  const fetchCompanyData = async (targetCnpj: string) => {
    if (!targetCnpj) return;
    
    setLoadingData(true);
    setErrorData(null);
    const cleanCnpj = targetCnpj.replace(/[^\d]/g, '');
    const targetUrl = `${connectionConfig.cnpjApi.baseUrl}${cleanCnpj}`;
    
    const endpoints = [
      { url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`, type: 'corsproxy' },
      { url: `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`, type: 'allorigins' },
      { url: targetUrl, type: 'direct' }
    ];

    let success = false;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url);
        
        if (!response.ok) {
           if (response.status === 429) throw new Error('TOO_MANY_REQUESTS');
           if (response.status === 404) throw new Error('CNPJ_NOT_FOUND');
           throw new Error(`Request failed with status ${response.status}`);
        }
        
        let json = await response.json();

        if (endpoint.type === 'allorigins') {
            if (json.contents) {
                try {
                  const content = JSON.parse(json.contents);
                  if (content.status && content.status !== 200) {
                      if (content.status === 429) throw new Error('TOO_MANY_REQUESTS');
                      if (content.status === 404) throw new Error('CNPJ_NOT_FOUND');
                  }
                  json = content;
                } catch (e) {
                   if (typeof json.contents === 'string' && json.contents.includes('Error')) {
                       throw new Error('AllOrigins proxy error');
                   }
                }
            } else {
                throw new Error('AllOrigins response empty');
            }
        }
        
        const data: CNPJResponse = json;
        
        setCompanyData({
          cnpj: data.estabelecimento?.cnpj || cleanCnpj, 
          razaoSocial: data.razao_social || '',
          nomeFantasia: data.estabelecimento?.nome_fantasia || data.razao_social || '',
          situacao: data.estabelecimento?.situacao_cadastral || 'Indisponível',
          dataAbertura: data.estabelecimento?.data_inicio_atividade 
            ? new Date(data.estabelecimento.data_inicio_atividade).toLocaleDateString('pt-BR') 
            : '-',
          cnae: data.estabelecimento?.atividade_principal 
            ? `${data.estabelecimento.atividade_principal.id} - ${data.estabelecimento.atividade_principal.descricao}` 
            : '-',
          endereco: data.estabelecimento 
            ? `${data.estabelecimento.tipo_logradouro} ${data.estabelecimento.logradouro}, ${data.estabelecimento.numero} ${data.estabelecimento.complemento ? '- ' + data.estabelecimento.complemento : ''} - ${data.estabelecimento.bairro}, ${data.estabelecimento.cidade?.nome || ''} - ${data.estabelecimento.estado?.sigla || ''}`
            : '-',
          naturezaJuridica: data.natureza_juridica 
            ? `${data.natureza_juridica.id} - ${data.natureza_juridica.descricao}` 
            : '-',
        });

        const now = new Date();
        setLastUpdateData(`${now.toLocaleDateString()} às ${now.toLocaleTimeString().slice(0, 5)}`);
        success = true;
        break;
      } catch (error: any) {
        console.warn(`Strategy ${endpoint.type} failed:`, error);
        if (error.message === 'CNPJ_NOT_FOUND') {
            setErrorData('CNPJ não encontrado.');
            setLoadingData(false);
            return;
        }
        if (error.message === 'TOO_MANY_REQUESTS') {
            if (!errorData) setErrorData('Limite de consultas excedido.');
        }
      }
    }

    if (!success && !errorData) {
       setErrorData('Erro ao consultar dados cadastrais.');
    } else {
       if (success) setErrorData(null);
    }
    setLoadingData(false);
  };

  // --- FETCH DIAGNÓSTICO FISCAL ---
  const fetchFiscalData = async (targetCnpj: string) => {
    if (!targetCnpj) return;
    
    setLoadingFiscal(true);
    setErrorFiscal(null);
    setFetchLogs([]); // Reset logs
    addLog("Inicializando consulta detalhada...");
    addLog("Atenção: Este processo leva cerca de 30 a 40 segundos.");

    const cleanCnpj = targetCnpj.replace(/[^\d]/g, '');
    addLog(`CNPJ alvo: ${cleanCnpj}`);
    
    const webhookUrl = connectionConfig.diagnosticApi.webhookUrl;
    const headerKey = connectionConfig.diagnosticApi.headerKey || 'cnpj';
    
    if (!webhookUrl) {
        setErrorFiscal('URL do Webhook de Diagnóstico Fiscal não configurada.');
        setLoadingFiscal(false);
        return;
    }
    
    const urlWithParams = `${webhookUrl}?cnpj=${cleanCnpj}`;

    const strategies = [
        { name: 'direct', url: urlWithParams }
    ];

    let success = false;

    for (const strategy of strategies) {
        addLog(`Conectando via: ${strategy.name}...`);
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (headerKey) {
                headers[headerKey] = cleanCnpj; 
            }
            
            const response = await fetch(strategy.url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ cnpj: cleanCnpj })
            });
            
            addLog(`Resposta recebida (Status: ${response.status}).`);
            
            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}`);
            }

            const rawText = await response.text();
            let rawData;
            try {
                rawData = JSON.parse(rawText);
            } catch (e) {
                addLog(`Erro ao analisar JSON: ${rawText.slice(0, 50)}...`);
                throw new Error("Resposta não é um JSON válido");
            }
            
            addLog(`Dados recebidos.`);

            let dataToProcess = null;

            if (Array.isArray(rawData) && rawData.length > 0) {
                 if (rawData[0].resultado) {
                     dataToProcess = rawData[0].resultado;
                 } else {
                     dataToProcess = rawData[0];
                 }
            } 
            else if (typeof rawData === 'object' && rawData !== null) {
                if (rawData.resultado) {
                    dataToProcess = rawData.resultado;
                } else {
                    dataToProcess = rawData;
                }
            }

            if (dataToProcess && (dataToProcess.dAS || dataToProcess.dASN || dataToProcess.identificacao)) {
                processFiscalResult(dataToProcess, cleanCnpj);
                success = true;
                addLog(`Diagnóstico processado com sucesso!`);
                break; 
            } else {
                addLog(`Aviso: Estrutura inesperada. Tentando processar mesmo assim...`);
                try {
                    processFiscalResult(rawData, cleanCnpj);
                    success = true;
                    addLog(`Processamento forçado concluído.`);
                    break;
                } catch (forcedError) {
                    addLog(`Falha no processamento forçado.`);
                    throw new Error('Não foi possível identificar dados fiscais na resposta.');
                }
            }

        } catch (e: any) {
            addLog(`Falha na estratégia ${strategy.name}: ${e.message || e}`);
            continue; 
        }
    }

    if (!success) {
        addLog(`Todas as tentativas falharam.`);
        setErrorFiscal('Não foi possível obter os dados. Verifique os logs.');
    }
    
    setLoadingFiscal(false);
  };

  const processFiscalResult = (result: any, cleanCnpj: string) => {
     try {
        const dasListRaw = result?.dAS?.anos || result?.anos || [];
        const dasnListRaw = result?.dASN?.anos || result?.anos || [];
        
        const processedDas = Array.isArray(dasListRaw) ? dasListRaw
            .filter((item: DasItem) => item && (item.principal || item.total))
            .map((item: DasItem) => {
                let status = 'pendente'; 
                const situacao = item.situacao ? item.situacao.toLowerCase() : '';
                
                if (situacao.includes('liquidado') || situacao.includes('pago')) {
                   status = 'pago';
                } else if (item.vencimento) {
                   const parts = item.vencimento.split('/');
                   if (parts.length === 3) {
                       const dueDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                       const today = new Date();
                       today.setHours(0,0,0,0);
                       
                       if (dueDate < today) status = 'vencido';
                       else status = 'avencer';
                   }
                }
                return { ...item, status };
            })
            .sort((a: any, b: any) => {
                if (!a.vencimento || !b.vencimento) return 0;
                const dateA = a.vencimento.split('/').reverse().join('-');
                const dateB = b.vencimento.split('/').reverse().join('-');
                return dateA < dateB ? 1 : -1;
            }) : [];
        
        let totalDebt = processedDas
            .filter((item: any) => item.status === 'vencido')
            .reduce((acc: number, item: any) => {
                if (!item.total) return acc;
                const val = parseFloat(item.total.toString().replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
                return acc + (isNaN(val) ? 0 : val);
            }, 0);

        const processedDasn = Array.isArray(dasnListRaw) ? dasnListRaw.map((item: DasnItem) => {
            let status = 'pendente';
            if (item.status === 'Regular' || item.dataApresentacao) status = 'entregue';
            if (item.status === 'Não optante') status = 'nao_optante';
            
            return { ...item, status };
        }) : [];

        const pendingDasnCount = processedDasn.filter((i: any) => i.status === 'pendente').length;
        
        // --- ESTIMATION LOGIC ---
        const today = new Date();
        const currentYear = today.getFullYear();
        const averageDasValue = 75.00;
        let isEstimated = false;
        
        const pendingDasnYears = processedDasn
            .filter((d: DasnItem) => d.status === 'pendente')
            .map(d => parseInt(d.ano));
            
        const yearsToEstimate = new Set<number>();
        
        pendingDasnYears
            .filter(year => year < currentYear)
            .forEach(year => {
                const dasCountForYear = processedDas.filter((d: DasItem) => d.ano && parseInt(d.ano) === year).length;
                if (dasCountForYear === 0) {
                    yearsToEstimate.add(year);
                }
            });
            
        const previousYear = currentYear - 1;
        const isPreviousDasnPending = pendingDasnYears.includes(previousYear);
        const hasCurrentYearDas = processedDas.some((d: DasItem) => d.ano && parseInt(d.ano) === currentYear);

        if (isPreviousDasnPending && !hasCurrentYearDas) {
            yearsToEstimate.add(currentYear);
        }
        
        const uniqueYearsToEstimate = Array.from(yearsToEstimate).sort((a, b) => a - b);

        for (const year of uniqueYearsToEstimate) {
            const dasCountForYear = processedDas.filter((d: DasItem) => d.ano && parseInt(d.ano) === year).length;
            
            let monthsToEstimate = 0;
            let maxMonths = 12;
            
            if (year < currentYear) {
                monthsToEstimate = 12;
            } else if (year === currentYear) {
                maxMonths = today.getMonth() + 1;
                monthsToEstimate = maxMonths - dasCountForYear;
            }

            if (monthsToEstimate > 0) {
                const estimatedDebt = monthsToEstimate * averageDasValue;
                totalDebt += estimatedDebt;
                isEstimated = true;
            }
        }
        
        const hasDebt = totalDebt > 0;
        
        const finalData: FiscalData = {
            dasList: processedDas,
            dasnList: processedDasn,
            totalDebt,
            pendingDasnCount,
            status: (hasDebt || pendingDasnCount > 0) ? 'irregular' : 'regular' as 'regular' | 'irregular',
            lastUpdate: new Date().toLocaleTimeString().slice(0, 5),
            isEstimated
        };

        setFiscalData(finalData);

     } catch (e: any) {
         addLog(`Erro ao processar dados visuais: ${e.message}`);
         console.error(e);
         throw new Error("Erro no processamento dos dados.");
     }
  };

  const handleResolveDasn = () => {
      const clean = cnpj ? cnpj.replace(/[^\d]/g, '') : '';
      if(clean) {
          setResolveUrl(`https://typebotapi.portalmei360.com/declara-o-anual-cl1wie5?cnpj=${clean}`);
      } else {
          showError('CNPJ inválido');
      }
  };

  const handleServiceClick = (serviceId: string) => {
      showError('Funcionalidade será ativada em breve!');
  };
  
  const handleSearchCnpj = async (e: React.FormEvent) => {
      e.preventDefault();
      const cleanCnpj = cnpjInput.replace(/[^\d]/g, '');
      if (cleanCnpj.length !== 14) {
          showError("CNPJ inválido. Digite apenas números.");
          return;
      }
      setCnpj(cleanCnpj);
      setFiscalData(null);
      setErrorFiscal(null);
      setErrorData(null);
      
      // Fetch both data sources
      await fetchCompanyData(cleanCnpj);
      await fetchFiscalData(cleanCnpj);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 h-[72px] flex items-center justify-between px-6">
            <div className="flex items-center gap-2">
                <img 
                    src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
                    alt="Regular MEI" 
                    className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
                />
                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase ml-2">Consulta Pública</span>
            </div>
            <button 
                onClick={onBack}
                className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
            >
                Voltar para a Home <span className="material-icons text-sm">arrow_back</span>
            </button>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
                
                {/* CNPJ Input Form */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Diagnóstico Fiscal MEI</h2>
                    <p className="text-slate-500 mb-6">Insira o CNPJ que deseja consultar para verificar a situação cadastral e pendências fiscais (DAS e DASN).</p>
                    
                    <form onSubmit={handleSearchCnpj} className="flex flex-col sm:flex-row gap-3">
                        <input 
                            type="text" 
                            value={cnpjInput}
                            onChange={(e) => setCnpjInput(e.target.value)}
                            className="flex-1 px-4 py-3 text-lg border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                            placeholder="00.000.000/0000-00"
                            disabled={loadingData || loadingFiscal}
                        />
                        <button 
                            type="submit"
                            disabled={loadingData || loadingFiscal || cnpjInput.replace(/[^\d]/g, '').length !== 14}
                            className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-700 min-w-[120px] flex items-center justify-center gap-2"
                        >
                            {loadingData || loadingFiscal ? <span className="material-icons animate-spin">refresh</span> : 'Consultar'}
                        </button>
                    </form>
                </div>

                {/* RESULTS SECTION */}
                {cnpj && (loadingData || loadingFiscal) && (
                    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                        <h4 className="text-lg font-bold text-slate-700 dark:text-white mb-2">Analisando CNPJ {cnpj}...</h4>
                        <p className="text-slate-500 mb-4 text-center max-w-sm">
                            {loadingData ? 'Buscando dados cadastrais...' : 'Consultando situação fiscal (pode levar até 40s)...'}
                        </p>
                        {loadingFiscal && (
                            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-1 rounded-full text-xs font-mono text-slate-500">
                                Tempo decorrido: {elapsedTime}s
                            </div>
                        )}
                    </div>
                )}

                {cnpj && !loadingData && !loadingFiscal && (
                    <div className="space-y-8">
                        
                        {/* SECTION 1: DADOS CADASTRAIS */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                    <span className="material-icons text-slate-400">store</span>
                                    Dados Cadastrais
                                </h3>
                                {companyData.situacao && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${companyData.situacao.toUpperCase() === 'ATIVA' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                        {companyData.situacao.toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {errorData && (
                                <div className="p-4 bg-red-50 text-red-600 text-sm border-b border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50">
                                    {errorData}
                                </div>
                            )}
                            
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">CNPJ</label>
                                    <p className="text-slate-800 dark:text-white font-medium font-mono">{companyData.cnpj || cnpj}</p>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Razão Social</label>
                                    <p className="text-slate-800 dark:text-white font-medium">{companyData.razaoSocial || '-'}</p>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Nome Fantasia</label>
                                    <p className="text-slate-800 dark:text-white font-medium">{companyData.nomeFantasia || '-'}</p>
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Atividade Principal (CNAE)</label>
                                    <p className="text-slate-800 dark:text-white font-medium">{companyData.cnae || '-'}</p>
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Natureza Jurídica</label>
                                    <p className="text-slate-800 dark:text-white font-medium">{companyData.naturezaJuridica || '-'}</p>
                                </div>
                                <div className="lg:col-span-3">
                                    <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Endereço</label>
                                    <p className="text-slate-800 dark:text-white font-medium">{companyData.endereco || '-'}</p>
                                </div>
                            </div>
                            <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                                <span className="text-xs text-slate-400">Atualizado: {lastUpdateData || 'Nunca'}</span>
                            </div>
                        </div>

                        {/* SECTION 2: DIAGNÓSTICO FISCAL */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                    <span className="material-icons text-slate-400">analytics</span>
                                    Diagnóstico Fiscal
                                </h3>
                                <button 
                                    onClick={() => fetchFiscalData(cnpj)}
                                    disabled={loadingFiscal}
                                    className="bg-primary hover:bg-blue-600 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 text-sm"
                                >
                                    <span className={`material-icons text-lg ${loadingFiscal ? 'animate-spin' : ''}`}>sync</span>
                                    {loadingFiscal ? `Aguarde (${elapsedTime}s)...` : 'Atualizar Diagnóstico'}
                                </button>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                {errorFiscal && (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95">
                                        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-3">
                                            <span className="material-icons text-2xl">error_outline</span>
                                        </div>
                                        <p className="text-red-600 font-medium mb-1">Erro na consulta</p>
                                        <p className="text-slate-500 text-sm max-w-md">{errorFiscal}</p>
                                        <button onClick={() => fetchFiscalData(cnpj)} className="mt-4 text-primary hover:underline text-sm">Tentar novamente</button>
                                    </div>
                                )}

                                {fiscalData && !loadingFiscal && (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        
                                        {/* Status Banner */}
                                        <div className={`p-4 rounded-xl border mb-6 flex items-start gap-4 ${
                                            fiscalData.status === 'regular' 
                                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/50' 
                                            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50'
                                        }`}>
                                            <div className={`p-2 rounded-full flex-shrink-0 ${
                                                fiscalData.status === 'regular' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                            }`}>
                                                <span className="material-icons text-2xl">
                                                    {fiscalData.status === 'regular' ? 'check_circle' : 'warning'}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className={`text-lg font-bold mb-1 ${
                                                    fiscalData.status === 'regular' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                                                }`}>
                                                    {fiscalData.status === 'regular' ? 'Empresa Regular' : 'Pendências Encontradas'}
                                                </h4>
                                                <p className={`text-sm ${
                                                    fiscalData.status === 'regular' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                                                }`}>
                                                    {fiscalData.status === 'regular' 
                                                        ? 'Parabéns! Não constam débitos ou declarações pendentes.' 
                                                        : 'Existem obrigações atrasadas que precisam da sua atenção.'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Summary Cards */}
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 relative">
                                                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Dívida Total Estimada</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-2xl font-bold ${fiscalData.totalDebt > 0 ? 'text-red-600' : 'text-slate-800 dark:text-white'}`}>
                                                        R$ {fiscalData.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    {fiscalData.isEstimated && (
                                                        <span className="material-icons text-yellow-500 text-lg cursor-help" title="Valor estimado. Guias de 2025 ainda não foram geradas devido à pendência da Declaração Anual.">
                                                            warning_amber
                                                        </span>
                                                    )}
                                                </div>
                                                {fiscalData.isEstimated && (
                                                    <p className="text-[10px] text-yellow-600 dark:text-yellow-500 mt-1">* Valor projetado (DASN Pendente)</p>
                                                )}
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Declarações Pendentes</span>
                                                <span className={`text-2xl font-bold ${fiscalData.pendingDasnCount > 0 ? 'text-red-600' : 'text-slate-800 dark:text-white'}`}>
                                                    {fiscalData.pendingDasnCount}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Detail Tabs */}
                                        <div className="mb-4 flex gap-2 border-b border-slate-200 dark:border-slate-800">
                                            <button 
                                                onClick={() => setActiveTab('das')}
                                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'das' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Guias DAS
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('dasn')}
                                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'dasn' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Declarações (DASN)
                                            </button>
                                        </div>

                                        {/* List Content */}
                                        <div className="flex-1 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
                                            {activeTab === 'das' ? (
                                                <div className="space-y-2">
                                                    {fiscalData.isEstimated && (
                                                        <div className="p-3 mb-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                                                            <span className="material-icons text-sm mt-0.5">info</span>
                                                            <p>As guias do ano vigente ainda não estão disponíveis no sistema da Receita Federal pois a Declaração Anual (DASN) do ano anterior está pendente.</p>
                                                        </div>
                                                    )}

                                                    {fiscalData.dasList.length === 0 ? (
                                                        <p className="text-center text-slate-400 py-4">Nenhuma guia com valor encontrada.</p>
                                                    ) : (
                                                        fiscalData.dasList.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                                                <div>
                                                                    <p className="font-semibold text-slate-800 dark:text-white text-sm">{item.periodo}</p>
                                                                    <p className="text-xs text-slate-500">Vencimento: {item.vencimento}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">{item.total}</p>
                                                                    {item.status === 'pago' && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded uppercase">Pago</span>}
                                                                    {item.status === 'vencido' && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded uppercase">Vencido</span>}
                                                                    {item.status === 'avencer' && <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded uppercase">A Vencer</span>}
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {fiscalData.dasnList.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                                            <div>
                                                                <p className="font-semibold text-slate-800 dark:text-white text-sm">Ano Base {item.ano}</p>
                                                                <p className="text-xs text-slate-500">
                                                                    {item.status === 'entregue' ? `Entregue em ${item.dataApresentacao}` : (item.status === 'nao_optante' ? 'Não optante' : 'Pendente')}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                {item.status === 'entregue' && <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded"><span className="material-icons text-xs">check</span> Regular</span>}
                                                                {item.status === 'nao_optante' && <span className="flex items-center gap-1 text-slate-500 text-xs font-bold bg-slate-100 px-2 py-1 rounded">N/A</span>}
                                                                {item.status === 'pendente' && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-100 px-2 py-1 rounded">
                                                                            <span className="material-icons text-xs">warning</span> Pendente
                                                                        </span>
                                                                        <button 
                                                                            onClick={handleResolveDasn}
                                                                            className="flex items-center gap-1 text-xs bg-primary hover:bg-blue-600 text-white px-3 py-1 rounded-md font-bold transition-colors shadow-sm"
                                                                        >
                                                                            Regularizar <span className="material-icons text-[10px]">open_in_new</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                            <span className="text-xs text-slate-400">Dados atualizados em: {fiscalData.lastUpdate}</span>
                                        </div>
                                    </div>
                                )}
                                
                                {/* LOGS DE PROCESSAMENTO */}
                                {fetchLogs.length > 0 && (
                                    <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                                        <details className="group" open={loadingFiscal}>
                                            <summary className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none">
                                                <span className="material-icons text-sm transition-transform group-open:rotate-90">chevron_right</span>
                                                Logs de Conexão
                                            </summary>
                                            <div className="mt-2 bg-slate-900 text-green-400 font-mono text-[10px] p-3 rounded-lg max-h-32 overflow-y-auto border border-slate-700 scroll-smooth">
                                                {fetchLogs.map((log, i) => (
                                                    <div key={i} className="whitespace-nowrap">{log}</div>
                                                ))}
                                                <div ref={logsEndRef} />
                                            </div>
                                        </details>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SECTION 3: SERVIÇOS CTA */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                    <span className="material-icons text-indigo-500">miscellaneous_services</span>
                                    Serviços Especializados
                                </h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {servicesData.map((service) => (
                                    <button 
                                        key={service.id}
                                        onClick={() => handleServiceClick(service.id)}
                                        className="flex flex-col text-left p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:shadow-md transition-all group bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${service.colorClass}`}>
                                            <span className="material-icons text-2xl">{service.icon}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white mb-2 group-hover:text-primary transition-colors">
                                            {service.title}
                                        </h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed flex-grow">
                                            {service.description}
                                        </p>
                                        <div className="flex items-center text-xs font-bold text-primary group-hover:gap-2 transition-all">
                                            Acessar Serviço <span className="material-icons text-sm ml-1">arrow_forward</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* RESOLUTION MODAL */}
                {resolveUrl && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <span className="material-icons text-primary">assignment_turned_in</span>
                                    Regularização
                                </h3>
                                <button onClick={() => setResolveUrl(null)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                            <div className="flex-1 bg-slate-100 dark:bg-slate-900 relative">
                                <iframe 
                                    src={resolveUrl} 
                                    className="w-full h-full border-0 absolute inset-0" 
                                    title="Assistente de Regularização"
                                    allow="camera; microphone; geolocation"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    </div>
  );
};

// --- Helper functions (getEasterDate, getBrazilianHolidays, isHolidayOrWeekend, getNextBusinessDay) are defined above the component in the original file.

export default CnpjConsultPage;