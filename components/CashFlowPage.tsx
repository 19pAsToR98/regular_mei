import React, { useState, useMemo } from 'react';
import { Transaction, Category } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import RecurrenceDeleteModal from './RecurrenceDeleteModal';
import { showSuccess, showLoading, dismissToast } from '../utils/toastUtils';

interface CashFlowPageProps {
  transactions: Transaction[];
  revenueCats: Category[];
  expenseCats: Category[];
  onAddTransaction: (t: Transaction | Transaction[]) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: number) => void;
  onDeleteTransactionSeries: (t: Transaction) => void;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

const CashFlowPage: React.FC<CashFlowPageProps> = ({ 
  transactions, revenueCats, expenseCats,
  onAddTransaction, onUpdateTransaction, onDeleteTransaction, onDeleteTransactionSeries
}) => {
  // --- STATE ---
  const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  // NEW STATE for bulk actions
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Recurrence Delete State
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  // Form State (Simplified: No expectedAmount)
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    type: 'receita',
    amount: '', // Single Amount Field
    date: new Date().toISOString().split('T')[0],
    status: 'pago',
    
    // Repetition logic
    recurrenceType: 'none', // none, installment, recurring
    recurrenceCount: 2, // Total installments or months
  });

  // --- FILTER LOGIC ---
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // 1. Transactions for the current month
  const monthlyTransactions = transactions.filter(t => {
    const tMonth = parseInt(t.date.split('-')[1]) - 1; // 0-indexed
    const tYear = parseInt(t.date.split('-')[0]);
    return tMonth === currentMonth && tYear === currentYear;
  });

  // 2. Transactions for the Table Display
  const filteredTransactions = monthlyTransactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- SELECTION HANDLERS ---
  
  const handleSelectTransaction = (id: number, isChecked: boolean) => {
      setSelectedTransactions(prev => 
          isChecked ? [...prev, id] : prev.filter(tid => tid !== id)
      );
  };

  const handleSelectAll = (isChecked: boolean) => {
      if (isChecked) {
          setSelectedTransactions(filteredTransactions.map(t => t.id));
      } else {
          setSelectedTransactions([]);
      }
  };
  
  const isAllSelected = filteredTransactions.length > 0 && selectedTransactions.length === filteredTransactions.length;

  // --- BULK ACTIONS LOGIC ---
  
  const handleBulkUpdateStatus = async (newStatus: 'pago' | 'pendente') => {
      if (selectedTransactions.length === 0) return;
      
      const loadingToastId = showLoading(`Atualizando ${selectedTransactions.length} transações...`);
      
      const transactionsToUpdate = transactions.filter(t => selectedTransactions.includes(t.id));
      
      const updatePromises = transactionsToUpdate.map(t => {
          return onUpdateTransaction({ ...t, status: newStatus });
      });
      
      await Promise.all(updatePromises);
      
      dismissToast(loadingToastId);
      showSuccess(`${selectedTransactions.length} transações atualizadas para ${newStatus === 'pago' ? 'Pagas/Recebidas' : 'Pendentes'}.`);
      setSelectedTransactions([]);
  };
  
  const handleBulkDelete = async () => {
      if (selectedTransactions.length === 0) return;
      
      if (!window.confirm(`Tem certeza que deseja excluir permanentemente ${selectedTransactions.length} transações?`)) {
          return;
      }
      
      const loadingToastId = showLoading(`Excluindo ${selectedTransactions.length} transações...`);
      
      const deletePromises = selectedTransactions.map(id => {
          return onDeleteTransaction(id);
      });
      
      await Promise.all(deletePromises);
      
      dismissToast(loadingToastId);
      showSuccess(`${selectedTransactions.length} transações excluídas.`);
      setSelectedTransactions([]);
  };


  // --- CALCULATIONS (NEW MODEL) ---
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Transactions for the current month
    const currentMonthTrans = transactions.filter(t => {
      const tMonth = parseInt(t.date.split('-')[1]) - 1;
      const tYear = parseInt(t.date.split('-')[0]);
      return tMonth === currentMonth && tYear === currentYear;
    });

    // Realized (Paid Only)
    const realizedRevenue = currentMonthTrans
      .filter(t => t.type === 'receita' && t.status === 'pago')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const realizedExpense = currentMonthTrans
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // 1. Caixa Atual (Realized Balance)
    const caixaAtual = realizedRevenue - realizedExpense;

    // Pending Transactions
    const pendingTrans = currentMonthTrans.filter(t => t.status === 'pendente');

    // 2. A Receber (Pending Revenue)
    const aReceber = pendingTrans
      .filter(t => t.type === 'receita')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // 3. A Pagar (Pending Expense)
    const aPagar = pendingTrans
      .filter(t => t.type === 'despesa')
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // 4. Caixa Projetado do Mês (Expected Balance)
    const totalExpectedRevenue = realizedRevenue + aReceber;
    const totalExpectedExpense = realizedExpense + aPagar;
    const caixaProjetado = totalExpectedRevenue - totalExpectedExpense;

    // 5. Em Atraso (Overdue) & A Vencer (Upcoming) - Only for pending transactions
    let emAtraso = 0;
    let aVencer = 0;

    pendingTrans
      .forEach(t => {
        if (t.date < todayStr) {
          // Sum of all overdue pending items (both revenue and expense)
          emAtraso += t.amount || 0;
        } else {
          // Sum of all upcoming pending items (both revenue and expense)
          aVencer += t.amount || 0;
        }
      });
      
    return {
      caixaAtual,
      aReceber,
      aPagar,
      caixaProjetado,
      emAtraso,
      aVencer,
      totalExpectedRevenue,
      totalExpectedExpense,
      realizedRevenue,
      realizedExpense,
    };
  }, [transactions, currentMonth, currentYear]);
  
  const {
    caixaAtual,
    aReceber,
    aPagar,
    caixaProjetado,
    emAtraso,
    aVencer,
    totalExpectedRevenue,
    totalExpectedExpense,
    realizedRevenue,
    realizedExpense,
  } = metrics;


  // --- CHART DATA CALCULATION ---
  const getChartData = (type: 'receita' | 'despesa') => {
      const dataMap: Record<string, number> = {};
      
      // Include both paid and pending in charts to show full picture
      monthlyTransactions
        .filter(t => t.type === type)
        .forEach(t => {
            const val = t.amount || 0;
            if (val > 0) {
                dataMap[t.category] = (dataMap[t.category] || 0) + val;
            }
        });

      return Object.keys(dataMap).map(key => ({
          name: key,
          value: dataMap[key]
      })).sort((a, b) => b.value - a.value);
  };

  const revenueChartData = useMemo(() => getChartData('receita'), [monthlyTransactions]);
  const expenseChartData = useMemo(() => getChartData('despesa'), [monthlyTransactions]);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const formatDateDisplay = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return {
          day: day,
          monthShort: date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
          full: date.toLocaleDateString('pt-BR')
      };
  };

  // --- HANDLERS ---
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
        description: '',
        category: '',
        type: 'receita',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pago',
        recurrenceType: 'none',
        recurrenceCount: 2
    });
    setIsModalOpen(true);
  };

  const openEditModal = (t: Transaction) => {
    setEditingId(t.id);
    setFormData({
        description: t.description,
        category: t.category,
        type: t.type,
        amount: t.amount.toString(),
        date: t.date,
        status: t.status,
        recurrenceType: 'none',
        recurrenceCount: 2
    });
    setIsModalOpen(true);
  };

  const handleDuplicateTransaction = (t: Transaction) => {
      setEditingId(null); // Ensure it's a new entry
      setFormData({
          description: t.description,
          category: t.category,
          type: t.type,
          amount: t.amount.toString(),
          date: new Date().toISOString().split('T')[0], // Reset to today
          status: 'pendente', // Default duplicate to pending
          recurrenceType: 'none',
          recurrenceCount: 2
      });
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.category) return;

    const amountValue = parseFloat(formData.amount) || 0;

    // Single Update
    if (editingId) {
        const payload: Transaction = {
            id: editingId,
            description: formData.description,
            category: formData.category,
            type: formData.type as 'receita' | 'despesa',
            amount: amountValue,
            date: formData.date,
            status: formData.status as 'pago' | 'pendente',
            // Preserve recurrence data from original transaction
            installments: transactions.find(t => t.id === editingId)?.installments,
            isRecurring: transactions.find(t => t.id === editingId)?.isRecurring
        };
        onUpdateTransaction(payload);
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
                date: dateStr,
                status: (formData.recurrenceType !== 'none' && i > 0) ? 'pendente' : (formData.status as 'pago' | 'pendente'),
                isRecurring: formData.recurrenceType === 'recurring',
                installments: formData.recurrenceType === 'installment' ? { current: i + 1, total: count } : undefined
            };
            transactionsToCreate.push(t);
        }

        onAddTransaction(transactionsToCreate);

        // AUTO-NAVIGATE: If the added transaction date is not in current view, switch view
        const [firstY, firstM] = formData.date.split('-').map(Number);
        // Note: firstM is 1-indexed (e.g., 05 for May), currentMonth is 0-indexed (e.g., 4 for May)
        if (firstY !== currentYear || (firstM - 1) !== currentMonth) {
            setCurrentDate(new Date(firstY, firstM - 1, 1));
        }
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (t: Transaction) => {
    // Check if it's a recurring or installment transaction
    if (t.isRecurring || t.installments) {
        setTransactionToDelete(t);
    } else {
        // Standard single deletion
        if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
            onDeleteTransaction(t.id);
        }
    }
  };
  
  const handleRecurrenceDelete = (deleteType: 'single' | 'series') => {
      if (!transactionToDelete) return;

      if (deleteType === 'single') {
          onDeleteTransaction(transactionToDelete.id);
      } else {
          // This calls the new handler in App.tsx to delete all related transactions
          onDeleteTransactionSeries(transactionToDelete);
      }
      setTransactionToDelete(null);
  };

  const handleQuickStatusToggle = (t: Transaction) => {
      const newStatus = t.status === 'pago' ? 'pendente' : 'pago';
      onUpdateTransaction({
          ...t,
          status: newStatus
      });
  };

  // --- EXPORT FUNCTIONS ---
  const handleExportCSV = () => {
      const summaryRows = [
          ["RESUMO DO PERÍODO", `${monthNames[currentMonth]} ${currentYear}`],
          ["Total Receitas (Pago)", realizedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
          ["Total Despesas (Pago)", realizedExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
          ["Saldo Realizado", caixaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
          ["Saldo Previsto (Pago + Pendente)", caixaProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
          [],
          ["DETALHAMENTO DE LANÇAMENTOS"]
      ];

      const headers = ["Data", "Descrição", "Categoria", "Tipo", "Status", "Valor"];
      const rows = filteredTransactions.map(t => [
          formatDateDisplay(t.date).full,
          t.description,
          t.category,
          t.type,
          t.status,
          (t.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      ]);

      const csvContent = "\uFEFF"
          + summaryRows.map(e => e.join(";")).join("\n") + "\n"
          + headers.join(";") + "\n" 
          + rows.map(e => e.join(";")).join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorio_financeiro_${monthNames[currentMonth]}_${currentYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExportModal(false);
  };

  const handlePrintReport = () => {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (!printWindow) return;

      const reportTitle = `Relatório Financeiro - ${monthNames[currentMonth]} ${currentYear}`;
      
      const htmlContent = `
        <html>
          <head>
            <title>${reportTitle}</title>
            <style>
              body { font-family: 'Inter', sans-serif; padding: 20px; color: #1e293b; }
              h1 { font-size: 24px; margin-bottom: 5px; color: #0f172a; }
              h2 { font-size: 16px; font-weight: normal; margin-bottom: 30px; color: #64748b; }
              .summary { display: flex; gap: 20px; margin-bottom: 30px; }
              .card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; flex: 1; }
              .card-label { font-size: 12px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-bottom: 5px; }
              .card-value { font-size: 20px; font-weight: bold; }
              .value-green { color: #16a34a; }
              .value-red { color: #dc2626; }
              .value-blue { color: #2563eb; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th { text-align: left; padding: 10px; border-bottom: 2px solid #e2e8f0; background: #f8fafc; text-transform: uppercase; color: #475569; font-size: 10px; }
              td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
              .text-right { text-align: right; }
              .tag { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
              .tag-receita { background: #dcfce7; color: #166534; }
              .tag-despesa { background: #fee2e2; color: #991b1b; }
              .footer { margin-top: 40px; font-size: 10px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            </style>
          </head>
          <body>
            <h1>${reportTitle}</h1>
            <h2>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</h2>

            <div class="summary">
                <div class="card">
                    <div class="card-label">Total Receitas</div>
                    <div class="card-value value-green">R$ ${realizedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="card">
                    <div class="card-label">Total Despesas</div>
                    <div class="card-value value-red">R$ ${realizedExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="card">
                    <div class="card-label">Saldo Realizado</div>
                    <div class="card-value ${caixaAtual >= 0 ? 'value-blue' : 'value-red'}">R$ ${caixaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Tipo</th>
                        <th>Status</th>
                        <th class="text-right">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredTransactions.map(t => `
                        <tr>
                            <td>${formatDateDisplay(t.date).full}</td>
                            <td>${t.description} ${t.installments ? `(${t.installments.current}/${t.installments.total})` : ''}</td>
                            <td>${t.category}</td>
                            <td><span class="tag ${t.type === 'receita' ? 'tag-receita' : 'tag-despesa'}">${t.type}</span></td>
                            <td>${t.status}</td>
                            <td class="text-right">
                                ${t.type === 'despesa' ? '- ' : ''}
                                R$ ${(t.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="footer">
                Relatório gerado pela plataforma Regular MEI.
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
          printWindow.print();
          printWindow.close();
      }, 500);
      setIsExportModal(false);
  };

  const getCategoryIcon = (catName: string, type: 'receita' | 'despesa') => {
      const cats = type === 'receita' ? revenueCats : expenseCats;
      const found = cats.find(c => c.name === catName);
      return found ? found.icon : 'attach_money';
  };

  const ChartSection = ({ data, title, total }: { data: any[], title: string, total: number }) => (
     <div className="flex-1 min-h-[180px] flex flex-col">
        <h4 className="text-xs font-bold text-slate-500 uppercase text-center mb-2">{title}</h4>
        {data.length > 0 ? (
            <div className="flex-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                            ))}
                        </Pie>
                        <RechartsTooltip 
                            formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                            {total.toLocaleString('pt-BR', { notation: 'compact', compactDisplay: 'short' })}
                        </span>
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex-1 flex items-center justify-center text-slate-300 text-xs italic">
                Sem dados.
            </div>
        )}
     </div>
  );
  
  const BulkActionBar: React.FC = () => {
      if (selectedTransactions.length === 0) return null;
      
      return (
          <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 p-3 rounded-lg border border-primary shadow-lg flex flex-col sm:flex-row justify-between items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <p className="text-sm font-bold text-slate-800 dark:text-white flex-shrink-0">
                  {selectedTransactions.length} transação(ões) selecionada(s)
              </p>
              <div className="flex gap-3 flex-wrap justify-end">
                  <button 
                      onClick={() => handleBulkUpdateStatus('pago')}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors shadow-sm"
                  >
                      <span className="material-icons text-sm">check_circle</span> Marcar como Pago
                  </button>
                  <button 
                      onClick={() => handleBulkUpdateStatus('pendente')}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white transition-colors shadow-sm"
                  >
                      <span className="material-icons text-sm">schedule</span> Marcar como Pendente
                  </button>
                  <button 
                      onClick={handleBulkDelete}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm"
                  >
                      <span className="material-icons text-sm">delete</span> Excluir
                  </button>
              </div>
          </div>
      );
  };


  // Group by date for "Statement Style" display
  const groupedTransactions = useMemo(() => {
      const groups: Record<string, Transaction[]> = {};
      filteredTransactions.forEach(t => {
          if (!groups[t.date]) groups[t.date] = [];
          groups[t.date].push(t);
      });
      return groups;
  }, [filteredTransactions]);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Actions */}
      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
        <div className="flex gap-2 w-full md:w-auto">
             <button 
                onClick={() => setIsExportModal(true)}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex-1 md:flex-none justify-center"
            >
                <span className="material-icons text-xl">file_download</span>
                <span className="hidden sm:inline">Relatórios</span>
            </button>
            <button 
                onClick={openAddModal}
                className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex-1 md:flex-none justify-center"
            >
            <span className="material-icons text-xl">add</span>
            Nova Transação
            </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm w-full md:w-fit mx-auto">
         <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
             <span className="material-icons">chevron_left</span>
         </button>
         <span className="text-lg font-bold text-slate-800 dark:text-white capitalize min-w-[140px] text-center">
             {monthNames[currentMonth]} {currentYear}
         </span>
         <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
             <span className="material-icons">chevron_right</span>
         </button>
      </div>

      {/* Summary Cards (New Model) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Caixa Atual */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <span className="material-icons text-primary dark:text-blue-400">account_balance_wallet</span>
            </div>
            <div className="min-w-0">
                 <p className="text-xs font-bold uppercase text-slate-400 truncate">Caixa Atual</p>
                 <p className={`text-xl font-bold truncate ${caixaAtual >= 0 ? 'text-slate-800 dark:text-white' : 'text-red-600'}`}>R$ {caixaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
        
        {/* 2. A Receber */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-sm">
           <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <span className="material-icons text-green-500 dark:text-green-400">arrow_upward</span>
            </div>
            <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-slate-400 truncate">A Receber (Previsto)</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400 truncate">R$ {aReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* 3. A Pagar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <span className="material-icons text-red-500 dark:text-red-400">arrow_downward</span>
            </div>
            <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-slate-400 truncate">A Pagar (Pendente)</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400 truncate">R$ {aPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* 4. Caixa Projetado do Mês (Destaque) */}
         <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-4 rounded-lg border border-slate-600 ring-1 ring-slate-500 shadow-lg text-white">
           <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <span className="material-icons text-white">query_stats</span>
            </div>
            <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-slate-300 truncate">Caixa Projetado do Mês</p>
                <p className={`text-xl font-bold truncate ${caixaProjetado >= 0 ? 'text-white' : 'text-red-300'}`}>R$ {caixaProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          
          {/* Secondary Indicators */}
          <div className="mt-3 pt-3 border-t border-white/30 space-y-1">
              <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-red-300">
                      <span className="material-icons text-sm">error</span> Em Atraso
                  </span>
                  <span className="font-bold text-red-200">R$ {emAtraso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-1 text-yellow-300">
                      <span className="material-icons text-sm">schedule</span> A Vencer
                  </span>
                  <span className="font-bold text-yellow-200">R$ {aVencer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons">search</span>
            <input 
              type="text" 
              placeholder="Buscar lançamento..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 w-full"
            />
          </div>
          
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 self-start md:self-auto w-full md:w-auto overflow-x-auto">
             <button 
              onClick={() => setFilterType('all')}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'all' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
             >
               Todos
             </button>
             <button 
              onClick={() => setFilterType('receita')}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'receita' ? 'bg-white dark:bg-slate-700 text-green-500 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
             >
               Entradas
             </button>
             <button 
              onClick={() => setFilterType('despesa')}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'despesa' ? 'bg-white dark:bg-slate-700 text-red-500 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
             >
               Saídas
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TABLE SECTION (LEFT - Col Span 2) */}
        <div className="lg:col-span-2 flex flex-col order-1 gap-4">
            
            {/* Bulk Action Bar */}
            <BulkActionBar />
            
            {/* DESKTOP TABLE VIEW (Grouped by Date) */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <th className="px-4 py-4 w-10">
                                <input 
                                    type="checkbox" 
                                    checked={isAllSelected}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    className="rounded text-primary focus:ring-primary"
                                />
                            </th>
                            <th className="px-3 py-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider w-1/2">Descrição</th>
                            <th className="px-3 py-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider w-24">Status</th>
                            <th className="px-3 py-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider text-right w-32">Valor</th>
                            <th className="px-3 py-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider text-center w-24">Ações</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {sortedDates.map(dateKey => (
                            <React.Fragment key={dateKey}>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                                    <td colSpan={5} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {formatDateDisplay(dateKey).full}
                                    </td>
                                </tr>
                                {groupedTransactions[dateKey].map((t) => {
                                    const isSelected = selectedTransactions.includes(t.id);
                                    return (
                                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-4 py-4">
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected}
                                            onChange={(e) => handleSelectTransaction(t.id, e.target.checked)}
                                            className="rounded text-primary focus:ring-primary"
                                        />
                                    </td>
                                    <td className="px-3 py-4"> {/* Removed whitespace-nowrap */}
                                        <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full flex-shrink-0 ${t.type === 'receita' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-500'}`}>
                                            <span className="material-icons text-lg">{getCategoryIcon(t.category, t.type)}</span>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-medium text-slate-800 dark:text-white block leading-snug line-clamp-1">{t.description}</span>
                                            
                                            <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 rounded border border-slate-200 dark:border-slate-700">
                                                    {t.category}
                                                </span>
                                                {t.installments && (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-wide">
                                                        <span className="material-icons text-[12px] opacity-70">pie_chart</span>
                                                        {t.installments.current}/{t.installments.total}
                                                    </span>
                                                )}
                                                {t.isRecurring && (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 uppercase tracking-wide">
                                                        <span className="material-icons text-[12px]">sync</span>
                                                        Mensal
                                                    </span>
                                                )}
                                            </div>

                                        </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-4"> {/* Removed whitespace-nowrap */}
                                        <button 
                                            onClick={() => handleQuickStatusToggle(t)}
                                            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-all hover:ring-2 ring-offset-1 dark:ring-offset-slate-900 ${
                                                t.status === 'pago' 
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200 ring-green-200' 
                                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 ring-yellow-200'
                                            }`}
                                            title="Clique para alterar status"
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'pago' ? 'bg-green-600' : 'bg-yellow-600'}`}></span>
                                            {t.status === 'pago' ? (t.type === 'receita' ? 'Recebido' : 'Pago') : 'Pendente'}
                                        </button>
                                    </td>
                                    <td className={`px-3 py-4 text-right`}> {/* Removed whitespace-nowrap */}
                                        <span className={`font-bold ${t.type === 'receita' ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>
                                            {t.type === 'despesa' ? '- ' : ''}R$ {(t.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4 text-center"> {/* Removed whitespace-nowrap */}
                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEditModal(t)} className="p-1.5 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded" title="Editar">
                                            <span className="material-icons text-lg">edit</span>
                                        </button>
                                        <button onClick={() => handleDuplicateTransaction(t)} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded" title="Duplicar">
                                            <span className="material-icons text-lg">content_copy</span>
                                        </button>
                                        <button onClick={() => handleDeleteClick(t)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded" title="Excluir">
                                            <span className="material-icons text-lg">delete</span>
                                        </button>
                                        </div>
                                    </td>
                                    </tr>
                                )})}
                            </React.Fragment>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MOBILE CARD VIEW (Grouped) - Need to add checkbox here too */}
            <div className="md:hidden space-y-4">
                {sortedDates.map(dateKey => (
                    <div key={dateKey} className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase sticky top-0 bg-background-light dark:bg-background-dark py-2 z-10">
                            {formatDateDisplay(dateKey).full}
                        </h4>
                        {groupedTransactions[dateKey].map(t => {
                            const isSelected = selectedTransactions.includes(t.id);
                            return (
                            <div key={t.id} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        {/* Checkbox for mobile */}
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected}
                                            onChange={(e) => handleSelectTransaction(t.id, e.target.checked)}
                                            className="rounded text-primary focus:ring-primary mt-1"
                                        />
                                        <div className={`p-2 rounded-full flex-shrink-0 ${t.type === 'receita' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-500'}`}>
                                            <span className="material-icons text-xl">{getCategoryIcon(t.category, t.type)}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white leading-tight line-clamp-1">{t.description}</p>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{t.category}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <span className={`font-bold text-lg ${t.type === 'receita' ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>
                                            {t.type === 'despesa' ? '- ' : ''}R$ {(t.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                    <div className="flex gap-2">
                                        {t.installments && (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                <span className="material-icons text-[10px]">pie_chart</span>
                                                {t.installments.current}/{t.installments.total}
                                            </span>
                                        )}
                                        {t.isRecurring && (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                                                <span className="material-icons text-[10px]">sync</span>
                                                Fixo
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
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

                                    <div className="flex gap-1">
                                        <button onClick={() => openEditModal(t)} className="p-2 text-slate-400 hover:text-primary bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <span className="material-icons text-lg">edit</span>
                                        </button>
                                        <button onClick={() => handleDuplicateTransaction(t)} className="p-2 text-slate-400 hover:text-blue-500 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <span className="material-icons text-lg">content_copy</span>
                                        </button>
                                        <button onClick={() => handleDeleteClick(t)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                            <span className="material-icons text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                ))}
            </div>

            {filteredTransactions.length === 0 && (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="material-icons text-4xl mb-3 text-slate-300 dark:text-slate-600">search_off</span>
                    <p>Nenhuma transação encontrada.</p>
                </div>
            )}
        </div>

        {/* CHART SECTION (RIGHT - Col Span 1) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col order-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                Análise Visual
            </h3>
            
            <div className="flex-1 flex flex-col gap-6">
                {/* Chart Area */}
                <div className="flex-1 flex flex-col">
                    {filterType === 'all' ? (
                       <>
                         <ChartSection data={revenueChartData} title="Receitas" total={totalExpectedRevenue} />
                         <div className="border-t border-slate-100 dark:border-slate-800"></div>
                         <ChartSection data={expenseChartData} title="Despesas" total={totalExpectedExpense} />
                       </>
                    ) : (
                        <ChartSection 
                            data={filterType === 'receita' ? revenueChartData : expenseChartData} 
                            title={filterType === 'receita' ? 'Receitas' : 'Despesas'} 
                            total={filterType === 'receita' ? totalExpectedRevenue : totalExpectedExpense}
                        />
                    )}
                </div>
                
                {/* Top Categories List (New Improvement) */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">
                        Top Categorias ({filterType === 'receita' ? 'Receita' : filterType === 'despesa' ? 'Despesa' : 'Ambos'})
                    </h4>
                    <div className="space-y-2">
                        {(filterType === 'receita' ? revenueChartData : expenseChartData)
                            .slice(0, 5)
                            .map((item, index) => (
                                <div key={item.name} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                                    </div>
                                    <span className="font-medium text-slate-800 dark:text-white">
                                        R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        {(filterType === 'all' && revenueChartData.length === 0 && expenseChartData.length === 0) && (
                            <p className="text-xs text-slate-400 italic">Sem dados para categorizar.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>

      </div>

      {/* Export Options Modal */}
      {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 border border-slate-200 dark:border-slate-800">
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="material-icons text-3xl">file_download</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Exportar Relatório</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                          Escolha o formato desejado para o período de <strong>{monthNames[currentMonth]}/{currentYear}</strong>.
                      </p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                      <button 
                          onClick={handlePrintReport}
                          className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                      >
                          <div className="bg-red-100 text-red-600 p-2 rounded-lg group-hover:bg-red-200 transition-colors">
                              <span className="material-icons">picture_as_pdf</span>
                          </div>
                          <div className="text-left">
                              <span className="block font-bold text-slate-700 dark:text-white">Relatório PDF</span>
                              <span className="text-xs text-slate-500">Visualizar para impressão</span>
                          </div>
                          <span className="material-icons text-slate-300 ml-auto">chevron_right</span>
                      </button>

                      <button 
                          onClick={handleExportCSV}
                          className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                      >
                          <div className="bg-green-100 text-green-600 p-2 rounded-lg group-hover:bg-green-200 transition-colors">
                              <span className="material-icons">table_view</span>
                          </div>
                          <div className="text-left">
                              <span className="block font-bold text-slate-700 dark:text-white">Planilha Excel (CSV)</span>
                              <span className="text-xs text-slate-500">Dados detalhados</span>
                          </div>
                          <span className="material-icons text-slate-300 ml-auto">chevron_right</span>
                      </button>
                  </div>

                  <button 
                      onClick={() => setIsExportModal(false)}
                      className="mt-6 w-full py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                  >
                      Cancelar
                  </button>
              </div>
          </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                          {editingId ? 'Editar Transação' : 'Nova Transação'}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          <span className="material-icons">close</span>
                      </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                      {/* TYPE SELECTOR */}
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

                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                          <input 
                              type="text" 
                              required
                              value={formData.description}
                              onChange={e => setFormData({...formData, description: e.target.value})}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                              placeholder="Ex: Venda de Produto"
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
                          <p className="text-xs text-slate-500 mt-1">
                              Se o status for <b>Pendente</b>, este valor será considerado uma previsão.
                          </p>
                      </div>
                      
                      {/* Total calculation help text */}
                      {formData.recurrenceType === 'installment' && formData.amount && (
                         <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                            Valor Total da Compra: <b>R$ {(parseFloat(formData.amount) * formData.recurrenceCount).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</b>
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
                              {(formData.type === 'receita' ? revenueCats : expenseCats).map((cat, idx) => (
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
                                  onChange={e => setFormData({...formData, date: e.target.value})}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                              />
                        </div>
                      </div>
                      
                      {/* Repetition Options (Only for new) */}
                      {!editingId && (
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
                                      onChange={() => setFormData({...formData, status: 'pago'})}
                                      className="text-primary focus:ring-primary"
                                  />
                                  <span className="text-slate-700 dark:text-slate-300">Pago / Recebido</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                      type="radio" 
                                      name="status" 
                                      checked={formData.status === 'pendente'}
                                      onChange={() => setFormData({...formData, status: 'pendente'})}
                                      className="text-primary focus:ring-primary"
                                  />
                                  <span className="text-slate-700 dark:text-slate-300">Pendente (Previsto)</span>
                              </label>
                          </div>
                      </div>

                      <div className="pt-2 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
                          <button 
                              type="button" 
                              onClick={() => setIsModalOpen(false)}
                              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                              Cancelar
                          </button>
                          <button 
                              type="submit" 
                              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm font-medium"
                          >
                              {editingId ? 'Salvar Alterações' : 'Adicionar'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
      
      {/* Recurrence Delete Modal */}
      {transactionToDelete && (
          <RecurrenceDeleteModal
              transaction={transactionToDelete}
              onClose={() => setTransactionToDelete(null)}
              onDeleteSingle={() => handleRecurrenceDelete('single')}
              onDeleteSeries={() => handleRecurrenceDelete('series')}
          />
      )}
    </div>
  );
};

export default CashFlowPage;