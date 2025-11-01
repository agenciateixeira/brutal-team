# 📋 ANÁLISE COMPLETA DO FLUXO DO SISTEMA

## 🎯 FLUXO ESPERADO (Como DEVE funcionar)

### 1️⃣ CADASTRO DO ALUNO
```
1. Aluno acessa /questionario
2. Preenche TODAS as perguntas da anamnese
3. Clica em "Finalizar" → Sistema salva com completed = true
4. Aluno acessa /cadastro
5. Cria conta com email e senha
6. Sistema cria usuário em auth.users
7. Trigger cria perfil em profiles com:
   - approved = FALSE (PENDENTE)
   - payment_status = NULL
   - Sem student_plan
   - Sem access_code
```

**✅ RESULTADO:** Aluno fica PENDENTE aguardando aprovação do coach

---

### 2️⃣ COACH APROVA ALUNO
```
1. Coach acessa /coach/dashboard
2. Vê lista de "Alunos Pendentes"
3. Clica em "Aprovar" no aluno
4. Preenche modal de aprovação:
   - Tipo de plano (mensal/semestral/anual)
   - Valor mensal
   - Dia de vencimento
5. Clica em "Confirmar Aprovação"
6. API /api/approve-aluno é chamada:
   a. Atualiza profiles:
      - approved = TRUE
      - approved_by = coach_id
      - approved_at = NOW()
   b. Cria student_plan:
      - plan_type, monthly_value, due_day
      - is_active = TRUE
      - payment_confirmed = FALSE (inicialmente)
   c. Trigger cria access_code automaticamente
   d. Trigger cria payment_history
   e. Atualiza profiles:
      - payment_status = 'active'
      - payment_plan, payment_value, payment_due_day
```

**✅ RESULTADO:** Aluno aprovado, código gerado, plano criado

---

### 3️⃣ ALUNO FAZ LOGIN
```
1. Coach envia código único para aluno (fora do sistema)
2. Aluno acessa /login ou /primeiro-acesso
3. Digita o código único
4. Sistema valida código em access_codes
5. Se válido:
   - Marca código como usado (se tiver campo)
   - Faz login automático do aluno
   - Redireciona para /aluno/dashboard
```

**✅ RESULTADO:** Aluno logado e acessa dashboard

---

### 4️⃣ ALUNO ENVIA FOTOS INICIAIS
```
1. Aluno acessa /aluno/dashboard
2. Sistema detecta que é primeiro acesso
3. Mostra modal ou página para enviar 3 fotos:
   - Frente
   - Costas
   - Lado
4. Aluno faz upload das fotos
5. Sistema salva em first_access_photos
6. Marca first_access_completed = TRUE
```

**✅ RESULTADO:** Fotos salvas, primeiro acesso completo

---

### 5️⃣ COACH VÊ INFORMAÇÕES DO ALUNO
```
1. Coach acessa /coach/aluno/[id]
2. Na aba "Perfil" vê:
   ✅ Respostas da anamnese (todas as perguntas)
   ✅ 3 fotos iniciais
   ✅ Código de acesso usado
   ✅ Informações básicas
```

**✅ RESULTADO:** Coach tem visão completa do aluno

---

### 6️⃣ COACH CONSULTA PAGAMENTOS
```
1. Coach acessa /coach/pagamentos
2. Vê lista de todos os alunos ATIVOS
3. Para cada aluno vê:
   ✅ Nome
   ✅ Plano (mensal/semestral/anual)
   ✅ Valor mensal
   ✅ Próximo vencimento
   ✅ Status (ativo/pendente/atrasado)
   ✅ Histórico de pagamentos
```

**✅ RESULTADO:** Coach gerencia pagamentos

---

## 🔴 PROBLEMAS IDENTIFICADOS

### ❌ PROBLEMA 1: Aluno aprovado automaticamente
**O QUE ESTÁ ACONTECENDO:**
- Aluno se cadastra e JÁ fica approved = TRUE
- Não aparece como "pendente" para o coach

**CAUSA PROVÁVEL:**
- Trigger `on_auth_user_created` pode estar criando com approved = TRUE
- Ou há outro trigger aprovando automaticamente

**FIX NECESSÁRIO:**
- Garantir que trigger SEMPRE cria com approved = FALSE
- Remover qualquer lógica que aprova automaticamente no cadastro

---

### ❌ PROBLEMA 2: Erro ao criar plano manualmente
**O QUE ESTÁ ACONTECENDO:**
- Coach tenta criar plano em /coach/pagamentos
- Dá erro 400 ao salvar student_plan

**CAUSA PROVÁVEL:**
- Campo obrigatório faltando
- Validação RLS bloqueando
- Trigger falhando

**FIX NECESSÁRIO:**
- Verificar quais campos são obrigatórios em student_plans
- Ajustar RLS policies
- Corrigir trigger

---

### ❌ PROBLEMA 3: Anamnese não aparece
**O QUE ESTÁ ACONTECENDO:**
- Aluno preenche questionário
- Coach não vê as respostas

**CAUSA PROVÁVEL:**
- Query buscando email errado
- Campo completed não está TRUE
- Campo completed_at está NULL

**FIX NECESSÁRIO:**
- Verificar se questionário marca completed = TRUE
- Garantir que query busca pelo email correto

---

### ❌ PROBLEMA 4: Chamadas para URL externa
**O QUE ESTÁ ACONTECENDO:**
- Sistema tenta chamar news-cmry0k7yy-guilhermes-projects-2870101b.vercel.app
- Dá erro de CORS

**CAUSA PROVÁVEL:**
- Código antigo de notificação por email
- Variável de ambiente apontando para URL errada

**FIX NECESSÁRIO:**
- Remover chamadas para essa URL
- Ou configurar variável de ambiente correta

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Executar diagnóstico completo do aluno agenciagtx1@gmail.com
2. ✅ Ver exatamente em que estado está (aprovado? tem plano? tem código?)
3. ✅ Corrigir triggers de aprovação automática
4. ✅ Corrigir criação de planos
5. ✅ Garantir que anamnese aparece
6. ✅ Remover chamadas externas
