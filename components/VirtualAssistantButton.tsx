import React from 'react';

interface VirtualAssistantButtonProps {
  isOpen: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}

const VirtualAssistantButton: React.FC<VirtualAssistantButtonProps> = ({ isOpen, onClick, style }) => {
  return (
    <button
      onClick={onClick}
      className={`
        fixed z-40 
        w-16 h-16 rounded-full 
        bg-transparent 
        shadow-xl hover:scale-110 
        transition-all duration-500 ease-in-out
        flex items-center justify-center 
        transform ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
      `}
      aria-label="Abrir Assistente Virtual"
      title="Assistente Virtual"
      style={style} // Apply dynamic position
    >
      {/* Substituindo o ícone pelo GIF */}
      <img 
        src="/clippy-white-10.gif" 
        alt="Assistente Virtual" 
        className="w-full h-full object-cover rounded-full"
      />
      
      {/* Pequeno balão de fala para simular interação */}
      <div className="absolute top-0 left-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
    </button>
  );
};

export default VirtualAssistantButton;