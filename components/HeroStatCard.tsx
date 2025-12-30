import React from 'react';

interface HeroStatCardProps {
  currentBalance: number;
  aReceber: number;
  aPagar: number;
  caixaProjetado: number;
  onNavigate: (tab: string) => void;
}

const HeroStatCard: React.FC<HeroStatCardProps> = ({ currentBalance, aReceber, aPagar, caixaProjetado, onNavigate }) => {
  const isPositive = currentBalance >= 0;
  const isProjectedPositive = caixaProjetado >= 0;

  const formatCurrency = (value: number) => 
    `R$ ${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div 
      className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg col-span-12 cursor-pointer hover:shadow-xl transition-shadow"
      onClick={() => onNavigate('cashflow')}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span className="material-icons text-primary">account_balance_wallet</span>
          Caixa Disponível Agora
        </h3>
        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
            isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
            {isPositive ? 'Positivo' : 'Negativo'}
        </span>
      </div>

      <p className={`text-5xl font-black tracking-tight mb-6 ${isPositive ? 'text-slate-800 dark:text-white' : 'text-red-600'}`}>
        {formatCurrency(currentBalance)}
      </p>

      {/* Microcards / Linha de Projeção */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        
        {/* A Receber */}
        <div className="flex flex-col">
          <p className="text-xs font-bold uppercase text-slate-500 mb-1">A Receber (30 dias)</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(aReceber)}</p>
        </div>
        
        {/* A Pagar */}
        <div className="flex flex-col">
          <p className="text-xs font-bold uppercase text-slate-500 mb-1">A Pagar (30 dias)</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(aPagar)}</p>
        </div>
        
        {/* Caixa Projetado */}
        <div className="flex flex-col">
          <p className="text-xs font-bold uppercase text-slate-500 mb-1">Caixa Projetado</p>
          <p className={`text-lg font-bold ${isProjectedPositive ? 'text-primary dark:text-blue-400' : 'text-red-600'}`}>
            {formatCurrency(caixaProjetado)}
          </p>
        </div>
      </div>
      
      <p className="text-xs text-slate-400 mt-4 text-center">
          Clique para ver o detalhamento completo no Fluxo de Caixa.
      </p>
    </div>
  );
};

export default HeroStatCard;