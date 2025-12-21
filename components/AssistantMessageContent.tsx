import React from 'react';

interface AssistantMessageContentProps {
  text: string;
}

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

  // 1. Dividir o texto por quebras de linha
  const lines = text.split('\n');

  const renderedContent = lines.map((line, index) => {
    // 2. Processar links dentro da linha
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(line)) !== null) {
      // Adiciona o texto antes do link
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      
      // Adiciona o link como um elemento <a>
      const linkText = match[1];
      const url = match[2];
      parts.push(
        <a 
          key={`link-${index}-${match.index}`} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-300 hover:text-blue-100 underline font-medium transition-colors"
        >
          {linkText}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }

    // Adiciona o restante do texto após o último link
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    // 3. Processar formatação de título (*Título:* Valor) na linha sem links
    const lineText = parts.map(p => (typeof p === 'string' ? p : '')).join('');
    const matchTitle = lineText.match(/^\*(.*?):\* (.*)$/);

    if (matchTitle) {
      // Se for um item formatado (*Título:* Valor)
      const title = matchTitle[1].trim();
      const value = matchTitle[2].trim();
      
      // Reconstroi a linha com a formatação de título, mantendo os elementos de link
      return (
        <p key={index} className="text-sm leading-snug">
          <strong className="font-bold">{title}:</strong> {value}
        </p>
      );
    } else {
      // Se for texto normal, retorna a linha com os links processados
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