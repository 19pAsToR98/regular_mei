"use client";

import React, { useState, useEffect } from 'react';
import { showSuccess, showError } from '../utils/toastUtils';

interface AnnualDeclarationFormProps {
  initialCnpj?: string;
  onSuccess: () => void;
}

const AnnualDeclarationForm: React.FC<AnnualDeclarationFormProps> = ({ initialCnpj = '', onSuccess }) => {
  const [step, setStep] = useState(1);
  const [cnpj, setCnpj] = useState(initialCnpj);
  const [loading, setLoading] = useState(false);

  const formatCnpj = (value: string) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    return cleanValue
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(formatCnpj(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cleanCnpj.length !== 14) {
      showError("Por favor, insira um CNPJ válido.");
      return;
    }

    setLoading(true);
    // Simulação de processamento/envio para o backend
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLoading(false);
    showSuccess("Dados do CNPJ validados! Em breve nossa equipe entrará em contato para finalizar sua declaração.");
    onSuccess();
  };

  return (
    <div className="flex flex-col h-full">
      {step === 1 ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-300">
              <span className="material-icons text-3xl">assignment</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">O que é a DASN-SIMEI?</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              A Declaração Anual do Simples Nacional (DASN-SIMEI) é a obrigação onde o MEI informa o faturamento bruto do ano anterior. 
              <br /><br />
              <span className="font-bold text-blue-600 dark:text-blue-400">Prazo:</span> Deve ser entregue até 31 de maio de cada ano para evitar multas e o bloqueio do CNPJ.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="material-icons text-green-500">check_circle</span>
              <p className="text-sm text-slate-600 dark:text-slate-400">Evite multas por atraso (mínimo R$ 50,00).</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-icons text-green-500">check_circle</span>
              <p className="text-sm text-slate-600 dark:text-slate-400">Mantenha seus benefícios previdenciários ativos.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-icons text-green-500">check_circle</span>
              <p className="text-sm text-slate-600 dark:text-slate-400">Gere o comprovante de rendimentos oficial.</p>
            </div>
          </div>

          <button 
            onClick={() => setStep(2)}
            className="w-full bg-primary hover:bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            Iniciar Declaração <span className="material-icons">arrow_forward</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Informe seu CNPJ</h3>
            <p className="text-sm text-slate-500 mb-4">Precisamos do seu CNPJ para localizar sua empresa na Receita Federal.</p>
            
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-icons">business</span>
              <input 
                type="text" 
                required
                value={cnpj}
                onChange={handleCnpjChange}
                className="w-full pl-12 pr-4 py-4 border border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-lg font-mono outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-xl flex gap-3">
            <span className="material-icons text-yellow-600 dark:text-yellow-500">info</span>
            <p className="text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed">
              Ao continuar, você autoriza nossos consultores a realizarem a consulta da sua situação fiscal para fins de preenchimento da declaração.
            </p>
          </div>

          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Voltar
            </button>
            <button 
              type="submit"
              disabled={loading || cnpj.replace(/[^\d]/g, '').length !== 14}
              className="flex-[2] bg-primary hover:bg-blue-600 disabled:bg-slate-300 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Validando...
                </>
              ) : (
                <>Continuar <span className="material-icons">check</span></>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AnnualDeclarationForm;