# 🎮 Sistema de Gamificação - ETAPA 1

## ✅ O que foi implementado

### 1. **Infraestrutura de Banco de Dados**
Criamos 4 novas tabelas para tracking e gamificação:

#### `daily_stats`
- Armazena estatísticas diárias de cada aluno
- Tracking de treinos, refeições e fotos
- Cálculo automático de "dia ativo" (70% de conclusão)

#### `user_stats`
- Estatísticas gerais acumuladas
- Current streak (dias consecutivos)
- Longest streak (recorde pessoal)
- Totais de treinos, refeições, fotos
- Percentuais do mês atual

#### `achievements`
- Catálogo de conquistas/badges disponíveis
- 10 achievements pré-cadastrados
- Tiers: bronze, silver, gold, platinum

#### `user_achievements`
- Conquistas desbloqueadas por cada aluno
- Timestamp de quando foi desbloqueado

### 2. **Componentes Visuais**

#### `ProgressBar`
- Barras de progresso horizontais animadas
- 6 variações de cores (primary, green, blue, yellow, purple, red)
- Efeito shimmer
- Porcentagens e contadores

#### `ProgressCircle`
- Progresso circular/radial
- Animação suave de preenchimento
- Ícone centralizado
- Efeito de glow

#### `StreakCounter`
- Contador de dias consecutivos (streak)
- Visual impactante em gradiente laranja/vermelho
- Mostra streak atual + recorde
- Efeitos especiais:
  - "EM CHAMAS!" quando >= 7 dias
  - "NOVO RECORDE!" quando bate o record

#### `AchievementBadge`
- Exibição de conquistas/badges
- Visual diferente para cada tier (bronze, silver, gold, platinum)
- Badges desbloqueados: coloridos com shimmer
- Badges bloqueados: cinza com cadeado
- Tooltip com descrição ao passar mouse

#### `MotivationalMessage`
- Mensagens dinâmicas baseadas em:
  - Progresso da semana
  - Dias de streak
  - Dia da semana
  - Hora do dia
- 4 tipos: excellent, good, warning, motivational
- Gradientes e ícones personalizados

#### `GamificationDashboard`
- Componente principal que integra tudo
- Exibe:
  - Mensagem motivacional
  - Streak counter
  - Progresso do dia (circles)
  - Progresso do mês (bars)
  - Grid de conquistas (desbloqueadas + bloqueadas)
  - Estatísticas gerais (cards)

### 3. **Integração no Dashboard**
- Adicionado no dashboard do aluno (`/aluno/dashboard`)
- Aparece logo após o header
- Totalmente responsivo (mobile + desktop)

## 📋 Como usar

### 1. **Rodar a Migration no Supabase**
```bash
# Abra o Supabase Dashboard
# Vá em: Database → SQL Editor
# Cole o conteúdo do arquivo:
RODAR_NO_SUPABASE_GAMIFICACAO.sql

# Clique em "Run"
```

Isso vai criar:
- ✅ Tabelas `daily_stats`, `user_stats`, `achievements`, `user_achievements`
- ✅ Índices para performance
- ✅ RLS Policies
- ✅ Triggers automáticos para calcular streak
- ✅ 10 achievements pré-cadastrados
- ✅ `user_stats` para alunos existentes

### 2. **Testar no Localhost**
```bash
npm run dev
```

Acesse como aluno e veja a dashboard com gamificação!

## 🎯 Achievements Disponíveis

| Badge | Nome | Descrição | Tier |
|-------|------|-----------|------|
| 🎯 | Primeiro Dia | Completou seu primeiro dia de treino | Bronze |
| 🔥 | Guerreiro Semanal | 7 dias consecutivos | Silver |
| 💪 | Quinzena Brutal | 14 dias consecutivos | Silver |
| 🏆 | Mestre do Mês | 30 dias consecutivos | Gold |
| 💯 | Clube dos 100 | 100 dias ativos (não consecutivos) | Platinum |
| ⭐ | Semana Perfeita | 100% de conclusão em 7 dias | Gold |
| 📸 | Documentando Evolução | Enviou 5 fotos de progresso | Bronze |
| 📷 | Profissional da Evolução | Enviou 20 fotos de progresso | Silver |
| 🍽️ | Disciplina Alimentar | 100 refeições completadas | Silver |
| 🦍 | Fera dos Treinos | 50 treinos completados | Gold |

## ⚙️ Como funciona o tracking automático

### Dia Ativo
Um dia é considerado "ativo" quando o aluno completa **pelo menos 70%** das atividades planejadas (treinos + refeições).

### Streak (Dias Consecutivos)
- Atualizado automaticamente via **trigger** no banco
- Se o aluno tem um dia ativo hoje e teve ontem → incrementa streak
- Se pulou um dia → reseta para 1
- O recorde é salvo automaticamente

### Triggers Automáticos

#### `calculate_is_active_day`
- Roda ANTES de inserir/atualizar `daily_stats`
- Calcula se o dia foi ativo (>= 70%)

#### `update_user_streak`
- Roda DEPOIS de inserir/atualizar `daily_stats`
- Atualiza `current_streak` e `longest_streak`

## 🎨 Customização de Cores

Os componentes aceitam variações de cor:

```tsx
<ProgressBar color="primary" />  // Laranja (brand)
<ProgressBar color="green" />    // Verde
<ProgressBar color="blue" />     // Azul
<ProgressBar color="yellow" />   // Amarelo
<ProgressBar color="purple" />   // Roxo
<ProgressBar color="red" />      // Vermelho
```

## 🔮 Próximos Passos (ETAPA 2)

Essa é apenas a ETAPA 1. Próximas implementações:

### ETAPA 2 - Gráficos de Evolução
- Line chart de peso/medidas
- Radar chart de performance
- Comparador de fotos antes/depois
- Relatório semanal automático

### ETAPA 3 - Personalização
- Mensagens personalizadas
- Widget de metas
- Modo dark/light
- Dicas automáticas

### ETAPA 4 - Social (Comunidade)
- Feed de treinos (tipo GymRats)
- Ranking entre alunos
- Desafios mensais
- Feed de conquistas

### ETAPA 5 - Relatórios Inteligentes
- Relatório automático semanal
- Índice de consistência (score 0-100)
- Alertas automáticos

## 📊 Exemplo de Uso

```tsx
import GamificationDashboard from '@/components/gamification/GamificationDashboard';

<GamificationDashboard
  userStats={{
    current_streak: 7,
    longest_streak: 14,
    total_workouts: 23,
    total_meals_completed: 145,
    total_photos: 3,
    total_active_days: 25,
    current_month_workout_percentage: 85,
    current_month_meal_percentage: 92,
    current_week_photo_percentage: 75
  }}
  achievements={allAchievements}
  userAchievements={unlockedAchievements}
  todayStats={{
    workouts_completed: 1,
    workouts_planned: 1,
    meals_completed: 4,
    meals_planned: 6,
    photos_uploaded: 0
  }}
  userName="João"
/>
```

## 🚀 Performance

- Todas as tabelas têm índices otimizados
- RLS configurado corretamente
- Cálculos feitos no backend (triggers)
- Animações com Framer Motion
- Componentes React otimizados

## 🔒 Segurança

- RLS ativado em todas as tabelas
- Alunos só veem seus próprios dados
- Coaches podem ver stats de seus alunos
- Políticas bem definidas para INSERT/UPDATE

---

**Status:** ✅ ETAPA 1 COMPLETA

**Próximo:** ETAPA 2 - Gráficos de Evolução
