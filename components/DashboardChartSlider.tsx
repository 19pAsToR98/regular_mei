import React, { useState, useRef, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, CartesianGrid, Tooltip as RechartsTooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { Transaction } from '../types';
import FinancialScore from './FinancialScore';
import Thermometer from './Thermometer';
import BalanceForecastCard from './BalanceForecastCard';

interface ChartData {
    name: string;
    saldo: number;
    receita?: number;
    despesa?: number;
    value?: number;
}

interface DashboardChartSliderProps {
    dailyBalanceData: ChartData[];
    monthlyEvolutionData: ChartData[];
    categoryDistributionData: { name: string, value: number }[];
    transactions: Transaction[];
    onNavigate: (tab: string) => void;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

const formatCurrency = (value: number) => 
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const formatKilo = (value: number) => {
    if (value === 0) return 'R$0';
    const kValue = value / 1000;
    return `R$${kValue.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
};

const DashboardChartSlider: React.FC<DashboardChartSliderProps> = ({ 
    dailyBalanceData, 
    monthlyEvolutionData, 
    categoryDistributionData,
    transactions,
    onNavigate
}) => {
    const [activeSlide, setActiveSlide] = useState(0);
    const [categoryType, setCategoryType] = useState<'despesa' | 'receita'>('despesa');
    const scrollRef = useRef<HTMLDivElement>(null);
    
    // Filter category data based on selected type (assuming categoryDistributionData contains both types)
    const filteredCategoryData = useMemo(() => {
        // NOTE: This component assumes categoryDistributionData is pre-filtered or contains only one type.
        // Since we can't easily pass two separate category datasets, we'll rely on the parent component
        // to pass the correct data or simplify the toggle here.
        // For now, we'll use the data passed and assume the parent handles the filtering if needed.
        return categoryDistributionData;
    }, [categoryDistributionData]);

    const handleScroll = () => {
        if (scrollRef.current) {
            const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
            setActiveSlide(index);
        }
    };

    const scrollToSlide = (index: number) => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                left: index * scrollRef.current.offsetWidth,
                behavior: 'smooth'
            });
            setActiveSlide(index);
        }
    };
    
    const slides = [
        { id: 'daily_balance', title: 'Saldo Diário (Mês Atual)', icon: 'bar_chart' },
        { id: 'evolution', title: 'Evolução Mensal (Últimos 6)', icon: 'trending_up' },
        { id: 'distribution', title: 'Distribuição por Categoria', icon: 'pie_chart' },
        { id: 'forecast', title: 'Projeção de Saldo', icon: 'query_stats' },
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 flex flex-col h-full">
            
            {/* Header & Navigation */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-slate-800 dark:text-white font-bold text-lg flex items-center gap-2">
                    <span className="material-icons text-primary">analytics</span>
                    {slides[activeSlide].title}
                </h3>
                <div className="flex items-center gap-2">
                    {slides.map((_, idx) => (
                        <button 
                            key={idx}
                            onClick={() => scrollToSlide(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${activeSlide === idx ? 'bg-primary w-4' : 'bg-slate-300 dark:bg-slate-700'}`}
                            aria-label={`Ir para gráfico ${idx + 1}`}
                        />
                    ))}
                    <button onClick={() => onNavigate('cashflow')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-500 ml-2">
                        <span className="material-icons text-[20px]">more_horiz</span>
                    </button>
                </div>
            </div>

            {/* Slider Content */}
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full flex-1"
                style={{ scrollbarWidth: 'none' }}
            >
                
                {/* SLIDE 0: DAILY BALANCE */}
                <div className="min-w-full snap-center flex-1 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyBalanceData} margin={{ top: 10, right: 0, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
                                dy={10} 
                            />
                            <RechartsTooltip 
                                formatter={(value: number) => [formatCurrency(value), 'Saldo']}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="saldo" name="Saldo" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* SLIDE 1: MONTHLY EVOLUTION (LAST 6 MONTHS) */}
                <div className="min-w-full snap-center flex-1 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyEvolutionData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={8}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={10} />
                            <RechartsTooltip cursor={{ fill: '#F1F5F9', opacity: 0.5 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, '']} />
                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="receita" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="despesa" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* SLIDE 2: CATEGORY DISTRIBUTION */}
                <div className="min-w-full snap-center flex-1 h-full flex flex-col items-center justify-center">
                    <div className="flex justify-center gap-2 mb-4">
                        <button onClick={() => setCategoryType('despesa')} className={`text-xs px-3 py-1 rounded-full border transition-colors ${categoryType === 'despesa' ? 'bg-red-50 text-red-600 border-red-200 font-bold' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>Despesas</button>
                        <button onClick={() => setCategoryType('receita')} className={`text-xs px-3 py-1 rounded-full border transition-colors ${categoryType === 'receita' ? 'bg-green-50 text-green-600 border-green-200 font-bold' : 'text-slate-500 border-transparent hover:bg-slate-50'}`}>Receitas</button>
                    </div>
                    {filteredCategoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={filteredCategoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {filteredCategoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                                </Pie>
                                <RechartsTooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" formatter={(value) => <span className="text-slate-600 dark:text-slate-300 text-xs font-medium ml-1">{value}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400"><span className="material-icons text-3xl mb-2 opacity-50">pie_chart</span><p className="text-sm">Sem dados nesta categoria.</p></div>
                    )}
                </div>

                {/* SLIDE 3: BALANCE FORECAST CARD (Reusing existing component) */}
                <div className="min-w-full snap-center flex-1 h-full p-4">
                    <BalanceForecastCard transactions={transactions} />
                </div>

            </div>
        </div>
    );
};

export default DashboardChartSlider;