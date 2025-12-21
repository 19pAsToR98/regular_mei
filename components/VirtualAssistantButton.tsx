import React from 'react';

interface VirtualAssistantButtonProps {
  isOpen: boolean;
  onClick: () => void;
  gifUrl?: string; // NOVA PROP
}

const VirtualAssistantButton: React.FC<VirtualAssistantButtonProps> = ({ isOpen, onClick, gifUrl }) => {
  
  // Usa a URL fornecida ou o fallback estático
  const iconSrc = gifUrl || "/clippy-white-10.gif";

  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 z-40 
        w-20 h-20 rounded-full 
        bg-transparent 
        shadow-none hover:scale-110 
        transition-all duration-500 ease-in-out
        flex items-center justify-center 
        transform
      `}
      aria-label="Abrir Assistente Virtual"
      title="Assistente Virtual"
    >
      {/* Container para o GIF e o indicador, para que o hover funcione no GIF */}
      <div className="relative w-12 h-12">
          <img 
            src={iconSrc} 
            alt="Assistente Dyad" 
            className="w-full h-full object-contain"
          />
          
          {/* Indicador de Notificação (Círculo) */}
          <div className="absolute top-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
      </div>
    </button>
  );
};

export default VirtualAssistantButton;