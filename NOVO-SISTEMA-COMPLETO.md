# 🚀 NOVO SISTEMA COMPLETO - BRUTAL TEAM

## 📋 ÍNDICE
1. [Estrutura SQL Criada](#estrutura-sql-criada)
2. [Fluxo Completo do Usuário](#fluxo-completo-do-usuário)
3. [Funcionalidades Implementadas](#funcionalidades-implementadas)
4. [Funcionalidades Pendentes](#funcionalidades-pendentes)
5. [Próximos Passos](#próximos-passos)

---

## 🗄️ ESTRUTURA SQL CRIADA

### ✅ Scripts Criados:

#### 1. `create-anamnese-system.sql`
Tabela `anamnese_responses` com 16 perguntas:
- **Informações Gerais:** nome, idade, altura, medidas (peso, cintura, braço, perna)
- **Rotina:** profissão, trabalho, estudo, atividades físicas, sono
- **Objetivos:** trajetória, mudanças esperadas, resultado estético
- **Treinamento:** tempo de treino, estagnação, pump
- **Substâncias:** esteroides, outras substâncias

#### 2. `create-access-codes-and-plans.sql`
**Tabelas:**
- `access_codes` - Códigos únicos de 8 caracteres para cada aluno
- `student_plans` - Planos (mensal/semestral/anual) com valores e vencimentos

**Funcionalidades:**
- Geração automática de código ao aprovar aluno
- Código só é ativado após confirmação manual de pagamento
- Planos com datas de início, fim e vencimento configuráveis

#### 3. `create-first-access-system.sql`
**Tabela:** `first_access_photos`
- Upload obrigatório de 3 fotos (frontal, lado, costa)
- Campos no `profiles`:
  - `first_access_completed`
  - `first_access_photos_uploaded`
  - `first_access_at`

#### 4. `update-weekly-summary-questions.sql`
**Tabela:** `weekly_summary` (completamente refeita)

**Campos principais:**
- Semana do mês (1ª, 2ª, 3ª, 4ª)
- Medidas (peso, gordura, massa muscular, etc)
- **Perguntas condicionais:**
  - Seguiu a dieta? (SIM/NÃO → rotas diferentes)
  - Faltou treino?
  - Consumo de água
  - Qualidade do sono
  - Desempenho do treino
- **Feedback do coach:** texto enviado pelo coach
- **Sistema de fila:** `submission_order`, `task_completed`

#### 5. `EXECUTE-ESTE-novo-sistema-completo.sql`
Script consolidado com TUDO em ordem sequencial.

---

## 🔄 FLUXO COMPLETO DO USUÁRIO

### 1️⃣ QUESTIONÁRIO (Antes do Cadastro)
```
Usuário acessa: questionario.brutalteam.blog.br
↓
Responde 16 perguntas de anamnese
↓
Clica em "INICIAR A CONSULTORIA"
↓
Redirecionado para /cadastro
```

### 2️⃣ CADASTRO
```
Preenche dados de cadastro
↓
Mensagem: "CADASTRO CONCLUÍDO COM SUCESSO"
"AGUARDE SEU COACH APROVAR E RECEBERÁ A CHAVE NO WHATSAPP"
```

### 3️⃣ APROVAÇÃO (Coach/Admin)
```
Coach vê aluno em "Cadastros Pendentes"
↓
Aprova e configura:
  - Tipo de plano (mensal/semestral/anual)
  - Valor mensal
  - Valor total
  - Dia de vencimento
↓
Sistema gera código de acesso automaticamente
↓
Coach confirma pagamento manualmente
↓
Código é ativado (is_active = true)
↓
Coach envia código para aluno via WhatsApp
```

### 4️⃣ PRIMEIRO ACESSO
```
Aluno recebe código
↓
Faz login com email + senha
↓
Sistema pede código de acesso
↓
Aluno insere código
↓
MODAL: "Bem-vindo! Anexe 3 fotos (frontal, lado, costa)"
↓
Aluno faz upload
↓
MODAL: "Em até 7 dias seu protocolo estará disponível"
↓
Acesso liberado!
```

### 5️⃣ RESUMO SEMANAL (Toda semana)
```
Aluno acessa "Resumo Semanal"
↓
Sistema mostra: "Você está na Xª semana de [MÊS]"
↓
Aluno preenche medidas
↓
Responde perguntas condicionais:
  - Seguiu dieta? SIM → Perguntas A, B, C
  - Seguiu dieta? NÃO → Perguntas D, E, F, G
  - Faltou treino?
  - Desempenho, horário, etc
↓
Anexa 3 fotos (opcional)
↓
Clica em "ENVIAR"
↓
Mensagem: "RESPOSTA ENVIADA AO COACH COM SUCESSO"
```

### 6️⃣ FEEDBACK DO COACH
```
Coach vê resumo na ordem cronológica (mais antigo primeiro)
↓
Analisa dados do aluno
↓
Escreve feedback personalizado
↓
Envia feedback
↓
Marca como "Tarefa Concluída"
↓
Aluno desce para o final da fila (foto fica cinza)
↓
Feedback aparece na dashboard do aluno por 1 semana
```

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS (SQL)

- [x] **Tabela de Anamnese** com 16 perguntas
- [x] **Sistema de Códigos de Acesso** com geração automática
- [x] **Tabela de Planos** (mensal/semestral/anual)
- [x] **Sistema de Primeiro Acesso** com upload de 3 fotos
- [x] **Novo Resumo Semanal** com perguntas condicionais
- [x] **Sistema de Fila** com ordem cronológica
- [x] **Feedback do Coach** armazenado no banco
- [x] **Semanas do Mês** calculadas automaticamente

---

## ⏳ FUNCIONALIDADES PENDENTES (Frontend)

### 🔴 ALTA PRIORIDADE

#### 1. Página de Questionário
- [ ] Criar subdomínio `questionario.brutalteam.blog.br`
- [ ] Página com 16 perguntas do formulário
- [ ] Validação de campos obrigatórios
- [ ] Salvar em `anamnese_responses`
- [ ] Botão "INICIAR A CONSULTORIA" → redireciona para /cadastro

#### 2. Modal de Primeiro Acesso
- [ ] Detectar se `first_access_completed = false`
- [ ] Mostrar modal ao fazer login
- [ ] Solicitar código de acesso
- [ ] Upload de 3 fotos (frontal, lado, costa)
- [ ] Mensagem "Em até 7 dias seu protocolo estará disponível"

#### 3. Sistema de Aprovação com Planos
- [ ] Adicionar seleção de plano na aprovação
- [ ] Campos: tipo de plano, valor mensal, valor total, vencimento
- [ ] Mostrar código gerado para o coach
- [ ] Botão "Confirmar Pagamento" → ativa código
- [ ] Copiar código para clipboard

#### 4. Nova Página de Resumo Semanal
- [ ] Calcular automaticamente semana do mês
- [ ] Formulário com perguntas condicionais:
  - **Seguiu dieta?** SIM/NÃO
  - Rotas diferentes baseado na resposta
- [ ] Upload de 3 fotos (opcional)
- [ ] Mensagem de sucesso ao enviar

#### 5. Dashboard do Coach - Resumos
- [ ] Lista em ordem cronológica (mais antigo primeiro)
- [ ] Card de cada resumo com dados do aluno
- [ ] Campo de texto para feedback
- [ ] Botão "Enviar Feedback"
- [ ] Botão "Tarefa Concluída" → aluno vai pro final
- [ ] Foto do aluno fica cinza quando concluído

#### 6. Dashboard do Aluno - Feedback
- [ ] Área para mostrar feedback do coach
- [ ] Aparece abaixo da data inicial
- [ ] Fica visível por 1 semana
- [ ] Desaparece ao enviar novo resumo

### 🟡 MÉDIA PRIORIDADE

#### 7. Guia Nutricional Personalizado
- [ ] Criar tabela de macronutrientes (aguardando dados)
- [ ] Modal/expansão ao clicar em "50g de proteína"
- [ ] Mostrar opções de alimentos com conversão
- [ ] Ex: "100g de patinho = 27g de proteína"
- [ ] Adaptar valores para dieta específica do aluno

#### 8. Melhorias na Interface
- [ ] Trocar fonte para **Montserrat**
- [ ] Botões da dieta à direita
- [ ] Cores só no hover
- [ ] Ícone de carboidrato = batata doce
- [ ] Treino A, B, C, D (não 1, 2, 3, 4)
- [ ] Campo para anotar cargas nos exercícios
- [ ] Nova tag de "DESCANSO"

#### 9. Notificações
- [ ] Notificar quando dieta é alterada
- [ ] Notificar quando treino é alterado
- [ ] Notificar quando protocolo é alterado
- [ ] Notificação desaparece ao visualizar

#### 10. Áudio de Recompensa
- [ ] Áudio ao dar check em refeição
- [ ] Áudio ao dar check em treino
- [ ] Sons motivacionais

### 🟢 BAIXA PRIORIDADE

#### 11. Chatbot nas Mensagens
- [ ] Respostas prontas para perguntas frequentes
- [ ] Integração com IA (opcional)

#### 12. Reorganização da Interface
- [ ] Perfil e mensagens por último no menu
- [ ] Número de refeições e observação abaixo do campo

---

## 📦 PRÓXIMOS PASSOS IMEDIATOS

### PASSO 1: Executar SQL no Supabase
```sql
-- Execute este arquivo:
supabase/EXECUTE-ESTE-novo-sistema-completo.sql
```

### PASSO 2: Enviar Tabela de Macronutrientes
Você mencionou que vai enviar as tabelas dos macronutrientes.
Quando enviar, vou criar:
- Tabela `macronutrientes`
- Sistema de conversão automática
- Modal do guia nutricional

### PASSO 3: Priorizar Desenvolvimento
Qual funcionalidade você quer que eu comece primeiro?

**Sugestão de ordem:**
1. ✅ Modal de Primeiro Acesso (crítico para onboarding)
2. ✅ Sistema de Planos na Aprovação
3. ✅ Página de Questionário
4. ✅ Nova Página de Resumo Semanal
5. ✅ Dashboard com Feedback do Coach

---

## 🎯 RESUMO EXECUTIVO

### O QUE JÁ ESTÁ PRONTO (SQL):
✅ Estrutura completa do banco de dados
✅ Sistema de códigos de acesso
✅ Sistema de planos
✅ Sistema de primeiro acesso
✅ Novo resumo semanal com fila
✅ Sistema de feedback do coach

### O QUE PRECISA SER FEITO (Frontend):
🔴 Interfaces para todas as funcionalidades acima
🔴 Página de questionário
🔴 Modal de primeiro acesso
🔴 Atualização do sistema de aprovação
🔴 Nova página de resumo semanal
🔴 Guia nutricional (aguardando tabela de macros)

### ESTIMATIVA:
- **SQL:** 100% completo ✅
- **Frontend:** 0% implementado ⏳

---

## 📞 AGUARDANDO DO USUÁRIO:

1. **Tabelas de Macronutrientes** - Para criar guia nutricional
2. **Priorização** - Qual funcionalidade implementar primeiro?
3. **Executar SQL** - Rodar o script no Supabase

---

**Criado em:** 26/10/2025
**Última atualização:** 26/10/2025
