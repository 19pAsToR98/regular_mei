import React, { useMemo } from 'react';
import { Transaction, Appointment, FiscalData } from '../types';

interface AlertsBlockProps {
  transactions: Transaction[];
  appointments: Appointment[];
  fiscalData: FiscalData | null;
  onNavigate: (tab: string) => void;
}

const AlertsBlock: React.FC<AlertsBlockProps> = ({ transactions, appointments, fiscalData, onNavigate }) => {
  
  const { overdueCount, upcomingCount, isProjectedNegative, negativeDays } = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    let overdueCount = 0;
    let upcomingCount = 0;
    let currentBalance = 0;
    let isProjectedNegative = false;
    let negativeDays = 0;

    // --- 1. Financial Overdue/Upcoming (Next 7 days) ---
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
    const next7DaysStr = next7Days.toISOString().split('T')[0];

    transactions.forEach(t => {
        if (t.status === 'pendente') {
            if (t.date < todayStr) {
                overdueCount++;
            } else if (t.date <= next7DaysStr) {
                upcomingCount++;
            }
        }
    });
    
    // --- 2. Fiscal Overdue/Upcoming ---
    if (fiscalData) {
        // Count overdue DAS
        overdueCount += fiscalData.dasList.filter(d => d.status === 'vencido').length;
        // Count pending DASN
        if (fiscalData.pendingDasnCount > 0) overdueCount++; 
        
        // Count upcoming DAS (next 7 days)
        fiscalData.dasList.forEach(d => {
            if (d.status === 'avencer') {
                const [day, month, year] = d.vencimento.split('/').map(Number);
                const dueDate = new Date(year, month - 1, day);
                
                if (dueDate >= today && dueDate <= next7Days) {
                    upcomingCount++;
                }
            }
        });
    }
    
    // --- 3. Liquidity Projection (Simplified: Find first day balance goes below zero) ---
    // This is a complex calculation, we'll simulate a simple check for now based on current month's realized balance
    // and pending expenses vs pending revenue.
    
    // For a more accurate simulation, we iterate day by day:
    let tempBalance = transactions
        .filter(t => t.status === 'pago' && t.date <= todayStr)
        .reduce((acc, t) => acc + (t.type === 'receita' ? t.amount : -t.amount), 0);
    
    const pendingTransSorted = transactions
        .filter(t => t.status === 'pendente' && t.date >= todayStr)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let projectionDate = new Date(today);
    
    for (let i = 0; i < 30; i++) {
        projectionDate.setDate(projectionDate.getDate() + 1);
        const dateStr = projectionDate.toISOString().split('T')[0];
        
        const dailyTrans = pendingTransSorted.filter(t => t.date === dateStr);
        
        dailyTrans.forEach(t => {
            tempBalance += (t.type === 'receita' ? t.amount : -t.amount);
        });
        
        if (tempBalance < 0 && !isProjectedNegative) {
            isProjectedNegative = true;
            // Calculate days difference from today
            const diffTime = projectionDate.getTime() - today.getTime();
            negativeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
    }
    
    return { overdueCount, upcomingCount, isProjectedNegative, negativeDays };
  }, [transactions, fiscalData, appointments]);

  const alerts = [];

  // Alert 1: Overdue
  if (overdueCount > 0) {
    alerts.push({
      id: 'overdue',
      title: `${overdueCount} Contas ou Obrigações em Atraso`,
      description: 'Aja imediatamente para evitar multas e juros.',
      icon: 'error',
      colorClass: 'bg-red-100 text-red-600 border-red-200',
      tab: 'cnpj', // Prioritize fiscal/cashflow
    });
  }

  // Alert 2: Upcoming Vencimentos
  if (upcomingCount > 0) {
    alerts.push({
      id: 'upcoming',
      title: `${upcomingCount} Vencimentos Próximos (7 dias)`,
      description: 'Prepare o caixa para as contas e compromissos da próxima semana.',
      icon: 'schedule',
      colorClass: 'bg-yellow-100 text-yellow-600 border-yellow-200',
      tab: 'calendar', // Calendar covers both financial and appointments
    });
  }

  // Alert 3: Negative Projection
  if (isProjectedNegative) {
    alerts.push({
      id: 'negative_cash',
      title: '⚠️ Caixa Projetado Negativo',
      description: `Seu saldo pode ficar negativo em ${negativeDays} dia${negativeDays !== 1 ? 's' : ''}.`,
      icon: 'warning',
      colorClass: 'bg-orange-100 text-orange-600 border-orange-200',
      tab: 'cashflow',
    });
  }
  
  // Default: All Clear
  if (alerts.length === 0) {
      alerts.push({
          id: 'all_clear',
          title: 'Tudo Certo!',
          description: 'Não há pendências críticas ou vencimentos próximos.',
          icon: 'check_circle',
          colorClass: 'bg-green-100 text-green-600 border-green-200',
          tab: 'dashboard',
      });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Onde Preciso Agir?</h3>
      
      {alerts.map(alert => (
        <button
          key={alert.id}
          onClick={() => onNavigate(alert.tab)}
          className={`w-full text-left p-4 rounded-xl border-l-4 shadow-sm transition-all hover:shadow-md flex items-start gap-4 ${alert.colorClass} dark:bg-slate-800/50 dark:border-slate-700`}
        >
          <span className="material-icons text-2xl flex-shrink-0 mt-0.5">{alert.icon}</span>
          <div className="flex-1">
            <p className="font-bold text-slate-800 dark:text-white leading-snug">{alert.title}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{alert.description}</p>
          </div>
          <span className="material-icons text-slate-400 text-xl ml-auto">chevron_right</span>
        </button>
      ))}
    </div>
  );
};

export default AlertsBlock;