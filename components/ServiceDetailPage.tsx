import React, { useState } from 'react';
import ServiceFlowPage from './ServiceFlowPage';

interface ServiceDetailPageProps {
  serviceKey: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  typebotId: string;
  onBack: () => void;
}

const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({
  serviceKey,
  title,
  description,
  icon,
  color,
  typebotId,
  onBack,
}) => {
  const [isFlowOpen, setIsFlowOpen] = useState(false);

  if (isFlowOpen) {
    return (
      <ServiceFlowPage
        typebotId={typebotId}
        title={title}
        onClose={() => setIsFlowOpen(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in duration-500">
      
      <button 
        onClick={onBack} 
        className="mb-6 flex items-center text-slate-500 hover:text-primary transition-colors font-medium"
      >
        <span className="material-icons text-sm mr-1">arrow_back</span> Voltar para a Home
      </button>

      <div className="flex flex-col md:flex-row items-start gap-8">
        
        {/* Icon and Title */}
        <div className="flex-shrink-0">
          <div className={`w-20 h-20 rounded-3xl ${color.replace('text-', 'bg-').replace('-500', '-100')} ${color} flex items-center justify-center mb-4`}>
            <span className="material-icons text-4xl">{icon}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-3">
            {title}
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            {description}
          </p>

          <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="material-icons text-primary">smart_toy</span> Iniciar Fluxo de Serviço
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                Ao clicar abaixo, você será guiado por nosso assistente virtual para completar o serviço de forma rápida e segura.
            </p>
            <button
              onClick={() => setIsFlowOpen(true)}
              className="w-full bg-primary hover:bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Iniciar {title} <span className="material-icons">arrow_forward</span>
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">O que você pode fazer:</h4>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400 text-sm">
                  <li className="flex items-center gap-2"><span className="material-icons text-green-500 text-base">check_circle</span> Preenchimento automático de dados.</li>
                  <li className="flex items-center gap-2"><span className="material-icons text-green-500 text-base">check_circle</span> Suporte especializado em tempo real.</li>
                  <li className="flex items-center gap-2"><span className="material-icons text-green-500 text-base">check_circle</span> Geração de guias e documentos fiscais.</li>
              </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;