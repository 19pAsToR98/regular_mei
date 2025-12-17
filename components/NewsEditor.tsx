import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles

interface NewsEditorProps {
  value: string;
  onChange: (content: string) => void;
}

// Configuração dos módulos e botões do editor
const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
    ['clean'] // Remove formatação
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet',
  'link', 'image'
];

const NewsEditor: React.FC<NewsEditorProps> = ({ value, onChange }) => {
  return (
    <div className="quill-editor-container dark:bg-slate-800 dark:text-white">
      <ReactQuill 
        theme="snow" 
        value={value} 
        onChange={onChange} 
        modules={modules}
        formats={formats}
        placeholder="Escreva o conteúdo do artigo aqui. Use os botões acima para formatar."
        className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
      />
    </div>
  );
};

export default NewsEditor;