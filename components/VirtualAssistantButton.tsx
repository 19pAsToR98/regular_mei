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
        bg-primary text-white
        shadow-xl hover:scale-110 
        transition-all duration-500 ease-in-out
        flex items-center justify-center 
        transform
      `}
      aria-label="Abrir Assistente Virtual"
      title="Assistente Virtual"
      style={style} // Apply dynamic position
    >
      <span className="material-icons text-3xl">smart_toy</span>
      
      {/* Pequeno balão de fala para simular interação */}
      <div className="absolute top-0 left-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
    </button>
  );
};

export default VirtualAssistantButton;