
import React, { useState } from 'react';
import { AppNotification } from '../types';

interface PollModalProps {
  notification: AppNotification;
  onVote: (notificationId: number, optionId: number) => void;
  onClose: () => void;
}

const PollModal: React.FC<PollModalProps> = ({ notification, onVote, onClose }) => {
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);

  if (!notification.pollOptions) return null;

  const hasVoted = notification.userVotedOptionId !== undefined;

  const handleSubmit = () => {
    if (selectedOptionId !== null) {
      onVote(notification.id, selectedOptionId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="bg-purple-600 p-6 text-white text-center relative">
          <div className="mx-auto bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
            <span className="material-icons text-2xl">poll</span>
          </div>
          <h3 className="text-xl font-bold">Enquete Rápida</h3>
          <p className="text-purple-100 text-sm opacity-90">Sua opinião ajuda a melhorar a plataforma.</p>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-6 text-center leading-snug">
            {notification.text}
          </h4>

          {hasVoted ? (
            // THANK YOU VIEW (Confirmed Vote)
            <div className="text-center py-8 animate-in zoom-in-95 duration-500">
              <div className="relative w-20 h-20 mx-auto mb-6">
                 <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full animate-ping opacity-75"></div>
                 <div className="relative w-full h-full bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center">
                    <span className="material-icons text-4xl animate-in zoom-in duration-500">check</span>
                 </div>
              </div>
              <h5 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Voto Confirmado!</h5>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Obrigado por participar. Sua opinião foi registrada com sucesso.
              </p>
              <button 
                onClick={onClose}
                className="text-purple-600 hover:text-purple-700 font-semibold text-sm hover:underline"
              >
                Fechar janela
              </button>
            </div>
          ) : (
            // VOTING VIEW
            <>
              <div className="space-y-3">
                {notification.pollOptions.map((option) => {
                  const isSelected = selectedOptionId === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedOptionId(option.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className={`font-medium ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {option.text}
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-purple-500' : 'border-slate-300'}`}>
                         {isSelected && <div className="w-2.5 h-2.5 bg-purple-500 rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={selectedOptionId === null}
                className="mt-6 w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-md transition-all active:scale-95 transform"
              >
                Confirmar Voto
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default PollModal;
