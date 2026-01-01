import React from 'react';

interface FinancialMetrics {
  realizedRevenue: number;
  realizedExpense: number;
  aReceber: number;
  emAtraso: number;
}

interface FinancialMetricsCardsProps {
  metrics: FinancialMetrics;
}

const FinancialMetricsCards: React.FC<FinancialMetricsCardsProps> = ({ metrics }) => {
  const { realizedRevenue, realizedExpense, aReceber, emAtraso } = metrics;

  // 1. Margem de Lucro Bruta (Realizada)
  const grossProfit = realizedRevenue - realizedExpense;
  const profitMargin = realizedRevenue > 0 ? (grossProfit / realizedRevenue) * 100 : 0;
  const isProfitable = profitMargin > 0;

  // 2. Taxa de Inadimplência (Atraso)
  // Consideramos inadimplência o valor que deveria ter sido recebido (aReceber) mas está em atraso (emAtraso).
  // Simplificação: Taxa de Atraso = Em Atraso / (Em Atraso + A Receber)
  const totalReceivables = emAtraso + aReceber;
  const delinquencyRate = totalReceivables > 0 ? (emAtraso / totalReceivables) * 100 : 0;
  const isHighDelinquency = delinquencyRate > 10; // Threshold de 10%

  // 3. Taxa de Cobertura de Despesas (Dias de Receita para cobrir Despesa)
  // Simplificação: Assumindo 30 dias no mês.
  const dailyRevenue = realizedRevenue / 30;
  const daysToCoverExpense = dailyRevenue > 0 ? realizedExpense / dailyRevenue : Infinity;
  const isEfficient = daysToCoverExpense <= 15; // Cobrir despesas em até 15 dias é bom

  const formatValue = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const MetricCard: React.FC<{ title: string, value: string, icon: string, color: string, subtext: string }> = ({ title, value, icon, color, subtext }) => (
    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100').replace('-500', '-100')} dark:${color.replace('text-', 'bg-').replace('-600', '-900/30').replace('-500', '-900/30')}`}>
          <span className={`material-icons text-xl ${color}`}>{icon}</span>
        </div>
        <p className="text-xs font-bold uppercase text-slate-400">{title}</p>
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtext}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      {/* 1. Margem de Lucro Bruta */}
      <MetricCard
        title="Margem de Lucro"
        value={`${profitMargin.toFixed(1)}%`}
        icon={isProfitable ? 'trending_up' : 'trending_down'}
        color={isProfitable ? 'text-green-600' : 'text-red-600'}
        subtext={isProfitable ? `Lucro de R$ ${formatValue(grossProfit)}` : `Prejuízo de R$ ${formatValue(Math.abs(grossProfit))}`}
      />

      {/* 2. Taxa de Atraso (Inadimplência) */}
      <MetricCard
        title="Taxa de Atraso"
        value={`${delinquencyRate.toFixed(1)}%`}
        icon={isHighDelinquency ? 'warning' : 'check_circle'}
        color={isHighDelinquency ? 'text-red-600' : 'text-primary'}
        subtext={totalReceivables > 0 ? `R$ ${formatValue(emAtraso)} em atraso` : 'Sem recebíveis pendentes'}
      />

      {/* 3. Dias para Cobrir Despesas */}
      <MetricCard
        title="Cobertura de Despesas"
        value={daysToCoverExpense === Infinity ? 'N/A' : `${Math.ceil(daysToCoverExpense)} dias`}
        icon={isEfficient ? 'bolt' : 'schedule'}
        color={isEfficient ? 'text-purple-600' : 'text-orange-600'}
        subtext={isEfficient ? 'Alta eficiência operacional' : 'Baixa eficiência ou alto custo fixo'}
      />
    </div>
  );
};

export default FinancialMetricsCards;