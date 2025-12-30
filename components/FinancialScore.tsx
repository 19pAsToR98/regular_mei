
import React, { useMemo } from 'react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { Transaction } from '../types';

interface FinancialScoreProps {
  transactions: Transaction[];
}

interface ScoreFactor {
  label: string;
  type: 'positive' | 'negative' | 'neutral';
  impact: string;
}

const FinancialScore: React.FC<FinancialScoreProps> = ({ transactions }) => {
  const analysis = useMemo(() => {
    // 1. Calculate Metrics based on current month
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const monthlyTrans = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.status === 'pago';
    });

    const revenue = monthlyTrans.filter(t => t.type === 'receita').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthlyTrans.filter(t => t.type === 'despesa').reduce((acc, t) => acc + t.amount, 0);
    const balance = revenue - expense;
    
    // Avoid division by zero
    const profitMargin = revenue > 0 ? (balance / revenue) : 0;

    // 2. Score Algorithm & Feedback Generation
    let score = 50; // Base score
    const factors: ScoreFactor[] = [];

    // Check 1: Balance Health (+30 / -30)
    if (balance > 0) {
        score += 30;
        factors.push({ label: 'Saldo em caixa positivo', type: 'positive', impact: '+30' });
    } else if (balance < 0) {
        score -= 30;
        factors.push({ label: 'Conta fechando no vermelho', type: 'negative', impact: '-30' });
    } else {
        factors.push({ label: 'Saldo zerado ou sem dados', type: 'neutral', impact: '0' });
    }

    // Check 2: Efficiency (Revenue vs Expense) (+10 / -20)
    if (revenue > expense) {
        score += 10;
    } else if (expense > revenue) {
        score -= 20;
        factors.push({ label: 'Despesas superam receitas', type: 'negative', impact: '-20' });
    }

    // Check 3: Profit Margin (+20)
    if (profitMargin > 0.20) { // > 20% margin
        score += 20;
        factors.push({ label: 'Margem de lucro excelente (>20%)', type: 'positive', impact: '+20' });
    } else if (revenue > 0 && profitMargin <= 0.05) {
        factors.push({ label: 'Margem de lucro muito baixa', type: 'neutral', impact: '0' });
    }

    // Check 4: Consistency / Volume (+10)
    if (revenue > 2000) {
        score += 10;
        factors.push({ label: 'Faturamento consistente', type: 'positive', impact: '+10' });
    } else if (revenue === 0) {
        factors.push({ label: 'Sem faturamento este mês', type: 'neutral', impact: '0' });
    }

    // Clamp score 0-100
    score = Math.max(0, Math.min(100, score));

    // Determine Status
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

    return { score, status, color, factors };
  }, [transactions]);

  const chartData = [
    { name: 'Score', value: analysis.score, fill: analysis.color }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Saúde Financeira</h3>
          <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
              analysis.status === 'Excelente' ? 'bg-green-100 text-green-700' :
              analysis.status === 'Bom' ? 'bg-blue-100 text-blue-700' :
              analysis.status === 'Atenção' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
              {analysis.status}
          </span>
      </div>
      
      {/* Chart Section */}
      <div className="relative h-40 w-full -mt-4" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            cx="50%" 
            cy="70%" 
            innerRadius="70%" 
            outerRadius="100%" 
            barSize={20} 
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
        
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 pointer-events-none">
            <span className="text-5xl font-black tracking-tighter" style={{ color: analysis.color }}>
                {analysis.score}
            </span>
            <span className="text-xs text-slate-400 uppercase font-medium">Pontuação Atual</span>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="mt-2 pt-4 border-t border-slate-100 dark:border-slate-800 flex-1">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Análise Detalhada</h4>
          <div className="space-y-3">
              {analysis.factors.length > 0 ? (
                  analysis.factors.map((factor, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                        <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                            factor.type === 'positive' ? 'bg-green-100 text-green-600' :
                            factor.type === 'negative' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                            <span className="material-icons text-[10px]">
                                {factor.type === 'positive' ? 'check' : factor.type === 'negative' ? 'close' : 'remove'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="text-slate-700 dark:text-slate-300 leading-tight">{factor.label}</p>
                        </div>
                        <span className={`text-xs font-bold ${
                            factor.type === 'positive' ? 'text-green-600' : 
                            factor.type === 'negative' ? 'text-red-500' : 'text-slate-400'
                        }`}>
                            {factor.impact}
                        </span>
                    </div>
                  ))
              ) : (
                  <p className="text-xs text-slate-400 text-center italic">Adicione mais transações para gerar feedbacks.</p>
              )}
          </div>
      </div>
    </div>
  );
};

export default FinancialScore;
