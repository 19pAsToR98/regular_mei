import React, { useState, useRef, useEffect } from 'react';

interface AssistantChatProps {
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

interface Message {
    sender: 'assistant' | 'user';
    text: string;
    action?: {
        type: 'navigate';
        target: string;
        label: string;
    }
}

// Mapeamento de comandos simples para navegação
const commandMap: Record<string, string> = {
    'recibo': 'tools',
    'ferramentas': 'tools',
    'fluxo de caixa': 'cashflow',
    'dashboard': 'dashboard',
    'cnpj': 'cnpj',
    'calendário': 'calendar',
    'notícias': 'news',
    'ofertas': 'offers',
    'configurações': 'settings',
};

const AssistantChat: React.FC<AssistantChatProps> = ({ onClose, onNavigate }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'assistant', text: 'Olá! Eu sou Dyad, seu assistente virtual. Como posso ajudar com suas finanças ou obrigações MEI hoje?' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const userText = input.trim().toLowerCase();
    if (userText === '') return;

    const newMessage: Message = { sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, newMessage]);
    setInput('');

    // --- Lógica de Resposta Simples ---
    let assistantResponse: Message;
    
    const targetTab = Object.keys(commandMap).find(key => userText.includes(key));

    if (targetTab) {
        const tab = commandMap[targetTab];
        
        assistantResponse = { 
            sender: 'assistant', 
            text: `Claro! O módulo de ${targetTab} fica na barra lateral. Posso te levar até lá.`,
            action: {
                type: 'navigate',
                target: tab,
                label: `Ir para ${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`
            }
        };
    } else {
        assistantResponse = { sender: 'assistant', text: 'Entendi sua pergunta. No momento, estou apenas simulando uma resposta. Tente perguntar sobre "fluxo de caixa" ou "recibos"!' };
    }

    setTimeout(() => {
      setMessages(prev => [...prev, assistantResponse]);
    }, 1000);
  };
  
  const handleActionClick = (action: Message['action']) => {
      if (!action) return;
      
      if (action.type === 'navigate') {
          onNavigate(action.target);
          onClose(); // Fecha o chat após a navegação
      }
  };

  return (
    <div 
        className="fixed bottom-[6.5rem] right-6 z-40 w-full max-w-sm h-[80vh] max-h-[600px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-300 transition-all ease-in-out"
    >
      
      {/* Balão de fala (Tail) - Aponta para o botão abaixo */}
      <div className="absolute bottom-[-10px] right-4 w-0 h-0 border-x-8 border-x-transparent border-t-[10px] border-t-white dark:border-t-slate-900 shadow-lg"></div>
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-primary rounded-t-xl">
        <div className="flex items-center gap-3">
          <span className="material-icons text-white">smart_toy</span>
          <h3 className="font-bold text-white">Dyad Assistente</h3>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-full transition-colors">
          <span className="material-icons">close</span>
        </button>
      </div>

      {/* Message Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-xl shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-blue-500 text-white rounded-br-none' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              
              {msg.action && (
                  <button 
                      onClick={() => handleActionClick(msg.action)}
                      className="mt-2 text-xs font-bold px-3 py-1 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors flex items-center gap-1"
                  >
                      {msg.action.label} <span className="material-icons text-sm">arrow_forward</span>
                  </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte algo..."
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"
          />
          <button
            type="submit"
            className="bg-primary hover:bg-blue-600 text-white p-2 rounded-lg transition-colors disabled:bg-slate-400"
            disabled={input.trim() === ''}
          >
            <span className="material-icons">send</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssistantChat;