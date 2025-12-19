import React, { useState } from 'react';
import { NewsItem } from '../types';
import { showSuccess, showError } from '../utils/toastUtils';

interface NewsPageProps {
  news: NewsItem[];
  readingId: number | null;
  onSelectNews: (id: number | null) => void;
}

const categories = ['Todas', 'Legislação', 'Finanças', 'Gestão', 'Marketing', 'Benefícios', 'Tecnologia'];

const NewsPage: React.FC<NewsPageProps> = ({ news, readingId, onSelectNews }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const filteredNews = news.filter(item => {
    // Only show published news in the list
    if (item.status === 'draft') return false;

    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Ensure consistent sorting

  // Logic to view a single article
  if (readingId) {
    const article = filteredNews.find(n => n.id === readingId);
    if (!article) {
        const fullArticle = news.find(n => n.id === readingId);
        if (!fullArticle) return <div>Artigo não encontrado.</div>;
    }

    // Find index for navigation
    const currentIndex = filteredNews.findIndex(n => n.id === readingId);
    const prevArticle = currentIndex > 0 ? filteredNews[currentIndex - 1] : null;
    const nextArticle = currentIndex < filteredNews.length - 1 ? filteredNews[currentIndex + 1] : null;
    
    // --- Share Handler ---
    const handleShare = async () => {
        if (!article) return;

        // 1. Construct the public URL
        const baseUrl = window.location.origin;
        const publicUrl = `${baseUrl}/?page=news&articleId=${article.id}`;

        const shareData = {
            title: article.title,
            text: `Leia esta notícia importante para o MEI: ${article.title} - ${article.excerpt}`,
            url: publicUrl,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                showSuccess('Notícia compartilhada com sucesso!');
            } else {
                // Fallback: Copy the public URL to clipboard
                await navigator.clipboard.writeText(`${shareData.title}: ${shareData.url}`);
                showSuccess('Link público copiado para a área de transferência!');
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                showError('Falha ao compartilhar. Tente copiar o link.');
                console.error('Share failed:', err);
            }
        }
    };

    return (
      <div className="max-w-4xl mx-auto p-4 md:p-0">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative h-64 md:h-80 w-full">
             <img src={article?.imageUrl} alt={article?.title} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
             <button 
               onClick={() => onSelectNews(null)}
               className="absolute top-4 left-4 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/30 transition-colors"
             >
               <span className="material-icons text-sm">arrow_back</span> Voltar
             </button>
             <div className="absolute bottom-6 left-6 md:left-10 right-6 text-white">
                <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-md mb-3">
                  {article?.category}
                </span>
                <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-2">{article?.title}</h1>
                <div className="flex items-center gap-4 text-sm text-slate-200">
                   <span className="flex items-center gap-1"><span className="material-icons text-sm">event</span> {article?.date}</span>
                   <span className="flex items-center gap-1"><span className="material-icons text-sm">schedule</span> {article?.readTime}</span>
                </div>
             </div>
          </div>
          
          <div className="p-6 md:p-10">
             <p className="text-lg text-slate-600 dark:text-slate-300 font-medium mb-8 leading-relaxed border-l-4 border-primary pl-4 italic">
               {article?.excerpt}
             </p>
             
             {/* REMOVENDO PROSE E APLICANDO ESTILOS BÁSICOS PARA MANTER O ESPAÇAMENTO DO EDITOR */}
             <div 
               className="text-base text-slate-700 dark:text-slate-300 leading-relaxed space-y-4"
               dangerouslySetInnerHTML={{ __html: article?.content || '' }}
             />

             <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                
                {/* Previous Article Button */}
                {prevArticle ? (
                    <button 
                        onClick={() => onSelectNews(prevArticle.id)}
                        className="text-slate-500 dark:text-slate-400 font-medium hover:text-primary flex items-center gap-2 transition-colors"
                    >
                        <span className="material-icons">chevron_left</span> Artigo Anterior
                    </button>
                ) : (
                    <div className="w-32"></div> // Spacer
                )}

                {/* Share Button */}
                <button 
                    onClick={handleShare}
                    className="text-slate-500 hover:text-primary transition-colors flex items-center gap-2"
                >
                   <span className="material-icons">share</span> Compartilhar
                </button>
                
                {/* Next Article Button */}
                {nextArticle ? (
                    <button 
                        onClick={() => onSelectNews(nextArticle.id)}
                        className="text-slate-500 dark:text-slate-400 font-medium hover:text-primary flex items-center gap-2 transition-colors"
                    >
                        Próximo Artigo <span className="material-icons">chevron_right</span>
                    </button>
                ) : (
                    <div className="w-32"></div> // Spacer
                )}
             </div>
             
             <div className="mt-4 text-center">
                 <button 
                   onClick={() => onSelectNews(null)}
                   className="text-primary font-medium hover:underline flex items-center gap-2 mx-auto"
                >
                   <span className="material-icons text-sm">arrow_upward</span> Voltar para a lista
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      
      {/* Search and Filter Section */}
      <div className="flex flex-col gap-6">
        <div className="relative max-w-2xl">
           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-icons">search</span>
           <input 
              type="text" 
              placeholder="Buscar notícias, dicas ou leis..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm text-lg"
            />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                ${selectedCategory === cat 
                  ? 'bg-primary text-white border-primary shadow-md transform scale-105' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredNews.map((item) => (
          <div 
            key={item.id} 
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col h-full cursor-pointer"
            onClick={() => onSelectNews(item.id)}
          >
            {/* Image */}
            <div className="h-48 overflow-hidden relative">
              <img 
                src={item.imageUrl} 
                alt={item.title}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4">
                 <span className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm">
                  {item.category}
                </span>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                 <span className="flex items-center gap-1">
                   <span className="material-icons text-sm">calendar_today</span> {item.date}
                 </span>
                 <span>•</span>
                 <span className="flex items-center gap-1">
                   <span className="material-icons text-sm">schedule</span> {item.readTime}
                 </span>
              </div>

              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 leading-snug group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 line-clamp-3">
                {item.excerpt}
              </p>

              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                <button className="text-primary font-semibold text-sm flex items-center gap-2 group/btn hover:gap-3 transition-all">
                  Ler artigo completo 
                  <span className="material-icons text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNews.length === 0 && (
         <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
               <span className="material-icons text-4xl text-slate-400">newspaper</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">Nenhuma notícia encontrada</h3>
            <p className="text-slate-500 dark:text-slate-400">Tente buscar por outros termos ou selecione outra categoria.</p>
            <button 
              onClick={() => {setSearchTerm(''); setSelectedCategory('Todas');}}
              className="mt-4 text-primary font-medium hover:underline"
            >
              Limpar filtros
            </button>
         </div>
      )}
    </div>
  );
};

export default NewsPage;