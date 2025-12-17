import { ServiceCTA } from '../types';

export const servicesData: ServiceCTA[] = [
  {
    id: 'declaracao',
    title: 'Declaração Anual (DASN)',
    description: 'Envio rápido e seguro da sua DASN-SIMEI, garantindo conformidade e evitando multas.',
    icon: 'event_note',
    colorClass: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
  },
  {
    id: 'cancelamento',
    title: 'Cancelamento MEI',
    description: 'Encerre seu MEI com orientação completa e sem dores de cabeça futuras.',
    icon: 'cancel',
    colorClass: 'text-red-500 bg-red-100 dark:bg-red-900/30'
  },
  {
    id: 'parcelamento',
    title: 'Parcelamento de Débitos',
    description: 'Negocie e parcele seus débitos em condições acessíveis para regularizar sua situação.',
    icon: 'account_balance_wallet',
    colorClass: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30'
  },
  {
    id: 'consulta',
    title: 'Consulta de Débitos',
    description: 'Verifique pendências no CNPJ e receba orientação sobre os próximos passos.',
    icon: 'search',
    colorClass: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30'
  },
  {
    id: 'alterar',
    title: 'Alterar MEI',
    description: 'Atualize dados do seu MEI, como endereço, atividades, nome fantasia e outras informações.',
    icon: 'edit_note',
    colorClass: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30'
  },
  {
    id: 'abrir',
    title: 'Abrir MEI',
    description: 'Abra seu MEI com orientação completa, evitando erros e começando o negócio do jeito certo.',
    icon: 'store',
    colorClass: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30'
  }
];