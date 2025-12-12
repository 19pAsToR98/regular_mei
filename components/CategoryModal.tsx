import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Category } from '../types';
import { showWarning } from '../utils/toastUtils';

interface CategoryModalProps {
  type: 'receita' | 'despesa';
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: 'receita' | 'despesa', cat: Category) => void;
}

// Mapeamento de ícones e termos em Português (copiado de SettingsPage para auto-suficiência)
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

const CategoryModal: React.FC<CategoryModalProps> = ({ type, isOpen, onClose, onSave }) => {
  const [newCatInput, setNewCatInput] = useState('');
  const [selectedNewIcon, setSelectedNewIcon] = useState(type === 'receita' ? 'sell' : 'receipt_long');
  const [activeIconCategory, setActiveIconCategory] = useState('Financeiro');
  const [iconSearchTerm, setIconSearchTerm] = useState('');
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
        setNewCatInput('');
        setSelectedNewIcon(type === 'receita' ? 'sell' : 'receipt_long');
        setActiveIconCategory('Financeiro');
        setIconSearchTerm('');
    }
  }, [isOpen, type]);

  // Filtered Icons based on search and active category
  const filteredIcons = useMemo(() => {
    const allIcons = Object.values(categorizedIcons).flat();
    const searchLower = iconSearchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (!searchLower) {
        return categorizedIcons[activeIconCategory as keyof typeof categorizedIcons] || [];
    }

    // 1. Search by icon name (English)
    const matchedByEnglish = allIcons.filter(icon => icon.toLowerCase().includes(searchLower));
    
    // 2. Search by Portuguese terms
    const matchedByPortuguese = new Set<string>();
    Object.entries(portugueseIconMap).forEach(([term, icons]) => {
        if (term.includes(searchLower)) {
            icons.forEach(icon => matchedByPortuguese.add(icon));
        }
    });

    // Combine and deduplicate results
    const combinedResults = new Set([...matchedByEnglish, ...Array.from(matchedByPortuguese)]);
    
    // Sort results: prioritize icons from the active category, then alphabetically
    const activeCategoryIcons = categorizedIcons[activeIconCategory as keyof typeof categorizedIcons] || [];
    
    return Array.from(combinedResults).sort((a, b) => {
        const aInActive = activeCategoryIcons.includes(a);
        const bInActive = activeCategoryIcons.includes(b);
        
        if (aInActive && !bInActive) return -1;
        if (!aInActive && bInActive) return 1;
        return a.localeCompare(b);
    });

  }, [activeIconCategory, iconSearchTerm]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) {
        showWarning("O nome da categoria não pode ser vazio.");
        return;
    }
    
    const newCategory: Category = {
      name: newCatInput.trim(),
      icon: selectedNewIcon
    };

    onSave(type, newCategory);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                Nova Categoria de {type === 'receita' ? 'Receita' : 'Despesa'}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-icons">close</span>
            </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-6 flex-1 overflow-y-auto">
            
            {/* Category Name */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Categoria</label>
                <input 
                    type="text" 
                    required
                    value={newCatInput}
                    onChange={e => setNewCatInput(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
                    placeholder={type === 'receita' ? 'Ex: Venda de Serviços' : 'Ex: Aluguel'}
                />
            </div>

            {/* Icon Picker Section (Always visible) */}
            <div className="relative">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ícone</label>
                
                {/* Selected Icon Preview */}
                <div className="flex gap-4 items-center mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${type === 'receita' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        <span className="material-icons text-2xl">{selectedNewIcon}</span>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                        Ícone selecionado: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{selectedNewIcon}</span>
                    </span>
                </div>
                
                {/* Icon Selector Content */}
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-inner w-full">
                    
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

                    {/* Category Tabs (Horizontal Scroll) */}
                    <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-700 pb-3 mb-3 scrollbar-hide">
                        {Object.keys(categorizedIcons).map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                    setActiveIconCategory(cat);
                                    setIconSearchTerm('');
                                }}
                                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${activeIconCategory === cat ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
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
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pb-2 border-t border-slate-100 dark:border-slate-800">
                <button 
                    type="button" 
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                >
                    Cancelar
                </button>
                <button 
                    type="submit" 
                    className={`flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors shadow-sm font-bold ${type === 'receita' ? 'bg-green-600' : 'bg-red-600'}`}
                >
                    Adicionar Categoria
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;