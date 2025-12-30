import React, { useMemo } from 'react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { Transaction } from '../types';

interface HealthScoreCardProps {
  transactions: Transaction[];
}

interface ScoreFactor {
  label: string;
  type: 'positive' | 'negative' | 'neutral';
  impact: string;
}

const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ transactions }) => {
  
  const currentYear = new Date().getFullYear();
  const maxLimit = 81000;

  const { scoreAnalysis, limitAnalysis } = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // --- 1. Financial Score Calculation ---
    const monthlyTrans = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.status === 'pago';
    });

    const revenue = monthlyTrans.filter(t => t.type === 'receita').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthlyTrans.filter(t => t.type === 'despesa').reduce((acc, t) => acc + t.amount, 0);
    const balance = revenue - expense;
    const profitMargin = revenue > 0 ? (balance / revenue) : 0;

    let score = 50;
    const factors: ScoreFactor[] = [];

    if (balance > 0) {
        score += 30;
        factors.push({ label: 'Saldo em caixa positivo', type: 'positive', impact: '+30' });
    } else if (balance < 0) {
        score -= 30;
        factors.push({ label: 'Conta fechando no vermelho', type: 'negative', impact: '-30' });
    }
    if (revenue > expense) {
        score += 10;
    } else if (expense > revenue) {
        score -= 20;
        factors.push({ label: 'Despesas superam receitas', type: 'negative', impact: '-20' });
    }
    if (profitMargin > 0.20) {
        score += 20;
        factors.push({ label: 'Margem de lucro excelente (>20%)', type: 'positive', impact: '+20' });
    }
    if (revenue > 2000) {
        score += 10;
        factors.push({ label: 'Faturamento consistente', type: 'positive', impact: '+10' });
    }

    score = Math.max(0, Math.min(100, score));

    let status = 'Regular';
    let color = '#F59E0B'; // Yellow

    if (score >= 80) {
        status = 'Excelente';
        color = '#10B981'; // Emerald
    } else if (score >= 60) {
        status = 'Bom';
        color = '#3B82F6'; // Blue
    } else if (score <= 40) {
        status = 'Atenção';
        color = '#EF4444'; // Red
    }
    
    const scoreAnalysis = { score, status, color, factors };

    // --- 2. Limit Thermometer Calculation ---
    const annualRevenue = transactions
      .filter(t => {
        const tYear = parseInt(t.date.split('-')[0]);
        return tYear === currentYear && t.type === 'receita' && t.status === 'pago';
      })
      .reduce((acc, t) => acc + t.amount, 0);

    const percentage = Math.min((annualRevenue / maxLimit) * 100, 100);

    const startOfYear = new Date(currentYear, 0, 1);
    const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const daysInYear = 365;
    const timePercentage = (dayOfYear / daysInYear) * 100;
    
    let limitStatus = 'Regular';
    let limitStatusColor = 'text-slate-500';
    let limitMessage = 'Seu faturamento está dentro do esperado para o período.';

    if (percentage > (timePercentage + 10)) {
        limitStatus = 'Acelerado';
        limitStatusColor = 'text-yellow-600';
        limitMessage = 'Atenção: Você está faturando mais rápido que o tempo decorrido. Cuidado com o limite.';
    } else if (percentage > 90) {
        limitStatus = 'Crítico';
        limitStatusColor = 'text-red-600';
        limitMessage = 'Você está muito próximo do limite anual. Considere o desenquadramento.';
    }

    const limitAnalysis = { annualRevenue, percentage, timePercentage, limitStatus, limitStatusColor, limitMessage };

    return { scoreAnalysis, limitAnalysis };
  }, [transactions]);

  const chartData = [
    { name: 'Score', value: scoreAnalysis.score, fill: scoreAnalysis.color }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
      
      {/* HEADER: Financial Score */}
      <div className="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Saúde Financeira</h3>
          <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
              scoreAnalysis.status === 'Excelente' ? 'bg-green-100 text-green-700' :
              scoreAnalysis.status === 'Bom' ? 'bg-blue-100 text-blue-700' :
              scoreAnalysis.status === 'Atenção' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
              {scoreAnalysis.status}
          </span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        
        {/* LEFT: Score Chart */}
        <div className="flex flex-col items-center justify-center">
            <div className="relative h-32 w-full" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                    cx="50%" 
                    cy="70%" 
                    innerRadius="70%" 
                    outerRadius="100%" 
                    barSize={15} 
                    data={chartData} 
                    startAngle={180} 
                    endAngle={0}
                >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={10}
                    />
                </RadialBarChart>
                </ResponsiveContainer>
                
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-2 pointer-events-none">
                    <span className="text-4xl font-black tracking-tighter" style={{ color: scoreAnalysis.color }}>
                        {scoreAnalysis.score}
                    </span>
                    <span className="text-xs text-slate-400 uppercase font-medium">Pontuação</span>
                </div>
            </div>
            
            <div className="mt-4 w-full">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Fatores Chave</h4>
                <div className="space-y-1">
                    {scoreAnalysis.factors.slice(0, 3).map((factor, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                                <span className={`material-icons text-[10px] ${
                                    factor.type === 'positive' ? 'text-green-600' :
                                    factor.type === 'negative' ? 'text-red-600' : 'text-slate-500'
                                }`}>
                                    {factor.type === 'positive' ? 'check' : factor.type === 'negative' ? 'close' : 'remove'}
                                </span>
                                <span className="text-slate-700 dark:text-slate-300 leading-tight">{factor.label}</span>
                            </div>
                            <span className={`font-bold ${
                                factor.type === 'positive' ? 'text-green-600' : 
                                factor.type === 'negative' ? 'text-red-500' : 'text-slate-400'
                            }`}>
                                {factor.impact}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* RIGHT: Thermometer (Limite MEI) */}
        <div className="flex flex-col justify-center border-t border-slate-100 dark:border-slate-800 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0 pt-6">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    Limite MEI {currentYear}
                </h3>
                <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 ${limitAnalysis.limitStatusColor}`}>
                    {limitAnalysis.limitStatus}
                </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-snug">
                {limitAnalysis.limitMessage}
            </p>

            {/* Progress Bar Container */}
            <div className="relative w-full h-6 bg-slate-100 dark:bg-slate-700 rounded-full mb-2 overflow-hidden">
                {/* Revenue Bar */}
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out relative z-10 ${
                        limitAnalysis.percentage > 80 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                        limitAnalysis.percentage > 50 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 
                        'bg-gradient-to-r from-green-400 to-green-500'
                    }`}
                    style={{ width: `${limitAnalysis.percentage}%` }}
                ></div>
                
                {/* Time Marker (Where you should be ideally) */}
                <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-800 dark:bg-white z-20 opacity-50 border-l border-dashed border-slate-400"
                    style={{ left: `${limitAnalysis.timePercentage}%` }}
                    title="Referência Temporal (Hoje)"
                ></div>
            </div>
            
            <div className="flex justify-between items-end mt-2">
                <div>
                    <p className="font-bold text-xl text-slate-800 dark:text-white">R$ {limitAnalysis.annualRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Acumulado</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-slate-600 dark:text-slate-300 text-lg">{limitAnalysis.percentage.toFixed(1)}%</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">utilizado de R$ {maxLimit.toLocaleString('pt-BR')}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default HealthScoreCard;