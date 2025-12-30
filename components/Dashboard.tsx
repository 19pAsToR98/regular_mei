import React from 'react';
import { Transaction, Appointment, FiscalData, NewsItem, ConnectionConfig } from '../types';
import HeroStatCard from './HeroStatCard';
import AlertsCard from './AlertsCard';
import FinancialScore from './FinancialScore';
import Thermometer from './Thermometer';
import DailyBalanceChart from './DailyBalanceChart';
import WeeklyInsightCard from './WeeklyInsightCard';
import Reminders from './Reminders';
import RecentTransactions from './RecentTransactions';
import NewsSlider from './NewsSlider';

interface DashboardProps {
  transactions: Transaction[];
  appointments: Appointment[];
  fiscalData: FiscalData | null;
  news: NewsItem[];
  connectionConfig: ConnectionConfig;
  onNavigate: (tab: string) => void;
  onViewNews: (id: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    transactions, appointments, fiscalData, news, connectionConfig, onNavigate, onViewNews 
}) => {
    
    // --- CALCULATIONS FOR HERO & ALERTS ---
    const { caixaAtual, aReceber, aPagar, caixaProjetado, emAtraso, aVencer } = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

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

        return { caixaAtual, aReceber, aPagar, caixaProjetado, emAtraso, aVencer };
    }, [transactions]);

    return (
        <div className="space-y-6">
            
            {/* BLOCO 1: HERO ABSOLUTO (Caixa Agora) */}
            <div className="grid grid-cols-12">
                <HeroStatCard 
                    currentBalance={caixaAtual}
                    aReceber={aReceber}
                    aPagar={aPagar}
                    caixaProjetado={caixaProjetado}
                    onNavigate={onNavigate}
                />
            </div>

            {/* BLOCO 5: INSIGHT DA SEMANA (IA) - Abaixo do Hero */}
            {connectionConfig.ai.enabled && (
                <div className="grid grid-cols-12">
                    <WeeklyInsightCard 
                        enabled={connectionConfig.ai.enabled} 
                        transactions={transactions}
                        onNavigate={onNavigate}
                    />
                </div>
            )}

            {/* BLOCO 2 & 3: ALERTAS, SAÚDE E OBRIGAÇÕES */}
            <div className="grid grid-cols-12 gap-6">
                
                {/* Coluna Esquerda (Alertas e Saúde) */}
                <div className="col-span-12 xl:col-span-8 space-y-6">
                    
                    {/* Alertas (Bloco 2) */}
                    <AlertsCard 
                        emAtraso={emAtraso}
                        aVencer={aVencer}
                        caixaProjetado={caixaProjetado}
                        fiscalData={fiscalData}
                        onNavigate={onNavigate}
                    />

                    {/* Saúde do Negócio (Bloco 3) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FinancialScore transactions={transactions} />
                        <Thermometer transactions={transactions} />
                    </div>
                </div>

                {/* Coluna Direita (Lembretes e Gráfico) */}
                <div className="col-span-12 xl:col-span-4 space-y-6">
                    
                    {/* Lembretes (Bloco 2 - Secundário) */}
                    <Reminders 
                        transactions={transactions} 
                        appointments={appointments} 
                        fiscalData={fiscalData} 
                        onNavigate={onNavigate} 
                    />
                    
                    {/* Gráfico (Bloco 4 - Desktop) */}
                    <DailyBalanceChart transactions={transactions} />
                </div>
            </div>

            {/* BLOCO 6: ATIVIDADE RECENTE E NOTÍCIAS */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 xl:col-span-6">
                    <RecentTransactions transactions={transactions} onNavigate={onNavigate} />
                </div>
                <div className="col-span-12 xl:col-span-6">
                    <NewsSlider news={news} onViewNews={onViewNews} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;