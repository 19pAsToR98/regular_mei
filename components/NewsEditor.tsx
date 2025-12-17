import React, { useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Heading from '@tiptap/extension-heading';

interface NewsEditorProps {
  value: string;
  onChange: (content: string) => void;
}

const MenuBar: React.FC<{ editor: Editor | null }> = ({ editor }) => {
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

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-t-lg">
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

      {/* Hard Break */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setHardBreak().run()}
        className={buttonClass(false)}
        title="Quebra de Linha"
      >
        <span className="material-icons text-lg">wrap_text</span>
      </button>
    </div>
  );
};

const NewsEditor: React.FC<NewsEditorProps> = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Re-enable Heading here, but configure it below
        heading: false,
        codeBlock: false,
        horizontalRule: false,
        hardBreak: true,
      }),
      Heading.configure({
        levels: [2, 3], // Only allow H2 and H3 for news articles
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
        attributes: {
            class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4',
        },
    },
  });

  // Sync external value changes (e.g., when editing a different news item)
  React.useEffect(() => {
    if (editor && editor.getHTML() !== value) {
        editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  return (
    <div className="w-full border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default NewsEditor;