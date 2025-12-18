import { createEditor, DecoratorNode, EditorConfig, LexicalEditor, NodeKey, Spread } from 'lexical';
import * as React from 'react';

export type ImagePayload = {
  altText: string;
  caption?: LexicalEditor;
  height?: number;
  key?: NodeKey;
  maxWidth?: number;
  showCaption?: boolean;
  src: string;
  width?: number;
};

function ImageComponent({
  src,
  altText,
  width,
  height,
  maxWidth,
  nodeKey,
}: {
  altText: string;
  caption: LexicalEditor;
  height: 'inherit' | number;
  maxWidth: number;
  nodeKey: NodeKey;
  showCaption: boolean;
  src: string;
  width: 'inherit' | number;
}) {
  const imageStyle = {
    maxWidth: maxWidth,
    width: width === 'inherit' ? '100%' : width,
    height: height === 'inherit' ? 'auto' : height,
  };

  return (
    <div className="editor-image-container my-4 flex justify-center">
      <img
        src={src}
        alt={altText}
        style={imageStyle}
        className="max-w-full h-auto rounded-lg shadow-md"
        draggable="false"
      />
    </div>
  );
}

export class ImageNode extends DecoratorNode<React.ReactElement> {
  __src: string;
  __altText: string;
  __width: 'inherit' | number;
  __height: 'inherit' | number;
  __maxWidth: number;
  __showCaption: boolean;
  __caption: LexicalEditor;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__width,
      node.__height,
      node.__showCaption,
      node.__caption,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, height, maxWidth, width, src, showCaption, caption } = serializedNode;
    const node = $createImageNode({
      altText,
      height,
      maxWidth,
      width,
      src,
      showCaption,
    });
    const nestedEditor = node.__caption;
    const editorState = nestedEditor.parseEditorState(caption.editorState);
    nestedEditor.setEditorState(editorState);
    return node;
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      caption: this.__caption.toJSON(),
      height: this.__height === 'inherit' ? 0 : this.__height,
      maxWidth: this.__maxWidth,
      showCaption: this.__showCaption,
      src: this.getSrc(),
      type: 'image',
      version: 1,
      width: this.__width === 'inherit' ? 0 : this.__width,
    };
  }

  constructor(
    src: string,
    altText: string,
    maxWidth: number,
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    showCaption?: boolean,
    caption?: LexicalEditor,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__maxWidth = maxWidth;
    this.__width = width === undefined ? 'inherit' : width;
    this.__height = height === undefined ? 'inherit' : height;
    this.__showCaption = showCaption === undefined ? false : showCaption;
    this.__caption = caption || createEditor();
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const className = 'editor-image-wrapper';
    span.className = className;
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  decorate(): React.ReactElement {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        maxWidth={this.__maxWidth}
        nodeKey={this.getKey()}
        showCaption={this.__showCaption}
        caption={this.__caption}
      />
    );
  }
}

export function $createImageNode({
  altText,
  height,
  maxWidth = 500,
  src,
  width,
  showCaption,
  caption,
  key,
}: ImagePayload): ImageNode {
  return new ImageNode(src, altText, maxWidth, width, height, showCaption, caption, key);
}

export function $isImageNode(node: ImageNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    caption: any;
    height?: number;
    maxWidth: number;
    showCaption: boolean;
    src: string;
    width?: number;
    type: 'image';
    version: 1;
  },
  Spread<typeof DecoratorNode.prototype.exportJSON>
>;