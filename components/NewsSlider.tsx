
import React, { useRef } from 'react';
import { NewsItem } from '../types';

interface NewsSliderProps {
  news: NewsItem[];
  onViewNews: (id: number) => void;
}

const NewsSlider: React.FC<NewsSliderProps> = ({ news, onViewNews }) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  // Filter only published news for the dashboard
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

  return (
    <div className="col-span-12">
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Últimas Notícias</h3>
        
        <div className="flex items-center gap-4">
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
      </div>
      
      {publishedNews.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 text-center text-slate-500 border border-slate-200 dark:border-slate-800">
           Nenhuma notícia publicada no momento.
        </div>
      ) : (
        <div 
            ref={sliderRef}
            className="flex overflow-x-auto gap-5 pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            {publishedNews.map((item) => (
            <div 
                key={item.id} 
                onClick={() => onViewNews(item.id)}
                className="flex-shrink-0 w-72 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer snap-start group"
            >
                {/* Image Container */}
                <div className="h-40 overflow-hidden relative">
                <img 
                    src={item.imageUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
                    {item.category}
                    </span>
                </div>
                </div>
                
                <div className="p-4 flex flex-col h-[calc(100%-10rem)]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="material-icons text-[14px]">schedule</span>
                    {item.date}
                    </span>
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-white text-sm leading-snug line-clamp-3 mb-3 group-hover:text-primary transition-colors flex-grow">
                    {item.title}
                </h4>
                <p className="text-xs font-medium text-primary mt-auto flex items-center gap-1 group-hover:gap-2 transition-all">
                    Ler notícia <span className="material-icons text-xs">arrow_forward</span>
                </p>
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default NewsSlider;
