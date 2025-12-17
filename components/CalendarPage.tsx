import React, { useState, useMemo } from 'react';
import { Transaction, Appointment, Category } from '../types';

interface CalendarPageProps {
  transactions: Transaction[];
  appointments: Appointment[];
  revenueCats: Category[];
  expenseCats: Category[];
  onAddTransaction: (t: Transaction) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: number) => void;
  onAddAppointment: (a: Appointment) => void;
  onUpdateAppointment: (a: Appointment) => void;
  onDeleteAppointment: (id: number) => void;
}

// Internal unified interface for display
interface CalendarEvent {
  id: number;
  date: Date;
  title: string;
  type: 'receita' | 'despesa' | 'compromisso';
  category?: string;
  amount?: number;
  time?: string;
  notify?: boolean;
}

interface Holiday {
  date: Date;
  title: string;
}

// --- HOLIDAY CALCULATION HELPERS ---
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

const getBrazilianHolidays = (year: number): Holiday[] => {
  const easter = getEasterDate(year);
  
  const carnival = new Date(easter);
  carnival.setDate(easter.getDate() - 47);
  
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);

  return [
    { date: new Date(year, 0, 1), title: 'Confraternização Universal' },
    { date: carnival, title: 'Carnaval' },
    { date: goodFriday, title: 'Sexta-feira Santa' },
    { date: easter, title: 'Páscoa' },
    { date: new Date(year, 3, 21), title: 'Tiradentes' },
    { date: new Date(year, 4, 1), title: 'Dia do Trabalho' },
    { date: corpusChristi, title: 'Corpus Christi' },
    { date: new Date(year, 8, 7), title: 'Independência do Brasil' },
    { date: new Date(year, 9, 12), title: 'Nossa Sr.a Aparecida' },
    { date: new Date(year, 10, 2), title: 'Finados' },
    { date: new Date(year, 10, 15), title: 'Proclamação da República' },
    { date: new Date(year, 11, 25), title: 'Natal' },
  ];
};

const CalendarPage: React.FC<CalendarPageProps> = ({
  transactions,
  appointments,
  revenueCats,
  expenseCats,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment
}) => {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false); // New state for mobile modal

  // Form States
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<'receita' | 'despesa' | 'compromisso'>('compromisso');
  const [newEventCategory, setNewEventCategory] = useState('');
  const [newEventAmount, setNewEventAmount] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventNotify, setNewEventNotify] = useState(false);

  // --- MERGE DATA SOURCES ---
  const events: CalendarEvent[] = useMemo(() => {
      const transEvents = transactions.map(t => {
          const [year, month, day] = t.date.split('-').map(Number);
          return {
              id: t.id,
              date: new Date(year, month - 1, day),
              title: t.description,
              type: t.type,
              category: t.category,
              amount: t.amount || t.expectedAmount,
              time: t.time || '00:00',
              notify: false
          } as CalendarEvent;
      });

      const apptEvents = appointments.map(a => {
          const [year, month, day] = a.date.split('-').map(Number);
          return {
              id: a.id,
              date: new Date(year, month - 1, day),
              title: a.title,
              type: 'compromisso',
              time: a.time,
              notify: a.notify
          } as CalendarEvent;
      });

      return [...transEvents, ...apptEvents];
  }, [transactions, appointments]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const holidays = useMemo(() => getBrazilianHolidays(currentDate.getFullYear()), [currentDate.getFullYear()]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  const getEventsForDay = (day: number) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(e => isSameDay(e.date, checkDate));
  };
  
  const getHolidaysForDay = (day: number) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return holidays.filter(h => isSameDay(h.date, checkDate));
  };

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    
    // Check if mobile (using standard tailwind lg breakpoint logic)
    if (window.innerWidth < 1024) {
      setIsDayDetailsOpen(true);
    }
  };

  const resetForm = () => {
    setNewEventTitle('');
    setNewEventType('compromisso');
    setNewEventCategory('');
    setNewEventAmount('');
    setNewEventTime('');
    setNewEventNotify(false);
    setEditingId(null);
  };

  const openNewEventModal = () => {
    resetForm();
    setIsModalOpen(true);
    // On mobile, if we open new event modal, we can close the day details modal or keep it behind
    // Keeping it behind is better UX, or closing it to focus. Let's close details for focus.
    if (window.innerWidth < 1024) setIsDayDetailsOpen(false);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingId(event.id);
    setNewEventTitle(event.title);
    setNewEventType(event.type);
    setNewEventCategory(event.category || '');
    setNewEventAmount(event.amount ? event.amount.toString() : '');
    setNewEventTime(event.time || '');
    setNewEventNotify(event.notify || false);
    setIsModalOpen(true);
    if (window.innerWidth < 1024) setIsDayDetailsOpen(false);
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
        if (event.type === 'compromisso') {
            onDeleteAppointment(event.id);
        } else {
            onDeleteTransaction(event.id);
        }
    }
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    if (newEventType === 'compromisso') {
        const appointment: Appointment = {
            id: editingId || Date.now(),
            title: newEventTitle,
            date: dateStr,
            time: newEventTime || '00:00',
            notify: newEventNotify,
            type: 'compromisso'
        };
        if (editingId) onUpdateAppointment(appointment);
        else onAddAppointment(appointment);
    } else {
        const transaction: Transaction = {
            id: editingId || Date.now(),
            description: newEventTitle,
            category: newEventCategory,
            type: newEventType,
            amount: parseFloat(newEventAmount) || 0,
            expectedAmount: parseFloat(newEventAmount) || 0,
            date: dateStr,
            time: newEventTime,
            status: 'pendente'
        };
        if (editingId) {
            const existing = transactions.find(t => t.id === editingId);
            if (existing) {
                transaction.status = existing.status;
                transaction.installments = existing.installments;
                transaction.isRecurring = existing.isRecurring;
            }
            onUpdateTransaction(transaction);
        } else {
            onAddTransaction(transaction);
        }
    }
    setIsModalOpen(false);
    resetForm();
    
    // Re-open mobile details if on mobile
    if (window.innerWidth < 1024) setIsDayDetailsOpen(true);
  };

  const renderDots = (dayEvents: CalendarEvent[], dayHolidays: Holiday[]) => {
    if (dayEvents.length === 0 && dayHolidays.length === 0) return null;
    
    const typesPresent = new Set<string>();
    
    // Add event types
    dayEvents.forEach(e => typesPresent.add(e.type));
    
    // Add holiday type
    if (dayHolidays.length > 0) {
        typesPresent.add('feriado');
    }

    const dots: { type: string, colorClass: string, title: string }[] = [];

    if (typesPresent.has('feriado')) {
        dots.push({ type: 'feriado', colorClass: 'bg-indigo-400', title: 'Feriado' });
    }
    if (typesPresent.has('receita')) {
        dots.push({ type: 'receita', colorClass: 'bg-green-500', title: 'Receita' });
    }
    if (typesPresent.has('despesa')) {
        dots.push({ type: 'despesa', colorClass: 'bg-red-500', title: 'Despesa' });
    }
    if (typesPresent.has('compromisso')) {
        dots.push({ type: 'compromisso', colorClass: 'bg-blue-500', title: 'Compromisso' });
    }

    return (
      <div className="flex gap-1.5 mt-1.5 justify-center flex-wrap px-1">
        {dots.map((dot, idx) => (
             <div key={dot.type} className={`w-3 h-3 rounded-full ${dot.colorClass} ring-2 ring-white dark:ring-slate-900`} title={dot.title}></div>
        ))}
      </div>
    );
  };

  const renderLegend = () => (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Legenda</h4>
      <div className="flex flex-wrap gap-x-4 gap-y-2 lg:flex-col lg:gap-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-indigo-400"></span>
          <span className="text-sm text-slate-600 dark:text-slate-400">Feriados</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span className="text-sm text-slate-600 dark:text-slate-400">Receitas</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="text-sm text-slate-600 dark:text-slate-400">Despesas</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          <span className="text-sm text-slate-600 dark:text-slate-400">Compromissos</span>
        </div>
      </div>
    </div>
  );

  const selectedDayEvents = events.filter(e => isSameDay(e.date, selectedDate));
  const selectedDayHolidays = holidays.filter(h => isSameDay(h.date, selectedDate));

  // --- REUSABLE EVENT LIST COMPONENT (For Sidebar & Mobile Modal) ---
  const renderEventList = () => (
    <>
      {selectedDayHolidays.length > 0 && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg mb-4">
              {selectedDayHolidays.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                      <span className="material-icons text-indigo-500 dark:text-indigo-400">celebration</span>
                      <div>
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase">Feriado Nacional</p>
                          <p className="font-semibold text-slate-800 dark:text-white text-sm">{h.title}</p>
                      </div>
                  </div>
              ))}
          </div>
      )}

      <div className="space-y-3">
        {selectedDayEvents.length === 0 && selectedDayHolidays.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <span className="material-icons text-4xl mb-2 opacity-50">event_busy</span>
            <p className="text-sm">Nenhum evento para este dia.</p>
          </div>
        ) : (
          selectedDayEvents.map(ev => (
            <div key={ev.id} className="group flex flex-col gap-2 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm relative">
              <div className="flex gap-3 items-start">
                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                  ev.type === 'receita' ? 'bg-green-500' : 
                  ev.type === 'despesa' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{ev.title}</p>
                  
                  {ev.category && (
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {ev.category}
                    </span>
                  )}

                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="material-icons text-[12px]">schedule</span> {ev.time}
                    </span>
                    {ev.amount !== undefined && (
                      <span className={`text-xs font-bold ${
                        ev.type === 'receita' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        R$ {ev.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                      {ev.type === 'receita' ? 'Conta a Receber' : 
                      ev.type === 'despesa' ? 'Conta a Pagar' : 'Compromisso'}
                    </span>
                     {ev.notify && (
                       <span className="material-icons text-[14px] text-slate-400" title="Notificação Ativada">notifications_active</span>
                     )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700 pt-2 mt-1 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openEditModal(ev); }}
                    className="p-1 text-slate-400 hover:text-primary transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                    title="Editar"
                  >
                    <span className="material-icons text-sm">edit</span>
                  </button>
                  <button 
                     onClick={(e) => { e.stopPropagation(); handleDeleteEvent(ev); }}
                     className="p-1 text-slate-400 hover:text-red-500 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                     title="Excluir"
                  >
                    <span className="material-icons text-sm">delete</span>
                  </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button 
        onClick={openNewEventModal}
        className="mt-6 w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-sm"
      >
        <span className="material-icons">add</span>
        Adicionar Evento
      </button>
    </>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-140px)] animate-in fade-in duration-500 pb-20 lg:pb-0">
      
      {/* Calendar Grid Section */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[400px] overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <span className="material-icons text-slate-600 dark:text-slate-400">chevron_left</span>
            </button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <span className="material-icons text-slate-600 dark:text-slate-400">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          {weekDays.map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 flex-1 lg:auto-rows-fr">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/50" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            const dayHolidays = getHolidaysForDay(day);
            const isSelected = isSameDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), selectedDate);
            const isToday = isSameDay(new Date(), new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
            const isHoliday = dayHolidays.length > 0;

            return (
              <div 
                key={day}
                onClick={() => handleDayClick(day)}
                className={`
                  relative border-b border-r border-slate-100 dark:border-slate-800 p-2 cursor-pointer transition-colors min-h-[80px] lg:min-h-0 flex flex-col items-center justify-start group active:bg-blue-100 dark:active:bg-blue-900/40
                  ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : isHoliday ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                `}
              >
                <span className={`
                  text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1
                  ${isToday ? 'bg-primary text-white shadow-sm' : isHoliday ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'}
                `}>
                  {day}
                </span>
                {renderDots(dayEvents, dayHolidays)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Legend (Shown below calendar grid on mobile) */}
      <div className="lg:hidden mt-6">
        {renderLegend()}
      </div>

      {/* Desktop Sidebar (Hidden on Mobile) */}
      <div className="hidden lg:flex w-full lg:w-80 flex-shrink-0 flex-col gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex-1 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {selectedDayEvents.length} eventos agendados
            </p>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
             {renderEventList()}
          </div>
        </div>
        
        {/* Desktop Legend */}
        {renderLegend()}
      </div>

      {/* Mobile Day Details Modal */}
      {isDayDetailsOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-10 sm:zoom-in-95">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white capitalize">
                        {selectedDate.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'long' })}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedDayEvents.length} eventos</p>
                  </div>
                  <button onClick={() => setIsDayDetailsOpen(false)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-500 dark:text-slate-300">
                      <span className="material-icons">close</span>
                  </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                  {renderEventList()}
              </div>
           </div>
        </div>
      )}

      {/* Add/Edit Event Modal (Global) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {editingId ? 'Editar Evento' : 'Novo Evento'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
                <input 
                  type="text" 
                  required
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="Ex: Pagamento Fornecedor"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                  <select 
                    value={newEventType}
                    onChange={(e) => {
                        setNewEventType(e.target.value as any);
                        setNewEventCategory(''); // Reset category when type changes
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                  >
                    <option value="compromisso">Compromisso</option>
                    <option value="receita">Conta a Receber</option>
                    <option value="despesa">Conta a Pagar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Horário</label>
                  <input 
                    type="time" 
                    value={newEventTime}
                    onChange={e => setNewEventTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                  />
                </div>
              </div>
              
              {(newEventType === 'receita' || newEventType === 'despesa') && (
                <div className="animate-in fade-in slide-in-from-top-2">
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                   <select 
                      value={newEventCategory}
                      onChange={(e) => setNewEventCategory(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                    >
                      <option value="">Selecione uma categoria...</option>
                      {newEventType === 'receita' 
                        ? revenueCats.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)
                        : expenseCats.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)
                      }
                    </select>
                </div>
              )}

              {newEventType !== 'compromisso' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={newEventAmount}
                    onChange={e => setNewEventAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder="0,00"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 text-sm">
                  {selectedDate.toLocaleDateString('pt-BR')}
                </div>
              </div>
              
              <div className="flex items-center gap-3 py-2">
                <button 
                  type="button"
                  onClick={() => setNewEventNotify(!newEventNotify)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${newEventNotify ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${newEventNotify ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Notificar-me
                </span>
              </div>

              <div className="pt-2 flex gap-3">
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
                  {editingId ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;