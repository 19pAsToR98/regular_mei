import React, { useState, useRef, useMemo } from 'react';
import { Category } from '../types';
import { showSuccess, showError, showWarning } from '../utils/toastUtils';

interface CategoryManagementProps {
  revenueCats: Category[];
  expenseCats: Category[];
  onAddCategory: (type: 'receita' | 'despesa', cat: Category) => void;
  onDeleteCategory: (type: 'receita' | 'despesa', name: string) => void;
}

// --- ICON DATA (Copied from SettingsPage.tsx) ---
const categorizedIcons = {
  'Financeiro': [
    'payments', 'attach_money', 'credit_card', 'account_balance_wallet', 'savings', 'receipt_long', 'paid', 'sell', 'trending_up', 'trending_down', 'pie_chart', 'sync', 'query_stats', 'account_balance', 'money_off', 'price_check', 'redeem', 'local_offer'
  ],
  'Negócios': [
    'work', 'store', 'business', 'groups', 'campaign', 'local_shipping', 'inventory_2', 'construction', 'gavel', 'verified_user', 'badge', 'handshake', 'person_add', 'support_agent', 'domain', 'factory', 'warehouse', 'content_cut', 'palette', 'brush'
  ],
  'Casa & Pessoal': [
    'home', 'apartment', 'directions_car', 'local_gas_station', 'fastfood', 'restaurant', 'pets', 'school', 'medical_services', 'fitness_center', 'shopping_bag', 'shopping_cart', 'local_cafe', 'local_bar', 'luggage', 'child_care', 'flight', 'pool', 'park'
  ],
  'Tecnologia': [
    'computer', 'phone_iphone', 'wifi', 'router', 'cloud', 'subscriptions', 'bolt', 'lightbulb', 'build', 'settings', 'laptop_mac', 'security', 'storage', 'developer_mode', 'code', 'print', 'smartphone', 'tv', 'gamepad'
  ],
  'Datas & Eventos': [
    'event', 'schedule', 'calendar_today', 'alarm', 'watch_later', 'hourglass_empty', 'date_range', 'notifications', 'celebration', 'public', 'music_note', 'camera_alt', 'mic', 'movie'
  ],
  'Diversos': [
    'category', 'more_horiz', 'attach_file', 'edit', 'delete', 'check_circle', 'warning', 'error', 'volunteer_activism', 'info', 'help', 'lock', 'star', 'favorite'
  ]
};

const portugueseIconMap: Record<string, string[]> = {
    'dinheiro': ['payments', 'attach_money', 'paid', 'savings'],
    'pagamento': ['payments', 'paid', 'credit_card'],
    'cartão': ['credit_card'],
    'casa': ['home', 'apartment'],
    'carro': ['directions_car', 'local_gas_station'],
    'comida': ['fastfood', 'restaurant'],
    'trabalho': ['work', 'business', 'store'],
    'loja': ['store', 'shopping_cart', 'shopping_bag'],
    'imposto': ['account_balance', 'gavel'],
    'saúde': ['medical_services', 'fitness_center'],
    'escola': ['school'],
    'viagem': ['flight', 'luggage'],
    'data': ['event', 'calendar_today', 'date_range'],
    'alerta': ['warning', 'error', 'notifications'],
    'config': ['settings', 'build'],
    'computador': ['computer', 'laptop_mac'],
    'celular': ['phone_iphone', 'smartphone'],
    'internet': ['wifi', 'router', 'cloud'],
    'serviço': ['work', 'build', 'support_agent'],
    'venda': ['sell', 'shopping_cart', 'inventory_2'],
    'compra': ['shopping_cart', 'shopping_bag'],
    'presente': ['redeem', 'local_offer'],
    'ajuda': ['help', 'info', 'support_agent'],
    'segurança': ['security', 'lock', 'verified_user'],
    'ferramenta': ['build', 'construction'],
    'equipe': ['groups', 'person_add'],
    'marketing': ['campaign'],
    'corte': ['content_cut'],
    'pintura': ['palette', 'brush'],
};

const defaultCategories = {
    receita: ['Serviços', 'Vendas', 'Produtos', 'Rendimentos', 'Outros'],
    despesa: ['Impostos', 'Fornecedores', 'Infraestrutura', 'Pessoal', 'Marketing', 'Software', 'Outros']
};
// --- END ICON DATA ---

const CategoryManagement: React.FC<CategoryManagementProps> = ({
  revenueCats,
  expenseCats,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [activeCatTab, setActiveCatTab] = useState<'receita' | 'despesa'>('receita');
  const [newCatInput, setNewCatInput] = useState('');
  const [selectedNewIcon, setSelectedNewIcon] = useState('sell');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [activeIconCategory, setActiveIconCategory] = useState('Financeiro');
  const [iconSearchTerm, setIconSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null); // New state for editing
  
  const iconPickerRef = useRef<HTMLDivElement>(null);

  const currentCategories = activeCatTab === 'receita' ? revenueCats : expenseCats;
  const isEditing = !!editingCategory;

  // Filtered Icons based on search and active category
  const filteredIcons = useMemo(() => {
    const allIcons = Object.values(categorizedIcons).flat();
    const searchLower = iconSearchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (!searchLower) {
        return categorizedIcons[activeIconCategory as keyof typeof categorizedIcons] || [];
    }

    const matchedByEnglish = allIcons.filter(icon => icon.toLowerCase().includes(searchLower));
    
    const matchedByPortuguese = new Set<string>();
    Object.entries(portugueseIconMap).forEach(([term, icons]) => {
        if (term.includes(searchLower)) {
            icons.forEach(icon => matchedByPortuguese.add(icon));
        }
    });

    const combinedResults = new Set([...matchedByEnglish, ...Array.from(matchedByPortuguese)]);
    
    const activeCategoryIcons = categorizedIcons[activeIconCategory as keyof typeof categorizedIcons] || [];
    
    return Array.from(combinedResults).sort((a, b) => {
        const aInActive = activeCategoryIcons.includes(a);
        const bInActive = activeCategoryIcons.includes(b);
        
        if (aInActive && !bInActive) return -1;
        if (!aInActive && bInActive) return 1;
        return a.localeCompare(b);
    });

  }, [activeIconCategory, iconSearchTerm]);

  const isDefaultCategory = (name: string, type: 'receita' | 'despesa') => {
      return defaultCategories[type].includes(name);
  };

  const handleAddCategory = () => {
    if (!newCatInput.trim()) {
        showWarning("O nome da categoria não pode ser vazio.");
        return;
    }
    
    const newCategory: Category = {
      name: newCatInput.trim(),
      icon: selectedNewIcon
    };

    onAddCategory(activeCatTab, newCategory);
    setNewCatInput('');
    setShowIconPicker(false);
    setSelectedNewIcon('sell');
  };

  const handleStartEdit = (cat: Category) => {
      if (isDefaultCategory(cat.name, activeCatTab)) {
          showWarning("Categorias padrão não podem ser editadas.");
          return;
      }
      setEditingCategory(cat);
      setNewCatInput(cat.name);
      setSelectedNewIcon(cat.icon);
  };

  const handleCancelEdit = () => {
      setEditingCategory(null);
      setNewCatInput('');
      setSelectedNewIcon('sell');
  };

  // Since we don't have an `onUpdateCategory` prop, we'll assume editing is primarily for the icon/name before adding/deleting.
  // For now, we'll focus on the ADD UI redesign, as updating requires more complex state management (which is usually handled by the parent/App.tsx).
  // Given the current structure, the user likely wants a better ADD/LIST interface.

  // Let's redesign the layout to be a two-column structure on desktop: List on the left, Add/Edit Form on the right.

  return (
    <div className="space-y-6">
        
        {/* Tabs for Receita/Despesa */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl inline-flex w-full md:w-auto">
            <button
                onClick={() => {
                    setActiveCatTab('receita');
                    handleCancelEdit();
                }}
                className={`flex-1 md:flex-none px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeCatTab === 'receita' ? 'bg-white dark:bg-slate-700 text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Receitas
            </button>
            <button
                onClick={() => {
                    setActiveCatTab('despesa');
                    handleCancelEdit();
                }}
                className={`flex-1 md:flex-none px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeCatTab === 'despesa' ? 'bg-white dark:bg-slate-700 text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Despesas
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Category List */}
            <div className="lg:col-span-2">
                <h4 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
                    <span className="material-icons text-lg text-slate-400">list</span>
                    Categorias Ativas ({activeCatTab === 'receita' ? 'Receitas' : 'Despesas'})
                </h4>
                
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                    {currentCategories.map((cat, idx) => {
                        const isDefault = isDefaultCategory(cat.name, activeCatTab);
                        const isSelected = editingCategory?.name === cat.name;
                        
                        return (
                            <div 
                                key={idx} 
                                className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                                    isSelected 
                                        ? 'border-primary ring-2 ring-primary/20 bg-blue-50 dark:bg-blue-900/20' 
                                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                                onClick={() => isSelected ? handleCancelEdit() : handleStartEdit(cat)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg flex-shrink-0 ${activeCatTab === 'receita' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                                        <span className="material-icons text-xl block">{cat.icon}</span>
                                    </div>
                                    <span className="font-medium text-slate-800 dark:text-white text-base">{cat.name}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {isDefault && (
                                        <span className="text-slate-400 cursor-help" title="Categoria padrão não pode ser removida.">
                                            <span className="material-icons text-sm">lock</span>
                                        </span>
                                    )}
                                    
                                    {!isDefault && (
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`Tem certeza que deseja excluir a categoria '${cat.name}'?`)) {
                                                    onDeleteCategory(activeCatTab, cat.name);
                                                }
                                            }}
                                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                            title="Remover"
                                        >
                                            <span className="material-icons text-lg">delete</span>
                                        </button>
                                    )}
                                    
                                    <span className={`material-icons text-slate-400 text-lg transition-transform ${isSelected ? 'rotate-90' : ''}`}>
                                        chevron_right
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Column 2: Add/Edit Form */}
            <div className="lg:col-span-1 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 h-fit">
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                    {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
                </h4>
                
                <div className="space-y-4">
                    
                    {/* Category Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                        <input 
                            type="text" 
                            value={newCatInput}
                            onChange={(e) => setNewCatInput(e.target.value)}
                            placeholder={`Ex: ${activeCatTab === 'receita' ? 'Consultoria' : 'Aluguel'}`}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>

                    {/* Icon Selector */}
                    <div ref={iconPickerRef}>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ícone</label>
                        <div className="flex gap-3 items-center">
                            <div className={`p-3 rounded-lg flex-shrink-0 ${activeCatTab === 'receita' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                                <span className="material-icons text-2xl block">{selectedNewIcon}</span>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setShowIconPicker(!showIconPicker)}
                                className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium"
                            >
                                Escolher Ícone
                                <span className="material-icons text-lg transition-transform duration-200">{showIconPicker ? 'expand_less' : 'expand_more'}</span>
                            </button>
                        </div>
                        
                        {showIconPicker && (
                            <div className="absolute right-4 lg:right-auto lg:left-auto lg:w-[450px] mt-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 w-[90vw] animate-in fade-in zoom-in-95 duration-200">
                                
                                {/* Search Bar */}
                                <div className="relative mb-3">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-icons text-lg">search</span>
                                    <input 
                                        type="text" 
                                        placeholder="Buscar ícone (ex: dinheiro, casa, carro)..." 
                                        value={iconSearchTerm}
                                        onChange={(e) => setIconSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                    />
                                </div>

                                {/* Category Tabs */}
                                <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-3 mb-3 max-h-24 overflow-y-auto custom-scrollbar">
                                    {Object.keys(categorizedIcons).map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => {
                                                setActiveIconCategory(cat);
                                                setIconSearchTerm('');
                                            }}
                                            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap text-center ${activeIconCategory === cat ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Icons Grid */}
                                <div className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto custom-scrollbar">
                                    {filteredIcons.length > 0 ? (
                                        filteredIcons.map((icon) => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedNewIcon(icon);
                                                    setShowIconPicker(false);
                                                }}
                                                title={icon}
                                                className={`p-2 rounded-lg flex items-center justify-center transition-all ${selectedNewIcon === icon ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                            >
                                                <span className="material-icons text-2xl">{icon}</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="col-span-8 text-center py-4 text-slate-400 text-sm">
                                            Nenhum ícone encontrado.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                        {isEditing && (
                            <button 
                                type="button"
                                onClick={handleCancelEdit}
                                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                        )}
                        <button 
                            type="button"
                            onClick={handleAddCategory}
                            disabled={!newCatInput.trim()}
                            className={`flex-1 px-4 py-2 ${activeCatTab === 'receita' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:bg-slate-300 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2`}
                        >
                            <span className="material-icons text-sm">{isEditing ? 'save' : 'add'}</span>
                            {isEditing ? 'Salvar Edição' : 'Adicionar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CategoryManagement;