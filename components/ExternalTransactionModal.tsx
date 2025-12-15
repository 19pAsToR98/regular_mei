import React from 'react';
import { Transaction, Category } from '../types';
import { showError } from '../utils/toastUtils';

interface ExternalTransactionModalProps {
  transactions: Transaction[];
  revenueCats: Category[];
  expenseCats: Category[];
  onClose: () => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: number) => void;
  onNavigateToCashflow: () => void;
}

const ExternalTransactionModal: React.FC<ExternalTransactionModalProps> = ({ 
  transactions, 
  revenueCats, 
  expenseCats, 
  onClose, 
  onUpdateTransaction,
  onDeleteTransaction,
  onNavigateToCashflow
}) => {

  const getCategoryIcon = (catName: string, type: 'receita' | 'despesa') => {
      const cats = type === 'receita' ? revenueCats : expenseCats;
      const found = cats.find(c => c.name === catName);
      return found ? found.icon : 'attach_money';
  };

  const handleQuickStatusToggle = (t: Transaction) => {
      const newStatus = t.status === 'pago' ? 'pendente' : 'pago';
      onUpdateTransaction({
          ...t,
          status: newStatus
      });
  };

  const handleEditClick = (t: Transaction) => {
      // In a real app, this would open the edit modal for this specific transaction.
      // Here, we navigate to the cashflow page and inform the user.
      onClose();
      onNavigateToCashflow();
      // Note: The CashFlowPage component would need logic to automatically open the edit modal 
      // if a transaction ID is passed via state/URL, but for this scope, navigation is sufficient.
      showError(`Transação "${t.description}" movida para edição na página Fluxo de Caixa.`);
  };

  const handleDeleteClick = (t: Transaction) => {
      if (window.confirm(`Tem certeza que deseja excluir o lançamento "${t.description}"?`)) {
          onDeleteTransaction(t.id);
      }
  };

  const formatDateDisplay = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-green-50 dark:bg-green-900/20 sticky top-0 z-10">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <span className="material-icons text-green-600">whatsapp</span>
                Novos Registros via WhatsApp
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-icons">close</span>
            </button>
        </div>
        
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
                Olá! Encontramos {transactions.length} novos lançamentos registrados pelo seu assistente do WhatsApp. Revise e confirme o status:
            </p>

            <div className="space-y-3">
                {transactions.map(t => (
                    <div key={t.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full flex-shrink-0 ${t.type === 'receita' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-500'}`}>
                                    <span className="material-icons text-xl">{getCategoryIcon(t.category, t.type)}</span>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white leading-tight line-clamp-1">{t.description}</p>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{t.category} - {formatDateDisplay(t.date)}</span>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <span className={`font-bold text-lg ${t.type === 'receita' ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>
                                    {t.type === 'despesa' ? '- ' : ''}R$ {(t.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <button 
                                onClick={() => handleQuickStatusToggle(t)}
                                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                                    t.status === 'pago' 
                                    ? 'bg-green-100 text-green-700 border border-green-200' 
                                    : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${t.status === 'pago' ? 'bg-green-600' : 'bg-yellow-600'}`}></span>
                                {t.status === 'pago' ? (t.type === 'receita' ? 'RECEBIDO' : 'PAGO') : 'PENDENTE'}
                            </button>

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleEditClick(t)}
                                    className="p-2 text-slate-400 hover:text-primary bg-slate-50 dark:bg-slate-700 rounded-lg"
                                    title="Editar no Fluxo de Caixa"
                                >
                                    <span className="material-icons text-lg">edit</span>
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(t)}
                                    className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-700 rounded-lg"
                                    title="Excluir"
                                >
                                    <span className="material-icons text-lg">delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/50">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg font-bold shadow-sm transition-colors"
            >
                Entendido
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExternalTransactionModal;