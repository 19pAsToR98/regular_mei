import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical';
import { useEffect } from 'react';
import { $createYouTubeNode, YouTubeNode } from './YouTubeNode';

export const INSERT_YOUTUBE_COMMAND: LexicalCommand<string> = createCommand('INSERT_YOUTUBE_COMMAND');

// Helper to extract video ID from various YouTube URLs
function getYouTubeVideoID(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function YouTubePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([YouTubeNode])) {
      throw new Error('YouTubePlugin: YouTubeNode not registered on editor');
    }

    return editor.registerCommand<string>(
      INSERT_YOUTUBE_COMMAND,
      (url) => {
        const videoID = getYouTubeVideoID(url);
        if (videoID) {
          const youtubeNode = $createYouTubeNode(videoID);
          editor.getRoot().append(youtubeNode);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}