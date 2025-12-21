import React from 'react';

interface QuickAction {
    label: string;
    icon: string;
    targetTab: string; // Corresponds to App.tsx activeTab
}

const actions: QuickAction[] = [
    { label: 'Suporte', icon: 'support_agent', targetTab: 'settings' },
    { label: 'Serviços', icon: 'build', targetTab: 'tools' },
    { label: 'Fluxo de Caixa', icon: 'swap_horiz', targetTab: 'cashflow' },
    { label: 'Meu CNPJ', icon: 'business', targetTab: 'cnpj' },
];

interface AssistantQuickActionsProps {
    onNavigate: (tab: string) => void;
    onClose: () => void;
    messageCount: number; // Novo prop para contagem de mensagens
}

const AssistantQuickActions: React.FC<AssistantQuickActionsProps> = ({ onNavigate, onClose, messageCount }) => {
    
    // Renderiza apenas se houver 1 mensagem (a saudação inicial)
    if (messageCount > 1) {
        return null;
    }
    
    const handleClick = (tab: string) => {
        onNavigate(tab);
        onClose();
    };

    return (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs font-bold text-slate-500 uppercase mb-3">Ações Rápidas</p>
            <div className="grid grid-cols-2 gap-2">
                {actions.map(action => (
                    <button
                        key={action.targetTab}
                        onClick={() => handleClick(action.targetTab)}
                        // Reduzindo o padding e o tamanho da fonte
                        className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        <span className="material-icons text-base text-primary">{action.icon}</span>
                        <span className="text-xs font-medium">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AssistantQuickActions;