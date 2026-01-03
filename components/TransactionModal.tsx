import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { showWarning } from '../utils/toastUtils';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (t: Transaction | Transaction[]) => void;
  revenueCats: Category[];
  expenseCats: Category[];
  editingTransaction?: Transaction | null;
  // Propriedade para forçar o tipo (usado no Quick Add)
  forcedType?: 'receita' | 'despesa';
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  revenueCats,
  expenseCats,
  editingTransaction,
  forcedType,
}) => {
  
  const isEditing = !!editingTransaction;

  const [formData, setFormData] = useState({
    description: editingTransaction?.description || '',
    category: editingTransaction?.category || '',
    type: editingTransaction?.type || forcedType || 'receita',
    amount: editingTransaction?.amount.toString() || '',
    date: editingTransaction?.date || new Date().toISOString().split('T')[0],
    status: editingTransaction?.status || (editingTransaction?.type === 'receita' ? 'pendente' : 'pago'),
    
    // Repetition logic (only for new transactions)
    recurrenceType: 'none', // none, installment, recurring
    recurrenceCount: 2, // Total installments or months
  });
  
  // Reset form when modal opens or editingTransaction changes
  useEffect(() => {
    if (isOpen) {
        setFormData({
            description: editingTransaction?.description || '',
            category: editingTransaction?.category || '',
            type: editingTransaction?.type || forcedType || 'receita',
            amount: editingTransaction?.amount.toString() || '',
            date: editingTransaction?.date || new Date().toISOString().split('T')[0],
            status: editingTransaction?.status || (editingTransaction?.type === 'receita' ? 'pendente' : 'pago'),
            recurrenceType: 'none',
            recurrenceCount: 2,
        });
    }
  }, [isOpen, editingTransaction, forcedType]);

  const isRevenue = formData.type === 'receita';
  const title = isEditing ? 'Editar Transação' : (isRevenue ? 'Nova Receita' : 'Nova Despesa');
  const buttonColor = isRevenue ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';
  const accentColor = isRevenue ? 'text-green-600' : 'text-red-600';
  const categories = isRevenue ? revenueCats : expenseCats;
  
  const amountValue = parseFloat(formData.amount) || 0;
  const totalInstallmentAmount = formData.recurrenceType === 'installment' ? (amountValue * formData.recurrenceCount) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim() || !formData.category || isNaN(amountValue) || amountValue <= 0) {
      showWarning('Preencha todos os campos obrigatórios (Descrição, Categoria e Valor).');
      return;
    }

    // Single Update
    if (isEditing) {
        const payload: Transaction = {
            id: editingTransaction!.id,
            description: formData.description,
            category: formData.category,
            type: formData.type as 'receita' | 'despesa',
            amount: amountValue,
            date: formData.date,
            status: formData.status as 'pago' | 'pendente',
            // Preserve recurrence data from original transaction
            installments: editingTransaction!.installments,
            isRecurring: editingTransaction!.isRecurring
        };
        onSave(payload);
    } 
    // Create New
    else {
        const transactionsToCreate: Transaction[] = [];
        const [y, m, d] = formData.date.split('-').map(Number);
        const startDate = new Date(y, m - 1, d, 12, 0, 0);
        
        const count = formData.recurrenceType === 'none' ? 1 : Math.max(1, formData.recurrenceCount);

        for (let i = 0; i < count; i++) {
            const itemDate = new Date(startDate);
            itemDate.setMonth(startDate.getMonth() + i);
            
            const year = itemDate.getFullYear();
            const month = String(itemDate.getMonth() + 1).padStart(2, '0');
            const day = String(itemDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            const t: Transaction = {
                id: Date.now() + i,
                description: formData.description,
                category: formData.category,
                type: formData.type as 'receita' | 'despesa',
                amount: amountValue,
                expectedAmount: amountValue,
                date: dateStr,
                status: (formData.recurrenceType !== 'none' && i > 0) ? 'pendente' : (formData.status as 'pago' | 'pendente'),
                isRecurring: formData.recurrenceType === 'recurring',
                installments: formData.recurrenceType === 'installment' ? { current: i + 1, total: count } : undefined
            };
            transactionsToCreate.push(t);
        }

        onSave(transactionsToCreate);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className={`px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800 sticky top-0 z-10`}>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <span className={`material-icons ${accentColor}`}>{isRevenue ? 'arrow_upward' : 'arrow_downward'}</span>
            {title}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* TYPE SELECTOR (Hidden if forced or editing) */}
          {!forcedType && !isEditing && (
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                <div className="flex gap-2">
                    <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'receita', category: ''})}
                        className={`flex-1 py-2 rounded-lg font-medium border ${formData.type === 'receita' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600'}`}
                    >Receita</button>
                    <button 
                        type="button"
                        onClick={() => setFormData({...formData, type: 'despesa', category: ''})}
                        className={`flex-1 py-2 rounded-lg font-medium border ${formData.type === 'despesa' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600'}`}
                    >Despesa</button>
                </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
            <input 
              type="text" 
              required
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
              placeholder={isRevenue ? 'Ex: Venda de Serviço X' : 'Ex: Pagamento de Aluguel'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Valor (R$)
            </label>
            <input 
              type="number" 
              step="0.01"
              required
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none text-lg font-bold"
              placeholder="0,00"
            />
          </div>
          
          {/* Total calculation help text */}
          {formData.recurrenceType === 'installment' && amountValue > 0 && (
             <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                Valor Total da Compra: <b>R$ {totalInstallmentAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</b>
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
              <select 
                required
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
              >
                <option value="">Selecione...</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
              <input 
                type="date" 
                required
                value={formData.date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
          </div>
          
          {/* Repetition Options (Only for new, non-recurring/non-installment transactions) */}
          {!isEditing && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Repetição</label>
                
                {/* Segmented Control Style */}
                <div className="flex mb-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                    <button 
                        type="button" 
                        onClick={() => setFormData({...formData, recurrenceType: 'none'})}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${formData.recurrenceType === 'none' ? 'bg-slate-800 text-white dark:bg-slate-700' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        Única
                    </button>
                    <div className="w-px bg-slate-300 dark:bg-slate-700"></div>
                    <button 
                        type="button" 
                        onClick={() => setFormData({...formData, recurrenceType: 'installment'})}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${formData.recurrenceType === 'installment' ? 'bg-slate-800 text-white dark:bg-slate-700' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        Parcelado
                    </button>
                    <div className="w-px bg-slate-300 dark:bg-slate-700"></div>
                    <button 
                        type="button" 
                        onClick={() => setFormData({...formData, recurrenceType: 'recurring'})}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${formData.recurrenceType === 'recurring' ? 'bg-slate-800 text-white dark:bg-slate-700' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        Fixo
                    </button>
                </div>
                
                {formData.recurrenceType !== 'none' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                         <label className="block text-xs font-medium text-slate-500 mb-1">
                            {formData.recurrenceType === 'installment' ? 'Número de Parcelas' : 'Repetir por quantos meses?'}
                         </label>
                         <input 
                            type="number" 
                            min="2" max="60"
                            value={formData.recurrenceCount}
                            onChange={e => setFormData({...formData, recurrenceCount: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm"
                         />
                    </div>
                )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="status" 
                  checked={formData.status === 'pago'}
                  onChange={() => setStatus('pago')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-slate-700 dark:text-slate-300">{isRevenue ? 'Recebido' : 'Pago'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="status" 
                  checked={formData.status === 'pendente'}
                  onChange={() => setStatus('pendente')}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-slate-700 dark:text-slate-300">Pendente (Previsto)</span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className={`flex-1 px-4 py-2 text-white rounded-lg ${buttonColor} transition-colors shadow-sm font-medium`}
            >
              {isEditing ? 'Salvar Alterações' : `Adicionar ${isRevenue ? 'Receita' : 'Despesa'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;