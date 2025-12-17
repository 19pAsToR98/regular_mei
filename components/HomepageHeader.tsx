import React from 'react';

interface HomepageHeaderProps {
    onNavigateToAuth: () => void;
}

const navLinks = [
    { label: 'Serviços', href: '#services' },
    { label: 'Vantagens', href: '#features' },
    { label: 'Contato', href: '#contact' },
];

const HomepageHeader: React.FC<HomepageHeaderProps> = ({ onNavigateToAuth }) => {
  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 h-[72px] flex items-center px-4 md:px-8 transition-all">
      <div className="max-w-7xl w-full mx-auto flex justify-between items-center">
        
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
            <img 
                src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
                alt="Regular MEI" 
                className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
            />
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <a 
              key={link.href} 
              href={link.href} 
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA Button */}
        <button 
            onClick={onNavigateToAuth}
            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors text-sm"
        >
            <span className="material-icons text-lg">login</span>
            Acessar Dashboard
        </button>
      </div>
    </header>
  );
};

export default HomepageHeader;