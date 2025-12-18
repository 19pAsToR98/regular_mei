import React, { useState, useMemo } from 'react';
import { Offer } from '../types';

interface OffersPageProps {
  offers: Offer[];
}

const categories = ['Todas', 'Finanças', 'Software', 'Educação', 'Saúde', 'Equipamentos', 'Serviços'];

// Helper function to calculate days remaining
const getDaysRemaining = (dateStr: string | null | undefined): number | null => {
    if (!dateStr) return null;
    const expiry = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 ? diffDays : -1; // -1 for expired
};

const OffersPage: React.FC<OffersPageProps> = ({ offers }) => {
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Filter out expired offers and sort by featured/exclusive/expiry date
  const filteredOffers = useMemo(() => {
      const now = new Date().getTime();
      
      return offers
          .filter(offer => {
              // Filter by category
              const matchesCategory = selectedCategory === 'Todas' || offer.category === selectedCategory;
              
              // Filter out expired offers based on expiryDate
              if (offer.expiryDate) {
                  const expiryTime = new Date(offer.expiryDate).getTime();
                  if (expiryTime < now) return false;
              }
              
              return matchesCategory;
          })
          .sort((a, b) => {
              // Sort by Featured (highest priority)
              if (a.isFeatured && !b.isFeatured) return -1;
              if (!a.isFeatured && b.isFeatured) return 1;
              
              // Sort by Exclusive (secondary priority)
              if (a.isExclusive && !b.isExclusive) return -1;
              if (!a.isExclusive && b.isExclusive) return 1;
              
              // Sort by Expiry Date (closest first)
              if (a.expiryDate && b.expiryDate) {
                  return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
              }
              if (a.expiryDate) return -1;
              if (b.expiryDate) return 1;
              
              return 0;
          });
  }, [offers, selectedCategory]);

  // Find featured offer (prioritize explicit 'isFeatured', otherwise take the first exclusive one)
  const featuredOffer = filteredOffers.find(o => o.isFeatured) || filteredOffers.find(o => o.isExclusive);

  const handleCopy = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      
      {/* Featured Banner */}
      {featuredOffer && (
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-10 text-white overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full translate-y-1/3 -translate-x-1/4 blur-xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-4 max-w-xl">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-semibold border border-white/10">
                Oferta em Destaque
              </span>
              <h3 className="text-2xl md:text-4xl font-bold leading-tight">
                {featuredOffer.title} <br/> <span className="text-yellow-300">{featuredOffer.discount}</span>
              </h3>
              <p className="text-blue-100 text-lg">
                {featuredOffer.description}
              </p>
              <a 
                href={featuredOffer.link || '#'} 
                className="inline-flex bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-bold shadow-sm transition-colors items-center gap-2"
              >
                Resgatar Oferta
                <span className="material-icons text-sm">arrow_forward</span>
              </a>
            </div>
            <div className="hidden md:flex items-center justify-center bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/10">
               <span className="material-icons text-6xl text-white">{featuredOffer.partnerIcon}</span>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
              ${selectedCategory === cat 
                ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white shadow-md' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOffers.map((offer) => {
            const daysRemaining = getDaysRemaining(offer.expiryDate);
            
            return (
            <div key={offer.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden relative group">
            
            {/* Exclusive Ribbon */}
            {offer.isExclusive && (
              <div className="absolute top-0 right-0">
                <div className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm uppercase tracking-wide z-10">
                  Exclusivo
                </div>
              </div>
            )}

            {/* Card Body */}
            <div className="p-6 flex-grow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${offer.partnerColor} flex items-center justify-center text-white shadow-sm`}>
                  <span className="material-icons text-2xl">{offer.partnerIcon}</span>
                </div>
                <div className="text-right">
                  <span className="block text-2xl font-bold text-slate-800 dark:text-white">{offer.discount}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">{offer.category}</span>
                </div>
              </div>
              
              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{offer.title}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                {offer.description}
              </p>
            </div>

            {/* Card Footer (Action Area) */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-700 border-dashed relative">
              {/* Decorative Circles for Coupon look */}
              <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-background-light dark:bg-background-dark rounded-full"></div>
              <div className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-background-light dark:bg-background-dark rounded-full"></div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-slate-400 font-medium">
                  {daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7 ? (
                      <span className="text-red-500 font-bold flex items-center gap-1">
                          <span className="material-icons text-sm">schedule</span>
                          Expira em {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''}
                      </span>
                  ) : (
                      offer.expiryText
                  )}
                </div>
                
                {offer.code ? (
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-1 pl-3 shadow-sm w-full max-w-[180px]">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm truncate flex-grow text-center tracking-wider">
                      {offer.code}
                    </span>
                    <button 
                      onClick={() => handleCopy(offer.code!, offer.id)}
                      className={`p-1.5 rounded-md transition-all ${copiedId === offer.id ? 'bg-green-100 text-green-600' : 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-500'}`}
                      title="Copiar código"
                    >
                      <span className="material-icons text-sm">
                        {copiedId === offer.id ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                ) : (
                  <a 
                    href={offer.link} 
                    className="flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors w-full max-w-[180px]"
                  >
                    Ativar Oferta
                    <span className="material-icons text-sm">open_in_new</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
};

export default OffersPage;