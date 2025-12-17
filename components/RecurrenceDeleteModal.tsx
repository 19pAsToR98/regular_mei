import React from 'react';
import { Transaction } from '../types';

interface RecurrenceDeleteModalProps {
  transaction: Transaction;
  onClose: () => void;
  onDeleteSingle: () => void;
  onDeleteSeries: () => void;
}

const RecurrenceDeleteModal: React.FC<RecurrenceDeleteModalProps> = ({
  transaction,
  onClose,
  onDeleteSingle,
  onDeleteSeries,
}) => {
  const isInstallment = !!transaction.installments;
  const typeLabel = isInstallment ? 'Parcela' : 'Lançamento Fixo';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-red-50 dark:bg-red-900/20">
          <h3 className="font-bold text-lg text-red-700 dark:text-red-400">
            Excluir {typeLabel}
          </h3>
          <button onClick={onClose} className="text-red-400 hover:text-red-600 dark:hover:text-red-200">
            <span className="material-icons">close</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            O lançamento <strong>"{transaction.description}"</strong> faz parte de uma série {isInstallment ? 'parcelada' : 'recorrente'}.
            Como você deseja prosseguir?
          </p>

          <div className="space-y-3 pt-2">
            {/* Option 1: Delete Single */}
            <button
              onClick={onDeleteSingle}
              className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3"
            >
              <span className="material-icons text-xl text-orange-500">event_note</span>
              <div>
                <p className="font-bold text-slate-800 dark:text-white">Excluir Apenas Este Mês</p>
                <p className="text-xs text-slate-500">Remove apenas o lançamento de {new Date(transaction.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.</p>
              </div>
            </button>

            {/* Option 2: Delete Series */}
            <button
              onClick={onDeleteSeries}
              className="w-full text-left p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-3"
            >
              <span className="material-icons text-xl text-red-600">delete_forever</span>
              <div>
                <p className="font-bold text-red-700 dark:text-red-300">Excluir Toda a Série</p>
                <p className="text-xs text-red-600 dark:text-red-400">Remove todos os {isInstallment ? 'pagamentos futuros desta parcela' : 'lançamentos recorrentes futuros'}.</p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecurrenceDeleteModal;