# Brutal Team - Plataforma de Consultoria Fitness

Plataforma de consultoria fitness com área logada para alunos e coach, desenvolvida com Next.js 14, TypeScript, Tailwind CSS e Supabase.

## Funcionalidades

### Área do Aluno
- Upload de fotos de progresso semanal
- Chat privado com o coach
- Visualização de dieta ativa
- Visualização de treino ativo

### Área do Coach (Painel Master)
- Visão geral de todos os alunos
- Acesso individual a cada aluno
- Visualização de todas as fotos de progresso
- Chat privado com cada aluno
- Gerenciamento de dietas (criar, ativar/desativar, excluir)
- Gerenciamento de treinos (criar, ativar/desativar, excluir)

## Stack Tecnológica

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Storage**: Supabase Storage (fotos)
- **Hospedagem**: Vercel
- **Domínio**: brutalteam.blog.br

## Configuração do Projeto

### 1. Instalação de Dependências

```bash
npm install
```

### 2. Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o script SQL em `supabase-schema.sql` no SQL Editor do Supabase
3. Crie um bucket de storage chamado `progress-photos`:
   - Acesse Storage no dashboard do Supabase
   - Clique em "New bucket"
   - Nome: `progress-photos`
   - Public: ✅ (marcar como público)
   - Configure as políticas de storage conforme descrito no final do arquivo SQL

### 3. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto (copie de `.env.local.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-do-supabase
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Para obter as chaves:
1. Acesse seu projeto no Supabase
2. Vá em Settings > API
3. Copie a URL do projeto e as chaves necessárias

### 4. Criar Usuário Coach

Por padrão, novos usuários são criados como "aluno". Para criar um usuário coach:

1. Crie uma conta normalmente pela aplicação
2. No Supabase Dashboard, vá em Authentication > Users
3. Encontre o usuário criado
4. Vá em Table Editor > profiles
5. Altere o campo `role` de `aluno` para `coach`

Ou execute o SQL diretamente:

```sql
UPDATE profiles SET role = 'coach' WHERE email = 'seu-email@exemplo.com';
```

### 5. Executar o Projeto

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start
```

Acesse: [http://localhost:3000](http://localhost:3000)

## Deploy na Vercel

1. Faça push do código para o GitHub
2. Conecte o repositório na Vercel
3. Configure as variáveis de ambiente (Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (URL do seu domínio)
4. Configure o domínio customizado `brutalteam.blog.br` nas configurações da Vercel

## Estrutura do Projeto

```
brutal-team/
├── src/
│   ├── app/
│   │   ├── login/              # Página de login
│   │   ├── aluno/
│   │   │   └── dashboard/      # Dashboard do aluno
│   │   ├── coach/
│   │   │   ├── dashboard/      # Dashboard do coach
│   │   │   └── aluno/[id]/     # Detalhes do aluno
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── layouts/            # Layouts (Aluno e Coach)
│   │   ├── aluno/              # Componentes do aluno
│   │   └── coach/              # Componentes do coach
│   ├── lib/
│   │   └── supabase/           # Configuração do Supabase
│   └── types/                  # TypeScript types
├── public/
├── middleware.ts               # Middleware de autenticação
├── supabase-schema.sql         # Schema do banco de dados
└── package.json
```

## Banco de Dados

### Tabelas

- **profiles**: Perfis de usuários (coach e alunos)
- **progress_photos**: Fotos de progresso dos alunos
- **messages**: Mensagens entre coach e alunos
- **dietas**: Dietas criadas pelo coach
- **treinos**: Treinos criados pelo coach

### Row Level Security (RLS)

Todas as tabelas possuem políticas RLS configuradas para garantir que:
- Alunos só veem seus próprios dados
- Coach tem acesso a todos os dados de todos os alunos
- Cada usuário só pode modificar seus próprios dados (exceto o coach)

## Próximos Passos

Após configurar o projeto, você pode:

1. Personalizar cores e estilos no `tailwind.config.ts`
2. Adicionar mais funcionalidades (métricas, gráficos de evolução, etc.)
3. Implementar notificações em tempo real
4. Adicionar upload de documentos (PDFs de dietas/treinos)
5. Criar sistema de agendamento de consultas

## Suporte

Para dúvidas ou problemas, consulte:
- [Documentação do Next.js](https://nextjs.org/docs)
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do Tailwind CSS](https://tailwindcss.com/docs)
