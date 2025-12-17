import React from 'react';

interface NewsEditorProps {
  value: string;
  onChange: (content: string) => void;
}

const NewsEditor: React.FC<NewsEditorProps> = ({ value, onChange }) => {
  return (
    <div className="w-full">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        className="w-full p-4 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none resize-y"
        placeholder="Escreva o conteúdo do artigo aqui. Você pode usar HTML básico se necessário."
      />
    </div>
  );
};

export default NewsEditor;