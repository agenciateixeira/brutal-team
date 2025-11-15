# 🏋️ Brutal Team - Plataforma Completa

## ✅ **Sistema 100% Funcional**

### 📱 **Área do Aluno** (Login Individual)

Cada aluno tem acesso exclusivo às suas próprias informações:

#### 1. **Dashboard** (`/aluno/dashboard`)
- Visão geral de todas as funcionalidades
- Resumo de progresso, mensagens, dieta e treino

#### 2. **Progresso** (`/aluno/progresso`)
- ✅ Upload de fotos semanais
- ✅ Adicionar observações em cada foto
- ✅ Galeria com todas as fotos enviadas
- ✅ Visualização em modal com zoom
- ✅ Deletar fotos
- ✅ Histórico completo de evolução

#### 3. **Mensagens** (`/aluno/mensagens`)
- ✅ Chat privado com o coach
- ✅ Mensagens em tempo real (Realtime do Supabase)
- ✅ Interface moderna estilo WhatsApp
- ✅ Histórico de conversas
- ✅ Suporte a múltiplas linhas (Shift+Enter)

#### 4. **Dieta** (`/aluno/dieta`)
- ✅ Visualização da dieta ativa
- ✅ Histórico de todas as dietas recebidas
- ✅ Detalhes de cada dieta (título, conteúdo, data)
- ✅ Interface expansível para ver dietas antigas

#### 5. **Treino** (`/aluno/treino`)
- ✅ Visualização do treino ativo
- ✅ Histórico de todos os treinos recebidos
- ✅ Detalhes de cada treino (título, conteúdo, data)
- ✅ Interface expansível para ver treinos antigos

#### 6. **Perfil** (`/aluno/perfil`)
- ✅ Editar nome completo
- ✅ Avatar com iniciais
- ✅ Visualizar tipo de conta
- ✅ Feedback de sucesso/erro

---

### 👨‍🏫 **Área do Coach** (Seu Painel Master)

Você (coach) tem acesso a **TODOS** os alunos:

#### 1. **Dashboard do Coach** (`/coach/dashboard`)
- ✅ Lista de todos os alunos cadastrados
- ✅ Busca por nome ou email
- ✅ Indicador de mensagens não lidas por aluno
- ✅ Informações de quando cada aluno se cadastrou
- ✅ Acesso rápido aos detalhes de cada aluno

#### 2. **Detalhes do Aluno** (`/coach/aluno/[id]`)

Ao clicar em qualquer aluno, você tem acesso a:

##### **Tab: Fotos de Progresso**
- ✅ Visualizar todas as fotos do aluno
- ✅ Ver semana de cada foto
- ✅ Ler observações do aluno
- ✅ Modal com zoom para análise detalhada

##### **Tab: Mensagens**
- ✅ Chat privado com cada aluno
- ✅ Mensagens em tempo real
- ✅ Marcar mensagens como lidas automaticamente
- ✅ Histórico completo de conversas

##### **Tab: Dieta**
- ✅ Criar novas dietas
- ✅ Visualizar todas as dietas do aluno
- ✅ Ativar/Desativar dietas
- ✅ Editar conteúdo
- ✅ Excluir dietas
- ✅ Apenas uma dieta ativa por vez

##### **Tab: Treino**
- ✅ Criar novos treinos
- ✅ Visualizar todos os treinos do aluno
- ✅ Ativar/Desativar treinos
- ✅ Editar conteúdo
- ✅ Excluir treinos
- ✅ Apenas um treino ativo por vez

#### 3. **Perfil do Coach** (`/coach/perfil`)
- ✅ Editar suas informações
- ✅ Badge de "Coach" destacado

---

## 🎨 **Recursos Visuais**

### **Design Moderno**
- ✅ Tema Claro/Escuro com toggle
- ✅ Sidebar responsiva com menu hambúrguer (mobile)
- ✅ Cores profissionais (vermelho/preto/branco)
- ✅ Transições suaves
- ✅ Ícones intuitivos (Lucide React)

### **Responsividade**
- ✅ 100% responsivo para mobile
- ✅ Layout adaptativo para tablet
- ✅ Desktop otimizado
- ✅ Menu lateral retrátil

### **PWA (Progressive Web App)**
- ✅ Instalável no celular (Android/iOS)
- ✅ Instalável no desktop
- ✅ Ícones gerados automaticamente
- ✅ Service Worker para cache offline
- ✅ Prompt de instalação automático
- ✅ Funciona como app nativo

---

## 🔐 **Segurança e Controle de Acesso**

### **Autenticação**
- ✅ Login com email/senha (Supabase Auth)
- ✅ Cadastro de novos usuários
- ✅ Proteção de rotas (Middleware)
- ✅ Sessões seguras

### **Controle de Acesso (RLS)**
- ✅ Alunos só veem seus próprios dados
- ✅ Coach vê dados de TODOS os alunos
- ✅ Mensagens privadas por aluno
- ✅ Fotos protegidas por usuário
- ✅ Dietas e treinos individualizados

### **Roles (Papéis)**
- **Coach**: Acesso total a todos os alunos
- **Aluno**: Acesso apenas aos próprios dados

---

## 📊 **Banco de Dados (Supabase)**

### **Tabelas Criadas:**
1. **profiles** - Perfis de usuários
2. **progress_photos** - Fotos de progresso
3. **messages** - Sistema de mensagens
4. **dietas** - Planos alimentares
5. **treinos** - Rotinas de exercícios

### **Storage:**
- Bucket `progress-photos` para fotos

### **Realtime:**
- Mensagens atualizadas em tempo real
- Sincronização automática

---

## 🚀 **Tecnologias Utilizadas**

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Storage**: Supabase Storage
- **Realtime**: Supabase Realtime
- **Ícones**: Lucide React
- **Datas**: date-fns (pt-BR)
- **Imagens**: Sharp (geração de ícones PWA)

---

## 📝 **Como Usar como Coach**

### **1. Acessar a Plataforma**
- URL: http://localhost:3000
- Login: guisdomkt@gmail.com
- Senha: Gui1302569
- ⚠️ **Certifique-se de que seu role está como "coach" no Supabase!**

### **2. Gerenciar Alunos**
- Veja lista de todos os alunos
- Use a busca para encontrar rapidamente
- Clique em qualquer aluno para ver detalhes

### **3. Acompanhar Progresso**
- Visualize fotos semanais
- Leia observações dos alunos
- Analise evolução visual

### **4. Comunicação**
- Troque mensagens individuais com cada aluno
- Mensagens em tempo real
- Histórico completo preservado

### **5. Criar Dietas**
- Crie quantas dietas quiser
- Ative/Desative conforme necessário
- Apenas uma ativa por vez
- Conteúdo em texto livre

### **6. Criar Treinos**
- Crie quantos treinos quiser
- Ative/Desative conforme necessário
- Apenas um ativo por vez
- Conteúdo em texto livre

---

## 📱 **Como Instalar no Celular**

### **Android (Chrome)**
1. Acesse http://localhost:3000
2. Aparecerá um prompt: "Instalar Brutal Team?"
3. Clique em "Instalar"
4. App na tela inicial!

### **iPhone (Safari)**
1. Acesse pelo Safari
2. Toque em "Compartilhar"
3. Selecione "Adicionar à Tela de Início"
4. Pronto!

---

## 🎯 **Funcionalidades Futuras (Sugestões)**

- [ ] Dashboard com gráficos de evolução
- [ ] Comparação de fotos lado a lado
- [ ] Notificações push
- [ ] Sistema de metas e objetivos
- [ ] Relatórios em PDF
- [ ] Agendamento de consultas
- [ ] Medidas corporais (peso, altura, circunferências)
- [ ] Controle de presença em treinos
- [ ] Sistema de pagamentos
- [ ] Notificações por email
- [ ] Anexar arquivos (PDFs, vídeos)
- [ ] Biblioteca de exercícios com vídeos
- [ ] Calculadora de macros
- [ ] Receitas fitness

---

## 🆘 **Suporte e Manutenção**

### **Comandos Úteis:**
```bash
# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Rodar em produção
npm start

# Gerar ícones PWA novamente
node generate-icons.js
```

### **Arquivos Importantes:**
- `.env.local` - Variáveis de ambiente (Supabase)
- `supabase-schema.sql` - Schema do banco
- `manifest.json` - Configuração do PWA
- `sw.js` - Service Worker

---

## ✅ **Checklist de Deploy**

Quando for fazer deploy na Vercel:

- [ ] Fazer push do código para GitHub
- [ ] Conectar repositório na Vercel
- [ ] Configurar variáveis de ambiente
- [ ] Configurar domínio brutalteam.blog.br
- [ ] Testar login e cadastro
- [ ] Testar upload de fotos
- [ ] Testar mensagens
- [ ] Testar criação de dietas/treinos
- [ ] Testar instalação do PWA no celular

---

**Plataforma 100% Funcional e Pronta para Uso! 🚀**
