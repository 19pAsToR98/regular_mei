import React, { useCallback, useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-align'; // Corrected import name for Tiptap v2
import Youtube from '@tiptap/extension-youtube';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';

interface NewsEditorProps {
  value: string;
  onChange: (content: string) => void;
}

// --- UI COMPONENTS ---

const ToolbarButton: React.FC<{ onClick: () => void, isActive: boolean, title: string, icon: string, disabled?: boolean }> = ({ onClick, isActive, title, icon, disabled = false }) => {
    const baseClass = "p-2 rounded transition-colors text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700";
    const activeClass = "bg-primary text-white hover:bg-primary/90 dark:hover:bg-primary/90";
    const disabledClass = "opacity-50 cursor-not-allowed";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`${baseClass} ${isActive ? activeClass : ''} ${disabled ? disabledClass : ''}`}
            title={title}
        >
            <span className="material-icons text-lg">{icon}</span>
        </button>
    );
};

const HeadingDropdown: React.FC<{ editor: Editor }> = ({ editor }) => {
    const levels = [
        { level: 0, label: 'Parágrafo', icon: 'format_textdirection_l_to_r' },
        { level: 2, label: 'Título 2', icon: 'title' },
        { level: 3, label: 'Título 3', icon: 'format_size' },
        { level: 4, label: 'Título 4', icon: 'format_size' },
    ];

    const activeLevel = editor.isActive('heading') ? editor.getAttributes('heading').level : 0;
    const current = levels.find(l => l.level === activeLevel) || levels[0];

    const handleSelect = (level: number) => {
        if (level === 0) {
            editor.chain().focus().setParagraph().run();
        } else {
            editor.chain().focus().toggleHeading({ level: level as 2 | 3 | 4 }).run();
        }
    };

    return (
        <div className="relative group">
            <button
                type="button"
                className="flex items-center gap-1 px-3 py-2 rounded transition-colors text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-medium"
            >
                <span className="material-icons text-lg">{current.icon}</span>
                <span className="hidden sm:inline">{current.label}</span>
                <span className="material-icons text-sm">expand_more</span>
            </button>
            <div className="absolute left-0 top-full mt-1 z-20 hidden group-hover:block bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 min-w-[150px]">
                {levels.map(l => (
                    <button
                        key={l.level}
                        onClick={() => handleSelect(l.level)}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${editor.isActive('heading', { level: l.level }) || (l.level === 0 && editor.isActive('paragraph')) ? 'bg-primary text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                    >
                        <span className="material-icons text-lg">{l.icon}</span>
                        {l.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

const ColorPicker: React.FC<{ editor: Editor }> = ({ editor }) => {
    const colors = [
        { hex: '#000000', label: 'Preto' },
        { hex: '#EF4444', label: 'Vermelho' },
        { hex: '#F59E0B', label: 'Amarelo' },
        { hex: '#10B981', label: 'Verde' },
        { hex: '#3B82F6', label: 'Azul' },
        { hex: '#8B5CF6', label: 'Roxo' },
    ];

    const handleColorChange = (color: string) => {
        editor.chain().focus().setColor(color).run();
    };
    
    const handleHighlightChange = (color: string) => {
        editor.chain().focus().toggleHighlight({ color }).run();
    };

    return (
        <div className="relative group">
            <ToolbarButton 
                onClick={() => {}} 
                isActive={editor.isActive('textStyle') || editor.isActive('highlight')} 
                title="Cor e Destaque" 
                icon="palette" 
            />
            <div className="absolute left-0 top-full mt-1 z-20 hidden group-hover:block bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-3 min-w-[200px]">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Cor do Texto</p>
                <div className="flex flex-wrap gap-2 mb-4">
                    {colors.map(c => (
                        <button
                            key={c.hex}
                            type="button"
                            onClick={() => handleColorChange(c.hex)}
                            className={`w-6 h-6 rounded-full ring-2 ring-offset-2 ring-transparent hover:ring-slate-400 transition-all`}
                            style={{ backgroundColor: c.hex, borderColor: c.hex }}
                            title={c.label}
                        />
                    ))}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().unsetColor().run()}
                        className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-500"
                        title="Remover Cor"
                    >
                        <span className="material-icons text-sm">close</span>
                    </button>
                </div>
                
                <p className="text-xs font-bold text-slate-500 uppercase mb-2 border-t border-slate-200 dark:border-slate-700 pt-2">Destaque</p>
                <div className="flex flex-wrap gap-2">
                    {colors.filter(c => c.hex !== '#000000').map(c => (
                        <button
                            key={c.hex}
                            type="button"
                            onClick={() => handleHighlightChange(c.hex + '33')} // Add opacity for highlight effect
                            className={`w-6 h-6 rounded-lg ring-2 ring-offset-2 ring-transparent hover:ring-slate-400 transition-all`}
                            style={{ backgroundColor: c.hex + '33', borderColor: c.hex }}
                            title={`Destaque ${c.label}`}
                        />
                    ))}
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().unsetHighlight().run()}
                        className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-500"
                        title="Remover Destaque"
                    >
                        <span className="material-icons text-sm">close</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const MenuBar: React.FC<{ editor: Editor | null, toggleHtmlView: () => void, isHtmlView: boolean }> = ({ editor, toggleHtmlView, isHtmlView }) => {
  if (!editor) {
    return null;
  }

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
      
      {/* Group 1: Headings/Paragraph */}
      <HeadingDropdown editor={editor} />
      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 self-center"></div>

      {/* Group 2: Basic Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Negrito"
        icon="format_bold"
        disabled={!editor.can().chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Itálico"
        icon="format_italic"
        disabled={!editor.can().chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Riscado"
        icon="strikethrough_s"
        disabled={!editor.can().chain().focus().toggleStrike().run()}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Código Inline"
        icon="code"
        disabled={!editor.can().chain().focus().toggleCode().run()}
      />
      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 self-center"></div>

      {/* Group 3: Color & Highlight */}
      <ColorPicker editor={editor} />
      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 self-center"></div>

      {/* Group 4: Lists & Blockquote */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Lista"
        icon="format_list_bulleted"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Lista Numerada"
        icon="format_list_numbered"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Citação"
        icon="format_quote"
      />
      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 self-center"></div>
      
      {/* Group 5: Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Alinhar à Esquerda"
        icon="format_align_left"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Alinhar ao Centro"
        icon="format_align_center"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Alinhar à Direita"
        icon="format_align_right"
      />
      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 self-center"></div>

      {/* Group 6: Media & Links */}
      <ToolbarButton
        onClick={addImage}
        isActive={editor.isActive('image')}
        title="Adicionar Imagem"
        icon="image"
      />
      <ToolbarButton
        onClick={addYoutubeVideo}
        isActive={editor.isActive('youtube')}
        title="Adicionar Vídeo do YouTube"
        icon="smart_display"
      />
      <ToolbarButton
        onClick={setLink}
        isActive={editor.isActive('link')}
        title="Adicionar Link"
        icon="link"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetLink().run()}
        isActive={false}
        title="Remover Link"
        icon="link_off"
        disabled={!editor.isActive('link')}
      />
      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1 self-center"></div>

      {/* Group 7: History */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        isActive={false}
        title="Desfazer"
        icon="undo"
        disabled={!editor.can().undo()}
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        isActive={false}
        title="Refazer"
        icon="redo"
        disabled={!editor.can().redo()}
      />

      {/* HTML Toggle */}
      <ToolbarButton
        onClick={toggleHtmlView}
        isActive={isHtmlView}
        title="Alternar para HTML"
        icon="code"
      />
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
        levels: [2, 3, 4], // Added H4
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
      TextStyle, // Required for Color extension
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
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
            // Alterado de prose-sm para prose-lg para consistência
            class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4',
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
          // IMPORTANT: Call onChange here to ensure the parent state is updated with the final HTML
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
      // IMPORTANT: Call onChange immediately when raw HTML changes
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