# Funcionalidades Avançadas - Implementação

## SQL a Executar no Supabase

Execute o arquivo `sql/advanced_features.sql` no SQL Editor do Supabase.

Este SQL implementa:

### 1. Sistema de Refeições Personalizáveis
- Adiciona coluna `meals_per_day` (2-6 refeições) em `dietas`
- Atualiza `meal_tracking` com campo `meals_completed` (JSON array)
- Coach escolhe quantas refeições o aluno deve fazer por dia
- Aluno marca apenas as refeições configuradas

### 2. Sistema de Treino Personalizado
- Adiciona coluna `workout_types` em `treinos` (array de tipos)
- Atualiza `workout_tracking` com `workout_types_completed`
- Tipos disponíveis: cardio, musculação, luta, outros
- Aluno marca quais tipos de treino fez no dia

### 3. Travar Resumo Semanal (7 dias)
- Adiciona `next_allowed_date` em `progress_photos`
- Trigger automático calcula próxima data permitida
- Bloqueia envio antes de 7 dias

### 4. Aprovação de Cadastro pelo Coach
- Adiciona campos: `approved`, `approved_by`, `approved_at` em `profiles`
- Novos alunos ficam pendentes até aprovação
- Coach aprova e já define se pagou + valor + data

### 5. Aviso de Vencimento (3 dias antes)
- Cria tabela `payment_reminders`
- Função `create_payment_reminders()` cria lembretes automáticos
- View `active_payment_reminders` mostra lembretes de hoje
- Aluno vê aviso 3 dias antes do vencimento

### 6. Persistência de Login
- ✅ Já configurado automaticamente pelo Supabase Auth Helpers
- Sessão persiste até logout manual

## Implementações no Código

### Componentes a Criar/Atualizar:

**1. DietaManager** - Adicionar seletor de refeições (2-6)
**2. TreinoManager** - Adicionar seletor de tipos de treino
**3. MealTracker** - Dinâmico baseado em meals_per_day
**4. WorkoutTracker** - Checkboxes para tipos de treino
**5. PhotoUploadFull** - Verificar se pode enviar (7 dias)
**6. Dashboard Aluno** - Mostrar aviso de vencimento
**7. Coach Dashboard** - Lista de aprovação de cadastros
**8. PaymentManagement** - Aprovar + registrar pagamento junto

## Ordem de Implementação

1. ✅ SQL executado
2. Aviso de vencimento no dashboard do aluno
3. Travar resumo semanal
4. Sistema de refeições personalizáveis
5. Sistema de treino personalizado
6. Botão de edição (cria nova versão)
7. Aprovação de cadastro

## Notas Técnicas

- O sistema de meals_completed usa JSONB para flexibilidade
- workout_types_completed é array de strings
- Triggers automáticos mantêm datas atualizadas
- RLS policies protegem dados por usuário
