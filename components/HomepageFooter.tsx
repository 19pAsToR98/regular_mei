import React from 'react';

const socialLinks = [
    { icon: 'mail', label: 'Email', href: 'mailto:contato@regularmei.com' },
    { icon: 'phone', label: 'WhatsApp', href: 'https://wa.me/5511999999999' },
    { icon: 'public', label: 'Site', href: 'https://regularmei.com.br' },
];

const quickLinks = [
    { label: 'Termos de Uso', href: '#' },
    { label: 'Política de Privacidade', href: '#' },
    { label: 'Ajuda', href: '#' },
];

const HomepageFooter: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-b border-slate-100 dark:border-slate-800 pb-10 mb-8">
          
          {/* Col 1: Logo & Description */}
          <div className="col-span-2 md:col-span-1">
            <img 
                src="https://regularmei.com.br/wp-content/uploads/2024/07/REGULAR-500-x-200-px.png" 
                alt="Regular MEI" 
                className="h-10 w-auto object-contain dark:brightness-0 dark:invert mb-4"
            />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Assessoria completa e plataforma de gestão para Microempreendedores Individuais.
            </p>
          </div>

          {/* Col 2: Contato */}
          <div>
            <h4 className="text-sm font-bold uppercase text-slate-800 dark:text-white mb-4">Contato</h4>
            <ul className="space-y-3">
              {socialLinks.map(link => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                  >
                    <span className="material-icons text-lg">{link.icon}</span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Links Rápidos */}
          <div>
            <h4 className="text-sm font-bold uppercase text-slate-800 dark:text-white mb-4">Links Rápidos</h4>
            <ul className="space-y-3">
              {quickLinks.map(link => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Newsletter/Social (Placeholder) */}
          <div>
            <h4 className="text-sm font-bold uppercase text-slate-800 dark:text-white mb-4">Siga-nos</h4>
            <div className="flex gap-3 text-slate-500 dark:text-slate-400">
                <a href="#" className="hover:text-primary transition-colors"><span className="material-icons">facebook</span></a>
                <a href="#" className="hover:text-primary transition-colors"><span className="material-icons">alternate_email</span></a>
                <a href="#" className="hover:text-primary transition-colors"><span className="material-icons">share</span></a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          &copy; {new Date().getFullYear()} Regular MEI. Todos os direitos reservados. CNPJ: 00.000.000/0001-00.
        </div>
      </div>
    </footer>
  );
};

export default HomepageFooter;