import React, { useState, useRef, useMemo } from 'react';
import { User } from '../types';

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
    const [isPrinting, setIsPrinting] = useState(false);
    
    // Removendo printSize e usando apenas o tamanho padrão da placa para visualização/impressão

    const handleGenerate = () => {
        if (!formData.key || !formData.name) return;
        const p = generatePixPayload(formData.key, formData.name, formData.city, formData.amount);
        setPayload(p);
    };

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 500);
    };

    // Auto-generate on field change if valid
    useMemo(() => {
        if (formData.key.length > 3 && formData.name.length > 2) {
            const p = generatePixPayload(formData.key, formData.name, formData.city, formData.amount);
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
            {/* Dynamic Style for Print Control */}
            <style>{`
                @media print {
                    /* Define page size to auto/A4 and remove margins */
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    
                    /* Hide everything except the print container */
                    body * {
                        visibility: hidden;
                    }
                    #pix-plate-container, #pix-plate-container * {
                        visibility: visible;
                    }
                    
                    /* Force the container to fill the page/area and center the plate */
                    #pix-plate-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        /* Ensure the plate itself is not scaled/transformed */
                        transform: none !important;
                        scale: 1 !important;
                    }
                    
                    /* Force background colors on print */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    /* Ensure the plate itself is printed at its defined size */
                    #pix-plate {
                        width: ${PLATE_WIDTH}px !important;
                        height: ${PLATE_HEIGHT}px !important;
                        box-shadow: none !important;
                        /* Preserve border-radius */
                    }
                }
            `}</style>

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
                                    placeholder="0,00"
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

                {/* Preview / Print Area */}
                <div className="flex flex-col gap-6 items-center">
                    
                    {/* VISUAL PREVIEW CONTAINER */}
                    <div className="w-full bg-slate-100 dark:bg-black/20 p-8 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-center items-center min-h-[600px] overflow-hidden relative">
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
                            <div id="pix-plate" className={`w-[320px] h-[480px] ${formData.color} rounded-3xl relative flex flex-col items-center p-8 text-white overflow-hidden shadow-sm`}>
                                {/* Decorative background circles */}
                                <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
                                <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-white opacity-5 rounded-full blur-xl"></div>
                                
                                {/* Header */}
                                <div className="relative z-10 flex flex-col items-center mb-6">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo%E2%80%94pix_powered_by_Banco_Central_%28Brazil%2C_2020%29.svg" alt="Pix" className="h-12 mb-2 brightness-0 invert" />
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
                                    {/* Adjusted to text-lg and line-clamp-2 for better fit */}
                                    <p className="font-bold text-lg leading-tight px-2 mb-2 line-clamp-2">
                                        {formData.name || 'Nome do Recebedor'}
                                    </p>
                                    
                                    <div className="bg-black/20 rounded-lg py-2 px-4 inline-block max-w-full">
                                        <p className="text-white font-mono text-sm truncate">{formData.key || 'CHAVE PIX'}</p>
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
                            onClick={handlePrint}
                            disabled={!payload || isPrinting}
                            className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-colors"
                        >
                            {isPrinting ? <span className="material-icons animate-spin text-sm">refresh</span> : <span className="material-icons">print</span>}
                            Imprimir Agora
                        </button>
                        <p className="text-center text-xs text-slate-400">Certifique-se de ativar "Gráficos de plano de fundo" na janela de impressão.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ReceiptGenerator = ({ onBack, user }: { onBack: () => void, user?: User | null }) => {
    const [formData, setFormData] = useState({
        payerName: '',
        payerDoc: '',
        amount: '',
        service: '',
        date: new Date().toISOString().split('T')[0],
        issuerName: user?.name || 'Minha Empresa MEI',
        issuerDoc: user?.cnpj || '00.000.000/0001-00'
    });
    
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 500);
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
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
                            <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="0,00" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Pagador (Cliente)</label>
                            <input type="text" value={formData.payerName} onChange={e => setFormData({...formData, payerName: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Nome do Cliente" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Referente a (Serviço)</label>
                            <textarea rows={2} value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Ex: Manutenção de Ar Condicionado" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF/CNPJ (Cliente)</label>
                                <input type="text" value={formData.payerDoc} onChange={e => setFormData({...formData, payerDoc: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Opcional" />
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Emitente (Você)</label>
                            <input type="text" value={formData.issuerName} onChange={e => setFormData({...formData, issuerName: e.target.value})} className="w-full px-3 py-2 border rounded-lg mb-2 bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Seu Nome ou Razão Social" />
                            <input type="text" value={formData.issuerDoc} onChange={e => setFormData({...formData, issuerDoc: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Seu CPF ou CNPJ" />
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="flex flex-col gap-4 print:w-full print:absolute print:top-0 print:left-0">
                    <div id="receipt-preview" className="bg-[#fffbeb] text-slate-800 p-8 rounded-sm shadow-lg border-2 border-dashed border-slate-300 relative font-mono text-sm leading-relaxed transform rotate-1 transition-transform hover:rotate-0 print:transform-none print:shadow-none print:border-none print:w-full">
                        {/* Paper Texture Effect */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        
                        <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                            <h2 className="text-2xl font-black uppercase tracking-widest">RECIBO</h2>
                            <p className="text-lg font-bold mt-2">R$ {parseFloat(formData.amount || '0').toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                        </div>

                        <div className="space-y-4">
                            <p>
                                Recebi(emos) de <span className="font-bold border-b border-slate-400 px-1">{formData.payerName || '__________________'}</span>
                                {formData.payerDoc && <span> (CPF/CNPJ: {formData.payerDoc})</span>}
                            </p>
                            <p>
                                A importância de <span className="font-bold bg-slate-200 px-1">R$ {parseFloat(formData.amount || '0').toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                            </p>
                            <p>
                                Referente aos serviços de: <br/>
                                <span className="font-bold border-b border-slate-400 block w-full mt-1 min-h-[1.5em]">{formData.service}</span>
                            </p>
                        </div>

                        <div className="mt-8 flex justify-between items-end">
                            <div>
                                <p>{new Date(formData.date).toLocaleDateString('pt-BR', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                            </div>
                            <div className="text-center">
                                <div className="mb-2 font-cursive text-xl text-blue-900 transform -rotate-3">{formData.issuerName}</div>
                                <div className="border-t border-slate-800 w-48 pt-1 text-xs uppercase">Assinatura do Emitente</div>
                                <div className="text-[10px]">{formData.issuerName}</div>
                                <div className="text-[10px]">{formData.issuerDoc}</div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-bold shadow-md flex items-center justify-center gap-2 transition-colors print:hidden"
                    >
                        {isPrinting ? <span className="material-icons animate-spin text-sm">refresh</span> : <span className="material-icons">print</span>}
                        Imprimir / Salvar PDF
                    </button>
                    <p className="text-center text-xs text-slate-400 print:hidden">Dica: Na janela de impressão, escolha "Salvar como PDF" para enviar pelo WhatsApp.</p>
                </div>
            </div>
        </div>
    );
};

const BudgetGenerator = ({ onBack, user }: { onBack: () => void, user?: User | null }) => {
    const [budget, setBudget] = useState({
        number: String(Math.floor(Math.random() * 10000)),
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
    
    const [isPrinting, setIsPrinting] = useState(false);

    // ... (rest of colors, bgColors, addItem, updateItem, removeItem, total logic) ...
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

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 500);
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

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* Editor (Left Column) */}
                <div className="xl:col-span-4 space-y-6 print:hidden">
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
                                            className={`flex-1 py-2 text-xs font-bold uppercase rounded border ${budget.template === t ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}
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
                                <div key={item.id} className="flex gap-2 items-start">
                                    <input type="text" value={item.desc} onChange={e => updateItem(item.id, 'desc', e.target.value)} className="flex-1 px-2 py-1 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Descrição" />
                                    <input type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', parseFloat(e.target.value))} className="w-16 px-2 py-1 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Qtd" />
                                    <input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value))} className="w-20 px-2 py-1 border rounded text-sm bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="R$" />
                                    <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700"><span className="material-icons text-sm">close</span></button>
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
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        {isPrinting ? <span className="material-icons animate-spin">refresh</span> : <span className="material-icons">print</span>}
                        Imprimir Orçamento
                    </button>
                </div>

                {/* Preview (Right Column) */}
                <div className="xl:col-span-8 flex justify-center">
                    <div 
                        id="budget-preview"
                        className={`bg-white text-slate-900 shadow-2xl mx-auto relative ${budget.template === 'modern' ? 'border-t-8 ' + colors[budget.color].split(' ')[1] : ''}`} 
                        style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}
                    >
                        
                        {/* HEADER */}
                        <div className={`flex justify-between items-start mb-12 ${budget.template === 'modern' ? 'border-b-2 pb-6 ' + colors[budget.color].split(' ')[1].replace('text-', 'border-') : ''} ${budget.template === 'classic' ? 'border-b border-slate-200 pb-6' : ''}`}>
                            <div>
                                <h1 className={`text-4xl font-bold uppercase tracking-tight mb-2 ${budget.template === 'minimal' ? 'text-slate-900' : colors[budget.color].split(' ')[0]}`}>Orçamento</h1>
                                <p className="text-slate-500 font-mono text-sm">#{budget.number}</p>
                            </div>
                            <div className="text-right">
                                <h2 className="font-bold text-xl">{budget.issuerName || 'Sua Empresa'}</h2>
                                <p className="text-sm text-slate-500">{budget.issuerCnpj}</p>
                                <p className="text-sm text-slate-500">{budget.issuerEmail}</p>
                                <p className="text-sm text-slate-500">{budget.issuerPhone}</p>
                            </div>
                        </div>

                        {/* INFO GRID */}
                        <div className="grid grid-cols-2 gap-8 mb-12">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Cliente</p>
                                <p className="font-bold text-lg">{budget.clientName || 'Nome do Cliente'}</p>
                                {budget.clientCnpj && <p className="text-sm text-slate-600">{budget.clientCnpj}</p>}
                                {budget.clientEmail && <p className="text-sm text-slate-600">{budget.clientEmail}</p>}
                            </div>
                            <div className="text-right">
                                <div className="mb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase mr-2">Data de Emissão:</span>
                                    <span className="font-medium">{new Date(budget.date).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase mr-2">Válido Até:</span>
                                    <span className="font-medium">{new Date(budget.validUntil).toLocaleDateString('pt-BR')}</span>
                                </div>
                            </div>
                        </div>

                        {/* TABLE */}
                        <table className="w-full mb-12">
                            <thead>
                                <tr className={`${budget.template === 'classic' ? 'bg-slate-100 border-y border-slate-200' : ''} ${budget.template === 'modern' ? bgColors[budget.color] : ''} ${budget.template === 'minimal' ? 'border-b border-slate-900' : ''}`}>
                                    <th className="py-3 px-4 text-left text-xs font-bold uppercase text-slate-500">Descrição</th>
                                    <th className="py-3 px-4 text-center text-xs font-bold uppercase text-slate-500 w-24">Qtd</th>
                                    <th className="py-3 px-4 text-right text-xs font-bold uppercase text-slate-500 w-32">Preço Unit.</th>
                                    <th className="py-3 px-4 text-right text-xs font-bold uppercase text-slate-500 w-32">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {items.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-100">
                                        <td className="py-3 px-4 font-medium">{item.desc || 'Item sem descrição'}</td>
                                        <td className="py-3 px-4 text-center text-slate-600">{item.qty}</td>
                                        <td className="py-3 px-4 text-right text-slate-600">R$ {item.price.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                        <td className="py-3 px-4 text-right font-bold">R$ {(item.qty * item.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* TOTALS */}
                        <div className="flex justify-end mb-12">
                            <div className="w-64 space-y-2">
                                <div className={`flex justify-between items-center py-3 border-t-2 ${colors[budget.color].split(' ')[1].replace('text-', 'border-')}`}>
                                    <span className="font-bold text-lg uppercase">Total</span>
                                    <span className={`font-bold text-2xl ${colors[budget.color].split(' ')[0]}`}>
                                        R$ {total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER / NOTES */}
                        {budget.notes && (
                            <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 text-sm text-slate-600 leading-relaxed print:bg-transparent print:border-slate-200">
                                <p className="font-bold text-xs uppercase text-slate-400 mb-2">Observações & Termos</p>
                                {budget.notes}
                            </div>
                        )}

                        <div className="absolute bottom-12 left-0 w-full text-center text-xs text-slate-300">
                            Gerado via Regular MEI
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FeeCalculator = ({ onBack }: { onBack: () => void }) => {
    // ... (No changes needed here for now) ...
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
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Calculadora de Taxas</h3>
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
         <div className="text-center py-12">
            <span className="material-icons text-4xl text-slate-300 mb-2">search_off</span>
            <p className="text-slate-500">Nenhuma ferramenta encontrada para "{searchTerm}"</p>
         </div>
      )}
    </div>
  );
};

export default ToolsPage;