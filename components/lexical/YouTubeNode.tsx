import { createEditor, DecoratorNode, EditorConfig, LexicalEditor, NodeKey, Spread } from 'lexical';
import * as React from 'react';

export type YouTubePayload = {
  videoID: string;
  key?: NodeKey;
};

function YouTubeComponent({ videoID }: { videoID: string }) {
  return (
    <div className="editor-youtube-container my-4 flex justify-center">
      <iframe
        width="560"
        height="315"
        src={`https://www.youtube-nocookie.com/embed/${videoID}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="max-w-full h-auto aspect-video rounded-lg shadow-md"
      ></iframe>
    </div>
  );
}

export class YouTubeNode extends DecoratorNode<React.ReactElement> {
  __videoID: string;

  static getType(): string {
    return 'youtube';
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(node.__videoID, node.__key);
  }

  static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    const { videoID } = serializedNode;
    return $createYouTubeNode(videoID);
  }

  exportJSON(): SerializedYouTubeNode {
    return {
      videoID: this.__videoID,
      type: 'youtube',
      version: 1,
    };
  }

  constructor(videoID: string, key?: NodeKey) {
    super(key);
    this.__videoID = videoID;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const className = 'editor-youtube-wrapper';
    span.className = className;
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): React.ReactElement {
    return <YouTubeComponent videoID={this.__videoID} />;
  }
}

export function $createYouTubeNode(videoID: string): YouTubeNode {
  return new YouTubeNode(videoID);
}

export function $isYouTubeNode(node: YouTubeNode | null | undefined): node is YouTubeNode {
  return node instanceof YouTubeNode;
}

export type SerializedYouTubeNode = Spread<
  {
    videoID: string;
    type: 'youtube';
    version: 1;
  },
  Spread<typeof DecoratorNode.prototype.exportJSON>
>;