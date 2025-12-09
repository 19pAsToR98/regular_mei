
import React, { useState } from 'react';

interface IntroWalkthroughProps {
  onFinish: () => void;
}

const slides = [
  {
    id: 1,
    title: "Bem-vindo ao Regular MEI",
    description: "Sua central de controle completa para gerenciar sua microempresa de forma simples e eficiente.",
    icon: "waving_hand",
    color: "text-yellow-500",
    bg: "bg-yellow-100 dark:bg-yellow-900/30"
  },
  {
    id: 2,
    title: "Painel Financeiro",
    description: "Acompanhe suas receitas, despesas e o limite anual do MEI através do nosso termômetro inteligente.",
    icon: "bar_chart",
    color: "text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/30"
  },
  {
    id: 3,
    title: "Obrigações em Dia",
    description: "Monitore suas guias DAS e a Declaração Anual (DASN) diretamente na aba 'Meu CNPJ'.",
    icon: "assignment_turned_in",
    color: "text-green-500",
    bg: "bg-green-100 dark:bg-green-900/30"
  },
  {
    id: 4,
    title: "Clube de Vantagens",
    description: "Acesse ofertas exclusivas de parceiros e ferramentas úteis como geradores de recibo e orçamento.",
    icon: "card_giftcard",
    color: "text-purple-500",
    bg: "bg-purple-100 dark:bg-purple-900/30"
  }
];

const IntroWalkthrough: React.FC<IntroWalkthroughProps> = ({ onFinish }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onFinish();
    }
  };

  const content = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative m-4">
        
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 z-0"></div>
        
        <div className="relative z-10 p-8 flex flex-col items-center text-center h-[420px]">
          
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            {/* Icon Circle */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg transform transition-all duration-500 ${content.bg} ${content.color} scale-100`}>
              <span className="material-icons text-4xl">{content.icon}</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 animate-in slide-in-from-bottom-2 duration-300 key={content.title}">
              {content.title}
            </h2>
            
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm md:text-base animate-in slide-in-from-bottom-4 duration-500 key={content.description}">
              {content.description}
            </p>
          </div>

          {/* Navigation Dots */}
          <div className="flex gap-2 mb-8">
            {slides.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-slate-300 dark:bg-slate-700'}`}
              />
            ))}
          </div>

          {/* Action Button */}
          <button 
            onClick={handleNext}
            className="w-full bg-primary hover:bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            {currentSlide === slides.length - 1 ? (
              <>Começar a Usar <span className="material-icons text-sm">rocket_launch</span></>
            ) : (
              <>Próximo <span className="material-icons text-sm">arrow_forward</span></>
            )}
          </button>
          
          {currentSlide < slides.length - 1 && (
            <button 
              onClick={onFinish}
              className="mt-4 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-wider"
            >
              Pular Introdução
            </button>
          )}

        </div>
      </div>
    </div>
  );
};

export default IntroWalkthrough;
