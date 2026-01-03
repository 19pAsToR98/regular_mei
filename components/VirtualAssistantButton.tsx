import React from 'react';

interface VirtualAssistantButtonProps {
  isOpen: boolean;
  onClick: () => void;
  gifUrl?: string; // NOVA PROP
  iconSizeClass?: string; // NOVA PROP
}

const VirtualAssistantButton: React.FC<VirtualAssistantButtonProps> = ({ isOpen, onClick, gifUrl, iconSizeClass = 'w-12 h-12' }) => {
  
  // Usa a URL fornecida ou o fallback estático
  const iconSrc = gifUrl || "/clippy-white-10.gif";

  return (
    <button
      onClick={onClick}
      className={`
        fixed right-6 z-40 
        lg:bottom-6 lg:right-6 
        lg:w-20 lg:h-20 
        w-16 h-16 
        lg:rounded-full rounded-2xl
        bg-transparent 
        shadow-none hover:scale-110 
        transition-all duration-500 ease-in-out
        flex items-center justify-center 
        transform
        
        /* Ajuste para mobile: 16px acima da bottom bar (h-16 = 4rem). 4rem + 16px = 5rem */
        bottom-[5rem]
      `}
      aria-label="Abrir Assistente Virtual"
      title="Assistente Virtual"
    >
      {/* Container para o GIF e o indicador, usando iconSizeClass para o tamanho */}
      <div className={`relative ${iconSizeClass}`}>
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