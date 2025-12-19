import React from 'react';

const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6 border-b pb-3">Termos de Uso do Regular MEI</h1>
      
      <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
        <p><strong>Última atualização:</strong> 15 de Julho de 2024</p>

        <h2 className="text-2xl font-bold mt-6">1. Aceitação dos Termos</h2>
        <p>Ao acessar e utilizar a plataforma Regular MEI, você concorda em cumprir e estar sujeito a estes Termos de Uso. Se você não concordar com qualquer parte dos termos, não deverá utilizar nossos serviços.</p>

        <h2 className="text-2xl font-bold mt-6">2. Descrição do Serviço</h2>
        <p>O Regular MEI é um dashboard de gestão financeira e fiscal destinado a Microempreendedores Individuais (MEI) no Brasil. Oferecemos ferramentas para acompanhamento de receitas, despesas, limite de faturamento e obrigações fiscais (DAS e DASN).</p>

        <h2 className="text-2xl font-bold mt-6">3. Responsabilidade do Usuário</h2>
        <p>Você é o único responsável pela precisão e legalidade dos dados financeiros e fiscais inseridos na plataforma. O Regular MEI fornece ferramentas de apoio, mas não substitui a consulta a um contador ou a responsabilidade do MEI perante a Receita Federal.</p>
        
        <h2 className="text-2xl font-bold mt-6">4. Limitação de Responsabilidade</h2>
        <p>O Regular MEI não se responsabiliza por quaisquer perdas financeiras, multas ou danos resultantes de erros na inserção de dados pelo usuário ou de falhas técnicas que possam ocorrer, embora nos esforcemos para manter a precisão e disponibilidade do serviço.</p>
        
        <h2 className="text-2xl font-bold mt-6">5. Encerramento da Conta</h2>
        <p>Reservamo-nos o direito de suspender ou encerrar sua conta, a nosso critério exclusivo, se houver violação destes Termos ou uso indevido da plataforma.</p>
      </div>
      
      <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-sm text-slate-500">Para dúvidas, entre em contato com nosso suporte.</p>
      </div>
    </div>
  );
};

export default TermsPage;