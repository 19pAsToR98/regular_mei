import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction, Category, Appointment, FiscalData } from '../types';
import Reminders from './Reminders';
import Thermometer from './Thermometer';
import FinancialScore from './FinancialScore';
import HeroStatCard from './HeroStatCard'; // NEW IMPORT
import AlertsCard from './AlertsCard'; // NEW IMPORT
import WeeklyInsightCard from './WeeklyInsightCard'; // NEW IMPORT

interface MobileDashboardProps {
  transactions: Transaction[];
  appointments: Appointment[];
  fiscalData: FiscalData | null;
  user: any; // User object
  onNavigate: (tab: string) => void;
  connectionConfig: any; // Connection config for AI toggle
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

const MobileDashboard: React.FC<MobileDashboardProps> = ({ transactions, user, appointments, fiscalData, onNavigate, connectionConfig }) => {
  
  // --- 1. CALCULATIONS FOR HERO & ALERTS ---
  const { caixaAtual, aReceber, aPagar, caixaProjetado, emAtraso, aVencer, totalExpectedExpense } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date();
    const cMonth = today.getMonth();
    const cYear = today.getFullYear();

    const currentMonthTrans = transactions.filter(t => {
        const tMonth = parseInt(t.date.split('-')[1]) - 1;
        const tYear = parseInt(t.date.split('-')[0]);
        return tMonth === cMonth && tYear === cYear;
    });

    // Realized (Paid Only)
    const realizedRevenue = currentMonthTrans
      .filter(t => t.type === 'receita' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const realizedExpense = currentMonthTrans
      .filter(t => t.type === 'despesa' && t.status === 'pago')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const caixaAtual = realizedRevenue - realizedExpense;

    // Pending Transactions (30 days from now, simplified to current month for consistency)
    const pendingTrans = currentMonthTrans.filter(t => t.status === 'pendente');

    const aReceber = pendingTrans
        .filter(t => t.type === 'receita')
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const aPagar = pendingTrans
        .filter(t => t.type === 'despesa')
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const caixaProjetado = caixaAtual + aReceber - aPagar;
    
    let emAtraso = 0;
    let aVencer = 0;

    pendingTrans
        .forEach(t => {
            if (t.date < todayStr) {
                emAtraso += t.amount || 0;
            } else {
                aVencer += t.amount || 0;
            }
        });
        
    const totalExpectedExpense = realizedExpense + aPagar;

    return { caixaAtual, aReceber, aPagar, caixaProjetado, emAtraso, aVencer, totalExpectedExpense };
  }, [transactions]);

  // --- 2. DATA FOR CATEGORIES (BLOCO 4 - MOBILE) ---
  const categoryData = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Focus on Despesas for the mobile chart (as requested)
    const relevantTrans = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth && 
             tDate.getFullYear() === currentYear && 
             t.type === 'despesa';
    });

    const totals: Record<string, number> = {};
    relevantTrans.forEach(t => {
      // Use all amounts (paid + pending) for category breakdown
      totals[t.category] = (totals[t.category] || 0) + (t.amount || 0);
    });

    return Object.keys(totals)
      .map(key => ({ name: key, value: totals[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [transactions]);


  return (
    <div className="flex flex-col gap-6 pb-20">
      
      {/* 1. BLOCO 1: HERO ABSOLUTO (Caixa Agora) */}
      <HeroStatCard 
          currentBalance={caixaAtual}
          aReceber={aReceber}
          aPagar={aPagar}
          caixaProjetado={caixaProjetado}
          onNavigate={onNavigate}
      />
      
      {/* 2. BLOCO 2: ALERTAS (Contas em Atraso, Projetado Negativo, etc.) */}
      <AlertsCard 
          emAtraso={emAtraso}
          aVencer={aVencer}
          caixaProjetado={caixaProjetado}
          fiscalData={fiscalData}
          onNavigate={onNavigate}
      />

      {/* 3. BLOCO 5: INSIGHT DA SEMANA (IA) */}
      {connectionConfig.ai.enabled && (
          <WeeklyInsightCard 
              enabled={connectionConfig.ai.enabled} 
              transactions={transactions}
              onNavigate={onNavigate}
          />
      )}

      {/* 4. BLOCO 3: SAÚDE DO NEGÓCIO (Score e Termômetro) */}
      <div className="space-y-6">
          <FinancialScore transactions={transactions} />
          <Thermometer transactions={transactions} />
      </div>

      {/* 5. BLOCO 4: GRÁFICO ÚNICO (Distribuição de Despesas) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Distribuição de Despesas (Mês)</h3>
          <div className="h-56 w-full relative" style={{ minWidth: 0 }}>
              {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                          >
                              {categoryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                              ))}
                          </Pie>
                          <Tooltip 
                              formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                  </ResponsiveContainer>
              ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                      Sem dados de despesas neste período.
                  </div>
              )}
          </div>
      </div>

      {/* 6. BLOCO 2: LEMBRETES (Secundário) */}
      <Reminders 
          transactions={transactions}
          appointments={appointments}
          fiscalData={fiscalData}
          onNavigate={onNavigate}
      />

      {/* Quick Access / Footer */}
      <div className="px-2">
         <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg flex items-center justify-between cursor-pointer">
            <div>
               <p className="text-blue-100 text-xs font-bold uppercase mb-1">Dica do dia</p>
               <p className="font-medium text-sm">Mantenha seus registros fiscais atualizados.</p>
            </div>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
               <span className="material-icons text-sm">lightbulb</span>
            </div>
         </div>
      </div>

    </div>
  );
};

export default MobileDashboard;