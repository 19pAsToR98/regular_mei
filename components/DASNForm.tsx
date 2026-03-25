import React, { useState } from 'react';
import { showWarning } from '../utils/toastUtils';

interface DASNFormProps {
  onBack: () => void;
  initialCnpj?: string;
}

const DASNForm: React.FC<DASNFormProps> = ({ onBack, initialCnpj = '' }) => {
  const [cnpj, setCnpj] = useState(initialCnpj);
  const [step, setStep] = useState(1);
  const [isValidating, setIsValidating] = useState(false);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cleanCnpj.length !== 14) {
      showWarning("Por favor, insira um CNPJ válido com 14 dígitos.");
      return;
    }

    setIsValidating(true);
    // Simula uma validação/busca rápida
    await new Promise(r => setTimeout(r, 1000));
    setIsValidating(false);
    setStep(2);
  };

  const steps = [
    { id: 1, label: 'Introdução', icon: 'info' },
    { id: 2, label: 'Identificação', icon: 'business' },
    { id: 3, label: 'Faturamento', icon: 'payments' },
  ];

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500 pb-12">
      {/* Botão Voltar */}
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-slate-400 hover:text-primary transition-colors font-semibold text-sm group"
      >
        <span className="material-icons text-sm mr-1 group-hover:-translate-x-1 transition-transform">arrow_back</span> 
        Voltar para o início
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-blue-500/5 border border-slate-100 dark:border-slate-800 overflow-hidden">
        
        {/* Stepper Header */}
        <div className="bg-slate-50/50 dark:bg-slate-800/50 px-8 py-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center relative">
                {/* Line Background */}
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
            {/* STEP 1: INTRODUÇÃO */}
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

            {/* STEP 2: CNPJ */}
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
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                Voltar
                            </button>
                            <button 
                                type="submit"
                                disabled={isValidating}
                                className="flex-[2] bg-primary hover:bg-blue-600 disabled:bg-slate-300 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                            >
                                {isValidating ? (
                                    <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <>Próximo Passo <span className="material-icons">arrow_forward</span></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* STEP 3: EM BREVE */}
            {step === 3 && (
                <div className="text-center py-6 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
                        <span className="material-icons text-5xl">verified</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">CNPJ Identificado!</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-sm mx-auto">
                        Estamos integrando o sistema de faturamento para que você possa preencher os valores automaticamente.
                    </p>
                    
                    <div className="p-6 rounded-3xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-left mb-10">
                        <p className="text-blue-800 dark:text-blue-300 font-bold text-sm mb-2 flex items-center gap-2">
                            <span className="material-icons text-sm">lightbulb</span> Dica Regular MEI
                        </p>
                        <p className="text-blue-700 dark:text-blue-400 text-xs leading-relaxed">
                            Mantenha seu fluxo de caixa atualizado no dashboard para que sua declaração seja gerada com apenas um clique no futuro.
                        </p>
                    </div>

                    <button 
                        onClick={() => setStep(1)}
                        className="text-primary font-bold hover:underline flex items-center justify-center gap-1 mx-auto transition-all hover:gap-2"
                    >
                        <span className="material-icons text-sm">restart_alt</span> Reiniciar processo
                    </button>
                </div>
            )}
        </div>

        {/* Footer Info */}
        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Ambiente Seguro & Criptografado</p>
        </div>
      </div>
    </div>
  );
};

export default DASNForm;