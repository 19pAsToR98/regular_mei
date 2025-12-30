import React, { useMemo } from 'react';
import { FiscalData } from '../types';

interface AlertsCardProps {
  emAtraso: number;
  aVencer: number;
  caixaProjetado: number;
  fiscalData: FiscalData | null;
  onNavigate: (tab: string) => void;
}

interface Alert {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    colorClass: string;
    actionTab: 'cashflow' | 'cnpj';
}

const AlertsCard: React.FC<AlertsCardProps> = ({ emAtraso, aVencer, caixaProjetado, fiscalData, onNavigate }) => {
  
  const alerts: Alert[] = useMemo(() => {
    const list: Alert[] = [];
    
    // 1. Alerta Fiscal (DASN ou DAS Vencido)
    const hasFiscalDebt = fiscalData && fiscalData.totalDebt > 0;
    const hasPendingDasn = fiscalData && fiscalData.pendingDasnCount > 0;
    
    if (hasFiscalDebt || hasPendingDasn) {
        list.push({
            id: 'fiscal',
            title: 'Pendência Fiscal Crítica',
            subtitle: `Dívida total de R$ ${fiscalData!.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
            icon: 'gavel',
            colorClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            actionTab: 'cnpj'
        });
    }

    // 2. Alerta Financeiro (Contas em Atraso)
    if (emAtraso > 0) {
        list.push({
            id: 'atraso',
            title: 'Contas em Atraso',
            subtitle: `R$ ${emAtraso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em pagamentos vencidos.`,
            icon: 'schedule',
            colorClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            actionTab: 'cashflow'
        });
    }
    
    // 3. Alerta de Caixa Projetado Negativo
    if (caixaProjetado < 0) {
        list.push({
            id: 'proj_negativa',
            title: 'Caixa Projetado Negativo',
            subtitle: `Previsão de déficit de R$ ${Math.abs(caixaProjetado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no mês.`,
            icon: 'trending_down',
            colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            actionTab: 'cashflow'
        });
    }

    // 4. Alerta de Vencimentos Próximos (Se não houver atraso crítico)
    if (aVencer > 0 && emAtraso === 0) {
        list.push({
            id: 'vencer',
            title: 'Vencimentos Próximos',
            subtitle: `R$ ${aVencer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a vencer nos próximos dias.`,
            icon: 'calendar_today',
            colorClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            actionTab: 'cashflow'
        });
    }

    // Prioridade: Fiscal > Atraso > Projetado Negativo > Vencimentos
    return list.sort((a, b) => {
        const order = ['fiscal', 'atraso', 'proj_negativa', 'vencer'];
        return order.indexOf(a.id) - order.indexOf(b.id);
    });
  }, [emAtraso, aVencer, caixaProjetado, fiscalData]);

  const primaryAlert = alerts[0];

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
        {alerts.length > 0 ? 'Ações Urgentes' : 'Tudo em Dia'}
      </h3>

      {alerts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <span className="material-icons text-3xl">check_circle</span>
          </div>
          <p className="font-semibold text-slate-800 dark:text-white">Parabéns!</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Não há pendências financeiras ou fiscais críticas no momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.slice(0, 3).map((alert) => (
            <div 
              key={alert.id} 
              className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${alert.colorClass.replace('bg-', 'border-').replace('text-', 'border-')}`}
              onClick={() => onNavigate(alert.actionTab)}
            >
              <div className={`p-2 rounded-full flex-shrink-0 ${alert.colorClass}`}>
                <span className="material-icons text-xl">{alert.icon}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 dark:text-white leading-snug">{alert.title}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{alert.subtitle}</p>
              </div>
              <span className="material-icons text-slate-400 text-lg self-center">chevron_right</span>
            </div>
          ))}
          
          {alerts.length > 3 && (
              <p className="text-xs text-center text-slate-500 mt-4">
                  + {alerts.length - 3} alertas adicionais.
              </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AlertsCard;