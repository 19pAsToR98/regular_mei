import React, { useRef } from 'react';
import { NewsItem } from '../types';

interface PublicNewsSliderProps {
  news: NewsItem[];
  onViewNews: (id: number) => void;
}

const PublicNewsSlider: React.FC<PublicNewsSliderProps> = ({ news, onViewNews }) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  // Filter only published news
  const publishedNews = news.filter(item => item.status === 'published');

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (publishedNews.length === 0) {
    return (
      <div className="text-center p-6 text-slate-400">
        Nenhuma notícia publicada no momento.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-end items-center mb-4 px-1">
        <div className="flex gap-2">
          <button 
            onClick={scrollLeft}
            className="p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary hover:border-primary dark:hover:border-primary transition-all shadow-sm"
          >
            <span className="material-icons text-xl">chevron_left</span>
          </button>
          <button 
            onClick={scrollRight}
            className="p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary hover:border-primary dark:hover:border-primary transition-all shadow-sm"
          >
            <span className="material-icons text-xl">chevron_right</span>
          </button>
        </div>
      </div>
      
      <div 
          ref={sliderRef}
          className="flex overflow-x-auto gap-5 pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
          {publishedNews.map((item) => (
          <div 
              key={item.id} 
              onClick={() => onViewNews(item.id)}
              className="flex-shrink-0 w-72 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow snap-start group cursor-pointer"
          >
              {/* Image Container */}
              <div className="h-36 overflow-hidden relative">
              <img 
                  src={item.imageUrl} 
                  alt={item.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800 bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg shadow-sm">
                  {item.category}
                  </span>
              </div>
              </div>
              
              <div className="p-4 flex flex-col">
              <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1">
                  <span className="material-icons text-sm">calendar_today</span> {item.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                      <span className="material-icons text-sm">schedule</span> {item.readTime}
                  </span>
              </div>

              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 leading-snug group-hover:text-primary transition-colors">
                  {item.title}
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-2">
                  {item.excerpt}
              </p>
              </div>
          </div>
          ))}
      </div>
    </div>
  );
};

export default PublicNewsSlider;