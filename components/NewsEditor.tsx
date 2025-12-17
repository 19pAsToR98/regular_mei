import React, { useCallback, useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Youtube from '@tiptap/extension-youtube';

interface NewsEditorProps {
  value: string;
  onChange: (content: string) => void;
}

const MenuBar: React.FC<{ editor: Editor | null, toggleHtmlView: () => void, isHtmlView: boolean }> = ({ editor, toggleHtmlView, isHtmlView }) => {
  if (!editor) {
    return null;
  }

  const buttonClass = (isActive: boolean) => 
    `p-2 rounded transition-colors ${
      isActive ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`;
    
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('URL da Imagem');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);
  
  const addYoutubeVideo = useCallback(() => {
    const url = window.prompt('URL do YouTube');

    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: 640,
        height: 480,
      });
    }
  }, [editor]);

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-t-lg">
      
      {/* Basic Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive('bold'))}
        title="Negrito"
      >
        <span className="material-icons text-lg">format_bold</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive('italic'))}
        title="Itálico"
      >
        <span className="material-icons text-lg">format_italic</span>
      </button>
      
      {/* Headings */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 2 }))}
        title="Título (H2)"
      >
        <span className="material-icons text-lg">title</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 3 }))}
        title="Subtítulo (H3)"
      >
        <span className="material-icons text-lg">format_size</span>
      </button>

      {/* Lists & Blockquote */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive('bulletList'))}
        title="Lista"
      >
        <span className="material-icons text-lg">format_list_bulleted</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editor.isActive('orderedList'))}
        title="Lista Numerada"
      >
        <span className="material-icons text-lg">format_list_numbered</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={buttonClass(editor.isActive('blockquote'))}
        title="Citação"
      >
        <span className="material-icons text-lg">format_quote</span>
      </button>
      
      {/* Alignment */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={buttonClass(editor.isActive({ textAlign: 'left' }))}
        title="Alinhar à Esquerda"
      >
        <span className="material-icons text-lg">format_align_left</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={buttonClass(editor.isActive({ textAlign: 'center' }))}
        title="Alinhar ao Centro"
      >
        <span className="material-icons text-lg">format_align_center</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={buttonClass(editor.isActive({ textAlign: 'right' }))}
        title="Alinhar à Direita"
      >
        <span className="material-icons text-lg">format_align_right</span>
      </button>

      {/* Media */}
      <button
        type="button"
        onClick={addImage}
        className={buttonClass(editor.isActive('image'))}
        title="Adicionar Imagem"
      >
        <span className="material-icons text-lg">image</span>
      </button>
      <button
        type="button"
        onClick={addYoutubeVideo}
        className={buttonClass(editor.isActive('youtube'))}
        title="Adicionar Vídeo do YouTube"
      >
        <span className="material-icons text-lg">smart_display</span>
      </button>
      
      {/* Link */}
      <button
        type="button"
        onClick={setLink}
        className={buttonClass(editor.isActive('link'))}
        title="Adicionar Link"
      >
        <span className="material-icons text-lg">link</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
        className={buttonClass(false)}
        title="Remover Link"
      >
        <span className="material-icons text-lg">link_off</span>
      </button>

      {/* HTML Toggle */}
      <button
        type="button"
        onClick={toggleHtmlView}
        className={`ml-auto ${buttonClass(isHtmlView)}`}
        title="Alternar para HTML"
      >
        <span className="material-icons text-lg">code</span>
      </button>
    </div>
  );
};

const NewsEditor: React.FC<NewsEditorProps> = ({ value, onChange }) => {
  const [isHtmlView, setIsHtmlView] = useState(false);
  const [htmlContent, setHtmlContent] = useState(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        horizontalRule: false,
        hardBreak: true,
      }),
      Heading.configure({
        levels: [2, 3],
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Youtube.configure({
        controls: false,
        nocookie: true,
        modestBranding: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const newHtml = editor.getHTML();
      setHtmlContent(newHtml);
      onChange(newHtml);
    },
    editorProps: {
        attributes: {
            class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4',
        },
    },
  });

  // Sync external value changes (e.g., when editing a different news item)
  React.useEffect(() => {
    if (editor && editor.getHTML() !== value && !isHtmlView) {
        editor.commands.setContent(value, false);
        setHtmlContent(value);
    }
  }, [value, editor, isHtmlView]);
  
  // Handle HTML view toggle
  const toggleHtmlView = () => {
      if (isHtmlView) {
          // Switching back to visual editor: update TipTap content from textarea
          editor?.commands.setContent(htmlContent);
          onChange(htmlContent);
      } else {
          // Switching to HTML view: get current HTML from TipTap
          setHtmlContent(editor?.getHTML() || '');
      }
      setIsHtmlView(!isHtmlView);
  };
  
  // Handle manual HTML input change
  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setHtmlContent(e.target.value);
      onChange(e.target.value);
  };

  return (
    <div className="w-full border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
      <MenuBar editor={editor} toggleHtmlView={toggleHtmlView} isHtmlView={isHtmlView} />
      
      {isHtmlView ? (
          <textarea
              value={htmlContent}
              onChange={handleHtmlChange}
              rows={10}
              className="w-full p-4 font-mono text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none resize-y min-h-[200px]"
              placeholder="Edição HTML bruta..."
          />
      ) : (
          <EditorContent editor={editor} />
      )}
    </div>
  );
};

export default NewsEditor;