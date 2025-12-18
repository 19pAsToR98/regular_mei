import React from 'react';

const SUPABASE_URL = 'https://ogwjtlkemsqmpvcikrtd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nd2p0bGtlbXNxbXB2Y2lrcnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNjEyOTcsImV4cCI6MjA4MDYzNzI5N30.at2Bl3cAhiZxQ6uuYrEwYVSqkBj7XGaMlD125O8wjRk';

const renderEndpoint = (method: string, path: string, description: string, payloadExample: string, responseExample: string, notes?: string) => (
  <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
    <div className="flex items-center gap-3 mb-3">
      <span className={`px-3 py-1 rounded-lg text-sm font-bold text-white ${method === 'POST' ? 'bg-green-600' : method === 'GET' ? 'bg-blue-600' : 'bg-red-600'}`}>{method}</span>
      <code className="text-sm font-mono text-slate-800 dark:text-white break-all">{path}</code>
    </div>
    <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">{description}</p>
    
    {notes && (
        <div className="p-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-900/50 dark:text-yellow-300">
            <strong>Atenção:</strong> {notes}
        </div>
    )}

    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Exemplo de Payload (JSON)</h4>
    <pre className="bg-slate-900 text-green-400 p-3 rounded-lg overflow-x-auto text-xs font-mono mb-4">
      {payloadExample}
    </pre>
    
    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Exemplo de Resposta</h4>
    <pre className="bg-slate-900 text-yellow-400 p-3 rounded-lg overflow-x-auto text-xs font-mono">
      {responseExample}
    </pre>
  </div>
);

const ApiDocsPage: React.FC = () => {
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Documentação da API</h2>
      <p className="text-slate-600 dark:text-slate-400 max-w-3xl">
        Para integrações externas (como WhatsApp ou sistemas de terceiros), utilize os endpoints abaixo.
        O número de telefone é o identificador principal para todas as operações.
      </p>

      {/* Authentication Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-icons text-primary">lock</span> Autenticação
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Todos os endpoints de Edge Function abaixo exigem apenas a API Key pública no cabeçalho.
        </p>
        <ul className="space-y-2 text-sm font-mono bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
          <li className="text-slate-800 dark:text-white">
            <span className="font-bold">Header Obrigatório:</span> <br/>
            <code className="text-primary break-all">{`apikey: ${SUPABASE_ANON_KEY}`}</code>
          </li>
        </ul>
        <p className="text-xs text-slate-500 mt-4">
          O número de telefone deve ser enviado no corpo da requisição (Payload) para identificar o usuário.
        </p>
      </div>

      {/* --- FLUXO DE CAIXA (TRANSACTIONS) --- */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-icons text-green-600">swap_horiz</span> Fluxo de Caixa (Transações)
        </h3>
        
        {/* CREATE TRANSACTION */}
        {renderEndpoint(
          'POST',
          `${SUPABASE_URL}/functions/v1/create-transaction-by-phone`,
          'Cria um novo lançamento (receita ou despesa) associado ao usuário.',
          `{
  "phone": "31996634201",
  "description": "Venda de consultoria",
  "category": "Serviços",
  "type": "receita", // 'receita' ou 'despesa'
  "amount": 500.00,
  "date": "2024-10-25", // YYYY-MM-DD
  "status": "pago", // 'pago' ou 'pendente'
  "is_recurring": false,
  "installments": null
}`,
          `{
  "message": "Transaction created successfully",
  "transaction": {
    "id": 123,
    "user_id": "uuid-do-usuario",
    "description": "Venda de consultoria",
    "amount": 500.00,
    "date": "2024-10-25",
    "status": "pago"
  }
}`,
          "O campo 'phone' deve corresponder exatamente ao número cadastrado pelo usuário (apenas dígitos)."
        )}

        {/* GET TRANSACTIONS */}
        {renderEndpoint(
          'POST',
          `${SUPABASE_URL}/functions/v1/get-transactions-by-phone`,
          'Consulta transações com filtros opcionais de tipo, status e período.',
          `{
  "phone": "31996634201",
  "type": "receita", // Opcional: 'receita' ou 'despesa'
  "status": "pendente", // Opcional: 'pago' ou 'pendente'
  "date_start": "2024-10-01", // Opcional: YYYY-MM-DD
  "date_end": "2024-10-31", // Opcional: YYYY-MM-DD
  "limit": 5 // Opcional: Limite de resultados
}`,
          `{
  "message": "Transactions retrieved successfully",
  "transactions": [
    { "id": 124, "description": "Aluguel", "amount": 1200.00, "status": "pendente", ... },
    // ...
  ]
}`,
          "Use 'date_start' e 'date_end' para definir um período. Se omitidos, retorna as 10 transações mais recentes."
        )}
      </div>
      
      {/* --- CATEGORIES --- */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-icons text-purple-600">category</span> Categorias
        </h3>
        
        {/* GET CATEGORIES */}
        {renderEndpoint(
          'POST',
          `${SUPABASE_URL}/functions/v1/get-user-categories-by-phone`,
          'Retorna as categorias personalizadas do usuário (receita e despesa).',
          `{
  "phone": "31996634201",
  "type": "despesa" // Opcional: 'receita' ou 'despesa'. Se omitido, retorna todas.
}`,
          `{
  "message": "Categories retrieved successfully",
  "categories": [
    { "name": "Aluguel", "icon": "home", "type": "despesa" },
    { "name": "Consultoria", "icon": "work", "type": "receita" }
  ]
}`,
          "Este endpoint retorna apenas categorias personalizadas salvas no banco de dados. As categorias padrão devem ser combinadas no sistema cliente."
        )}
      </div>

      {/* --- CALENDÁRIO (APPOINTMENTS) --- */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-icons text-blue-600">calendar_today</span> Calendário (Compromissos)
        </h3>
        
        {/* CREATE APPOINTMENT */}
        {renderEndpoint(
          'POST',
          `${SUPABASE_URL}/functions/v1/create-appointment-by-phone`,
          'Cria um novo compromisso no calendário do usuário.',
          `{
  "phone": "31996634201",
  "title": "Reunião com Fornecedor X",
  "date": "2024-11-10", // YYYY-MM-DD
  "time": "14:30", // HH:MM
  "notify": true,
  "type": "compromisso"
}`,
          `{
  "message": "Appointment created successfully",
  "appointment": {
    "id": 456,
    "user_id": "uuid-do-usuario",
    "title": "Reunião com Fornecedor X",
    "date": "2024-11-10",
    "time": "14:30"
  }
}`,
          "O campo 'phone' deve corresponder exatamente ao número cadastrado pelo usuário (apenas dígitos)."
        )}

        {/* GET APPOINTMENTS */}
        {renderEndpoint(
          'POST',
          `${SUPABASE_URL}/functions/v1/get-appointments-by-phone`,
          'Consulta compromissos com filtros de período.',
          `{
  "phone": "31996634201",
  "date_start": "2024-10-25", // Opcional: YYYY-MM-DD
  "date_end": "2024-10-31", // Opcional: YYYY-MM-DD
  "limit": 5 // Opcional: Limite de resultados
}`,
          `{
  "message": "Appointments retrieved successfully",
  "appointments": [
    { "id": 457, "title": "Pagar DAS", "date": "2024-10-25", "time": "09:00", ... },
    // ...
  ]
}`,
          "Se apenas 'date_start' for fornecido, a consulta retorna compromissos apenas para aquele dia."
        )}
      </div>
    </div>
  );
};

export default ApiDocsPage;