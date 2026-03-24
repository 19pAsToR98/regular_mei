import React, { useState, useEffect } from 'react';
import { NewsItem } from '../types';
import PublicNewsSlider from './PublicNewsSlider';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onViewBlog: (id: number | null) => void;
  onConsultCnpj: () => void;
  news: NewsItem[];
  onNavigateToService: (service: string) => void; // NOVA PROP
}

// Mapeamento dos Typebot IDs (Mantido para os outros serviços por enquanto)
const TYPEBOT_IDS: Record<string, string> = {
    'cancelamento': 'cancelar-mei-yljnmeh',
    'parcelamento': 'parcelamento-de-d-bitos-c1b6oco',
    'abertura': 'abrir-mei-43ty0i4',
    'alterar': 'alterar-mei-o1ryxif',
    'consulta': 'declara-o-anual-cl1wie5'
};
const TYPEBOT_API_HOST = "https://typebotapi.portalmei360.com";


const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onViewBlog, onConsultCnpj, news, onNavigateToService }) => {
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTypebotId, setActiveTypebotId] = useState<string | null>(null);
  const [typebotTitle, setTypebotTitle] = useState('Atendimento Especializado');

  // ... keep existing code (useEffect)

  const handleOpenService = (serviceKey: string) => {
    if (serviceKey === 'declaracao') {
        onNavigateToService('dasn-service');
        return;
    }
    
    const service = mainServices.find(s => s.key === serviceKey);
    setTypebotTitle(service?.title || 'Atendimento Especializado');
    setActiveTypebotId(TYPEBOT_IDS[serviceKey]);
  };
  
  // ... keep existing code (rest of handlers)

  const mainServices = [
    {
      key: 'declaracao',
      title: 'Declaração Anual do MEI',
      desc: 'Entrega da DASN-SIMEI obrigatória para manter seu CNPJ regular e evitar multas.',
      icon: 'assignment',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    // ... rest of services
    {
      key: 'cancelamento',
      title: 'Cancelamento de CNPJ',
      desc: 'Baixa definitiva do registro MEI com orientação sobre pendências e obrigações.',
      icon: 'cancel',
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      key: 'parcelamento',
      title: 'Parcelamento de Débitos',
      desc: 'Regularização de guias DAS atrasadas com opções de parcelamento em até 60x.',
      icon: 'account_balance_wallet',
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      key: 'abertura',
      title: 'Abertura MEI',
      desc: 'Criação do seu novo CNPJ MEI de forma rápida, segura e com suporte especializado.',
      icon: 'rocket_launch',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      key: 'alterar',
      title: 'Alterar CNPJ MEI',
      desc: 'Atualize dados do seu MEI, como endereço, atividades, nome fantasia e outras informações.',
      icon: 'edit_note',
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
      key: 'consulta',
      title: 'Consulta de Débitos',
      desc: 'Verifique pendências no CNPJ e receba orientação sobre os próximos passos.',
      icon: 'search',
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  // ... keep existing code (rest of component)
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 selection:bg-primary selection:text-white overflow-x-hidden scroll-smooth">
      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-[100] transition-colors duration-300 border-b ${
        isMenuOpen 
          ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800' 
          : 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-slate-100 dark:border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-[72px] md:h-[80px] items-center">
            <div className="flex items-center gap-10">
              <img 
                src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
                alt="Regular MEI" 
                className="h-7 md:h-9 w-auto dark:brightness-0 dark:invert cursor-pointer"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              />
              <div className="hidden lg:flex gap-8">
                <button onClick={() => scrollToSection('services')} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Serviços</button>
                <button onClick={() => scrollToSection('dashboard')} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Gestão</button>
                <button onClick={() => scrollToSection('whatsapp')} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">WhatsApp AI</button>
                <button onClick={() => scrollToSection('tools')} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Ferramentas</button>
                <button onClick={() => scrollToSection('blog')} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Blog</button>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button onClick={onLogin} className="hidden sm:block text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-primary px-4 py-2">
                Entrar
              </button>
              <button onClick={onGetStarted} className="bg-primary hover:bg-blue-600 text-white px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm shadow-xl shadow-blue-500/25 transition-all active:scale-95">
                Começar
              </button>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
              >
                <span className="material-icons">{isMenuOpen ? 'close' : 'menu'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-[72px] bg-white dark:bg-slate-950 z-[110] animate-in slide-in-from-top duration-300 overflow-y-auto pb-10">
            <div className="px-4 py-6 space-y-2">
              <button onClick={() => scrollToSection('services')} className="flex items-center gap-4 w-full px-5 py-4 text-lg font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                  <span className="material-icons">assignment</span>
                </div>
                Serviços
              </button>
              <button onClick={() => scrollToSection('dashboard')} className="flex items-center gap-4 w-full px-5 py-4 text-lg font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                  <span className="material-icons">analytics</span>
                </div>
                Gestão Financeira
              </button>
              <button onClick={() => scrollToSection('whatsapp')} className="flex items-center gap-4 w-full px-5 py-4 text-lg font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
                  <span className="material-icons">chat</span>
                </div>
                WhatsApp AI
              </button>
              <button onClick={() => scrollToSection('tools')} className="flex items-center gap-4 w-full px-5 py-4 text-lg font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 flex items-center justify-center">
                  <span className="material-icons">build</span>
                </div>
                Ferramentas
              </button>
              <button onClick={() => scrollToSection('blog')} className="flex items-center gap-4 w-full px-5 py-4 text-lg font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                  <span className="material-icons">article</span>
                </div>
                Blog & Notícias
              </button>
              
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button onClick={onLogin} className="w-full py-5 rounded-2xl text-xl font-black text-primary border-2 border-primary/10 hover:bg-primary/5 transition-colors">
                  Entrar na Conta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HERO SECTION */}
        <section className="relative pt-24 pb-12 md:pt-40 md:pb-24 px-4 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
            <div className="absolute top-[5%] right-[5%] w-[50%] h-[50%] bg-blue-500/10 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-0 left-[0%] w-[40%] h-[40%] bg-indigo-500/5 blur-[80px] rounded-full"></div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Left Column: Content */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 md:space-y-8 animate-in fade-in slide-in-from-left-6 duration-700">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Portal de Regularização 2025
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tighter">
                A tranquilidade que <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 italic">seu CNPJ merece.</span>
              </h1>
              
              <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                Consulte sua situação fiscal agora. Resolvemos suas pendências e entregamos sua <b>Declaração Anual</b> com segurança e rapidez.
              </p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                <button onClick={onConsultCnpj} className="bg-primary hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-xl shadow-blue-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                  Consultar CNPJ Grátis <span className="material-icons">search</span>
                </button>
                <button onClick={() => handleOpenService('declaracao')} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 px-8 py-4 rounded-2xl font-bold text-base hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                  DASN 2025 <span className="material-icons text-sm">assignment</span>
                </button>
              </div>

              <div className="flex items-center gap-4 md:gap-6 pt-2">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="Usuário Regular MEI" />
                    </div>
                  ))}
                </div>
                <p className="text-xs md:sm text-slate-400 font-medium">
                  <span className="text-slate-900 dark:text-white font-bold">15 mil+</span> empreendedores
                </p>
              </div>
            </div>

            {/* Right Column: Image */}
            <div className="relative animate-in fade-in slide-in-from-bottom-12 lg:slide-in-from-right-12 duration-1000 mt-8 lg:mt-0">
              <div className="relative w-full max-w-[320px] sm:max-w-[450px] mx-auto">
                <div className="relative aspect-square rounded-[40px] md:rounded-[60px] overflow-hidden shadow-2xl border-[8px] md:border-[16px] border-white dark:border-slate-900 z-10 transform lg:-rotate-2">
                  <img 
                    src="https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?auto=format&fit=crop&q=80&w=1000" 
                    alt="Empreendedora MEI trabalhando" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
                </div>

                {/* Floating Gadget: Search/Consulta */}
                <div className="absolute -top-6 -right-2 md:-right-12 z-20 animate-bounce-slow hidden sm:block">
                  <button onClick={onConsultCnpj} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-3 md:p-4 rounded-3xl shadow-2xl border border-white/20 flex items-center gap-3 md:gap-4 hover:scale-105 transition-transform">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="material-icons text-xl md:text-2xl">verified</span>
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">CNPJ Regular</p>
                      <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-white">Consulta Gratuita</p>
                    </div>
                  </button>
                </div>

                {/* Floating Gadget: DASN Deadline */}
                <div className="absolute bottom-6 -left-4 md:-left-16 z-20 animate-pulse-slow">
                  <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 md:px-6 py-3 md:py-4 rounded-[24px] md:rounded-[32px] shadow-2xl flex flex-col items-center gap-1 border border-white/10 dark:border-slate-200">
                    <span className="material-icons text-orange-500 text-2xl md:text-3xl">event_busy</span>
                    <p className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter opacity-70">Prazo DASN</p>
                    <p className="text-base md:text-xl font-black leading-none">31 MAIO</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES GRID SECTION */}
        <section id="services" className="py-16 md:py-24 px-4 border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 md:mb-6">
                Serviços <span className="text-primary">Especializados</span>
              </h2>
              <p className="text-base md:text-lg text-slate-500 dark:text-slate-400">
                Tudo o que você precisa para manter seu CNPJ em dia e focar no crescimento do seu negócio.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {mainServices.map((service, i) => (
                <div 
                  key={i} 
                  className="group p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer"
                  onClick={() => handleOpenService(service.key)}
                >
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${service.bg} ${service.color} flex items-center justify-center mb-5 md:mb-6 group-hover:scale-110 transition-transform`}>
                    <span className="material-icons text-2xl md:text-3xl">{service.icon}</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white mb-2 md:mb-3 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4 md:mb-6">
                    {service.desc}
                  </p>
                  <div className="flex items-center text-primary text-xs font-black uppercase tracking-widest gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    Acessar <span className="material-icons text-sm">arrow_forward</span>
                  </div>
                </div>
              ))}
              
              <div className="p-6 md:p-8 rounded-3xl bg-primary text-white flex flex-col justify-center items-center text-center space-y-4 shadow-xl">
                 <span className="material-icons text-4xl md:text-5xl">help_outline</span>
                 <h3 className="text-xl md:text-2xl font-bold">Precisa de ajuda?</h3>
                 <p className="text-blue-100 text-xs md:text-sm opacity-90">Nossos consultores estão prontos para te orientar em qualquer processo.</p>
                 <button onClick={() => handleOpenService('consulta')} className="bg-white text-primary px-6 py-3 rounded-xl font-black text-sm hover:bg-blue-50 transition-colors w-full">
                    Falar com Consultor
                 </button>
              </div>
            </div>
          </div>
        </section>

        {/* ... rest of component */}
      </nav>

      {/* TYPEBOT MODAL */}
      {activeTypebotId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full h-full md:h-[680px] md:max-w-4xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase text-[10px] md:text-xs tracking-widest">
                <span className="material-icons text-primary text-sm">smart_toy</span>
                {typebotTitle}
              </h3>
              <button 
                onClick={handleCloseTypebot} 
                className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-300 transition-colors"
              >
                <span className="material-icons text-xl">close</span>
              </button>
            </div>
            <div className="bg-white flex-1 relative">
              <iframe 
                  src={getTypebotUrl(activeTypebotId)} 
                  className="w-full h-full border-0 absolute inset-0" 
                  title={typebotTitle}
                  allow="camera; microphone; geolocation"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;