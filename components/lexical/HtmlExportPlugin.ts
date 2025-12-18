import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $generateHtmlFromNodes } from '@lexical/html';
import { EditorState } from 'lexical';
import { useCallback } from 'react';

interface HtmlExportPluginProps {
  onChange: (html: string) => void;
}

export function HtmlExportPlugin({ onChange }: HtmlExportPluginProps): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const handleChange = useCallback((editorState: EditorState) => {
    editorState.read(() => {
      const htmlString = $generateHtmlFromNodes(editor, null);
      onChange(htmlString);
    });
  }, [editor, onChange]);

  return <OnChangePlugin onChange={handleChange} />;
}