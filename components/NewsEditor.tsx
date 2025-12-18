import React, { useMemo, useRef } from 'react';
import JoditEditor from 'jodit-react';

interface NewsEditorProps {
  value: string;
  onChange: (content: string) => void;
}

const NewsEditor: React.FC<NewsEditorProps> = ({ value, onChange }) => {
  const editor = useRef(null);

  // Configuração do Jodit
  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: 'Escreva o conteúdo do artigo aqui...',
      height: 400,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
      buttons: [
        'bold', 'italic', 'underline', '|',
        'ul', 'ol', '|',
        'fontsize', 'paragraph', 'align', '|',
        'link', 'image', 'video', 'hr', '|',
        'source', 'fullsize'
      ],
      buttonsMD: [
        'bold', 'italic', 'underline', '|',
        'ul', 'ol', '|',
        'link', 'image', 'video', '|',
        'source'
      ],
      buttonsSM: [
        'bold', 'italic', '|',
        'ul', 'ol', '|',
        'link', 'image', '|',
        'source'
      ],
      buttonsXS: [
        'bold', 'italic', '|',
        'link', 'image', '|',
        'source'
      ],
      // Remove o botão de upload de arquivo para simplificar
      uploader: {
        insertImageAsBase64URI: true,
      },
      filebrowser: {
        ajax: {
          url: 'https://xdsoft.net/jodit/connector/index.php'
        }
      }
    }),
    []
  );

  // O Jodit usa um evento onChange que retorna o novo conteúdo HTML
  const handleEditorChange = (newContent: string) => {
    onChange(newContent);
  };

  return (
    <div className="w-full shadow-sm">
      <JoditEditor
        ref={editor}
        value={value}
        config={config}
        onBlur={handleEditorChange} // Atualiza o estado no blur para evitar re-renderizações excessivas
        onChange={handleEditorChange} // Atualiza o estado no change
      />
    </div>
  );
};

export default NewsEditor;