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
                                    {/* CORREÇÃO: Removendo o filtro 'brightness-0 invert' e usando uma imagem mais robusta ou um ícone */}
                                    <img 
                                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Logo_PIX.svg/1200px-Logo_PIX.svg.png" 
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

const ReceiptGenerator = ({ onBack, user }: { onBack: () => void, user?: User | null }) => {
// ... (Restante do ReceiptGenerator permanece inalterado)
    // Helper para obter a data local no formato YYYY-MM-DD
    const getLocalISODate = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000; // offset em ms
        const localTime = new Date(now.getTime() - offset);
        return localTime.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
        template: 'classic' as 'classic' | 'mei' | 'detailed',
        payerName: '',
        payerDoc: '',
        date: getLocalISODate(),
        local: '',
        issuerName: user?.name || 'Minha Empresa MEI',
        issuerDoc: user?.cnpj || '00.000.000/0001-00',
        issuerCpf: '',
        
        paymentMethod: 'pix',
        otherPaymentMethod: '',
        
        // Assinatura digitada e estilo
        signatureText: user?.name || '',
        signatureStyle: 'standard' as 'standard' | 'cursive',
    });
    
    const [items, setItems] = useState<{id: number, desc: string, qty: number, price: number}[]>([
        { id: 1, desc: 'Serviço Exemplo', qty: 1, price: 100.00 }
    ]);
    
    const [isExporting, setIsExporting] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

    const total = useMemo(() => {
        return items.reduce((acc, item) => acc + (item.qty * item.price), 0);
    }, [items]);

    const addItem = () => {
        setItems([...items, { id: Date.now(), desc: '', qty: 1, price: 0 }]);
    };

    const updateItem = (id: number, field: string, value: string | number) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeItem = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleExportPDF = () => {
        if (!receiptRef.current) {
            showError("Erro: Elemento do recibo não encontrado.");
            return;
        }
        
        setIsExporting(true);
        showSuccess("Gerando PDF, aguarde...");

        const element = receiptRef.current;
        const filename = `recibo_${formData.payerName.replace(/\s/g, '_')}_${formData.date}.pdf`;

        // Configurações para A4 (210mm x 297mm)
        const opt = {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                logging: false, 
                useCORS: true,
                // Usando onclone para forçar o fundo branco e o grayscale
                onclone: (doc: Document) => {
                    const receiptElement = doc.getElementById('receipt-preview');
                    if (receiptElement) {
                        // 1. Forçar fundo branco para eliminar o pastel yellow
                        receiptElement.style.backgroundColor = '#FFFFFF';
                        // 2. Forçar filtro grayscale
                        receiptElement.style.filter = 'grayscale(100%)';
                        receiptElement.style.webkitFilter = 'grayscale(100%)';
                    }
                }
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
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

    const formatAmountInWords = (amount: number): string => {
        const num = amount || 0;
        if (num === 0) return 'zero reais';

        const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
        const teens = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
        const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
        const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
        const thousands = ['', 'mil', 'milhões', 'bilhões'];

        const toWords = (n: number): string => {
            if (n === 0) return '';
            if (n < 10) return units[n];
            if (n < 20) return teens[n - 10];
            if (n < 100) {
                const t = tens[Math.floor(n / 10)];
                const u = units[n % 10];
                return t + (u ? ' e ' + u : '');
            }
            if (n < 1000) {
                const h = hundreds[Math.floor(n / 100)];
                const rest = toWords(n % 100);
                return h + (rest ? ' e ' + rest : '');
            }
            return '';
            // Simplified logic for brevity, full implementation is complex
        };

        const integerPart = Math.floor(num);
        const decimalPart = Math.round((num - integerPart) * 100);

        let result = '';
        let temp = integerPart;
        let i = 0;

        while (temp > 0) {
            const chunk = temp % 1000;
            if (chunk > 0) {
                let chunkWords = toWords(chunk);
                if (chunk === 1 && i === 1) chunkWords = 'mil';
                
                if (result) {
                    result = chunkWords + (i === 1 ? ' e ' : ', ') + result;
                } else {
                    result = chunkWords;
                }
            }
            temp = Math.floor(temp / 1000);
            i++;
        }
        
        result = result.trim();
        
        let final = result + (integerPart === 1 ? ' real' : ' reais');

        if (decimalPart > 0) {
            const centavos = toWords(decimalPart);
            final += ' e ' + centavos + (decimalPart === 1 ? ' centavo' : ' centavos');
        }

        return final.charAt(0).toUpperCase() + final.slice(1);
    };

    const amountInWords = formatAmountInWords(total);
    const formattedAmount = total.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    
    // CORREÇÃO: Usar a data do formulário para formatar
    const dateObj = new Date(formData.date + 'T12:00:00'); // Adiciona hora para evitar problemas de fuso
    const formattedDate = dateObj.toLocaleDateString('pt-BR');
    const [day, month, year] = formattedDate.split('/');
    
    // Local e data para preenchimento
    const locationAndDate = `${formData.local || 'Local não informado'}, ${formattedDate}`;
    
    const paymentOptions = [
        { label: 'Pix', value: 'pix' },
        { label: 'Dinheiro', value: 'dinheiro' },
        { label: 'Transferência', value: 'transferencia' },
        { label: 'Cartão', value: 'cartao' },
        { label: 'Boleto', value: 'boleto' },
    ];

    const renderPaymentCheckboxes = (template: 'mei' | 'detailed') => {
        return (
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-800 dark:text-slate-800">
                {paymentOptions.map(opt => (
                    <span key={opt.value} className="flex items-center">
                        ({formData.paymentMethod === opt.value ? 'X' : ' '}) {opt.label}
                    </span>
                ))}
                <span className="flex items-center">
                    ({formData.paymentMethod === 'outro' ? 'X' : ' '}) Outro: {formData.paymentMethod === 'outro' ? formData.otherPaymentMethod : ' '}
                </span>
            </div>
        );
    };

    // Helper para renderizar campos com tamanho dinâmico
    const renderDynamicValue = (content: string, className: string = '') => (
        <span className={`font-bold px-1 inline-block whitespace-normal text-slate-900 dark:text-slate-900 ${className}`}>
            {content || '____________________'}
        </span>
    );
    
    // Componente de lista de itens para modelos simples/MEI
    const renderItemList = () => (
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-800 dark:text-slate-800">
            {items.map((item, index) => (
                <li key={index}>
                    {item.desc || 'Serviço/Produto'} (R$ {(item.qty * item.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})})
                </li>
            ))}
        </ul>
    );

    // NOVO: Componente de Assinatura
    const renderSignatureArea = () => (
        <div className="pt-12 text-center">
            <p>Local e data: {renderDynamicValue(locationAndDate)}</p>
            
            {/* Assinatura */}
            <div className="mt-12 w-64 mx-auto pt-1">
                {formData.signatureText ? (
                    <div className={`w-full h-auto object-contain max-h-20 border-b border-slate-800 pb-1 text-lg ${formData.signatureStyle === 'cursive' ? 'font-cursive' : 'font-sans'}`}>
                        {formData.signatureText}
                    </div>
                ) : (
                    <div className="border-t border-slate-800 pt-1">
                        <p className="text-sm font-bold">{formData.issuerName || 'Assinatura do Emitente'}</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderReceiptContent = () => {
        // Usando valores preenchidos ou um espaço vazio
        const issuerName = formData.issuerName || ' ';
        const issuerDoc = formData.issuerDoc || ' ';
        const issuerCpf = formData.issuerCpf || ' ';
        const payerName = formData.payerName || ' ';
        const payerDoc = formData.payerDoc || ' ';
        const amount = formattedAmount || ' ';
        const amountExtenso = amountInWords || ' ';
        
        switch (formData.template) {
            case 'classic':
                return (
                    <div className="space-y-6 text-slate-800 dark:text-slate-800">
                        <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                            <h2 className="text-2xl font-black uppercase tracking-widest">RECIBO</h2>
                        </div>
                        
                        <p>
                            Eu, {renderDynamicValue(issuerName)}
                            , CPF nº {renderDynamicValue(issuerCpf)}
                            , recebi de {renderDynamicValue(payerName)}
                            , CPF/CNPJ nº {renderDynamicValue(payerDoc)}
                            , a quantia de R$ {renderDynamicValue(amount)} ({renderDynamicValue(amountExtenso)}), referente a:
                        </p>
                        
                        {/* Lista de itens */}
                        <div className="pt-2 border-t border-slate-200">
                            <p className="font-bold text-sm mb-2">Itens/Serviços:</p>
                            {renderItemList()}
                        </div>

                        <p>
                            Declaro que o valor foi recebido integralmente nesta data.
                        </p>

                        {renderSignatureArea()}
                    </div>
                );
            case 'mei':
                return (
                    <div className="space-y-6 text-slate-800 dark:text-slate-800">
                        <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                            <h2 className="text-2xl font-black uppercase tracking-widest">RECIBO MEI</h2>
                        </div>
                        
                        <p>
                            Eu, {renderDynamicValue(issuerName)}
                            , MEI inscrito no CNPJ {renderDynamicValue(issuerDoc)}
                            , recebi de {renderDynamicValue(payerName)}
                            , CPF/CNPJ {renderDynamicValue(payerDoc)}
                            , o valor de R$ {renderDynamicValue(amount)} ({renderDynamicValue(amountExtenso)}), referente a:
                        </p>

                        <p className="font-bold mt-4">Serviço prestado / Produto vendido:</p>
                        {/* Lista de itens */}
                        {renderItemList()}

                        <p className="font-bold mt-4">O pagamento foi realizado em {day}/{month}/{year} por meio de:</p>
                        {renderPaymentCheckboxes('mei')}

                        <p className="mt-6">
                            Declaro que este recibo comprova o pagamento integral referente ao item descrito.
                        </p>

                        {renderSignatureArea()}
                    </div>
                );
            case 'detailed':
                return (
                    <div className="space-y-6 text-slate-800 dark:text-slate-800">
                        <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                            <h2 className="text-2xl font-black uppercase tracking-widest">COMPROVANTE DE PAGAMENTO</h2>
                        </div>
                        
                        <p>
                            Recebi de {renderDynamicValue(payerName)}
                            , inscrito no CPF/CNPJ nº {renderDynamicValue(payerDoc)}
                            , o valor de R$ {renderDynamicValue(amount)} ({renderDynamicValue(amountExtenso)}), referente ao pagamento de:
                        </p>

                        {/* Tabela de Itens para o modelo detalhado */}
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-100 border-y border-slate-300">
                                    <th className="py-2 px-2 text-left text-xs font-bold uppercase text-slate-500">Descrição</th>
                                    <th className="py-2 px-2 text-center text-xs font-bold uppercase text-slate-500 w-16">Qtd</th>
                                    <th className="py-2 px-2 text-right text-xs font-bold uppercase text-slate-500 w-32">Preço Unit.</th>
                                    <th className="py-2 px-2 text-right text-xs font-bold uppercase text-slate-500 w-32">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {items.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-100">
                                        <td className="py-1 px-2 font-medium text-slate-800 dark:text-slate-800">{item.desc || 'Item sem descrição'}</td>
                                        <td className="py-1 px-2 text-center text-slate-600 dark:text-slate-600">{item.qty}</td>
                                        <td className="py-1 px-2 text-right text-slate-600 dark:text-slate-600">R$ {item.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                        <td className="py-1 px-2 text-right font-bold text-slate-800 dark:text-slate-800">R$ {(item.qty * item.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        <div className="flex justify-end mt-2">
                            <div className="w-48 flex justify-between border-t border-slate-400 pt-1">
                                <span className="font-bold">TOTAL:</span>
                                <span className="font-bold">R$ {formattedAmount}</span>
                            </div>
                        </div>

                        <p className="font-bold mt-4">Forma de pagamento:</p>
                        {renderPaymentCheckboxes('detailed')}

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div>
                                <span className="font-bold">Data do pagamento:</span> {renderDynamicValue(formattedDate)}
                            </div>
                            <div>
                                <span className="font-bold">Valor total recebido:</span> {renderDynamicValue(`R$ ${amount}`)}
                            </div>
                        </div>

                        <p className="mt-6">
                            Declaro para os devidos fins que o valor foi quitado integralmente.
                        </p>

                        {renderSignatureArea()}
                    </div>
                );
            default:
                return <p className="text-center text-slate-500">Selecione um modelo de recibo.</p>;
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <button onClick={onBack} className="mb-4 flex items-center text-slate-500 hover:text-primary transition-colors font-medium print:hidden">
                <span className="material-icons text-sm mr-1">arrow_back</span> Voltar para ferramentas
            </button>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit print:hidden">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-icons text-emerald-500">edit_note</span> Preencher Recibo
                    </h3>
                    
                    {/* Template Selector */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Modelo de Recibo</label>
                        <div className="flex gap-2">
                            {['classic', 'mei', 'detailed'].map(t => (
                                <button 
                                    key={t}
                                    type="button"
                                    onClick={() => setFormData({...formData, template: t as any})}
                                    className={`flex-1 py-2 text-xs font-bold uppercase rounded border transition-colors ${formData.template === t ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                                >
                                    {t === 'classic' ? 'Simples' : t === 'mei' ? 'MEI' : 'Detalhado'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Total (Calculado)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                <input 
                                    type="text" 
                                    value={formattedAmount} 
                                    readOnly
                                    className="w-full pl-10 pr-4 py-3 text-lg font-bold border rounded-lg bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" 
                                />
                            </div>
                        </div>
                        
                        {/* Item List Editor */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Itens / Serviços</label>
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div key={item.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                        <input type="text" value={item.desc} onChange={e => updateItem(item.id, 'desc', e.target.value)} className="flex-1 w-full sm:w-auto px-2 py-1 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Descrição" />
                                        
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <input type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', parseFloat(e.target.value))} className="w-1/2 sm:w-16 px-2 py-1 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Qtd" />
                                            <input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value))} className="w-1/2 sm:w-20 px-2 py-1 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="R$" />
                                        </div>
                                        
                                        <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 flex-shrink-0 p-1 sm:p-0"><span className="material-icons text-sm">close</span></button>
                                    </div>
                                ))}
                                <button onClick={addItem} className="w-full py-2 border border-dashed border-slate-300 rounded text-slate-500 hover:bg-slate-50 text-sm flex items-center justify-center gap-1">
                                    <span className="material-icons text-sm">add</span> Adicionar Item
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Pagador (Cliente)</label>
                            <input type="text" value={formData.payerName} onChange={e => setFormData({...formData, payerName: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Nome do Cliente" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Local</label>
                                <input type="text" value={formData.local} onChange={e => setFormData({...formData, local: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Ex: São Paulo, SP" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF/CNPJ (Cliente)</label>
                                <input type="text" value={formData.payerDoc} onChange={e => setFormData({...formData, payerDoc: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Opcional" />
                            </div>
                            {/* Payment Method (Only for MEI/Detailed) */}
                            {(formData.template === 'mei' || formData.template === 'detailed') && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Forma de Pagamento</label>
                                    <select 
                                        value={formData.paymentMethod}
                                        onChange={e => setFormData({...formData, paymentMethod: e.target.value, otherPaymentMethod: e.target.value === 'outro' ? formData.otherPaymentMethod : ''})}
                                        className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    >
                                        {paymentOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        <option value="outro">Outro</option>
                                    </select>
                                    {formData.paymentMethod === 'outro' && (
                                        <input 
                                            type="text" 
                                            value={formData.otherPaymentMethod} 
                                            onChange={e => setFormData({...formData, otherPaymentMethod: e.target.value})} 
                                            className="w-full px-3 py-2 border rounded-lg mt-2 bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" 
                                            placeholder="Especifique a forma de pagamento"
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Emitente (Você)</label>
                            <input type="text" value={formData.issuerName} onChange={e => setFormData({...formData, issuerName: e.target.value})} className="w-full px-3 py-2 border rounded-lg mb-2 bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Seu Nome ou Razão Social" />
                            
                            {formData.template === 'classic' ? (
                                <input type="text" value={formData.issuerCpf} onChange={e => setFormData({...formData, issuerCpf: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Seu CPF" />
                            ) : (
                                <input type="text" value={formData.issuerDoc} onChange={e => setFormData({...formData, issuerDoc: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Seu CNPJ" />
                            )}
                        </div>
                        
                        {/* Assinatura */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assinatura (Nome Completo)</label>
                            <input 
                                type="text" 
                                value={formData.signatureText} 
                                onChange={e => setFormData({...formData, signatureText: e.target.value})} 
                                className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" 
                                placeholder="Seu nome para assinatura"
                            />
                            
                            <div className="mt-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estilo</label>
                                <div className="flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, signatureStyle: 'standard'})}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors border ${formData.signatureStyle === 'standard' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}
                                    >
                                        Padrão
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, signatureStyle: 'cursive'})}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors border font-cursive ${formData.signatureStyle === 'cursive' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}
                                    >
                                        Manuscrito
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="flex flex-col gap-4">
                    <div 
                        ref={receiptRef} 
                        id="receipt-preview" 
                        // Mantendo a classe grayscale no JSX para a pré-visualização
                        className={`bg-[#fffbeb] text-slate-800 p-8 rounded-sm shadow-lg border-2 border-dashed border-slate-300 relative font-mono text-sm leading-relaxed grayscale`}
                    >
                        {/* Paper Texture Effect */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        
                        {renderReceiptContent()}
                        
                        <div className="absolute bottom-4 left-0 w-full text-center text-[10px] text-slate-400">
                            Gerado via Regular MEI
                        </div>
                    </div>

                    <button 
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-colors print:hidden"
                    >
                        {isExporting ? <span className="material-icons animate-spin text-sm">refresh</span> : <span className="material-icons">file_download</span>}
                        Exportar PDF (P&B)
                    </button>
                    <p className="text-center text-xs text-slate-400 print:hidden">Gera um arquivo PDF de alta qualidade do seu recibo.</p>
                </div>
            </div>
        </div>
    );
};

const BudgetGenerator = ({ onBack, user }: { onBack: () => void, user?: User | null }) => {
// ... (Restante do BudgetGenerator permanece inalterado)
    const [budget, setBudget] = useState({
        // Removendo a inicialização do número do orçamento
        number: '', 
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        issuerName: user?.name || 'Minha Empresa MEI',
        issuerCnpj: user?.cnpj || '00.000.000/0001-00',
        issuerEmail: user?.email || 'contato@minhaempresa.com',
        issuerPhone: user?.phone || '(11) 99999-9999',
        clientName: '',
        clientCnpj: '',
        clientEmail: '',
        notes: 'Orçamento sujeito a alteração sem aviso prévio. Pagamento 50% na aprovação.',
        template: 'classic' as 'classic' | 'modern' | 'minimal',
        color: 'blue' as 'blue' | 'emerald' | 'slate' | 'orange',
    });

    const [items, setItems] = useState<{id: number, desc: string, qty: number, price: number}[]>([
        { id: 1, desc: 'Serviço Exemplo', qty: 1, price: 100.00 }
    ]);
    
    const [isExporting, setIsExporting] = useState(false); 
    const budgetRef = useRef<HTMLDivElement>(null); 

    const colors: Record<string, string> = {
        blue: 'text-blue-600 border-blue-600 bg-blue-600',
        emerald: 'text-emerald-600 border-emerald-600 bg-emerald-600',
        slate: 'text-slate-800 border-slate-800 bg-slate-800',
        orange: 'text-orange-600 border-orange-600 bg-orange-600',
    };

    const bgColors: Record<string, string> = {
        blue: 'bg-blue-50',
        emerald: 'bg-emerald-50',
        slate: 'bg-slate-100',
        orange: 'bg-orange-50',
    };

    const addItem = () => {
        setItems([...items, { id: Date.now(), desc: '', qty: 1, price: 0 }]);
    };

    const updateItem = (id: number, field: string, value: string | number) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeItem = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };

    const total = items.reduce((acc, item) => acc + (item.qty * item.price), 0);

    const handleExportPDF = () => {
        if (!budgetRef.current) {
            showError("Erro: Elemento do orçamento não encontrado.");
            return;
        }
        
        setIsExporting(true);
        showSuccess("Gerando PDF, aguarde...");

        const element = budgetRef.current;
        const filename = `orcamento_${budget.clientName.replace(/\s/g, '_')}_${budget.date}.pdf`;

        // Configurações para A4 (210mm x 297mm)
        const opt = {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                logging: false, 
                useCORS: true,
                // Adicionando largura explícita para tentar corrigir o corte
                width: element.offsetWidth, 
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
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

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        background: white;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #budget-preview, #budget-preview * {
                        visibility: visible;
                    }
                    #budget-preview {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 210mm !important;
                        min-height: 297mm !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: white !important;
                        padding: 15mm !important;
                    }
                    /* Remove border radius and shadows for print */
                    * {
                        box-shadow: none !important;
                    }
                }
            `}</style>

            <button onClick={onBack} className="mb-4 flex items-center text-slate-500 hover:text-primary transition-colors font-medium print:hidden">
                <span className="material-icons text-sm mr-1">arrow_back</span> Voltar para ferramentas
            </button>

            {/* CORREÇÃO: Usando grid-cols-1 no mobile e lg:grid-cols-12 no desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Editor (Left Column) - Ocupa 12 colunas no mobile, 4 no desktop */}
                <div className="lg:col-span-4 space-y-6 print:hidden">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-icons text-blue-500">settings</span> Configurações
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Modelo</label>
                                <div className="flex gap-2">
                                    {['classic', 'modern', 'minimal'].map(t => (
                                        <button 
                                            key={t}
                                            onClick={() => setBudget({...budget, template: t as any})}
                                            className={`flex-1 py-2 text-xs font-bold uppercase rounded border transition-colors ${budget.template === t ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-700' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                                        >
                                            {t === 'classic' ? 'Padrão' : t === 'modern' ? 'Moderno' : 'Minim.'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cor Principal</label>
                                <div className="flex gap-2">
                                    {Object.keys(colors).map(c => (
                                        <button 
                                            key={c}
                                            onClick={() => setBudget({...budget, color: c as any})}
                                            className={`w-8 h-8 rounded-full ${colors[c].split(' ')[2]} ${budget.color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-icons text-blue-500">store</span> Emitente
                        </h3>
                        <div className="space-y-3">
                            <input type="text" value={budget.issuerName} onChange={e => setBudget({...budget, issuerName: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Nome da Empresa" />
                            <input type="text" value={budget.issuerCnpj} onChange={e => setBudget({...budget, issuerCnpj: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="CNPJ" />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" value={budget.issuerEmail} onChange={e => setBudget({...budget, issuerEmail: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Email" />
                                <input type="text" value={budget.issuerPhone} onChange={e => setBudget({...budget, issuerPhone: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Telefone" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-icons text-blue-500">person</span> Cliente
                        </h3>
                        <div className="space-y-3">
                            <input type="text" value={budget.clientName} onChange={e => setBudget({...budget, clientName: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Nome do Cliente" />
                            <input type="text" value={budget.clientCnpj} onChange={e => setBudget({...budget, clientCnpj: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="CPF ou CNPJ" />
                            <input type="text" value={budget.clientEmail} onChange={e => setBudget({...budget, clientEmail: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Email / Contato" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-icons text-blue-500">list</span> Itens
                        </h3>
                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={item.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                    {/* Descrição (Ocupa a largura total no mobile) */}
                                    <input type="text" value={item.desc} onChange={e => updateItem(item.id, 'desc', e.target.value)} className="flex-1 w-full sm:w-auto px-2 py-1 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Descrição" />
                                    
                                    {/* Qtd e Preço (Ocupam 50% cada no mobile, e largura fixa no desktop) */}
                                    <div className="flex gap-2 w-full sm:w-auto sm:flex-shrink-0">
                                        <input type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', parseFloat(e.target.value))} className="w-1/2 sm:w-16 px-2 py-1 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Qtd" />
                                        <input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value))} className="w-1/2 sm:w-20 px-2 py-1 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="R$" />
                                    </div>
                                    
                                    {/* Botão de Remover */}
                                    <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 flex-shrink-0 p-1 sm:p-0 absolute right-0 top-0 sm:static">
                                        <span className="material-icons text-sm">close</span>
                                    </button>
                                </div>
                            ))}
                            <button onClick={addItem} className="w-full py-2 border border-dashed border-slate-300 rounded text-slate-500 hover:bg-slate-50 text-sm flex items-center justify-center gap-1">
                                <span className="material-icons text-sm">add</span> Adicionar Item
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-icons text-blue-500">notes</span> Detalhes Finais
                        </h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Data</label>
                                    <input type="date" value={budget.date} onChange={e => setBudget({...budget, date: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Validade</label>
                                    <input type="date" value={budget.validUntil} onChange={e => setBudget({...budget, validUntil: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50" />
                                </div>
                            </div>
                            <textarea rows={3} value={budget.notes} onChange={e => setBudget({...budget, notes: e.target.value})} className="w-full px-3 py-2 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Observações e Termos" />
                        </div>
                    </div>

                    <button 
                        onClick={handleExportPDF} 
                        disabled={isExporting}
                        className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        {isExporting ? <span className="material-icons animate-spin text-sm">refresh</span> : <span className="material-icons">file_download</span>}
                        Exportar PDF
                    </button>
                </div>

                {/* Preview (Right Column) - Ocupa 12 colunas no mobile, 8 no desktop */}
                <div className="lg:col-span-8 flex justify-center">
                    <div 
                        ref={budgetRef} 
                        id="budget-preview"
                        // CORREÇÃO: Removendo dimensões fixas no mobile e ajustando padding
                        className={`bg-white text-slate-900 shadow-2xl mx-auto relative w-full lg:max-w-[210mm] lg:min-h-[297mm] p-4 md:p-8 lg:p-[15mm] ${budget.template === 'modern' ? 'border-t-8 ' + colors[budget.color].split(' ')[1] : ''}`} 
                    >
                        
                        {/* HEADER */}
                        <div className={`flex justify-between items-start mb-6 lg:mb-12 ${budget.template === 'modern' ? 'border-b-2 pb-4 lg:pb-6 ' + colors[budget.color].split(' ')[1].replace('text-', 'border-') : ''} ${budget.template === 'classic' ? 'border-b border-slate-200 pb-4 lg:pb-6' : ''} ${budget.template === 'minimal' ? 'border-b border-slate-200 pb-4 lg:pb-6' : ''}`}>
                            <div>
                                <h1 className={`text-2xl md:text-4xl font-bold uppercase tracking-tight mb-1 lg:mb-2 ${budget.template === 'minimal' ? 'text-slate-900' : colors[budget.color].split(' ')[0]}`}>Orçamento</h1>
                                {/* Removendo o número do orçamento */}
                                {/* <p className="text-slate-500 font-mono text-sm">#{budget.number}</p> */}
                            </div>
                            <div className="text-right text-xs md:text-sm">
                                <h2 className="font-bold text-base md:text-xl text-slate-900 dark:text-slate-900">{budget.issuerName || 'Sua Empresa'}</h2>
                                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-500">{budget.issuerCnpj}</p>
                                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-500">{budget.issuerEmail}</p>
                                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-500">{budget.issuerPhone}</p>
                            </div>
                        </div>

                        {/* INFO GRID */}
                        <div className="grid grid-cols-2 gap-4 lg:gap-8 mb-6 lg:mb-12 text-xs md:text-sm">
                            <div>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase mb-1">Cliente</p>
                                <p className="font-bold text-sm md:text-lg text-slate-900 dark:text-slate-900">{budget.clientName || 'Nome do Cliente'}</p>
                                {budget.clientCnpj && <p className="text-xs md:text-sm text-slate-600 dark:text-slate-600">{budget.clientCnpj}</p>}
                                {budget.clientEmail && <p className="text-xs md:text-sm text-slate-600 dark:text-slate-600">{budget.clientEmail}</p>}
                            </div>
                            <div className="text-right">
                                <div className="mb-1 lg:mb-2">
                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase mr-2">Data de Emissão:</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-900">{new Date(budget.date).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase mr-2">Válido Até:</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-900">{new Date(budget.validUntil).toLocaleDateString('pt-BR')}</span>
                                </div>
                            </div>
                        </div>

                        {/* TABLE */}
                        <table className="w-full mb-6 lg:mb-12">
                            <thead>
                                <tr className={`${budget.template === 'classic' ? 'bg-slate-100 border-y border-slate-200' : ''} ${budget.template === 'modern' ? bgColors[budget.color] : ''} ${budget.template === 'minimal' ? 'border-b border-slate-900' : ''}`}>
                                    <th className="py-2 px-2 lg:py-3 lg:px-4 text-left text-[10px] lg:text-xs font-bold uppercase text-slate-500">Descrição</th>
                                    <th className="py-2 px-2 lg:py-3 lg:px-4 text-center text-[10px] lg:text-xs font-bold uppercase text-slate-500 w-16 lg:w-24">Qtd</th>
                                    <th className="py-2 px-2 lg:py-3 lg:px-4 text-right text-[10px] lg:text-xs font-bold uppercase text-slate-500 w-20 lg:w-32">Preço Unit.</th>
                                    <th className="py-2 px-2 lg:py-3 lg:px-4 text-right text-[10px] lg:text-xs font-bold uppercase text-slate-500 w-20 lg:w-32">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs md:text-sm">
                                {items.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-100">
                                        <td className="py-2 px-2 lg:py-3 lg:px-4 font-medium text-slate-900 dark:text-slate-900">{item.desc || 'Item sem descrição'}</td>
                                        <td className="py-2 px-2 lg:py-3 lg:px-4 text-center text-slate-600 dark:text-slate-600">{item.qty}</td>
                                        <td className="py-2 px-2 lg:py-3 lg:px-4 text-right text-slate-600 dark:text-slate-600">R$ {item.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                        <td className="py-2 px-2 lg:py-3 lg:px-4 text-right font-bold text-slate-900 dark:text-slate-900">R$ {(item.qty * item.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* TOTALS */}
                        <div className="flex justify-end mb-6 lg:mb-12">
                            <div className="w-full max-w-xs space-y-2">
                                <div className={`flex justify-between items-center py-2 lg:py-3 border-t-2 ${colors[budget.color].split(' ')[1].replace('text-', 'border-')}`}>
                                    <span className="font-bold text-base lg:text-lg uppercase text-slate-900 dark:text-slate-900">Total</span>
                                    <span className={`font-bold text-xl lg:text-2xl ${colors[budget.color].split(' ')[0]}`}>
                                        R$ {total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER / NOTES */}
                        {budget.notes && (
                            <div className="bg-slate-50 p-4 lg:p-6 rounded-lg border border-slate-100 text-xs md:text-sm text-slate-600 leading-relaxed print:bg-transparent print:border-slate-200">
                                <p className="font-bold text-[10px] uppercase text-slate-400 dark:text-slate-400 mb-1 lg:mb-2">Observações & Termos</p>
                                <p className="text-slate-600 dark:text-slate-600">{budget.notes}</p>
                            </div>
                        )}

                        <div className="absolute bottom-4 left-0 w-full text-center text-[8px] text-slate-300">
                            Gerado via Regular MEI
                        </div>
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