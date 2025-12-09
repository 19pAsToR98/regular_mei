# Diretrizes de Desenvolvimento (AI Rules)

Este documento estabelece as regras e o stack tecnológico a ser seguido para garantir a consistência, manutenibilidade e performance do projeto Regular MEI Dashboard.

## 1. Stack Tecnológico

1.  **Framework:** React (v19+) utilizando componentes funcionais e Hooks.
2.  **Linguagem:** TypeScript (TSX) para tipagem estática e maior segurança no desenvolvimento.
3.  **Estilização:** Tailwind CSS, utilizado de forma extensiva para todos os aspectos de layout, design e responsividade.
4.  **Componentes UI:** Prioridade para componentes simples construídos com Tailwind. Para elementos complexos (como modais, botões avançados, inputs), utilize os componentes disponíveis na biblioteca **shadcn/ui**.
5.  **Ícones:** A biblioteca principal de ícones é o **Material Icons** (via classes `material-icons`). A biblioteca `lucide-react` está instalada e pode ser usada como alternativa, mas priorize a consistência visual com o Material Icons.
6.  **Roteamento:** O roteamento é gerenciado internamente pelo estado `activeTab` no `App.tsx`. Não utilize bibliotecas de roteamento externas (como React Router DOM) para navegação principal.
7.  **Gráficos:** A biblioteca **recharts** é a única permitida para todas as visualizações de dados (gráficos de barra, pizza, radiais, etc.).
8.  **Integração de Dados:** Para operações de banco de dados e autenticação, utilize o cliente **Supabase** configurado em `lib/supabase.ts`.
9.  **Análise Inteligente:** Utilize a biblioteca **@google/genai** para funcionalidades de inteligência artificial, como a análise financeira.
10. **Estrutura de Arquivos:** Mantenha a organização em `src/pages` para visualizações de tela cheia e `src/components` para módulos reutilizáveis.

## 2. Regras de Uso de Bibliotecas

| Funcionalidade | Biblioteca/Padrão Recomendado | Regras de Implementação |
| :--- | :--- | :--- |
| **Layout e Design** | Tailwind CSS | **Obrigatório.** Sempre utilize classes utilitárias do Tailwind para estilizar. Garanta que todos os componentes sejam responsivos (`md:`, `lg:`, etc.). |
| **Componentes UI** | shadcn/ui ou Custom Tailwind | Use shadcn/ui para componentes complexos (ex: `Button`, `Dialog`, `Card`). Mantenha a simplicidade e evite dependências desnecessárias. |
| **Ícones** | Material Icons (classes) | Use a classe `material-icons` e o nome do ícone (ex: `<span className="material-icons">home</span>`). Use `lucide-react` apenas se o ícone não estiver disponível no Material Icons. |
| **Gráficos** | recharts | Use `ResponsiveContainer` para garantir que os gráficos se ajustem ao layout. Mantenha a paleta de cores consistente com o tema da aplicação. |
| **Notificações** | Sistema de Toast (a ser implementado) | Utilize um sistema de toast para feedback não intrusivo ao usuário (sucesso, erro, aviso). |
| **Gerenciamento de Estado** | `useState`, `useMemo`, `useCallback` | Priorize o estado local e a passagem de props. Evite introduzir bibliotecas de gerenciamento de estado global, a menos que o escopo do projeto exija. |
| **APIs Externas** | `fetch` ou cliente Supabase | Use `fetch` nativo para APIs simples (como a de CNPJ). Use o cliente Supabase para interações com o backend. |