import React from 'react';

const SUPABASE_URL = 'https://ogwjtlkemsqmpvcikrtd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nd2p0bGtlbXNxbXB2Y2lrcnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNjEyOTcsImV4cCI6MjA4MDYzNzI5N30.at2Bl3cAhiZxQ6uuYrEwYVSqkBj7XGaMlD125O8wjRk';

const ApiDocsPage: React.FC = () => {
  
  const renderEndpoint = (method: string, path: string, description: string, payloadExample: string, responseExample: string) => (
    <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-3">
        <span className={`px-3 py-1 rounded-lg text-sm font-bold text-white ${method === 'POST' ? 'bg-green-600' : method === 'GET' ? 'bg-blue-600' : 'bg-red-600'}`}>{method}</span>
        <code className="text-sm font-mono text-slate-800 dark:text-white break-all">{path}</code>
      </div>
      <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">{description}</p>
      
      <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Exemplo de Payload (JSON)</h4>
      <pre className="bg-slate-900 text-green-400 p-3 rounded-lg overflow-x-auto text-xs font-mono mb-4">
        {payloadExample}
      </pre>
      
      <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Exemplo de Resposta (201 Created)</h4>
      <pre className="bg-slate-900 text-yellow-400 p-3 rounded-lg overflow-x-auto text-xs font-mono">
        {responseExample}
      </pre>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Documentação da API (PostgREST)</h2>
      <p className="text-slate-600 dark:text-slate-400 max-w-3xl">
        Esta API permite que sistemas externos interajam com seus dados de Fluxo de Caixa e Calendário de forma segura, utilizando a infraestrutura Supabase.
        Lembre-se que todas as requisições devem ser autenticadas com o token JWT do usuário.
      </p>

      {/* Authentication Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-icons text-primary">lock</span> Autenticação
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Para acessar os endpoints, você precisa de dois cabeçalhos (Headers) obrigatórios:
        </p>
        <ul className="space-y-2 text-sm font-mono bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
          <li className="text-slate-800 dark:text-white">
            <span className="font-bold">1. API Key:</span> <code className="text-primary">{`apikey: ${SUPABASE_ANON_KEY}`}</code>
          </li>
          <li className="text-slate-800 dark:text-white">
            <span className="font-bold">2. Autorização (JWT):</span> <code className="text-red-500">Authorization: Bearer [YOUR_JWT_TOKEN]</code>
          </li>
        </ul>
        <p className="text-xs text-slate-500 mt-4">
          O token JWT é obtido após o login do usuário. O RLS (Row Level Security) garante que o usuário só acesse seus próprios dados.
        </p>
      </div>

      {/* Transactions API */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-icons text-green-600">swap_horiz</span> Lançamentos Financeiros (Transactions)
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Endpoint para gerenciar receitas e despesas.
        </p>
        
        {renderEndpoint(
          'POST',
          `${SUPABASE_URL}/rest/v1/transactions`,
          'Cria um novo lançamento (receita ou despesa).',
          `{
  "description": "Venda de consultoria",
  "category": "Serviços",
  "type": "receita",
  "amount": 500.00,
  "date": "2024-10-25",
  "status": "pago",
  "is_recurring": false,
  "installments": null
}`,
          `[
  {
    "id": 123,
    "user_id": "uuid-do-usuario",
    "description": "Venda de consultoria",
    "amount": 500.00,
    "date": "2024-10-25",
    // ... outros campos
  }
]`
        )}
        
        {renderEndpoint(
          'GET',
          `${SUPABASE_URL}/rest/v1/transactions?select=*&limit=10`,
          'Lista os lançamentos do usuário (máximo 10 por padrão). Use filtros como `date=eq.2024-10-25`.',
          'N/A',
          `[
  { "id": 123, "description": "Venda...", "amount": 500.00, ... },
  { "id": 124, "description": "Aluguel...", "amount": 1200.00, ... }
]`
        )}
      </div>

      {/* Appointments API */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-icons text-blue-600">calendar_today</span> Compromissos (Appointments)
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Endpoint para gerenciar lembretes e compromissos no calendário.
        </p>
        
        {renderEndpoint(
          'POST',
          `${SUPABASE_URL}/rest/v1/appointments`,
          'Cria um novo compromisso.',
          `{
  "title": "Reunião com Fornecedor X",
  "date": "2024-11-10",
  "time": "14:30",
  "notify": true,
  "type": "compromisso"
}`,
          `[
  {
    "id": 456,
    "user_id": "uuid-do-usuario",
    "title": "Reunião com Fornecedor X",
    "date": "2024-11-10",
    // ... outros campos
  }
]`
        )}
        
        {renderEndpoint(
          'DELETE',
          `${SUPABASE_URL}/rest/v1/appointments?id=eq.456`,
          'Exclui um compromisso específico pelo ID.',
          'N/A',
          'Status 204 No Content (Sucesso)'
        )}
      </div>
    </div>
  );
};

export default ApiDocsPage;