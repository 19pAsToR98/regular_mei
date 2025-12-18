import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { ImageNode } from './lexical/ImageNode.tsx';
import { INSERT_IMAGE_COMMAND } from './lexical/ImagePlugin.tsx';
import { INSERT_YOUTUBE_COMMAND } from './lexical/YouTubePlugin.tsx';
import { $getRoot, $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, COMMAND_PRIORITY_CRITICAL, FORMAT_ELEMENT_COMMAND, $createParagraphNode, $createTextNode, $isRootOrShadowRoot, EditorState } from 'lexical';
import { $wrapNodes } from '@lexical/selection';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { YouTubeNode } from './lexical/YouTubeNode.tsx';
import { YouTubePlugin } from './lexical/YouTubePlugin.tsx';
import { ImagePlugin } from './lexical/ImagePlugin.tsx';
import { HtmlExportPlugin } from './lexical/HtmlExportPlugin.tsx';
import { HtmlImportPlugin } from './lexical/HtmlImportPlugin.tsx';
import { AutoLinkPlugin } from './lexical/AutoLinkPlugin.tsx';
// import { CodeHighlightNode, CodeNode } from '@lexical/code'; // REMOVED
// import { CodeHighlightPlugin } from '@lexical/react/LexicalCodeHighlightPlugin'; // REMOVED

interface NewsEditorProps {
  value: string;
  onChange: (content: string) => void;
}

// --- CONFIGURAÇÃO DO EDITOR ---
const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
  paragraph: 'editor-paragraph',
  heading: {
    h2: 'text-2xl font-bold mb-4 mt-6 text-slate-800 dark:text-white',
    h3: 'text-xl font-semibold mb-3 mt-5 text-slate-800 dark:text-white',
  },
  list: {
    ul: 'list-disc pl-6 mb-4 space-y-1',
    ol: 'list-decimal pl-6 mb-4 space-y-1',
    listitem: 'editor-listitem',
  },
  quote: 'border-l-4 border-primary pl-4 italic text-slate-600 dark:text-slate-300 my-4',
  link: 'text-primary hover:underline',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'bg-slate-100 dark:bg-slate-700 p-1 rounded font-mono text-sm',
  },
  code: 'bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto my-4',
};

const editorConfig = {
  namespace: 'NewsEditor',
  theme,
  onError(error: Error) {
    console.error('Lexical Error:', error);
  },
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    LinkNode,
    AutoLinkNode,
    ImageNode,
    YouTubeNode,
    // CodeNode, // REMOVED
    // CodeHighlightNode, // REMOVED
  ],
};

// --- TOOLBAR COMPONENT ---
const ToolbarPlugin: React.FC<{ toggleHtmlView: () => void, isHtmlView: boolean }> = ({ toggleHtmlView, isHtmlView }) => {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');

  const updateToolbar = useCallback(() => {
    const selection = activeEditor.getEditorState().read(() => $getSelection());
    if (!$isRangeSelection(selection)) return;

    const anchorNode = selection.anchor.getNode();
    const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getAncestor(editor => $isRootOrShadowRoot(editor)) || anchorNode;
    const elementKey = element.getKey();
    const elementDOM = activeEditor.getElementByKey(elementKey);

    if (elementDOM) {
      if (element.getType() === 'heading') {
        const level = element.getTag();
        setBlockType(level);
      } else if (element.getType() === 'list') {
        const tag = element.getTag();
        setBlockType(tag);
      } else {
        setBlockType(element.getType());
      }
    }

    setIsBold(selection.hasFormat('bold'));
    setIsItalic(selection.hasFormat('italic'));
  }, [activeEditor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatText = (format: 'bold' | 'italic') => {
    activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatBlock = (type: 'h2' | 'h3' | 'quote' | 'ul' | 'ol' | 'paragraph') => {
    if (type === 'ul') {
      activeEditor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else if (type === 'ol') {
      activeEditor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => {
            if (type === 'h2') return $createHeadingNode('h2');
            if (type === 'h3') return $createHeadingNode('h3');
            if (type === 'quote') return $createQuoteNode();
            return $createParagraphNode();
          });
        }
      });
    }
  };

  const insertLink = () => {
    const url = window.prompt('URL do Link');
    if (url) {
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
  };

  const insertImage = () => {
    const url = window.prompt('URL da Imagem');
    if (url) {
      activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: url, altText: 'Imagem' });
    }
  };
  
  const insertYouTube = () => {
    const url = window.prompt('URL do YouTube');
    if (url) {
      activeEditor.dispatchCommand(INSERT_YOUTUBE_COMMAND, url);
    }
  };

  const buttonClass = (isActive: boolean) => 
    `p-2 rounded transition-colors ${
      isActive ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`;

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-t-lg">
      
      {/* Block Type Selector */}
      <select
        value={blockType}
        onChange={(e) => formatBlock(e.target.value as any)}
        className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
      >
        <option value="paragraph">Normal</option>
        <option value="h2">Título (H2)</option>
        <option value="h3">Subtítulo (H3)</option>
        <option value="ul">Lista</option>
        <option value="ol">Lista Num.</option>
        <option value="quote">Citação</option>
      </select>
      
      {/* Basic Formatting */}
      <button
        type="button"
        onClick={() => formatText('bold')}
        className={buttonClass(isBold)}
        title="Negrito"
      >
        <span className="material-icons text-lg">format_bold</span>
      </button>
      <button
        type="button"
        onClick={() => formatText('italic')}
        className={buttonClass(isItalic)}
        title="Itálico"
      >
        <span className="material-icons text-lg">format_italic</span>
      </button>
      
      {/* Link & Media */}
      <button
        type="button"
        onClick={insertLink}
        className={buttonClass(blockType === 'link')}
        title="Adicionar Link"
      >
        <span className="material-icons text-lg">link</span>
      </button>
      <button
        type="button"
        onClick={insertImage}
        className={buttonClass(false)}
        title="Adicionar Imagem"
      >
        <span className="material-icons text-lg">image</span>
      </button>
      <button
        type="button"
        onClick={insertYouTube}
        className={buttonClass(false)}
        title="Adicionar Vídeo do YouTube"
      >
        <span className="material-icons text-lg">smart_display</span>
      </button>

      {/* Alignment (Lexical doesn't have native alignment commands in StarterKit, requires custom implementation or extension) */}
      <button
        type="button"
        onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
        className={buttonClass(false)}
        title="Alinhar à Esquerda"
      >
        <span className="material-icons text-lg">format_align_left</span>
      </button>
      <button
        type="button"
        onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
        className={buttonClass(false)}
        title="Alinhar ao Centro"
      >
        <span className="material-icons text-lg">format_align_center</span>
      </button>
      <button
        type="button"
        onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
        className={buttonClass(false)}
        title="Alinhar à Direita"
      >
        <span className="material-icons text-lg">format_align_right</span>
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

// --- LEXICAL EDITOR COMPONENT ---
const LexicalEditor: React.FC<{ value: string, onChange: (content: string) => void, toggleHtmlView: () => void, isHtmlView: boolean }> = ({ value, onChange, toggleHtmlView, isHtmlView }) => {
  const initialEditorState = useMemo(() => {
    return (editor: any) => {
      if (value) {
        // Use the HtmlImportPlugin to load the initial HTML content
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          // This is a placeholder, the HtmlImportPlugin will handle the actual import
          // We rely on the HtmlImportPlugin to run after initialization
        });
      } else {
        editor.update(() => {
          const root = $getRoot();
          if (root.isEmpty()) {
            root.append($createParagraphNode().append($createTextNode('Comece a escrever sua notícia aqui...')));
          }
        });
      }
    };
  }, [value]);

  // State to hold raw HTML when in HTML view
  const [htmlContent, setHtmlContent] = useState(value);
  
  // Handle manual HTML input change
  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setHtmlContent(e.target.value);
      onChange(e.target.value);
  };

  return (
    <LexicalComposer initialConfig={{ ...editorConfig, editorState: initialEditorState }}>
      <div className="w-full border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
        <ToolbarPlugin toggleHtmlView={toggleHtmlView} isHtmlView={isHtmlView} />
        
        {isHtmlView ? (
            <textarea
                value={htmlContent}
                onChange={handleHtmlChange}
                rows={10}
                className="w-full p-4 font-mono text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none resize-y min-h-[200px]"
                placeholder="Edição HTML bruta..."
            />
        ) : (
            <div className="relative editor-container">
                <RichTextPlugin
                    contentEditable={<ContentEditable className="editor-input min-h-[200px] p-4 focus:outline-none" />}
                    placeholder={<div className="editor-placeholder absolute top-0 left-0 p-4 pointer-events-none text-slate-400">Comece a escrever sua notícia aqui...</div>}
                    ErrorBoundary={() => <div>Erro no Editor</div>}
                />
                <HistoryPlugin />
                <ListPlugin />
                <LinkPlugin />
                <TabIndentationPlugin />
                {/* <CodeHighlightPlugin /> */}
                <YouTubePlugin />
                <ImagePlugin />
                <AutoLinkPlugin />
                
                {/* Custom Plugins for HTML Import/Export */}
                <HtmlExportPlugin onChange={onChange} />
                <HtmlImportPlugin html={value} />
                
                <OnChangePlugin onChange={(editorState: EditorState) => {
                    // This is mainly for internal state updates, the HtmlExportPlugin handles the final HTML output to parent
                }} />
            </div>
        )}
      </div>
    </LexicalComposer>
  );
};

// --- MAIN COMPONENT ---
const NewsEditor: React.FC<NewsEditorProps> = ({ value, onChange }) => {
  const [isHtmlView, setIsHtmlView] = useState(false);
  
  // When switching from HTML view back to Lexical, we need to ensure Lexical re-renders and imports the HTML.
  // We use a key change to force re-initialization of the LexicalComposer.
  const editorKey = useMemo(() => isHtmlView ? 'html' : 'lexical', [isHtmlView]);

  const toggleHtmlView = () => {
      setIsHtmlView(prev => !prev);
  };

  return (
    <LexicalEditor 
        key={editorKey}
        value={value} 
        onChange={onChange} 
        toggleHtmlView={toggleHtmlView} 
        isHtmlView={isHtmlView} 
    />
  );
};

export default NewsEditor;