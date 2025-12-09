
import React from 'react';

const InvoicesPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-8 animate-in fade-in duration-500">
      
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-blue-400 opacity-20 blur-2xl rounded-full"></div>
        <div className="relative bg-white dark:bg-slate-800 p-8 rounded-full shadow-lg border border-slate-100 dark:border-slate-700">
          <span className="material-icons text-6xl text-blue-500">receipt</span>
        </div>
        <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-white dark:border-slate-900 uppercase tracking-wide">
            Em Breve
        </div>
      </div>
      
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">
        Emissor de Nota Fiscal (NFS-e)
      </h2>
      
      <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-8 text-lg leading-relaxed">
        Estamos finalizando a integração com o padrão nacional. Em breve você poderá emitir, cancelar e enviar suas notas fiscais de serviço diretamente por aqui.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-3 text-slate-500">
                  <span className="material-icons">bolt</span>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-1">Emissão Rápida</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Preenchimento automático de dados para emitir notas em segundos.</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-3 text-slate-500">
                  <span className="material-icons">share</span>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-1">Envio Automático</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Envie o PDF e XML por WhatsApp e E-mail para seu cliente.</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-3 text-slate-500">
                  <span className="material-icons">cloud_download</span>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-1">Backup Seguro</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Suas notas armazenadas e organizadas por 5 anos na nuvem.</p>
          </div>
      </div>

      <button 
        disabled
        className="mt-10 flex items-center gap-2 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-6 py-3 rounded-xl font-medium cursor-not-allowed"
      >
        <span className="material-icons text-sm">notifications_active</span>
        Avise-me quando lançar
      </button>
    </div>
  );
};

export default InvoicesPage;
