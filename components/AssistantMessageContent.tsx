import React from 'react';

interface AssistantMessageContentProps {
  text: string;
}

/**
 * Valida se a URL usa um protocolo seguro (http, https, mailto).
 * @param url A URL a ser validada.
 */
const isSafeUrl = (url: string): boolean => {
    try {
        const parsedUrl = new URL(url);
        return ['http:', 'https:', 'mailto:'].includes(parsedUrl.protocol);
    } catch {
        return false;
    }
};

/**
 * Converte o texto simples do assistente em elementos React formatados.
 * Suporta:
 * 1. Links no formato Markdown [Texto do Link](URL)
 * 2. Quebras de linha (\n) para <br />
 * 3. Formato *Título:* Valor para <strong>Título:</strong> Valor
 */
const AssistantMessageContent: React.FC<AssistantMessageContentProps> = ({ text }) => {
  if (!text) return null;

  // Regex para encontrar links no formato [Texto](URL)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  // Regex para encontrar formatação de título *Título:* Valor
  const titleRegex = /^\*(.*?):\* (.*)$/;

  // 1. Dividir o texto por quebras de linha
  const lines = text.split('\n');

  const renderedContent = lines.map((line, index) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    // 2. Processar links dentro da linha
    while ((match = linkRegex.exec(line)) !== null) {
      // Adiciona o texto antes do link
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      
      const linkText = match[1];
      const rawUrl = match[2];
      
      // 3. Validate URL scheme (Issue 6)
      if (isSafeUrl(rawUrl)) {
          // Adiciona o link como um elemento <a>
          parts.push(
            <a 
              key={`link-${index}-${match.index}`} 
              href={rawUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-100 underline font-medium transition-colors"
            >
              {linkText}
            </a>
          );
      } else {
          // If unsafe, render as plain text
          parts.push(`[${linkText}](${rawUrl})`);
      }
      
      lastIndex = linkRegex.lastIndex;
    }

    // Adiciona o restante do texto após o último link
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    // 3. Processar formatação de título (*Título:* Valor) na linha
    // Nota: A regex de título só funciona se a linha inteira (após processamento de links) corresponder ao padrão.
    
    const lineText = parts.map(p => (typeof p === 'string' ? p : '')).join('');
    const matchTitle = lineText.match(titleRegex);

    if (matchTitle) {
      // Se for um item formatado (*Título:* Valor)
      const title = matchTitle[1].trim();
      const value = matchTitle[2].trim();
      
      // Se a linha for um título, renderizamos apenas o título e o valor.
      return (
        <p key={index} className="text-sm leading-snug">
          <strong className="font-bold">{title}:</strong> {value}
        </p>
      );
    } else {
      // Se for texto normal ou contiver links, renderizamos as partes (incluindo os elementos <a>)
      return (
        <p key={index} className="text-sm leading-snug">
          {parts}
        </p>
      );
    }
  });

  return <div className="space-y-1">{renderedContent}</div>;
};

export default AssistantMessageContent;