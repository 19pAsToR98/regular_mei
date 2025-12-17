import React from 'react';
import { ServiceCTA } from '../types';
import { servicesData } from '../data/servicesData';
import HomepageHeader from './HomepageHeader';
import HomepageFooter from './HomepageFooter';

interface HomepageProps {
    onNavigateToAuth: () => void;
}

const featuresData = [
    { icon: 'bar_chart', title: 'Controle Financeiro', description: 'Dashboard intuitivo para receitas, despesas e fluxo de caixa.' },
    { icon: 'receipt_long', title: 'Monitoramento Fiscal', description: 'Acompanhe o limite anual do MEI e pendências de DAS e DASN.' },
    { icon: 'build', title: 'Ferramentas Úteis', description: 'Geradores de recibo, orçamento e calculadora de taxas.' },
    { icon: 'local_offer', title: 'Clube de Vantagens', description: 'Acesso a ofertas e descontos exclusivos de parceiros.' },
];

const Homepage: React.FC<HomepageProps> = ({ onNavigateToAuth }) => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      
      <HomepageHeader onNavigateToAuth={onNavigateToAuth} />

      <main className="flex-1 w-full">
        
        {/* 1. Hero Section */}
        <div className="max-w-7xl mx-auto w-full text-center py-20 md:py-32 px-4">
          <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm font-semibold mb-4">
            O seu parceiro MEI
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
            Assessoria e Gestão <br className="hidden md:inline"/> Simplificada
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10">
            Simplificamos a burocracia fiscal e financeira para que você possa focar no crescimento do seu negócio.
          </p>
          <button 
            onClick={onNavigateToAuth}
            className="bg-primary hover:bg-blue-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 mx-auto text-lg"
          >
            Começar Agora (Grátis)
            <span className="material-icons text-xl">arrow_forward</span>
          </button>
        </div>

        {/* 2. CTA - Financial Platform (Dashboard) */}
        <div id="features" className="max-w-5xl mx-auto w-full px-4 mb-20">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
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
        </div>

        {/* 3. Features Section (Vantagens) */}
        <div className="max-w-6xl mx-auto w-full px-4 py-16">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-12 text-center">
                Vantagens da Plataforma
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuresData.map((feature, index) => (
                    <div key={index} className="text-center p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-shadow">
                        <div className="w-16 h-16 bg-blue-100 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-icons text-3xl">{feature.icon}</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">{feature.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* 4. Services Section (Assessoria) */}
        <div id="services" className="max-w-6xl mx-auto w-full px-4 py-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 text-center">
                Nossos Serviços de Assessoria
            </h2>
            <p className="text-center text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-12">
                Conte com nossa equipe especializada para resolver as obrigações mais complexas do seu MEI.
            </p>
            
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

        {/* 5. Contact CTA */}
        <div id="contact" className="max-w-4xl mx-auto w-full text-center py-20 px-4">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">
                Pronto para Regularizar seu MEI?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                Fale com um de nossos consultores e comece hoje mesmo.
            </p>
            <a 
                href="https://wa.me/5511999999999" 
                target="_blank"
                className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-green-500/30 transition-all transform hover:-translate-y-0.5 text-lg"
            >
                <span className="material-icons text-xl">whatsapp</span>
                Falar com Consultor
            </a>
        </div>

      </main>

      <HomepageFooter />
    </div>
  );
};

export default Homepage;