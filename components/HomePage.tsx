import React from 'react';

interface HomePageProps {
  onNavigateToClientArea: () => void;
  onNavigateToServices: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigateToClientArea, onNavigateToServices }) => {
  const handleScrollToServices = (e: React.MouseEvent) => {
    e.preventDefault();
    const servicesElement = document.getElementById('servicos');
    if (servicesElement) servicesElement.scrollIntoView({ behavior: 'smooth' });
    onNavigateToServices();
  };
  
  const handleScrollToPlatform = (e: React.MouseEvent) => {
    e.preventDefault();
    const platformElement = document.getElementById('plataforma');
    if (platformElement) platformElement.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
      {/* Header */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-[#f0f2f5] dark:border-slate-800 sticky top-0 z-50">
        <div className="layout-container flex justify-center w-full">
          <header className="px-4 md:px-10 py-3 w-full max-w-[1280px] flex items-center justify-between whitespace-nowrap">
            <div className="flex items-center gap-4 text-text-main dark:text-white">
              <a className="block h-10 md:h-12" href="#">
                <img 
                  alt="Logo Regular MEI" 
                  className="h-full w-auto object-contain" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOkCZpC8MG5GqfP6nd1uh9DELiDOJzDT0jSKL3PeNjs7v96DXykf9SCMoB0zUPkdj9bF4gq4C9qugb-tq1CqDjucn2sEBuaYIELId1BTupf5jE3oRJhc7nJC-JOUXpbN4m97ZHZmqF9O3eYwlWOFPH3Udn0fS8JWCJNKI8XCxi6j6C4ACDaEtfa5z0fcNtK_torXE4FgBK3Jnfqy002ZWAKYpcqhFDrnUDd0nWFeyYQ-o1ThOYATPz74FDXabGGejmLEm6sN9hk_gc8yTCSd_b1cbX5G909vRctolEiDUfnAu0LhUtO5Sxqpy8G9kEo_bPMdcW6u7kWOwg7I5PGT8MZpk4mA57I2lebXis3E53sQ0D75DM5dm4pUomf3FQ"
                />
              </a>
            </div>
            <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
              <nav className="flex items-center gap-9">
                <a className="text-text-main dark:text-gray-200 text-sm font-medium hover:text-primary transition-colors" href="#">Início</a>
                <a className="text-text-main dark:text-gray-200 text-sm font-medium hover:text-primary transition-colors" href="#servicos" onClick={handleScrollToServices}>Serviços</a>
                <a className="text-text-main dark:text-gray-200 text-sm font-medium hover:text-primary transition-colors" href="#plataforma" onClick={handleScrollToPlatform}>Plataforma</a>
                <a className="text-text-main dark:text-gray-200 text-sm font-medium hover:text-primary transition-colors" href="https://wa.me/553199664201" target="_blank" rel="noopener noreferrer">Contato</a>
              </nav>
              <div className="flex gap-2">
                <button 
                  onClick={onNavigateToClientArea}
                  className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-6 bg-primary hover:bg-primary/90 transition-colors text-white text-sm font-bold tracking-[0.015em]"
                >
                  <span className="truncate">Área do Cliente</span>
                </button>
              </div>
            </div>
            {/* Mobile Menu Icon (Placeholder) */}
            <div className="md:hidden text-text-main dark:text-white">
              <span className="material-symbols-outlined text-3xl">menu</span>
            </div>
          </header>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="flex flex-col bg-background-light dark:bg-background-dark">
        <div className="layout-container flex grow flex-col justify-center items-center">
          <div className="px-4 md:px-10 py-10 w-full max-w-[1280px]">
            <div className="@container">
              <div className="flex flex-col gap-10 lg:flex-row items-center">
                {/* Hero Content */}
                <div className="flex flex-col gap-6 lg:w-1/2 justify-center lg:pr-10">
                  <div className="flex flex-col gap-4 text-left">
                    <h1 className="text-text-main dark:text-white text-4xl font-black leading-tight tracking-[-0.033em] md:text-5xl lg:text-6xl">
                      Regularize e turbine o seu MEI em poucos cliques
                    </h1>
                    <h2 className="text-text-muted dark:text-gray-400 text-lg font-normal leading-relaxed">
                      Assessoria empresarial completa: Declaração anual, parcelamentos e gestão financeira inteligente para você focar no que importa: crescer.
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a 
                      href="https://wa.me/553199664201" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-primary hover:bg-primary/90 transition-colors text-white text-base font-bold tracking-[0.015em]"
                    >
                      <span className="truncate">Falar com Consultor</span>
                    </a>
                    <button 
                      onClick={handleScrollToServices}
                      className="flex cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-white border border-gray-200 hover:bg-gray-50 text-text-main text-base font-bold tracking-[0.015em]"
                    >
                      <span className="truncate">Ver Serviços</span>
                    </button>
                  </div>
                </div>
                {/* Hero Image */}
                <div className="w-full lg:w-1/2 aspect-video lg:aspect-square max-h-[500px] rounded-xl overflow-hidden shadow-xl">
                  <div 
                    className="w-full h-full bg-center bg-no-repeat bg-cover" 
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCCm53jg2oJVEdV_Cn-iMooFZtMS1jyMUhrYUQpDA9sn0ZlV779A3wqzl_W8CSmkdvjzPIgjcyEErfI4ESue2xczfWXMa1FRijHMwoUL9tmVoTN62P1pfZZu2wZtazYoZi7lRa4FtdejX9htGJwsImmPH6UJ1U3veCu59KOPjLH7XpQQrQ7cP1j4OswRAL4y3elBI4gxpLyPXhdXLOopEeyvKdG9vUC85MLLz_JtaZDW7m9L1fZvNUIKBDLzcZO1L_NmOAEw5NFXXE")' }}
                  >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Section Header */}
      <div className="flex justify-center py-5 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800" id="servicos">
        <div className="px-4 md:px-10 w-full max-w-[1280px] flex flex-col items-center text-center">
          <span className="text-secondary font-bold tracking-wider uppercase text-sm mb-2">Serviços Especializados</span>
          <h2 className="text-text-main dark:text-white text-3xl md:text-4xl font-bold leading-tight tracking-[-0.015em] max-w-2xl">
            Tudo que o seu MEI precisa em um só lugar
          </h2>
          <p className="text-text-muted dark:text-gray-400 mt-4 max-w-xl text-lg">
            Deixe a burocracia complexa com nossos especialistas e garanta a regularidade do seu CNPJ.
          </p>
        </div>
      </div>
      
      {/* Services Grid */}
      <div className="flex justify-center pb-20 pt-10 bg-white dark:bg-slate-900">
        <div className="px-4 md:px-10 w-full max-w-[1280px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="flex flex-col gap-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-background-light dark:bg-slate-800 p-6 hover:shadow-lg transition-shadow group">
              <div className="bg-white dark:bg-slate-700 w-12 h-12 rounded-lg flex items-center justify-center shadow-sm text-secondary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[28px]">description</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-text-main dark:text-white text-xl font-bold">Declaração Anual (DASN)</h3>
                <p className="text-text-muted dark:text-gray-400 text-sm leading-relaxed">
                  Mantenha sua empresa em dia com a Receita Federal evitando multas e bloqueios. Fazemos sua declaração completa.
                </p>
              </div>
            </div>
            {/* Card 2 */}
            <div className="flex flex-col gap-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-background-light dark:bg-slate-800 p-6 hover:shadow-lg transition-shadow group">
              <div className="bg-white dark:bg-slate-700 w-12 h-12 rounded-lg flex items-center justify-center shadow-sm text-secondary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[28px]">storefront</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-text-main dark:text-white text-xl font-bold">Abertura MEI</h3>
                <p className="text-text-muted dark:text-gray-400 text-sm leading-relaxed">
                  Quer formalizar seu negócio? Realizamos todo o processo de abertura do seu CNPJ MEI de forma rápida e segura.
                </p>
              </div>
            </div>
            {/* Card 3 */}
            <div className="flex flex-col gap-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-background-light dark:bg-slate-800 p-6 hover:shadow-lg transition-shadow group">
              <div className="bg-white dark:bg-slate-700 w-12 h-12 rounded-lg flex items-center justify-center shadow-sm text-secondary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[28px]">payments</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-text-main dark:text-white text-xl font-bold">Parcelamento de Débitos</h3>
                <p className="text-text-muted dark:text-gray-400 text-sm leading-relaxed">
                  Regularize suas dívidas ativas com parcelas que cabem no seu bolso. Negociamos diretamente com o governo.
                </p>
              </div>
            </div>
            {/* Card 4 */}
            <div className="flex flex-col gap-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-background-light dark:bg-slate-800 p-6 hover:shadow-lg transition-shadow group">
              <div className="bg-white dark:bg-slate-700 w-12 h-12 rounded-lg flex items-center justify-center shadow-sm text-secondary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[28px]">search</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-text-main dark:text-white text-xl font-bold">Consulta de Débitos</h3>
                <p className="text-text-muted dark:text-gray-400 text-sm leading-relaxed">
                  Verifique pendências financeiras e cadastrais do seu CNPJ. Diagnóstico completo da saúde fiscal do seu MEI.
                </p>
              </div>
            </div>
            {/* Card 5 */}
            <div className="flex flex-col gap-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-background-light dark:bg-slate-800 p-6 hover:shadow-lg transition-shadow group">
              <div className="bg-white dark:bg-slate-700 w-12 h-12 rounded-lg flex items-center justify-center shadow-sm text-secondary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[28px]">manage_accounts</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-text-main dark:text-white text-xl font-bold">Alteração Cadastral</h3>
                <p className="text-text-muted dark:text-gray-400 text-sm leading-relaxed">
                  Mudou de endereço ou atividade? Atualize os dados da sua empresa facilmente sem sair de casa.
                </p>
              </div>
            </div>
            {/* Card 6 */}
            <div className="flex flex-col gap-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-background-light dark:bg-slate-800 p-6 hover:shadow-lg transition-shadow group">
              <div className="bg-white dark:bg-slate-700 w-12 h-12 rounded-lg flex items-center justify-center shadow-sm text-secondary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[28px]">cancel</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-text-main dark:text-white text-xl font-bold">Cancelamento MEI</h3>
                <p className="text-text-muted dark:text-gray-400 text-sm leading-relaxed">
                  Precisa encerrar as atividades? Faça a baixa do seu CNPJ legalmente e evite cobranças futuras indevidas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Platform Feature Section */}
      <div className="flex flex-col bg-background-light dark:bg-background-dark py-16" id="plataforma">
        <div className="layout-container flex grow flex-col justify-center items-center">
          <div className="px-4 md:px-10 w-full max-w-[1280px]">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              {/* Left Content */}
              <div className="flex flex-col gap-8 lg:w-1/2">
                <div className="flex flex-col gap-4">
                  <span className="bg-secondary/10 text-secondary w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Novidade Exclusiva</span>
                  <h2 className="text-text-main dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                    Plataforma Financeira Integrada com IA
                  </h2>
                  <p className="text-text-muted dark:text-gray-400 text-lg leading-relaxed">
                    Tenha o controle total do seu negócio. Nossa plataforma exclusiva oferece ferramentas poderosas para simplificar sua gestão financeira e operacional.
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-primary">
                      <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-main dark:text-white">Dashboard Completo</h4>
                      <p className="text-sm text-text-muted dark:text-gray-400">Visualize seus ganhos, gastos e previsões em tempo real.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-primary">
                      <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-main dark:text-white">Fluxo de Caixa</h4>
                      <p className="text-sm text-text-muted dark:text-gray-400">Organize suas finanças dia a dia com categorização automática.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-primary">
                      <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-text-main dark:text-white">Assistente IA no WhatsApp</h4>
                      <p className="text-sm text-text-muted dark:text-gray-400">Tire dúvidas, emita guias DAS e gerencie tarefas enviando uma mensagem no Zap.</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onNavigateToClientArea}
                  className="flex w-fit cursor-pointer items-center justify-center rounded-lg h-12 px-8 bg-primary hover:bg-primary/90 transition-colors text-white text-base font-bold shadow-lg shadow-primary/30 mt-4"
                >
                  <span className="truncate">Conhecer a Plataforma</span>
                </button>
              </div>
              {/* Right Grid Images */}
              <div className="lg:w-1/2 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-4 mt-8">
                  <div 
                    className="w-full bg-center bg-no-repeat bg-cover rounded-xl aspect-[4/5] shadow-lg" 
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD4705GTk2ZtutXMcUBhH8V3gdOCYo_QIddzSgrAtKIgIN9qsmbJlSxEZpzvXlZJHHVZi4qQMabjrC5pP50OzwoRCY5wDAECAUyamabuij2N4dyZSv--dD7v6UKnf8acOI9k1dVMUZnJsDIXpZdloGfnShYKh-vxzbx0VE1egpLrYtP9Ze5hYQcrki0wMVELJ-QewCCbT5v4ncMD4L81dMVB_-3hyGzY10TzRqnentbxO_h3HtgcTPg6__-uJ3cW7zapXuS5r2pqq4")' }}
                  >
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700">
                    <span className="material-symbols-outlined text-secondary mb-2">notifications_active</span>
                    <p className="font-bold text-text-main dark:text-white text-sm">Lembretes Automáticos</p>
                    <p className="text-xs text-text-muted dark:text-gray-400">Nunca mais perca o vencimento do DAS.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700">
                    <span className="material-symbols-outlined text-green-500 mb-2">chat</span>
                    <p className="font-bold text-text-main dark:text-white text-sm">IA no WhatsApp</p>
                    <p className="text-xs text-text-muted dark:text-gray-400">Atendimento 24h para seu MEI.</p>
                  </div>
                  <div 
                    className="w-full bg-center bg-no-repeat bg-cover rounded-xl aspect-[4/5] shadow-lg" 
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDwrtKgm8dO6FwOf7nP7oej-HNd5NOqRv-p4TwDfVBS-J0tQmm3JbHLUgcNVJFmoEDrgMEoerkXihLyRtrHXBRpSrJvsSEkxIIO_E5WSlFMk6TbVPu5BNCooys69imue07xpaaOG6P0Wgqc7kTfhNms_IvUEXs4a0o4eyVtXH6QZHmn8YdFz3nKGMMuixzkDVYpYU0WzNmtSNPfyQhzJcDgZKHo-ZloCewv9P7iD66q-LTkke7GoJjuSlAYm0zUaKwuMAYy0JpUUP4")' }}
                  >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 py-10 px-4 md:px-10">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img 
              alt="Regular MEI Footer Logo" 
              className="h-8 w-auto grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBh4Qlc-fdsyzc_jxcUTdwnLDGHbkZzWlWOFPH3Udn0fS8JWCJNKI8XCxi6j6C4ACDaEtfa5z0fcNtK_torXE4FgBK3Jnfqy002ZWAKYpcqhFDrnUDd0nWFeyYQ-o1ThOYATPz74FDXabGGejmLEm6sN9hk_gc8yTCSd_b1cbX5G909vRctolEiDUfnAu0LhUtO5Sxqpy8G9kEo_bPMdcW6u7kWOwg7I5PGT8MZpk4mA57I2lebXis3E53sQ0D75DM5dm4pUomf3FQ"
            />
          </div>
          <div className="text-text-muted dark:text-gray-500 text-sm text-center md:text-right">
            <p>© 2024 Regular MEI. Todos os direitos reservados.</p>
            <div className="flex gap-4 justify-center md:justify-end mt-2">
              <a className="hover:text-primary transition-colors" href="#" onClick={(e) => { e.preventDefault(); onNavigateToClientArea(); }}>Termos de Uso</a>
              <a className="hover:text-primary transition-colors" href="#" onClick={(e) => { e.preventDefault(); onNavigateToClientArea(); }}>Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Floating WhatsApp Button */}
      <a className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full p-3 shadow-lg transition-transform hover:scale-110 flex items-center justify-center" href="https://wa.me/553199664201" target="_blank" rel="noopener noreferrer">
        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path>
        </svg>
      </a>
    </div>
  );
};

export default HomePage;