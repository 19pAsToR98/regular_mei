import React, { useState, useRef, useMemo } from 'react';
import { User } from '../types';
import { showSuccess, showError } from '../utils/toastUtils';

// Declaração global para html2pdf (disponível via script tag no index.html)
declare const html2pdf: any;

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  iconColor: string;
  status: 'active' | 'soon' | 'new';
}

const toolsData: Tool[] = [
  {
    id: 'recibo',
    title: 'Gerador de Recibos',
    description: 'Emita recibos simples e rápidos com sua logo e assinatura digital.',
    icon: 'receipt',
    color: 'bg-emerald-5 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    status: 'active',
  },
  {
    id: 'calculadora_taxas',
    title: 'Calculadora de Taxas',
    description: 'Descubra quanto cobrar para cobrir as taxas da maquininha de cartão.',
    icon: 'calculate',
    color: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    status: 'active',
  },
  {
    id: 'pix',
    title: 'Gerador de Plaquinha Pix',
    description: 'Crie um QR Code personalizado para receber pagamentos no balcão.',
    icon: 'qr_code_2',
    color: 'bg-cyan-50 dark:bg-cyan-900/20',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    status: 'active',
  },
  {
    id: 'orcamento',
    title: 'Gerador de Orçamentos',
    description: 'Crie orçamentos profissionais em PDF para enviar aos seus clientes.',
    icon: 'description',
    color: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    status: 'active',
  },
  {
    id: 'crm',
    title: 'Meus Clientes (CRM)',
    description: 'Caderno de contatos digital com histórico de serviços.',
    icon: 'groups',
    color: 'bg-orange-50 dark:bg-orange-900/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
    status: 'soon',
  },
];

// --- UTILS FOR PIX PAYLOAD GENERATION (EMVCo Standard) ---
const crc16CCITT = (payload: string): string => {
    let crc = 0xFFFF;
    const polynomial = 0x1021;

    for (let i = 0; i < payload.length; i++) {
        crc ^= (payload.charCodeAt(i) << 8);
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = ((crc << 1) ^ polynomial);
            } else {
                crc = (crc << 1);
            }
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};

const generatePixPayload = (key: string, name: string, city: string, amount?: string, txId: string = '***') => {
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    
    const formatField = (id: string, value: string) => {
        const len = value.length.toString().padStart(2, '0');
        return `${id}${len}${value}`;
    };

    const cleanKey = key.trim();
    const cleanName = normalize(name).substring(0, 25); // Max 25 chars
    const cleanCity = normalize(city).substring(0, 15); // Max 15 chars
    const cleanAmount = amount ? parseFloat(amount).toFixed(2) : null;
    const cleanTxId = txId || '***';

    let payload = 
        formatField('00', '01') + // Payload Format Indicator
        formatField('26', // Merchant Account Information
            formatField('00', 'BR.GOV.BCB.PIX') + 
            formatField('01', cleanKey)
        ) +
        formatField('52', '0000') + // Merchant Category Code
        formatField('53', '986');   // Transaction Currency (BRL)

    if (cleanAmount) {
        payload += formatField('54', cleanAmount);
    }

    payload += 
        formatField('58', 'BR') + // Country Code
        formatField('59', cleanName) + // Merchant Name
        formatField('60', cleanCity) + // Merchant City
        formatField('62', // Additional Data Field Template
            formatField('05', cleanTxId)
        ) +
        '6304'; // CRC16 ID + Length

    payload += crc16CCITT(payload);

    return payload;
};

const PixGenerator = ({ onBack, user }: { onBack: () => void, user?: User | null }) => {
    const [formData, setFormData] = useState({
        keyType: 'cpf',
        key: '',
        name: user?.name || '',
        city: 'BRASIL',
        amount: '',
        color: 'bg-emerald-600'
    });

    const [payload, setPayload] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    
    const plateRef = useRef<HTMLDivElement>(null);

    // Helper para formatar a chave de celular para o padrão EMVCo (+55DDDNumero)
    const formatPhoneKey = (rawKey: string, keyType: string): string => {
        const cleanKey = rawKey.replace(/[^\d]/g, '');
        
        if (keyType === 'celular') {
            // Se o número já começar com 55, assumimos que o código do país está correto
            if (cleanKey.startsWith('55')) {
                return `+${cleanKey}`;
            }
            
            // Se for um número de 10 ou 11 dígitos (DDD + Número), adicionamos +55
            if (cleanKey.length === 10 || cleanKey.length === 11) {
                return `+55${cleanKey}`;
            }
            
            return rawKey; // Retorna a chave original se não for um formato reconhecido
        }
        
        // Para CPF, CNPJ e Aleatória, apenas removemos a pontuação
        if (keyType === 'cpf' || keyType === 'cnpj' || keyType === 'aleatoria') {
            return cleanKey;
        }
        
        return rawKey;
    };

    const handleGenerate = () => {
        if (!formData.key || !formData.name) return;
        
        // Pré-processamento da chave
        const processedKey = formatPhoneKey(formData.key, formData.keyType);

        const p = generatePixPayload(processedKey, formData.name, formData.city, formData.amount);
        setPayload(p);
    };

    const handleExportPDF = () => {
        if (!plateRef.current) {
            showError("Erro: Elemento da placa não encontrado.");
            return;
        }
        
        setIsExporting(true);
        showSuccess("Gerando PDF, aguarde...");

        // Configuração para o PDF (tamanho da placa 320x480px)
        const element = plateRef.current;
        const filename = `plaquinha_pix_${formData.name.replace(/\s/g, '_')}.pdf`;

        // Tamanho fixo da placa para visualização (320x480)
        const PLATE_WIDTH = 320;
        const PLATE_HEIGHT = 480;

        // Configurações para manter a qualidade e o tamanho do elemento
        const opt = {
            margin: 5, // Reduzindo a margem para maximizar o espaço na página pequena
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 3, // Alta escala para qualidade
                logging: false, 
                useCORS: true,
                // Definir largura e altura exatas do elemento para evitar quebras
                width: PLATE_WIDTH, 
                height: PLATE_HEIGHT 
            },
            jsPDF: { 
                unit: 'mm', 
                format: [80, 120], // Formato pequeno (80mm x 120mm)
                orientation: 'portrait' 
            } 
        };

        html2pdf().set(opt).from(element).save().then(() => {
            setIsExporting(false);
            showSuccess("PDF exportado com sucesso!");
        }).catch((error: any) => {
            console.error("Erro ao exportar PDF:", error);
            showError("Falha ao exportar PDF. Tente novamente.");
            setIsExporting(false);
        });
    };

    // Auto-generate on field change if valid
    useMemo(() => {
        if (formData.key.length > 3 && formData.name.length > 2) {
            // Pré-processamento da chave
            const processedKey = formatPhoneKey(formData.key, formData.keyType);
            
            const p = generatePixPayload(processedKey, formData.name, formData.city, formData.amount);
            setPayload(p);
        } else {
            setPayload('');
        }
    }, [formData]);

    // Tamanho fixo da placa para visualização (320x480)
    const PLATE_WIDTH = 320;
    const PLATE_HEIGHT = 480;
    const PREVIEW_SCALE = 0.75; // Scale down for preview container fit

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            {/* Removendo o bloco <style> print:hidden, pois usaremos html2pdf */}

            <button onClick={onBack} className="mb-4 flex items-center text-slate-500 hover:text-primary transition-colors font-medium print:hidden">
                <span className="material-icons text-sm mr-1">arrow_back</span> Voltar para ferramentas
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Form */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-icons text-cyan-500">qr_code_2</span> Dados da Plaquinha
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Chave</label>
                            <div className="flex gap-2 flex-wrap">
                                {['cpf', 'cnpj', 'celular', 'email', 'aleatoria'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setFormData({...formData, keyType: type})}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors border ${formData.keyType === type ? 'bg-cyan-100 text-cyan-700 border-cyan-200' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chave Pix</label>
                            <input 
                                type="text" 
                                value={formData.key} 
                                onChange={e => setFormData({...formData, key: e.target.value})} 
                                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/50" 
                                placeholder={formData.keyType === 'email' ? 'exemplo@email.com' : 'Sua chave pix'} 
                            />
                            {formData.keyType === 'celular' && (
                                <p className="text-xs text-slate-500 mt-1">
                                    Formato esperado: (DDD) 9XXXX-XXXX. Será convertido para o padrão internacional.
                                </p>
                            )}
                            {(formData.keyType === 'cpf' || formData.keyType === 'cnpj') && (
                                <p className="text-xs text-slate-500 mt-1">
                                    A pontuação será removida automaticamente para gerar o QR Code.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Beneficiário</label>
                            <input 
                                type="text" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/50" 
                                placeholder="Seu nome ou da Empresa" 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cidade</label>
                                <input 
                                    type="text" 
                                    value={formData.city} 
                                    onChange={e => setFormData({...formData, city: e.target.value})} 
                                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/50" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (Opcional)</label>
                                <input 
                                    type="number" 
                                    value={formData.amount} 
                                    onChange={e => setFormData({...formData, amount: e.target.value})} 
                                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/50" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cor do Fundo</label>
                            <div className="flex gap-2">
                                {['bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-slate-900', 'bg-pink-600'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setFormData({...formData, color})}
                                        className={`w-8 h-8 rounded-full ${color} ${formData.color === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview / Export Area */}
                <div className="flex flex-col gap-6 items-center">
                    
                    {/* VISUAL PREVIEW CONTAINER */}
                    <div className="w-full bg-slate-100 dark:bg-black/20 p-4 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-center items-center min-h-[600px] overflow-hidden relative">
                        <div className="absolute top-2 right-2 bg-white/50 dark:bg-black/50 px-2 py-1 rounded text-[10px] uppercase font-bold text-slate-500">
                            Pré-visualização
                        </div>

                        {/* SHEET SIMULATION - Adjusted scale for preview */}
                        <div 
                            id="pix-plate-container" 
                            className={`bg-white shadow-xl transition-all duration-500 flex items-center justify-center relative`}
                            style={{ 
                                // Apply scale only for visual fit
                                transform: `scale(${PREVIEW_SCALE})`, 
                                transformOrigin: 'center center',
                                margin: '0',
                                padding: '0'
                            }}
                        >
                            {/* THE PLATE ITSELF - Fixed size for consistency */}
                            <div ref={plateRef} id="pix-plate" className={`w-[320px] h-[480px] ${formData.color} rounded-3xl relative flex flex-col items-center p-8 text-white overflow-hidden shadow-sm`}>
                                {/* Decorative background circles */}
                                <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
                                <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-white opacity-5 rounded-full blur-xl"></div>
                                
                                {/* Header */}
                                <div className="relative z-10 flex flex-col items-center mb-6">
                                    {/* CORREÇÃO: Usando a URL fornecida */}
                                    <img 
                                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Pix_%28Brazil%29_logo.svg/640px-Pix_%28Brazil%29_logo.svg.png" 
                                        alt="Pix" 
                                        className="h-12 mb-2 object-contain" 
                                        style={{ filter: 'brightness(0) invert(1)' }} // Forçando o branco no fundo colorido
                                    />
                                    <h3 className="text-xl font-bold tracking-wide uppercase text-white/90 text-center whitespace-nowrap">
                                        Pagamento Instantâneo
                                    </h3>
                                </div>

                                {/* QR Code Container */}
                                <div className="relative z-10 bg-white p-4 rounded-3xl shadow-xl mb-6">
                                    {payload ? (
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`} 
                                            alt="QR Code Pix" 
                                            className="w-56 h-56 mix-blend-multiply"
                                        />
                                    ) : (
                                        <div className="w-56 h-56 bg-slate-100 flex items-center justify-center text-slate-400 text-xs text-center rounded">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-icons text-3xl">qr_code_2</span>
                                                <span>Aguardando dados...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Info */}
                                <div className="relative z-10 text-center w-full mt-auto">
                                    <p className="text-white/80 text-[10px] uppercase font-bold mb-1 tracking-widest">Beneficiário</p>
                                    {/* Reduced font size to text-base and added mb-4 */}
                                    <p className="font-bold text-base leading-tight px-2 mb-4 line-clamp-2">
                                        {formData.name || 'Nome do Recebedor'}
                                    </p>
                                    
                                    <div className="bg-black/20 rounded-lg py-2 px-4 inline-block max-w-full">
                                        <p className="font-mono text-sm truncate">{formData.key || 'CHAVE PIX'}</p>
                                    </div>
                                    
                                    <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-white/50 font-medium">
                                        <span className="material-icons text-[10px]">lock</span> Pagamento Seguro
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full max-w-xs print:hidden">
                        <button 
                            onClick={handleExportPDF}
                            disabled={!payload || isExporting}
                            className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-colors"
                        >
                            {isExporting ? <span className="material-icons animate-spin text-sm">refresh</span> : <span className="material-icons">file_download</span>}
                            Exportar PDF
                        </button>
                        <p className="text-center text-xs text-slate-400">Gera um arquivo PDF de alta qualidade da sua placa.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FeeCalculator = ({ onBack }: { onBack: () => void }) => {
// ... (Restante do FeeCalculator permanece inalterado)
    const [calcData, setCalcData] = useState({
        desiredAmount: '',
        feePercent: '',
    });

    const desired = parseFloat(calcData.desiredAmount) || 0;
    const fee = parseFloat(calcData.feePercent) || 0;
    
    // Formula: Charge = Desired / (1 - (Fee/100))
    const chargeAmount = fee < 100 ? desired / (1 - (fee / 100)) : 0;
    const feeValue = chargeAmount - desired;

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <button onClick={onBack} className="mb-4 flex items-center text-slate-500 hover:text-primary transition-colors font-medium print:hidden">
                <span className="material-icons text-sm mr-1">arrow_back</span> Voltar para ferramentas
            </button>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                        <span className="material-icons text-2xl">calculate</span>
                    </div>
                    <h3 className="2xl font-bold text-slate-800 dark:text-white mb-2">Calculadora de Taxas</h3>
                    <p className="text-slate-500 mb-6">Descubra exatamente quanto cobrar para descontar a taxa da maquininha e receber o valor cheio.</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Valor que você quer receber (Líquido)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                <input 
                                    type="number" 
                                    value={calcData.desiredAmount} 
                                    onChange={e => setCalcData({...calcData, desiredAmount: e.target.value})} 
                                    className="w-full pl-10 pr-4 py-3 text-lg font-bold border rounded-xl bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-purple-500/50" 
                                    placeholder="100,00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Taxa da Maquininha (%)</label>
                            <div className="relative">
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                <input 
                                    type="number" 
                                    value={calcData.feePercent} 
                                    onChange={e => setCalcData({...calcData, feePercent: e.target.value})} 
                                    className="w-full px-4 py-3 text-lg font-bold border rounded-xl bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-purple-500/50" 
                                    placeholder="4,99"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Consulte a taxa de parcelamento da sua operadora.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden print:w-full print:shadow-none print:bg-white print:text-black">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10 print:hidden"></div>
                    <div className="relative z-10">
                        <p className="text-purple-200 font-medium mb-1 print:text-slate-500">Você deve cobrar do cliente:</p>
                        <div className="text-5xl font-black mb-6 tracking-tight print:text-black">
                            R$ {chargeAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>

                        <div className="space-y-3 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 print:border-slate-200 print:bg-slate-50">
                            <div className="flex justify-between text-sm">
                                <span className="text-purple-100 print:text-slate-600">Taxa da Máquina ({calcData.feePercent || 0}%)</span>
                                <span className="font-bold text-red-200 print:text-red-600">- R$ {feeValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                            <div className="border-t border-white/20 pt-2 flex justify-between text-lg font-bold print:border-slate-300">
                                <span className="print:text-slate-800">Você Recebe</span>
                                <span className="text-green-300 print:text-green-600">R$ {desired.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                        </div>
                        
                        <p className="text-xs text-purple-200 mt-6 text-center opacity-70 print:text-slate-400">
                            Cálculo: Valor Cobrado = Valor Desejado ÷ (1 - Taxa)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ToolsPageProps {
    user?: User | null;
}

const ToolsPage: React.FC<ToolsPageProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const filteredTools = toolsData.filter(tool => 
    tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToolClick = (tool: Tool) => {
      if (tool.status === 'active' || tool.status === 'new') {
          setActiveTool(tool.id);
      }
  };

  // --- RENDER ACTIVE TOOL ---
  if (activeTool === 'recibo') {
      return <ReceiptGenerator onBack={() => setActiveTool(null)} user={user} />;
  }

  if (activeTool === 'calculadora_taxas') {
      return <FeeCalculator onBack={() => setActiveTool(null)} />;
  }

  if (activeTool === 'pix') {
      return <PixGenerator onBack={() => setActiveTool(null)} user={user} />;
  }

  if (activeTool === 'orcamento') {
      return <BudgetGenerator onBack={() => setActiveTool(null)} user={user} />;
  }

  // --- RENDER TOOL GRID ---
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Ferramentas Úteis</h3>
            <p className="text-slate-500 dark:text-slate-400">Aplicativos práticos para o dia a dia do seu negócio.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-72">
           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons">search</span>
           <input 
              type="text" 
              placeholder="Buscar ferramenta..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
            />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTools.map((tool) => (
          <div 
            key={tool.id}
            onClick={() => handleToolClick(tool)}
            className={`
              relative group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300
              ${tool.status === 'soon' ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1 hover:border-primary/30'}
            `}
          >
            {/* Badge Status */}
            {tool.status === 'new' && (
              <span className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Novo
              </span>
            )}
            {tool.status === 'soon' && (
              <span className="absolute top-4 right-4 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Em Breve
              </span>
            )}

            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${tool.color} group-hover:scale-110 transition-transform duration-300`}>
              <span className={`material-icons text-3xl ${tool.iconColor}`}>
                {tool.icon}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 group-hover:text-primary transition-colors">
              {tool.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              {tool.description}
            </p>

            <div className="flex items-center text-sm font-semibold">
              {tool.status === 'soon' ? (
                 <span className="text-slate-400 flex items-center gap-1">
                   <span className="material-icons text-base">lock</span> Indisponível
                 </span>
              ) : (
                <span className="text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  Abrir Ferramenta <span className="material-icons text-base">arrow_forward</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTools.length === 0 && (
         <div className="flex flex-col items-center justify-center py-12">
            <span className="material-icons text-4xl text-slate-300 mb-2">search_off</span>
            <p className="text-slate-500">Nenhuma ferramenta encontrada para "{searchTerm}"</p>
         </div>
      )}
    </div>
  );
};

export default ToolsPage;