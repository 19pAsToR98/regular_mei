import React from 'react';
import { ServiceCTA } from '../types';
import { servicesData } from '../data/servicesData';

interface HomepageProps {
    onNavigateToAuth: () => void;
}

const Homepage: React.FC<HomepageProps> = ({ onNavigateToAuth }) => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* Header/Intro Section */}
      <div className="max-w-4xl w-full text-center py-16 md:py-24">
        <img 
            src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
            alt="Regular MEI" 
            className="h-12 md:h-16 mx-auto mb-6 object-contain dark:brightness-0 dark:invert"
        />
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">
          Assessoria Completa para o seu MEI
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-8">
          Simplificamos a burocracia para que você possa focar no crescimento do seu negócio.
        </p>
      </div>

      {/* CTA - Financial Platform */}
      <div className="max-w-5xl w-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-2xl mb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -translate-y-1/4 translate-x-1/4 blur-xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-left max-w-xl">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-semibold border border-white/10 mb-3">
                    Ferramenta Gratuita
                </span>
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                    Gerencie suas Finanças com o Dashboard Regular MEI
                </h2>
                <p className="text-blue-100 text-lg">
                    Acompanhe receitas, despesas, limite anual e pendências fiscais em tempo real.
                </p>
            </div>
            <button 
                onClick={onNavigateToAuth}
                className="flex-shrink-0 bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-xl font-bold shadow-lg transition-colors items-center gap-2 w-full md:w-auto flex justify-center"
            >
                Acessar Plataforma Financeira
                <span className="material-icons text-sm">arrow_forward</span>
            </button>
        </div>
      </div>

      {/* Services Section */}
      <div className="max-w-6xl w-full mb-16">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 text-center">
          Nossos Serviços de Assessoria
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesData.map((service) => (
            <div 
              key={service.id}
              className="flex flex-col text-left p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${service.colorClass}`}>
                <span className="material-icons text-2xl">{service.icon}</span>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-2">
                {service.title}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed flex-grow">
                {service.description}
              </p>
              <a 
                href="#" // Placeholder for external service link
                className="flex items-center text-sm font-bold text-primary hover:underline mt-auto"
              >
                Saiba Mais <span className="material-icons text-sm ml-1">chevron_right</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Placeholder */}
      <footer className="mt-8 text-center text-sm text-slate-400 pb-8">
        <p>Regular MEI - Assessoria e Gestão para Microempreendedores Individuais.</p>
      </footer>
    </div>
  );
};

export default Homepage;