import React from 'react';

interface AssistantMessageContentProps {
  text: string;
}

/**
 * Converte o texto simples do assistente em elementos React formatados.
 * Suporta:
 * 1. Quebras de linha (\n) para <br />
 * 2. Formato *Título:* Valor para <strong>Título:</strong> Valor
 */
const AssistantMessageContent: React.FC<AssistantMessageContentProps> = ({ text }) => {
  if (!text) return null;

  // 1. Dividir o texto por quebras de linha
  const lines = text.split('\n');

  const renderedContent = lines.map((line, index) => {
    // 2. Regex para encontrar o padrão *Título:*
    const match = line.match(/^\*(.*?):\* (.*)$/);

    if (match) {
      // Se for um item formatado (*Título:* Valor)
      const title = match[1].trim();
      const value = match[2].trim();
      
      return (
        <p key={index} className="text-sm leading-snug">
          <strong className="font-bold">{title}:</strong> {value}
        </p>
      );
    } else {
      // Se for texto normal (incluindo a primeira linha de introdução)
      return (
        <p key={index} className="text-sm leading-snug">
          {line}
        </p>
      );
    }
  });

  return <div className="space-y-1">{renderedContent}</div>;
};

export default AssistantMessageContent;