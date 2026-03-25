import React, { useState } from 'react';
import { showWarning } from '../utils/toastUtils';

interface DASNFormProps {
  onBack: () => void;
  initialCnpj?: string;
}

const DASNForm: React.FC<DASNFormProps> = ({ onBack, initialCnpj = '' }) => {
  const [cnpj, setCnpj] = useState(initialCnpj);
  const [step, setStep] = useState(1);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    if (cleanCnpj.length !== 14) {
      showWarning("Por favor, insira um CNPJ válido com 14 dígitos.");
      return;
    }
    // Por enquanto, apenas avançamos para o próximo passo lógico que será implementado futuramente
    setStep(2);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header de Navegação */}
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-slate-500 hover:text-primary transition-colors font-medium"
      >
        <span className="material-icons text-sm mr-1">arrow_back</span> Voltar
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          
          {/* Lado Esquerdo: Apresentação */}
          <div className="lg:col-span-2 bg-blue-600 p-8 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                <span className="material-icons text-3xl">assignment</span>
              </div>
              <h2 className="text-2xl font-bold mb-4 leading-tight">Declaração Anual do MEI (DASN-SIMEI)</h2>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">
                A DASN é a obrigação mais importante do ano. Nela, você informa o faturamento bruto da sua empresa no ano anterior.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-xs">
                  <span className="material-icons text-blue-300 text-sm">check_circle</span>
                  <span><b>Prazo Final:</b> 31 de Maio de cada ano.</span>
                </li>
                <li className="flex items-start gap-3 text-xs">
                  <span className="material-icons text-blue-300 text-sm">check_circle</span>
                  <span><b>Evite Multas:</b> A entrega em atraso gera multa automática de R$ 50,00.</span>
                </li>
                <li className="flex items-start gap-3 text-xs">
                  <span className="material-icons text-blue-300 text-sm">check_circle</span>
                  <span><b>Regularidade:</b> Sem a DASN, você não consegue gerar as guias DAS do ano atual.</span>
                </li>
              </ul>
            </div>

            <div className="mt-12 relative z-10">
                <p className="text-[10px] uppercase tracking-widest font-bold text-blue-200 opacity-70">Processo Seguro</p>
                <p className="text-xs text-blue-100">Seus dados são protegidos e enviados diretamente para a Receita Federal.</p>
            </div>

            {/* Elementos Decorativos */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          {/* Lado Direito: Formulário */}
          <div className="lg:col-span-3 p-8 md:p-12">
            {step === 1 ? (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Vamos começar</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Informe o CNPJ da sua empresa para verificarmos o status da sua declaração.</p>

                <form onSubmit={handleNext} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">CNPJ da Empresa</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-icons">business</span>
                      <input 
                        type="text" 
                        required
                        value={cnpj}
                        onChange={(e) => setCnpj(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-lg font-mono outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-primary hover:bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Continuar <span className="material-icons">arrow_forward</span>
                  </button>
                </form>

                <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    <b>Dica:</b> Se você já é cliente Regular MEI e está logado, seu CNPJ foi preenchido automaticamente. Caso contrário, digite apenas os números.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-icons text-4xl">check_circle</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">CNPJ Validado!</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                  Estamos preparando o ambiente para a coleta dos dados de faturamento. Esta funcionalidade será expandida em breve.
                </p>
                <button 
                  onClick={() => setStep(1)}
                  className="text-primary font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <span className="material-icons text-sm">restart_alt</span> Reiniciar processo
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DASNForm;