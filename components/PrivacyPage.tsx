import React from 'react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6 border-b pb-3">Política de Privacidade do Regular MEI</h1>
      
      <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
        <p><strong>Última atualização:</strong> 15 de Julho de 2024</p>

        <h2 className="text-2xl font-bold mt-6">1. Coleta de Informações</h2>
        <p>Coletamos informações que você nos fornece diretamente, incluindo nome, e-mail, telefone e CNPJ. Também coletamos dados de uso da plataforma e transações financeiras para fornecer o serviço de dashboard.</p>

        <h2 className="text-2xl font-bold mt-6">2. Uso das Informações</h2>
        <p>Utilizamos suas informações para:</p>
        <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Fornecer, operar e manter nossos serviços.</li>
            <li>Melhorar, personalizar e expandir nossos serviços.</li>
            <li>Comunicar-nos com você, incluindo para atendimento ao cliente e envio de atualizações.</li>
            <li>Monitorar e analisar o uso de nossos serviços.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-6">3. Compartilhamento de Dados</h2>
        <p>Não compartilhamos suas informações pessoais e financeiras com terceiros, exceto quando necessário para operar o serviço (ex: APIs de consulta fiscal) ou quando exigido por lei.</p>

        <h2 className="text-2xl font-bold mt-6">4. Segurança</h2>
        <p>Empregamos medidas de segurança razoáveis, incluindo criptografia e RLS (Row Level Security) no nosso banco de dados Supabase, para proteger suas informações contra acesso não autorizado.</p>
        
        <h2 className="text-2xl font-bold mt-6">5. Seus Direitos (LGPD)</h2>
        <p>Você tem o direito de acessar, corrigir ou solicitar a exclusão dos seus dados pessoais a qualquer momento, através das configurações da sua conta ou entrando em contato conosco.</p>
      </div>
      
      <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-500">Sua privacidade é nossa prioridade.</p>
      </div>
    </div>
  );
};

export default PrivacyPage;