import React from 'react';

interface AudioWaveIndicatorProps {
  isRecording: boolean;
}

const AudioWaveIndicator: React.FC<AudioWaveIndicatorProps> = ({ isRecording }) => {
  if (!isRecording) return null;

  // Array para criar 5 barras com diferentes atrasos de animação
  const bars = Array.from({ length: 5 }).map((_, index) => {
    // Atraso e duração da animação para criar o efeito de onda
    const delay = `${index * 0.1}s`;
    const duration = '1.2s';
    
    return (
      <div
        key={index}
        className="w-1 h-full bg-red-400 rounded-full origin-bottom"
        style={{
          animation: `wave-pulse ${duration} infinite alternate ease-in-out`,
          animationDelay: delay,
        }}
      />
    );
  });

  return (
    <>
      {/* Keyframes para a animação de pulso (Tailwind não suporta keyframes inline) */}
      <style jsx global>{`
        @keyframes wave-pulse {
          0% {
            transform: scaleY(0.2);
          }
          100% {
            transform: scaleY(1);
          }
        }
      `}</style>
      
      <div className="flex items-center justify-center h-6 w-10 gap-0.5">
        {bars}
      </div>
    </>
  );
};

export default AudioWaveIndicator;