import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { showSuccess, showError } from '../utils/toastUtils';

interface DasnServicePageProps {
  user?: User | null;
  onBack: () => void;
}

const DasnServicePage: React.FC<DasnServicePageProps> = ({ user, onBack }) => {
  const [cnpj, setCnpj] = useState(user?.cnpj || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'intro' | 'form' | 'success'>('intro');

  // Formata o CNPJ enquanto o usuário digita
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 14) {
      setCnpj(value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCnpj = cnpj.replace(/\D/g, '');
    
    if (cleanCnpj.length !== 14) {
      showError("Por favor, insira um CNPJ válido.");
      return;
    }

    setIsSubmitting(true);
    
    // Simulação de processamento/envio para o backend
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStep('success');
      showSuccess("Solicitação de declaração enviada com sucesso!");
    } catch (error) {
      showError("Ocorreu um erro ao processar sua solicitação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header com Botão Voltar */}
      <button 
        onClick={onBack}
        className="mb-8 flex items-center text-slate-500 hover:text-primary transition-colors font-medium group"
      >
        <span className="material-icons text-sm mr-1 group-hover:-translate-x-1 transition-transform">arrow_back</span> 
        Voltar
      </button>

      {step === 'intro' && (
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <span className="material-icons text-sm">assignment</span> Serviço Obrigatório
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white mb-4">
              Declaração Anual do MEI (DASN-SIMEI)
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
              A DASN-SIMEI é a declaração onde o MEI informa o faturamento bruto do ano anterior. É obrigatória mesmo que a empresa não tenha tido faturamento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                <span className="material-icons">event_busy</span>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-2">Prazo Final</h4>
              <p className="text-sm text-slate-500">Deve ser entregue até o dia 31 de maio de cada ano.</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4">
                <span className="material-icons">gavel</span>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-2">Evite Multas</h4>
              <p className="text-sm text-slate-500">A não entrega gera multa e pode bloquear o seu CNPJ.</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
                <span className="material-icons">verified</span>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-2">Regularidade</h4>
              <p className="text-sm text-slate-500">Mantenha seus benefícios previdenciários ativos.</p>
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={() => setStep('form')}
              className="w-full md:w-auto bg-primary hover:bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
            >
              Iniciar Declaração <span className="material-icons">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {step === 'form' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Dados da Empresa</h3>
            <p className="text-sm text-slate-500">Confirme o CNPJ para o qual deseja realizar a declaração.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">CNPJ da MEI</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-icons">business</span>
                <input 
                  type="text" 
                  required
                  value={cnpj}
                  onChange={handleCnpjChange}
                  className="w-full pl-12 pr-4 py-4 text-xl border border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-mono"
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                <span className="material-icons text-xs">info</span>
                Seus dados estão protegidos de acordo com a LGPD.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <button 
                type="button"
                onClick={() => setStep('intro')}
                className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSubmitting || cnpj.replace(/\D/g, '').length !== 14}
                className="flex-[2] bg-primary hover:bg-blue-600 disabled:bg-slate-300 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processando...
                  </>
                ) : (
                  <>
                    Continuar para Faturamento <span className="material-icons">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-12 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <span className="material-icons text-5xl">check_circle</span>
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4">Solicitação Recebida!</h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10">
            Iniciamos o processo da sua Declaração Anual. Em breve você receberá o protocolo e as instruções no seu e-mail e WhatsApp.
          </p>
          <button 
            onClick={onBack}
            className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-xl font-bold transition-all"
          >
            Voltar ao Início
          </button>
        </div>
      )}
    </div>
  );
};

export default DasnServicePage;