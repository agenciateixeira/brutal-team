// Configuração dos Planos Brutal Team

export interface Plan {
  id: string
  name: string
  price: number
  priceId: string // Price ID do Stripe
  productId: string // Product ID do Stripe
  interval: 'month'
  maxAlunos: number
  features: string[]
  popular?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 139,
    priceId: 'price_1STMV9FMnw8AtxwIeniXcviA', // ✅ LIVE MODE
    productId: 'prod_TQBiK9gw1XBAcC',
    interval: 'month',
    maxAlunos: 6,
    features: [
      'Até 6 alunos ativos',
      'Criação de treinos e dietas',
      'Chat com alunos',
      'Fotos de progresso',
      'Dashboard básico',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 269,
    priceId: 'price_1STMVRFMnw8AtxwICgQfochD', // ✅ LIVE MODE
    productId: 'prod_TQBqwGhm2JaJEv',
    interval: 'month',
    maxAlunos: 12,
    features: [
      'Até 12 alunos ativos',
      'Todos os recursos do Starter',
      'Templates de treinos e dietas',
      'Estatísticas avançadas',
      'Notificações push',
      'Suporte prioritário',
    ],
    popular: true,
  },
  {
    id: 'empresarial',
    name: 'Empresarial',
    price: 997,
    priceId: 'price_1STMVfFMnw8AtxwIZ1H5lsJK', // ✅ LIVE MODE
    productId: 'prod_TQBtqGXjRBZ8Dg',
    interval: 'month',
    maxAlunos: 50,
    features: [
      'Até 50 alunos ativos',
      'Todos os recursos do Pro',
      'Protocolos hormonais',
      'Guia nutricional completo',
      'Análises de bioimpedância',
      'Suporte VIP prioritário',
      'Relatórios personalizados',
    ],
  },
  {
    id: 'personalizado',
    name: 'Personalizado',
    price: 29.9, // Por usuário
    priceId: 'price_1STMXEFMnw8AtxwIqjvuWGOm', // ✅ LIVE MODE
    productId: 'prod_TQByvqHCvch9HV',
    interval: 'month',
    maxAlunos: 999, // Ilimitado
    features: [
      'Alunos ilimitados',
      'R$ 29,90 por aluno',
      'Todos os recursos do Empresarial',
      'API customizada',
      'Suporte dedicado 24/7',
      'Integração personalizada',
      'Relatórios avançados',
    ],
  },
]

// Obter plano por ID
export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id)
}

// Obter plano por Price ID
export function getPlanByPriceId(priceId: string): Plan | undefined {
  return PLANS.find((plan) => plan.priceId === priceId)
}

// Verificar se coach pode adicionar mais alunos
export function canAddMoreStudents(
  planId: string,
  currentStudents: number
): boolean {
  const plan = getPlanById(planId)
  if (!plan) return false

  // Plano personalizado é ilimitado
  if (plan.id === 'personalizado') return true

  return currentStudents < plan.maxAlunos
}

// Calcular valor para plano personalizado
export function calculatePersonalizedPrice(numberOfStudents: number): number {
  return numberOfStudents * 29.9
}
