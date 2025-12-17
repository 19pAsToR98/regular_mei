export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

export interface StatData {
  label: string;
  value: string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  colorClass: string;
  iconBgClass: string;
  iconColorClass: string;
}

export interface Reminder {
  id: number | string;
  title: string;
  subtitle: string;
  icon: string;
  bgClass: string;
  iconColorClass: string;
  date?: string; // ISO Date for sorting
  priority?: number; // 1 = High (DASN/DAS), 2 = Medium, 3 = Low
  actionLabel?: string;
  actionLink?: string;
  actionTab?: 'cashflow' | 'cnpj' | 'calendar'; // New field for navigation
}

export interface ForecastItem {
  label: string;
  value: string;
  icon: string;
  trend: 'up' | 'down';
  bgClass: string;
  iconColorClass: string;
}

export interface Offer {
  id: number;
  partnerName: string;
  partnerColor: string; // Tailwind color class for logo bg
  partnerIcon: string;
  discount: string;
  title: string;
  description: string;
  category: string;
  code?: string;
  link?: string;
  expiry: string;
  isExclusive?: boolean;
  isFeatured?: boolean;
}

export interface NewsItem {
  id: number;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  imageUrl: string;
  readTime: string;
  status: 'published' | 'draft';
}

export interface MaintenanceConfig {
  global: boolean;
  dashboard: boolean;
  cashflow: boolean;
  invoices: boolean;
  calendar: boolean;
  cnpj: boolean;
  tools: boolean;
  news: boolean;
  offers: boolean;
}

export interface ApiFieldMapping {
  key: string;        // Internal app key (e.g., 'razaoSocial')
  jsonPath: string;   // Path in API response (e.e., 'estabelecimento.nome_fantasia')
  label: string;      // Display label (e.g., 'Nome Fantasia')
  visible: boolean;   // Whether to show this field to the user
}

export interface ConnectionConfig {
  cnpjApi: {
    baseUrl: string;
    token?: string;
    mappings: ApiFieldMapping[];
  };
  diagnosticApi: {
    webhookUrl: string;
    headerKey?: string;
    mappings: ApiFieldMapping[];
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
    fromEmail: string;
  };
  ai: {
    enabled: boolean;
  };
}

export interface PollOption {
  id: number;
  text: string;
  votes: number;
}

export interface PollVote {
  userId: string;
  userName: string;
  userEmail: string;
  optionId: number;
  optionText: string;
  votedAt: string;
}

export interface AppNotification {
  id: number;
  text: string; // Message content or Poll Question
  type: 'info' | 'warning' | 'success' | 'poll';
  date: string;
  pollOptions?: PollOption[];
  pollVotes?: PollVote[]; // Detailed vote history
  active: boolean;
  read?: boolean;
  userVotedOptionId?: number; // ID of the option the user voted for
  expiresAt?: string; // ISO Date string for poll expiration
}

export interface CNPJResponse {
  razao_social: string;
  natureza_juridica: {
    id: string;
    descricao: string;
  };
  estabelecimento: {
    cnpj: string;
    nome_fantasia: string;
    situacao_cadastral: string;
    data_inicio_atividade: string;
    tipo_logradouro: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cep: string;
    atividade_principal: {
        id: string;
        descricao: string;
    };
    cidade: {
        nome: string;
    };
    estado: {
        sigla: string;
    };
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cnpj?: string;
  isSetupComplete: boolean;
  // Admin Fields
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive' | 'suspended';
  lastActive?: string; // ISO Date
  joinedAt?: string; // ISO Date
}

// --- FISCAL API TYPES ---

export interface ServiceCTA {
  id: string;
  title: string;
  description: string;
  icon: string;
  colorClass: string;
}

export interface DasItem {
  ano: string;
  periodo: string;
  principal: string;
  multa: string;
  juros: string;
  total: string;
  vencimento: string;
  situacao: string;
  status?: string;
}

export interface DasnItem {
  ano: string;
  dataApresentacao: string | null;
  status: string;
}

export interface Mei360Result {
  identificacao: {
    cnpj: string;
    razaoSocial: string;
  };
  dASN: {
    anos: DasnItem[];
  };
  dAS: {
    anos: DasItem[];
  };
  metricas?: {
    dasnNaoApresentadaCount: number;
    dasMesesComValorCount: number;
  };
}

export interface Mei360Response {
  sucesso: boolean;
  resultado: Mei360Result;
}

export interface FiscalData {
  dasList: DasItem[];
  dasnList: DasnItem[];
  totalDebt: number;
  pendingDasnCount: number;
  status: 'regular' | 'irregular' | 'unknown';
  lastUpdate: string;
  isEstimated?: boolean;
}

// --- CASHFLOW TYPES ---

export interface Category {
  name: string;
  icon: string;
}

export interface Transaction {
  id: number;
  description: string;
  category: string;
  type: 'receita' | 'despesa';
  amount: number; // Realized Amount (Valor Pago/Recebido)
  expectedAmount?: number; // Expected Amount (Valor Previsto)
  date: string; // ISO String YYYY-MM-DD
  time?: string; // HH:MM
  status: 'pago' | 'pendente';
  installments?: {
      current: number;
      total: number;
  };
  isRecurring?: boolean;
  externalApi?: boolean; // NEW: True if added via external API
}

// --- CALENDAR TYPES ---

export interface Appointment {
  id: number;
  title: string;
  date: string; // ISO String YYYY-MM-DD
  time: string; // HH:MM
  notify: boolean;
  type: 'compromisso';
}