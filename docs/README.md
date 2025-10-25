# Brutal Team - Documentação do Projeto

> Plataforma de consultoria fitness online - Sistema completo de gestão para coaches e alunos

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Features Principais](#features-principais)
- [Configuração](#configuração)
- [Deployment](#deployment)

## 🎯 Visão Geral

O Brutal Team é uma PWA (Progressive Web App) completa para gestão de consultoria fitness, conectando coaches e alunos através de uma plataforma moderna e intuitiva.

### Funcionalidades Principais

- 👨‍🏫 **Gestão de Coaches**: Dashboard completo para gerenciar alunos
- 🏋️ **Área do Aluno**: Acesso a treinos, dietas, protocolos e tracking
- 💬 **Chat com IA**: Suporte automatizado usando Gemini AI
- 📊 **Tracking de Progresso**: Acompanhamento de refeições e treinos
- 📸 **Fotos de Progresso**: Sistema de antes/depois
- 📈 **Resumos Semanais**: Análises automáticas com IA
- 🔐 **LGPD Compliant**: Termos, privacidade e exclusão de dados
- 📱 **PWA**: Instalável e funciona offline

## 🛠️ Tecnologias

### Frontend
- **Next.js 14.2.33** - App Router
- **React 18** - Server & Client Components
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide Icons** - Ícones SVG

### Backend & Database
- **Supabase** - PostgreSQL + Auth + Storage
- **Row Level Security (RLS)** - Segurança de dados
- **Supabase Storage** - Upload de fotos

### AI & Integrações
- **Google Gemini AI** - Chat e análises
- **date-fns** - Manipulação de datas
- **next-pwa** - Progressive Web App

## 📁 Estrutura do Projeto

```
brutal-team/
├── docs/                          # Documentação
│   ├── features/                 # Documentação de features
│   └── README.md                # Este arquivo
├── public/                       # Assets estáticos
│   ├── logo.png
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── app/                     # App Router (Next.js 14)
│   │   ├── (auth)/             # Rotas públicas
│   │   │   ├── login/
│   │   │   └── cadastro/
│   │   ├── aluno/              # Área do aluno
│   │   │   ├── dashboard/
│   │   │   ├── mensagens/
│   │   │   ├── fotos/
│   │   │   ├── dieta/
│   │   │   ├── treino/
│   │   │   ├── protocolo/
│   │   │   ├── progresso/
│   │   │   └── perfil/
│   │   ├── coach/              # Área do coach
│   │   │   ├── dashboard/
│   │   │   ├── alunos/
│   │   │   └── perfil/
│   │   ├── admin/              # Área administrativa
│   │   ├── api/                # API Routes
│   │   ├── termos-de-uso/
│   │   ├── politica-de-privacidade/
│   │   └── layout.tsx          # Layout raiz
│   ├── components/
│   │   ├── aluno/              # Componentes do aluno
│   │   ├── coach/              # Componentes do coach
│   │   ├── admin/              # Componentes admin
│   │   ├── chat/               # Sistema de chat
│   │   ├── layouts/            # Layouts
│   │   ├── perfil/             # Componentes de perfil
│   │   ├── pwa/                # PWA components
│   │   ├── providers/          # Context providers
│   │   └── ui/                 # UI components
│   ├── contexts/               # React Contexts
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Libraries
│   │   └── supabase/          # Supabase clients
│   ├── types/                  # TypeScript types
│   └── utils/                  # Utilities
├── supabase/                   # Supabase migrations & SQL
└── .env.local                  # Environment variables
```

## ⭐ Features Principais

### 1. Sistema de Loading & Transições
- Loading screen com ícones animados (halter, maçã, atleta, coração)
- Fundo branco com transições suaves
- Tempo configurável: 3s (login/cadastro), 1.3s (navegação interna)
- Fade-in e fade-out em todas as transições
- [Ver documentação detalhada](./features/loading-transitions.md)

### 2. LGPD & Compliance
- Termos de Uso completos
- Política de Privacidade detalhada
- Checkbox obrigatório no cadastro
- Sistema de exclusão de conta
- Email de contato: contato@brutalteam.blog.br
- Foro: Campinas - SP
- [Ver documentação detalhada](./features/lgpd-compliance.md)

### 3. Sistema de Tracking
- **Meal Tracking**: Acompanhamento de refeições diárias
- **Workout Tracking**: Registro de treinos por tipo
- Histórico com filtros (7 dias, 30 dias, personalizado)
- Badges de progresso
- [Ver documentação detalhada](./features/tracking-system.md)

### 4. Gestão de Conteúdo
- **Dietas**: Criação, edição, ativação/desativação
- **Treinos**: Múltiplos tipos (cardio, musculação, luta, outros)
- **Protocolos Hormonais**: Gestão especializada
- Sistema de versões (editar cria nova versão)
- [Ver documentação detalhada](./features/content-management.md)

### 5. Chat com IA
- Integração com Google Gemini AI
- Contexto do aluno (dieta, treino, protocolo ativos)
- Histórico de conversas
- Respostas personalizadas
- [Ver documentação detalhada](./features/ai-chat.md)

### 6. Resumos Semanais
- Geração automática com IA
- Análise de progresso semanal
- Bloqueio de 7 dias entre resumos
- Notificações quando disponíveis
- [Ver documentação detalhada](./features/weekly-summaries.md)

### 7. Sistema de Fotos
- Upload de fotos (antes/depois)
- Comparação lado a lado
- Galeria organizada
- Supabase Storage
- [Ver documentação detalhada](./features/photo-system.md)

### 8. Sistema de Aprovação
- Coaches aprovam novos alunos
- Status: pendente, aprovado
- Notificações de novos cadastros
- Tela de aguardando aprovação
- [Ver documentação detalhada](./features/approval-system.md)

### 9. PWA (Progressive Web App)
- Instalável em mobile e desktop
- Ícones otimizados
- Manifest configurado
- Service Worker
- [Ver documentação detalhada](./features/pwa.md)

### 10. Responsividade
- Mobile-first design
- Breakpoints otimizados
- Sidebar responsiva
- Formulários adaptáveis
- [Ver documentação detalhada](./features/responsive-design.md)

## 🚀 Configuração

### Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# App
NEXT_PUBLIC_APP_URL=your_app_url
```

### Instalação

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm start
```

## 📦 Deployment

### Vercel (Recomendado)
```bash
vercel deploy
```

### Google Cloud Run
```bash
gcloud run deploy gtxap --source . --platform managed --region southamerica-east1 --allow-unauthenticated
```

## 📝 Database Setup

Execute os seguintes arquivos SQL no Supabase (em ordem):

1. `supabase/advanced_features.sql` - Features avançadas
2. `supabase/create-avatars-bucket.sql` - Bucket de avatares
3. Configure RLS policies conforme documentação

## 🎨 Design System

### Cores
- **Primary**: #E11D48 (Rose)
- **Background**: White
- **Text**: Gray-900
- **Success**: Green-500
- **Error**: Red-500

### Tipografia
- **Font**: Inter (Google Fonts)
- **Headings**: Bold
- **Body**: Regular

## 📱 Suporte a Navegadores

- Chrome/Edge (últimas 2 versões)
- Firefox (últimas 2 versões)
- Safari (últimas 2 versões)
- Mobile browsers (iOS Safari, Chrome Android)

## 🤝 Contribuindo

1. Siga o padrão de código TypeScript/React
2. Use Tailwind para estilos
3. Documente novas features
4. Teste em mobile e desktop
5. Commit messages em português

## 📄 Licença

Propriedade de Brutal Team - Todos os direitos reservados

## 📧 Contato

Email: contato@brutalteam.blog.br

---

**Última atualização:** 25/10/2025
**Versão:** 2.0.0
