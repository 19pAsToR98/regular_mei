import React from 'react';

interface VirtualAssistantButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

const VirtualAssistantButton: React.FC<VirtualAssistantButtonProps> = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 z-40 
        w-16 h-16 rounded-full 
        bg-primary text-white
        shadow-xl hover:scale-110 
        transition-all duration-500 ease-in-out
        flex items-center justify-center 
        transform
      `}
      aria-label="Abrir Assistente Virtual"
      title="Assistente Virtual"
    >
      {/* Substituindo o ícone por uma tag <img> que carrega o GIF */}
      <img 
        src="/clippy-white-10.gif" 
        alt="Assistente Dyad" 
        className="w-10 h-10 object-contain"
      />
      
      {/* Pequeno balão de fala para simular interação */}
      <div className="absolute top-0 left-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
    </button>
  );
};

export default VirtualAssistantButton;