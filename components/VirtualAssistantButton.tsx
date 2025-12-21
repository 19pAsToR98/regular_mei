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
        bg-primary
        shadow-xl hover:scale-110 
        transition-all duration-500 ease-in-out
        flex items-center justify-center 
        transform
      `}
      aria-label="Abrir Assistente Virtual"
      title="Assistente Virtual"
    >
      {/* Usando o GIF em vez do Material Icon */}
      <img 
        src={iconSrc} 
        alt="Assistente Dyad" 
        className="w-12 h-12 object-contain"
      />
      
      {/* Pequeno balão de fala para simular interação (REMOVIDO) */}
      {/* <div className="absolute top-0 left-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div> */}
    </button>
  );
};

export default VirtualAssistantButton;