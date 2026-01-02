import React from 'react';

interface ServiceFlowPageProps {
  typebotId: string;
  title: string;
  onClose: () => void;
}

const TYPEBOT_API_HOST = "https://typebotapi.portalmei360.com";

const ServiceFlowPage: React.FC<ServiceFlowPageProps> = ({ typebotId, title, onClose }) => {
  const typebotUrl = `${TYPEBOT_API_HOST}/${typebotId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full h-full md:h-[85vh] md:max-w-4xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase text-sm tracking-widest">
            <span className="material-icons text-primary text-xl">smart_toy</span>
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-300 transition-colors"
            title="Fechar"
          >
            <span className="material-icons text-xl">close</span>
          </button>
        </div>
        
        {/* Iframe Content */}
        <div className="bg-white flex-1 relative">
          <iframe 
            src={typebotUrl} 
            className="w-full h-full border-0 absolute inset-0" 
            title={title}
            allow="camera; microphone; geolocation"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default ServiceFlowPage;