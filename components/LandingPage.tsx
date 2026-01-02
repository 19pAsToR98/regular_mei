import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onViewBlog: () => void;
  onConsultCnpj: () => void;
  onNavigate: (tab: string) => void; // NEW PROP for service navigation
}

// Mapeamento dos Typebot IDs (Mantido aqui para referência de serviço)
const TYPEBOT_IDS: Record<string, string> = {
    'declaracao': 'declara-o-anual-cl1wie5',
    'cancelamento': 'cancelar-mei-yljnmeh',
    'parcelamento': 'parcelamento-de-d-bitos-c1b6oco',
    'abertura': 'abrir-mei-43ty0i4',
    'alterar': 'alterar-mei-o1ryxif',
    'consulta': 'declara-o-anual-cl1wie5'
};

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onViewBlog, onConsultCnpj, onNavigate }) => {
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Removendo Typebot Modal State

  // WhatsApp conversation simulation logic
  useEffect(() => {
    const sequence = [
      { delay: 1000, typing: true },  // Bot starts typing
      { delay: 1500, typing: false, show: 1 }, // Bot msg 1
      { delay: 1000, typing: false, show: 1 }, // Wait
      { delay: 1500, typing: false, show: 2 }, // User msg
      { delay: 1000, typing: true, show: 2 },  // Bot starts typing response
      { delay: 2000, typing: false, show: 3 }, // Bot msg 2
      { delay: 5000, typing: false, show: 0 }, // Reset loop
    ];

    let timer: any;
    let currentStep = 0;

    const runStep = () => {
      const step = sequence[currentStep];
      
      setIsTyping(step.typing || false);
      if (step.show !== undefined) setActiveMessageIndex(step.show);

      timer = setTimeout(() => {
        currentStep = (currentStep + 1) % sequence.length;
        runStep();
      }, step.delay);
    };

    runStep();

    return () => clearTimeout(timer);
  }, []);

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleServiceClick = (serviceKey: keyof typeof TYPEBOT_IDS) => {
    // Navega para a rota específica do serviço
    onNavigate(`service-${serviceKey}`);
  };
  
  const mainServices = [
    {
      key: 'declaracao',
      title: 'Declaração Anual do MEI',
      desc: 'Entrega da DASN-SIMEI obrigatória para manter seu CNPJ regular e evitar multas.',
      icon: 'assignment',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
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

  const tools = [
    {
      title: 'Gerador de Orçamentos',
      desc: 'Crie propostas profissionais em PDF e envie direto pelo WhatsApp para seus clientes.',
      icon: 'description',
      color: 'bg-blue-500'
    },
    {
      title: 'Emissor de Recibos',
      desc: 'Gere recibos digitais assinados em segundos após cada venda ou serviço prestado.',
      icon: 'receipt',
      color: 'bg-emerald-500'
    },
    {
      title: 'Plaquinha de PIX',
      desc: 'Personalize seu QR Code de pagamento para o balcão com as cores da sua marca.',
      icon: 'qr_code_2',
      color: 'bg-cyan-500'
    }
  ];

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
                <button onClick={onViewBlog} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Blog</button>
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

        {/* Mobile Menu Overlay - SOLID BACKGROUND */}
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
              <button onClick={onViewBlog} className="flex items-center gap-4 w-full px-5 py-4 text-lg font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
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
      </nav>

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
              <button onClick={() => handleServiceClick('declaracao')} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 px-8 py-4 rounded-2xl font-bold text-base hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
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
              <p className="text-xs md:text-sm text-slate-400 font-medium">
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

              {/* Floating Gadget: Search/Consulta (Change to use onConsultCnpj) */}
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
                onClick={() => handleServiceClick(service.key as keyof typeof TYPEBOT_IDS)}
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
               <button onClick={() => handleServiceClick('consulta')} className="bg-white text-primary px-6 py-3 rounded-xl font-black text-sm hover:bg-blue-50 transition-colors w-full">
                  Falar com Consultor
               </button>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD FEATURES SECTION */}
      <section id="dashboard" className="py-16 md:py-24 px-4 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="space-y-6 md:space-y-8 text-center lg:text-left">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                Financeiro de gente grande, <br className="hidden md:block" />
                <span className="text-primary">feito para você.</span>
              </h2>
              <div className="space-y-4 md:space-y-6">
                {[
                  { title: 'Fluxo de Caixa', desc: 'Entradas e saídas categorizadas automaticamente para você entender de onde vem o seu dinheiro.', icon: 'swap_horiz' },
                  { title: 'Lembretes Inteligentes', desc: 'Nunca mais esqueça de pagar o DAS ou entregar a Declaração Anual. Nós avisamos você.', icon: 'alarm_on' },
                  { title: 'Calendário de Obrigações', desc: 'Uma visão mensal completa da sua agenda de pagamentos e compromissos com clientes.', icon: 'calendar_month' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-center lg:items-start gap-4 md:gap-5 group text-center sm:text-left">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex-shrink-0 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                       <span className="material-icons text-2xl md:text-3xl">{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-base md:text-lg text-slate-800 dark:text-white mb-1">{item.title}</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative group max-w-[500px] mx-auto w-full">
               {/* Main Card Mockup */}
               <div className="relative z-10 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[30px] md:rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in duration-700">
                  <div className="flex justify-between items-center mb-6 md:mb-8">
                     <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-base md:text-lg">Saúde do Negócio</h4>
                        <p className="text-[10px] md:text-xs text-slate-400">Março de 2025</p>
                     </div>
                     <div className="flex items-center gap-1.5 md:gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 px-2.5 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold">
                        <span className="material-icons text-xs md:text-sm">trending_up</span> +12%
                     </div>
                  </div>

                  <div className="h-32 md:h-48 w-full relative">
                    <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
                      <path d="M0 130 C 50 110, 100 140, 150 80 C 200 40, 250 90, 300 50 C 350 20, 400 30" className="stroke-primary fill-none" strokeWidth="4" strokeLinecap="round" />
                      <circle cx="150" cy="80" r="6" className="fill-primary stroke-white dark:stroke-slate-900" strokeWidth="3" />
                    </svg>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:gap-4 mt-6 md:mt-8">
                     <div className="bg-slate-50 dark:bg-slate-800 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entradas</p>
                        <p className="text-base md:text-lg font-bold text-slate-900 dark:text-white">R$ 12.420</p>
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-800 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saídas</p>
                        <p className="text-base md:text-lg font-bold text-slate-900 dark:text-white">R$ 3.150</p>
                     </div>
                  </div>
               </div>

               {/* Floating elements adjusted for mobile visibility or hidden */}
               <div className="absolute -bottom-6 -right-2 md:-right-6 z-20 bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 w-32 md:w-48 animate-in slide-in-from-right-10 duration-1000 hidden sm:block">
                  <div className="relative h-1.5 md:h-2 bg-slate-100 dark:bg-slate-700 rounded-full mb-2 md:mb-3 overflow-hidden">
                     <div className="absolute left-0 top-0 h-full bg-orange-500 w-[78%] rounded-full"></div>
                  </div>
                  <p className="text-xs md:sm font-black text-slate-800 dark:text-white">78% <span className="text-[10px] md:text-xs font-medium text-slate-400">Limite</span></p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHATSAPP AI SECTION */}
      <section id="whatsapp" className="py-16 md:py-24 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 md:gap-16">
            <div className="w-full lg:w-1/2 order-2 lg:order-1">
               <div className="relative max-w-[280px] md:max-w-[300px] mx-auto">
                  {/* Smartphone Mockup */}
                  <div className="relative z-10 bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] p-3 md:p-4 shadow-2xl border-[6px] md:border-[8px] border-slate-800">
                     <div className="bg-white dark:bg-slate-900 rounded-[1.8rem] md:rounded-[2rem] overflow-hidden h-[480px] md:h-[550px] flex flex-col">
                        <div className="bg-[#075e54] p-3 md:p-4 text-white flex items-center gap-3">
                           <span className="material-icons text-sm md:text-base">arrow_back</span>
                           <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                              <span className="material-icons text-lg md:text-xl">smart_toy</span>
                           </div>
                           <div>
                              <p className="font-bold text-[10px] md:text-xs">Assistente Regular MEI</p>
                              <p className="text-[8px] md:text-[10px] opacity-70">online</p>
                           </div>
                        </div>
                        <div className="flex-1 p-3 md:p-4 space-y-3 md:space-y-4 overflow-y-auto bg-[#e5ddd5] dark:bg-slate-800/50">
                           {activeMessageIndex >= 1 && (
                             <div className="bg-white dark:bg-slate-700 p-2.5 md:p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] animate-in fade-in slide-in-from-left duration-300">
                                <p className="text-[11px] md:text-xs text-slate-800 dark:text-slate-100 font-medium">Oi! Qual despesa você quer lançar hoje?</p>
                                <p className="text-[7px] md:text-[8px] text-slate-400 text-right mt-1">14:02</p>
                             </div>
                           )}
                           {activeMessageIndex >= 2 && (
                             <div className="bg-[#dcf8c6] dark:bg-emerald-900/40 p-2.5 md:p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[85%] ml-auto animate-in fade-in slide-in-from-right duration-300">
                                <p className="text-[11px] md:text-xs text-slate-800 dark:text-slate-100 font-medium">Almoço com cliente, R$ 45,00 no crédito</p>
                                <p className="text-[7px] md:text-[8px] text-slate-400 text-right mt-1">14:03</p>
                             </div>
                           )}
                           {activeMessageIndex >= 3 && (
                             <div className="bg-white dark:bg-slate-700 p-2.5 md:p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] animate-in fade-in slide-in-from-left duration-300">
                                <p className="text-[11px] md:text-xs text-slate-800 dark:text-slate-100 font-medium">Pronto! Lançado em "Alimentação". ✅</p>
                                <p className="text-[7px] md:text-[8px] text-slate-400 text-right mt-1">14:03</p>
                             </div>
                           )}
                        </div>
                        <div className="p-3 md:p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                           <div className="flex-1 h-8 md:h-10 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                           <div className="w-8 h-8 md:w-10 md:h-10 bg-[#075e54] rounded-full flex items-center justify-center text-white">
                              <span className="material-icons text-sm md:text-xl">send</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
            <div className="w-full lg:w-1/2 space-y-6 md:space-y-8 order-1 lg:order-2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 text-emerald-500 font-bold uppercase text-[10px] md:text-xs tracking-widest">
                 <span className="material-icons text-sm">chat_bubble</span> WhatsApp AI
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                Seu negócio <span className="text-emerald-500">na palma da mão.</span>
              </h2>
              <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                Registre gastos e consulte saldo diretamente pelo WhatsApp. Praticidade total para o seu dia a dia.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-left">
                {[
                  'Lançamento por voz ou texto',
                  'Consulta de saldo instantânea',
                  'Envio de PDF de recibos',
                  'Alertas de guias vencendo'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-xs md:text-sm">
                    <span className="material-icons text-emerald-500 text-base md:text-xl">check_circle</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TOOLS SECTION */}
      <section id="tools" className="py-16 md:py-24 px-4 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4">HUB de Ferramentas</h2>
          <p className="text-slate-400 text-base md:text-lg">Utilitários que passam mais profissionalismo para seus clientes.</p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {tools.map((tool, i) => (
            <div key={i} className="p-8 md:p-10 rounded-[24px] md:rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group flex flex-col items-center md:items-start text-center md:text-left">
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${tool.color} flex items-center justify-center mb-6 md:mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                <span className="material-icons text-3xl md:text-4xl">{tool.icon}</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">{tool.title}</h3>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-6 md:mb-8">{tool.desc}</p>
              <button onClick={onGetStarted} className="text-white font-bold flex items-center gap-2 hover:gap-3 transition-all mt-auto">
                 Acessar Agora <span className="material-icons text-sm">arrow_forward</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-slate-950 pt-16 md:pt-20 pb-10 px-4 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto text-center md:text-left">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-16">
            <div className="md:col-span-2 space-y-6">
               <img 
                src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
                alt="Regular MEI" 
                className="h-8 md:h-10 w-auto dark:brightness-0 dark:invert mx-auto md:mx-0"
              />
              <p className="text-slate-500 max-w-sm mx-auto md:mx-0 text-sm md:text-base">A plataforma definitiva para o microempreendedor individual que deseja crescer com segurança e organização.</p>
              <div className="flex justify-center md:justify-start gap-4">
                 {['facebook', 'instagram', 'youtube', 'linkedin'].map(social => (
                   <a key={social} href="#" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-all">
                     <span className="material-icons text-xl">group</span>
                   </a>
                 ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4 md:mb-6 uppercase text-[10px] md:text-xs tracking-widest">Produto</h4>
              <ul className="space-y-3 md:space-y-4 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                <li><button onClick={() => scrollToSection('dashboard')} className="hover:text-primary">Funcionalidades</button></li>
                <li><button onClick={() => scrollToSection('whatsapp')} className="hover:text-primary">WhatsApp AI</button></li>
                <li><button onClick={() => scrollToSection('tools')} className="hover:text-primary"> HUB de Ferramentas</button></li>
                <li><button onClick={onViewBlog} className="hover:text-primary">Blog & Notícias</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4 md:mb-6 uppercase text-[10px] md:text-xs tracking-widest">Suporte</h4>
              <ul className="space-y-3 md:space-y-4 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-primary">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-primary">Privacidade</a></li>
                <li><a href="#" className="hover:text-primary">Contato</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t border-slate-100 dark:border-slate-900 text-center">
             <p className="text-[10px] md:text-sm text-slate-400">© {new Date().getFullYear()} Regular MEI. Todos os direitos reservados. Feito com ❤️ para quem empreende.</p>
          </div>
        </div>
      </footer>

      {/* REMOVED TYPEBOT MODAL */}
    </div>
  );
};

export default LandingPage;