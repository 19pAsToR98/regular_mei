import React from 'react';

const SUPABASE_URL = 'https://ogwjtlkemsqmpvcikrtd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nd2p0bGtlbXNxbXB2Y2lrcnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNjEyOTcsImV4cCI6MjA4MDYzNzI5N30.at2Bl3cAhiZxQ6uuYrEwYVSqkBj7XGaMlD125O8wjRk';

const ApiDocsPage: React.FC = () => {
  
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
      
      <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Exemplo de Resposta (201 Created)</h4>
      <pre className="bg-slate-900 text-yellow-400 p-3 rounded-lg overflow-x-auto text-xs font-mono">
        {responseExample}
      </pre>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Documentação da API</h2>
      <p className="text-slate-600 dark:text-slate-400 max-w-3xl">
        Para integrações externas (como WhatsApp ou sistemas de terceiros), utilize os endpoints abaixo.
        Eles foram projetados para usar o número de telefone como identificador seguro.
      </p>

      {/* Authentication Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-icons text-primary">lock</span> Autenticação
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Para acessar os endpoints de Edge Function, você precisa apenas da API Key pública. O token JWT não é necessário, pois a função usa a Chave de Serviço (Service Role Key) internamente para buscar o usuário pelo telefone.
        </p>
        <ul className="space-y-2 text-sm font-mono bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
          <li className="text-slate-800 dark:text-white">
            <span className="font-bold">Header Obrigatório:</span> <code className="text-primary">{`apikey: ${SUPABASE_ANON_KEY}`}</code>
          </li>
        </ul>
        <p className="text-xs text-slate-500 mt-4">
          O número de telefone deve ser enviado no corpo da requisição (Payload).
        </p>
      </div>

      {/* Transactions API (Edge Function) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-icons text-green-600">swap_horiz</span> Lançamentos Financeiros (Edge Function)
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Endpoint seguro para criar receitas ou despesas usando o número de telefone do usuário.
        </p>
        
        {renderEndpoint(
          'POST',
          `${SUPABASE_URL}/functions/v1/create-transaction-by-phone`,
          'Cria um novo lançamento (receita ou despesa) associado ao usuário com o número de telefone fornecido.',
          `{
  "phone": "31996634201",
  "description": "Venda de consultoria",
  "category": "Serviços",
  "type": "receita",
  "amount": 500.00,
  "date": "2024-10-25",
  "status": "pago",
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
    // ... outros campos
  }
}`,
          "O campo 'phone' deve corresponder exatamente ao número cadastrado pelo usuário (apenas dígitos)."
        )}
      </div>

      {/* Appointments API (PostgREST - Requires JWT) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-icons text-blue-600">calendar_today</span> Compromissos (PostgREST)
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Endpoint para gerenciar lembretes e compromissos no calendário. Este endpoint requer autenticação JWT (Bearer Token).
        </p>
        
        {renderEndpoint(
          'POST',
          `${SUPABASE_URL}/rest/v1/appointments`,
          'Cria um novo compromisso. O campo user_id é preenchido automaticamente pelo RLS.',
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
]`,
          "Este endpoint requer o cabeçalho 'Authorization: Bearer [YOUR_JWT_TOKEN]'."
        )}
        
        {renderEndpoint(
          'GET',
          `${SUPABASE_URL}/rest/v1/appointments?select=*&limit=10`,
          'Lista os compromissos do usuário (máximo 10 por padrão).',
          'N/A',
          `[
  { "id": 456, "title": "Reunião...", "date": "2024-11-10", ... }
]`,
          "Este endpoint requer o cabeçalho 'Authorization: Bearer [YOUR_JWT_TOKEN]'."
        )}
      </div>
    </div>
  );
};

export default ApiDocsPage;