import React, { useMemo } from 'react';
import { Reminder, Transaction, Appointment, FiscalData, DasItem } from '../types';

interface RemindersProps {
  transactions?: Transaction[];
  appointments?: Appointment[];
  fiscalData?: FiscalData | null;
  onNavigate: (tab: string) => void;
}

const Reminders: React.FC<RemindersProps> = ({ transactions = [], appointments = [], fiscalData, onNavigate }) => {
  
  // --- HOLIDAY HELPERS ---
  const getEasterDate = (year: number): Date => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month, day);
  };

  const getBrazilianHolidays = (year: number) => {
    const easter = getEasterDate(year);
    const carnival = new Date(easter); carnival.setDate(easter.getDate() - 47);
    const goodFriday = new Date(easter); goodFriday.setDate(easter.getDate() - 2);
    const corpusChristi = new Date(easter); corpusChristi.setDate(easter.getDate() + 60);

    return [
      new Date(year, 0, 1),
      carnival,
      goodFriday,
      easter,
      new Date(year, 3, 21),
      new Date(year, 4, 1),
      corpusChristi,
      new Date(year, 8, 7),
      new Date(year, 9, 12),
      new Date(year, 10, 2),
      new Date(year, 10, 15),
      new Date(year, 11, 25),
    ];
  };

  const isHolidayOrWeekend = (date: Date): boolean => {
    const day = date.getDay();
    if (day === 0 || day === 6) return true; // Sunday or Saturday
    
    const holidays = getBrazilianHolidays(date.getFullYear());
    return holidays.some(h => 
      h.getDate() === date.getDate() && h.getMonth() === date.getMonth()
    );
  };

  const getNextBusinessDay = (date: Date): Date => {
    let checkDate = new Date(date);
    while (isHolidayOrWeekend(checkDate)) {
      checkDate.setDate(checkDate.getDate() + 1);
    }
    return checkDate;
  };

  // Helper to calculate difference in days (normalized to midnight)
  const getDaysDifference = (targetDate: Date): number => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const target = new Date(targetDate);
      target.setHours(0, 0, 0, 0);
      
      const diffTime = target.getTime() - today.getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // --- GENERATE REMINDERS ---
  const reminders = useMemo(() => {
    const list: Reminder[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    // 1. DASN (Annual Declaration) - Priority 1
    if (fiscalData && fiscalData.pendingDasnCount > 0) {
       fiscalData.dasnList.forEach(item => {
           if (item.status === 'pendente') {
               list.push({
                   id: `dasn-${item.ano}`,
                   title: `Declaração Anual ${item.ano} Pendente`,
                   subtitle: 'Evite multas! Regularize agora.',
                   icon: 'campaign',
                   bgClass: 'bg-red-100 dark:bg-red-900/50',
                   iconColorClass: 'text-red-500 dark:text-red-400',
                   priority: 1,
                   date: new Date(today.getFullYear(), 4, 31).toISOString(), // Roughly end of May
                   actionLabel: 'Regularizar',
                   actionTab: 'cnpj', // Navigate to CNPJ page
               });
           }
       });
    }

    // 2. DAS (Monthly Guides) - Priority 1 or 2
    if (fiscalData) {
        const eligibleDas = fiscalData.dasList
            .filter(item => {
                if (item.status === 'pago') return false;

                let dueDate: Date;
                if (item.vencimento) {
                    const [d, m, y] = item.vencimento.split('/').map(Number);
                    dueDate = new Date(y, m - 1, d);
                } else {
                    // Fallback logic
                    const [monthName, yearStr] = item.periodo.split('/');
                    const monthMap: Record<string, number> = { 
                        'Janeiro':0, 'Fevereiro':1, 'Março':2, 'Abril':3, 'Maio':4, 'Junho':5, 
                        'Julho':6, 'Agosto':7, 'Setembro':8, 'Outubro':9, 'Novembro':10, 'Dezembro':11 
                    };
                    const m = monthMap[monthName];
                    const y = parseInt(yearStr);
                    const rawDueDate = new Date(y, m + 1, 20);
                    dueDate = getNextBusinessDay(rawDueDate);
                }

                const diffDays = getDaysDifference(dueDate);

                // Store calculated date/diff for sorting later
                (item as any)._dueDate = dueDate;
                (item as any)._diffDays = diffDays;

                // FILTER: Only show if within -3 to +3 days range
                return diffDays >= -3 && diffDays <= 3;
            })
            .sort((a: any, b: any) => {
                return a._diffDays - b._diffDays;
            });

        // Take ONLY THE FIRST eligible DAS
        if (eligibleDas.length > 0) {
            const item = eligibleDas[0] as (DasItem & { _dueDate: Date, _diffDays: number });
            const diffDays = item._diffDays;
            
            let title = '';
            let bgClass = '';
            let iconColorClass = '';
            let icon = '';
            let priority = 2;

            if (diffDays < 0) {
                title = `DAS ${item.periodo} Venceu há ${Math.abs(diffDays)} dia${Math.abs(diffDays) !== 1 ? 's' : ''}`;
                bgClass = 'bg-red-100 dark:bg-red-900/50';
                iconColorClass = 'text-red-500 dark:text-red-400';
                icon = 'error';
                priority = 1;
            } else if (diffDays === 0) {
                title = `DAS ${item.periodo} Vence HOJE`;
                bgClass = 'bg-yellow-100 dark:bg-yellow-900/50';
                iconColorClass = 'text-yellow-600 dark:text-yellow-400';
                icon = 'receipt_long';
                priority = 1;
            } else {
                title = `DAS ${item.periodo} Vence em ${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
                bgClass = 'bg-yellow-100 dark:bg-yellow-900/50';
                iconColorClass = 'text-yellow-600 dark:text-yellow-400';
                icon = 'receipt_long';
                priority = 2;
            }

            list.push({
                id: `das-${item.periodo}`,
                title: title,
                subtitle: `Valor: ${item.total}`,
                icon: icon,
                bgClass: bgClass,
                iconColorClass: iconColorClass,
                priority: priority,
                date: item._dueDate.toISOString(),
                actionTab: 'cnpj', // Navigate to CNPJ page
            });
        }
    }

    // 3. Appointments & Transactions - Priority 3
    
    appointments.forEach(appt => {
        if (!appt.date) return;
        const [y, m, d] = appt.date.split('-').map(Number);
        const apptDate = new Date(y, m - 1, d);
        
        const diffDays = getDaysDifference(apptDate);

        // Show today (0) and upcoming up to 3 days
        if (diffDays >= 0 && diffDays <= 3) {
            list.push({
                id: `appt-${appt.id}`,
                title: appt.title,
                subtitle: diffDays === 0 ? `Hoje às ${appt.time}` : `Em ${diffDays} dia${diffDays !== 1 ? 's' : ''}`,
                icon: 'event',
                bgClass: 'bg-blue-100 dark:bg-blue-900/50',
                iconColorClass: 'text-blue-500 dark:text-blue-400',
                priority: 3,
                date: appt.date,
                actionTab: 'calendar', // Navigate to Calendar page
            });
        }
    });

    transactions.forEach(t => {
        if (t.status === 'pendente') {
            const [y, m, d] = t.date.split('-').map(Number);
            const tDate = new Date(y, m - 1, d);
            
            const diffDays = getDaysDifference(tDate);

            // Show overdue (-5 days) to upcoming (+3 days)
            if (diffDays >= -5 && diffDays <= 3) { 
                const isOverdue = diffDays < 0;
                const isToday = diffDays === 0;
                
                let subtitle = '';
                if (t.type === 'receita') {
                    if (isOverdue) subtitle = `Atrasado há ${Math.abs(diffDays)} dias`;
                    else if (isToday) subtitle = `Recebimento Previsto HOJE`;
                    else subtitle = `Recebimento em ${diffDays} dias`;
                } else {
                    if (isOverdue) subtitle = `Venceu há ${Math.abs(diffDays)} dias`;
                    else if (isToday) subtitle = `Vence HOJE`;
                    else subtitle = `Vence em ${diffDays} dias`;
                }

                subtitle += ` • R$ ${(t.amount || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;

                list.push({
                    id: `trans-${t.id}`,
                    title: `${t.description}`,
                    subtitle: subtitle,
                    icon: t.type === 'receita' ? 'trending_up' : 'trending_down',
                    bgClass: isOverdue ? 'bg-red-50 dark:bg-red-900/20' : (t.type === 'receita' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-100 dark:bg-slate-800'),
                    iconColorClass: isOverdue ? 'text-red-500' : (t.type === 'receita' ? 'text-green-500' : 'text-slate-500'),
                    priority: isOverdue ? 2 : 3,
                    date: t.date,
                    actionTab: 'cashflow', // Navigate to Cashflow page
                });
            }
        }
    });

    // Sort: Priority (asc), then Date (asc)
    return list.sort((a, b) => {
        if ((a.priority || 99) !== (b.priority || 99)) {
            return (a.priority || 99) - (b.priority || 99);
        }
        return new Date(a.date || '').getTime() - new Date(b.date || '').getTime();
    });

  }, [fiscalData, transactions, appointments]);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-full w-full shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Lembretes & Pendências</h3>
        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-full">{reminders.length}</span>
      </div>
      
      <div className="space-y-4 flex-grow overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
        {reminders.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
                <span className="material-icons text-4xl mb-2 opacity-30">check_circle</span>
                <p className="text-sm">Tudo em dia! Sem pendências próximas.</p>
            </div>
        ) : (
            reminders.map((reminder) => (
            <div 
                key={reminder.id} 
                onClick={() => reminder.actionTab && onNavigate(reminder.actionTab)}
                className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700 group"
            >
                <div className={`p-2.5 rounded-xl ${reminder.bgClass} flex-shrink-0 mt-0.5`}>
                <span className={`material-icons text-xl ${reminder.iconColorClass}`}>
                    {reminder.icon}
                </span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-white text-sm leading-snug truncate">{reminder.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{reminder.subtitle}</p>
                    {reminder.actionLabel && (
                        <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wide text-primary bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">
                            {reminder.actionLabel}
                        </span>
                    )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
                    <span className="material-icons text-slate-300 text-sm">chevron_right</span>
                </div>
            </div>
            ))
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
        <button 
            onClick={() => onNavigate('calendar')}
            className="text-sm font-bold text-primary hover:text-blue-600 hover:underline transition-all"
        >
            Ver Agenda Completa
        </button>
      </div>
    </div>
  );
};

export default Reminders;