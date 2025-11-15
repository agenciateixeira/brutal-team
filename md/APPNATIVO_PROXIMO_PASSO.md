# 📱 BRUTAL TEAM - APP NATIVO - PRÓXIMO PASSO

## 🎯 Objetivo
Transformar o app web Next.js em apps nativos iOS e Android usando Expo (React Native), com sistema de pagamento Stripe Connect para monetização B2B e marketplace.

---

## 📝 LOG DE PROGRESSO

### 2025-11-10 - Setup Inicial + Autenticação ✅

**Contas criadas:**
- ✅ Google Play Developer ($25 pago)
- ⏳ Apple Developer (aguardando MacBook chegar)

**Projeto Expo:**
- ✅ Projeto criado com `create-expo-app` (template blank-typescript)
- ✅ Expo Router instalado e configurado
- ✅ Supabase instalado (@supabase/supabase-js)
- ✅ AsyncStorage configurado para persistência
- ✅ React Native Web instalado (para testar no navegador)
- ✅ Estrutura de pastas criada (app/, lib/, components/, assets/)

**Configurações:**
- ✅ app.json configurado com:
  - Nome: "Brutal Team"
  - Bundle IDs: com.brutalteam.app (iOS e Android)
  - Permissões de câmera e galeria
  - Tema: dark mode
- ✅ Arquivo .env criado com credenciais Supabase
- ✅ lib/supabase.ts configurado com AsyncStorage
- ✅ package.json com entry point: "expo-router/entry"

**Telas criadas e funcionando:**
- ✅ **Tela de login** (app/index.tsx)
  - Input de email e senha
  - Integração completa com Supabase Auth
  - Redirecionamento automático após login
  - Verifica sessão ativa ao carregar
  - Design minimalista dark theme

- ✅ **Tela de dashboard** (app/dashboard.tsx)
  - Mostra nome do usuário
  - Card com preview de features
  - Botão de logout funcional
  - Redirecionamento automático se não estiver logado

**Branding e Design:**
- ✅ **lib/theme.ts** criado com cores de produção
  - Primary: #0081A7 (azul principal)
  - Secondary: #011936 (azul escuro)
  - Background: #011936
  - Text: #FFFFFF, #93B7BE, #465362
- ✅ **Login screen** aplicado com cores de produção
- ✅ **Dashboard screen** aplicado com cores de produção
- ✅ Consistência visual mantida com app web

**Testado:**
- ✅ Login funcional na web (localhost:8081)
- ✅ Dashboard carrega corretamente
- ✅ Logout funciona
- ✅ Persistência de sessão (AsyncStorage)
- ✅ Visual consistente com produção

**Próximos passos:**
1. ⏳ Testar em device real (Android/iOS) com Expo Go
2. Criar navegação com tabs (aluno) / drawer (coach)
3. Migrar telas de treino e dieta
4. Implementar push notifications
5. Build para Google Play

---

## 📋 CONTAS DE DESENVOLVEDOR

### Google Play Console (Android)
- **Site:** https://play.google.com/console
- **Custo:** $25 USD (taxa única, pagamento único)
- **Tempo de aprovação:** Imediato após pagamento
- **Tempo de review de apps:** 1-3 dias geralmente
- **Requisitos:**
  - Conta Google
  - Cartão de crédito internacional
  - Documento de identificação (pode ser solicitado)

**Como criar:**
1. Acesse https://play.google.com/console/signup
2. Faça login com conta Google
3. Pague a taxa de $25
4. Preencha informações da empresa/desenvolvedor
5. Aceite os termos

### Apple Developer Program (iOS)
- **Site:** https://developer.apple.com/programs/
- **Custo:** $99 USD/ano (renovação anual)
- **Tempo de aprovação:** 24-48h após pagamento
- **Tempo de review de apps:** 2-7 dias
- **Requisitos:**
  - Apple ID
  - Cartão de crédito internacional
  - Autenticação de dois fatores habilitada
  - MacBook (você já tem! ✅)

**Como criar:**
1. Acesse https://developer.apple.com/programs/enroll/
2. Faça login com Apple ID
3. Escolha "Individual" ou "Organization" (Organization precisa de CNPJ/documentos)
4. Pague $99/ano
5. Aguarde aprovação

---

## 🏗️ ARQUITETURA DO PROJETO

```
brutal-team/
│
├── web/                          # Next.js atual (renomear pasta atual)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── mobile/                       # NOVO - Expo React Native
│   ├── app/                      # Expo Router (navegação)
│   │   ├── (auth)/              # Rotas autenticadas
│   │   │   ├── aluno/
│   │   │   └── coach/
│   │   ├── login.tsx
│   │   └── _layout.tsx
│   │
│   ├── components/              # Componentes React Native
│   │   ├── ui/                 # Botões, inputs, etc
│   │   ├── aluno/
│   │   └── coach/
│   │
│   ├── lib/                    # Lógica compartilhada
│   │   ├── supabase.ts        # Cliente Supabase
│   │   └── stripe.ts          # Integração Stripe
│   │
│   ├── assets/                # Imagens, fontes
│   ├── app.json              # Config do Expo
│   ├── package.json
│   └── tsconfig.json
│
└── shared/                     # Código compartilhado web + mobile
    ├── types/                 # TypeScript interfaces
    ├── utils/                # Funções helpers
    └── constants/            # Config, cores, etc
```

---

## 🚀 ROADMAP COMPLETO

### **FASE 1: Configuração de Pagamentos (1 semana)**

#### 1.1 Setup Stripe Connect
**Objetivo:** Permitir que coaches conectem suas contas bancárias e recebam pagamentos

**Passos:**
1. Criar conta Stripe: https://stripe.com/br
2. Ativar Stripe Connect no Dashboard
3. Configurar plataforma:
   - Application Fee: % que você fica (ex: 10%)
   - Países suportados: Brasil inicialmente
   - Tipo: Express ou Standard (recomendo Express)

**Código necessário:**
- API route para criar Connect Account
- Fluxo de onboarding do coach
- Dashboard de ganhos do coach
- Webhook para sincronizar status

**SQL necessário:**
```sql
-- Adicionar colunas na tabela profiles
ALTER TABLE profiles ADD COLUMN stripe_account_id TEXT;
ALTER TABLE profiles ADD COLUMN stripe_account_status TEXT;
ALTER TABLE profiles ADD COLUMN stripe_charges_enabled BOOLEAN DEFAULT false;

-- Tabela de pagamentos
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES profiles(id),
  coach_id UUID REFERENCES profiles(id),
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  coach_amount DECIMAL(10,2),
  status TEXT, -- succeeded, failed, pending
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.2 Assinatura do Coach (Mensalidade)
**Objetivo:** Coach paga mensalidade para usar a plataforma

**Opções:**
- Stripe Billing (recomendado)
- Stripe Checkout para assinaturas

**Planos sugeridos:**
- **Básico:** R$ 29,90/mês - Até 10 alunos
- **Pro:** R$ 79,90/mês - Até 30 alunos
- **Premium:** R$ 149,90/mês - Alunos ilimitados + features extras

**Features extras Premium:**
- Templates de treino/dieta premium
- Analytics avançado
- Suporte prioritário
- Marca branca (white label)

#### 1.3 Pagamento Aluno → Coach
**Objetivo:** Aluno paga mensalidade ao coach pelo app

**Fluxo:**
1. Aluno escolhe plano do coach (ou coach define valor fixo)
2. Checkout Stripe (salvando cartão)
3. Cobrança recorrente automática
4. Split automático (Platform Fee)
5. Coach recebe direto na conta

**Importante - Compliance Apple/Google:**
- Apple/Google não permite venda de serviços físicos com IAP obrigatório
- Coaching é serviço físico ✅
- Use Stripe Checkout via WebView ou deeplink
- Não mencione "compra" ou "assinatura digital" nas descrições

---

### **FASE 2: Setup Expo Mobile (2-3 dias)**

#### 2.1 Instalar Expo
```bash
# No diretório brutal-team
npx create-expo-app@latest mobile --template tabs

cd mobile
npx expo install expo-router expo-constants expo-linking expo-status-bar react-native-safe-area-context react-native-screens
```

#### 2.2 Instalar Dependências Principais
```bash
# Supabase
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill

# UI e Utils
npx expo install react-native-gesture-handler react-native-reanimated
npx expo install expo-image expo-font

# Stripe
npm install @stripe/stripe-react-native

# Notificações Push
npx expo install expo-notifications expo-device expo-constants
```

#### 2.3 Configurar Supabase
```typescript
// mobile/lib/supabase.ts
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

#### 2.4 Configurar app.json
```json
{
  "expo": {
    "name": "Brutal Team",
    "slug": "brutal-team",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "brutalteam",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.brutalteam.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Precisamos de acesso à câmera para você tirar fotos de progresso.",
        "NSPhotoLibraryUsageDescription": "Precisamos de acesso às fotos para você selecionar imagens."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#000000"
      },
      "package": "com.brutalteam.app",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#000000"
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "SEU_PROJECT_ID_AQUI"
      }
    }
  }
}
```

---

### **FASE 3: Desenvolver Telas Principais (2-3 semanas)**

#### Prioridade de Desenvolvimento:

**Semana 1 - Autenticação e Base**
- [ ] Login/Registro
- [ ] Recuperação de senha
- [ ] Onboarding (primeira vez)
- [ ] Navegação bottom tabs (aluno)
- [ ] Drawer navigation (coach)

**Semana 2 - Features Core Aluno**
- [ ] Dashboard com overview
- [ ] Visualização de treino do dia
- [ ] Visualização de dieta
- [ ] Marcar exercícios como concluídos
- [ ] Registro de progresso (fotos)
- [ ] Perfil e configurações

**Semana 3 - Features Core Coach**
- [ ] Dashboard com lista de alunos
- [ ] Visualizar progresso do aluno
- [ ] Criar/editar treino
- [ ] Criar/editar dieta
- [ ] Chat com aluno
- [ ] Notificações

**Componentes que podem ser reaproveitados do web:**
- Lógica de negócio (hooks)
- Chamadas à API Supabase
- Validações
- Tipos TypeScript

**Componentes que precisam ser reescritos:**
- UI (React Native vs HTML/CSS)
- Navegação (Expo Router vs Next.js)
- Formulários (React Native elements)
- Gráficos (react-native-chart-kit vs recharts)

---

### **FASE 4: Integração Stripe Mobile (1 semana)**

#### 4.1 Setup Stripe Provider
```typescript
// mobile/app/_layout.tsx
import { StripeProvider } from '@stripe/stripe-react-native';

export default function RootLayout() {
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      merchantIdentifier="merchant.com.brutalteam.app"
    >
      {/* resto do app */}
    </StripeProvider>
  );
}
```

#### 4.2 Fluxo de Pagamento
```typescript
// Exemplo simplificado
import { useStripe } from '@stripe/stripe-react-native';

const { initPaymentSheet, presentPaymentSheet } = useStripe();

// 1. Criar Payment Intent no backend
const { data } = await supabase.functions.invoke('create-payment-intent', {
  body: { amount: 29900, coachId: '...' }
});

// 2. Inicializar Payment Sheet
await initPaymentSheet({
  paymentIntentClientSecret: data.clientSecret,
  merchantDisplayName: 'Brutal Team',
});

// 3. Apresentar ao usuário
const { error } = await presentPaymentSheet();
```

---

### **FASE 5: Push Notifications (já está pronto! ✅)**

Você já tem:
- ✅ Triggers de banco configurados
- ✅ Edge function de push funcionando
- ✅ Sistema de preferências

**Falta apenas:**
- Configurar Expo Notifications no app mobile
- Salvar push token do device no Supabase
- Testar em device real

#### Setup Expo Notifications
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

async function registerForPushNotifications() {
  if (!Device.isDevice) {
    alert('Push notifications só funcionam em dispositivos físicos');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Permissão de notificações negada');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Salvar no Supabase
  await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    expo_push_token: token,
    is_active: true,
  });
}
```

---

### **FASE 6: Assets e Branding (3-5 dias)**

#### Ícones necessários:

**iOS:**
- App Icon: 1024x1024px (PNG sem alpha)
- Ícones em múltiplos tamanhos (Expo gera automaticamente)

**Android:**
- Adaptive Icon: 1024x1024px
- Foreground: 1024x1024px
- Background: cor sólida ou imagem

**Ferramentas:**
- Figma para design
- https://makeappicon.com/ - Gera todos os tamanhos
- https://www.appicon.co/ - Alternativa

#### Screenshots necessários:

**iOS (por device):**
- iPhone 6.5" (iPhone 14 Pro Max): 1284x2778px
- iPhone 6.7" (iPhone 15 Pro Max): 1290x2796px
- iPhone 5.5" (iPhone 8 Plus): 1242x2208px
- iPad Pro 12.9": 2048x2732px

**Android:**
- Phone: 1080x1920px (mínimo)
- Tablet 7": 1200x1920px
- Tablet 10": 1920x1200px

**Dicas:**
- Mostre features principais
- Use texto mínimo (pode virar em qualquer idioma)
- Destaque diferenciais (comunidade, gamificação, etc)
- 3-5 screenshots são suficientes

---

### **FASE 7: Compliance e Documentação Legal**

#### Documentos obrigatórios:

**1. Política de Privacidade**
- Como coleta dados
- Como usa dados
- Como compartilha (Stripe, por exemplo)
- Direitos do usuário (LGPD)
- Como deletar conta
- **Hospedagem:** Precisa estar acessível via URL pública

**2. Termos de Uso**
- Regras de uso do app
- Responsabilidades do coach
- Responsabilidades do aluno
- Política de cancelamento/reembolso
- Propriedade intelectual

**3. Dados de Saúde (importante!)**
- App lida com dados de saúde e fitness
- Precisa explicar como protege esses dados
- Pode precisar de certificações dependendo do país

**4. LGPD Compliance**
- Consentimento explícito
- Direito ao esquecimento
- Portabilidade de dados
- Notificação de vazamentos

**Geradores úteis:**
- https://www.privacypolicygenerator.info/
- https://www.termsfeed.com/
- https://getterms.io/

---

### **FASE 8: Build e Deploy nas Stores**

#### 8.1 Setup EAS (Expo Application Services)
```bash
npm install -g eas-cli
eas login
eas build:configure
```

#### 8.2 Build Android (APK/AAB)
```bash
# Build de desenvolvimento (APK)
eas build --platform android --profile development

# Build de produção (AAB para Google Play)
eas build --platform android --profile production
```

#### 8.3 Build iOS (IPA)
```bash
# Precisa de Apple Developer Account ativo

# Build de desenvolvimento (Simulator)
eas build --platform ios --profile development

# Build de produção (App Store)
eas build --platform ios --profile production
```

#### 8.4 Submit para Google Play
```bash
eas submit --platform android
```

**Ou manualmente:**
1. Acesse Google Play Console
2. Crie novo aplicativo
3. Preencha informações:
   - Nome do app
   - Descrição curta (80 chars)
   - Descrição completa (4000 chars)
   - Screenshots
   - Ícone
   - Feature graphic (1024x500px)
4. Upload do AAB
5. Preencher questionário de conteúdo
6. Classificação etária
7. Submit para review

#### 8.5 Submit para App Store
```bash
eas submit --platform ios
```

**Ou manualmente via Xcode:**
1. Abra Xcode
2. Window > Organizer
3. Archive o app
4. Distribute App > App Store Connect
5. Upload

**Depois no App Store Connect:**
1. Acesse https://appstoreconnect.apple.com/
2. Preencha App Information
3. Screenshots para cada tamanho
4. App Privacy (obrigatório!)
5. Pricing and Availability
6. Submit for Review

---

## ⚠️ PONTOS DE ATENÇÃO

### Pagamentos In-App

**Apple:**
- Proíbe pagamentos externos para conteúdo digital
- Coaching é serviço físico ✅ (permitido)
- Pode usar Stripe sem problemas
- Mencione "coaching pessoal" nas descrições
- Não use termos como "premium content" ou "unlock features"

**Google:**
- Mais flexível que Apple
- Permite pagamentos externos
- Precisa oferecer Google Pay como opção (opcional)

### Review Checklist

**Antes de submeter:**
- [ ] App não crasha
- [ ] Todas as telas carregam
- [ ] Login/logout funcionam
- [ ] Imagens carregam
- [ ] Push notifications funcionam
- [ ] Pagamentos funcionam
- [ ] Links de privacidade/termos funcionam
- [ ] App funciona offline (ou mostra mensagem clara)
- [ ] Não tem console.logs em produção
- [ ] Ícones e screenshots de qualidade

### Testes Obrigatórios

**Devices para testar:**
- iPhone (iOS 16+)
- iPad
- Android flagship (Samsung/Pixel)
- Android budget (Xiaomi/Motorola)
- Tablet Android

**Cenários:**
- Conexão lenta (3G)
- Sem internet
- Notificações em background
- App em background por horas
- Troca de usuário
- Múltiplas contas

---

## 📊 MÉTRICAS DE SUCESSO

### Pré-Launch
- [ ] 100 coaches em lista de espera
- [ ] 20 coaches beta testando
- [ ] 0 crashes em 1 semana de testes
- [ ] Todas as features principais funcionando

### Pós-Launch (Primeiros 3 meses)
- **Downloads:** 1.000+ downloads
- **Coaches ativos:** 50+ coaches pagantes
- **Alunos ativos:** 500+ alunos
- **Retenção D7:** >40%
- **Retenção D30:** >20%
- **Churn de coaches:** <5%/mês
- **Rating:** >4.0 estrelas em ambas stores

---

## 💰 ESTIMATIVA DE CUSTOS

### Setup Inicial
- Google Play Developer: $25 (único)
- Apple Developer: $99/ano
- Stripe (sem custo de setup)
- **Total:** $124 USD primeiro ano

### Mensais
- Supabase: Grátis até 500MB/50k usuários autenticados
- Expo EAS Build: Grátis para open source, $29/mês para comercial
- Stripe: 3.9% + R$0,39 por transação (Brasil)
- **Total estimado:** $29/mês + fees de transação

### Por Transação (exemplo)
Aluno paga R$ 300/mês ao coach:
- Stripe fee: R$ 11,70 + R$ 0,39 = **R$ 12,09**
- Platform fee (10%): **R$ 30,00**
- Coach recebe: **R$ 257,91**
- Você fica com: **R$ 30,00** (menos fees de saque do Stripe)

---

## 📚 RECURSOS E DOCUMENTAÇÃO

### Expo
- Docs: https://docs.expo.dev/
- Fórum: https://forums.expo.dev/
- Discord: https://chat.expo.dev/

### Stripe
- Docs Connect: https://stripe.com/docs/connect
- Docs Mobile: https://stripe.com/docs/mobile
- Dashboard: https://dashboard.stripe.com/

### App Stores
- Google Play Console: https://play.google.com/console
- Apple Developer: https://developer.apple.com/
- App Store Connect: https://appstoreconnect.apple.com/

### Supabase
- Docs: https://supabase.com/docs
- React Native: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. **HOJE:**
   - [ ] Criar conta Google Play Developer ($25)
   - [ ] Criar conta Stripe (grátis)
   - [ ] Ler sobre Stripe Connect

2. **ESTA SEMANA:**
   - [ ] Criar conta Apple Developer ($99) quando MacBook chegar
   - [ ] Instalar Xcode no MacBook
   - [ ] Setup inicial do Expo
   - [ ] Configurar Stripe Connect básico

3. **PRÓXIMA SEMANA:**
   - [ ] Migrar tela de login para mobile
   - [ ] Migrar dashboard para mobile
   - [ ] Testar em device real
   - [ ] Configurar push notifications

4. **MÊS 1:**
   - [ ] Completar MVP mobile
   - [ ] Beta test com 10 coaches
   - [ ] Ajustar baseado em feedback
   - [ ] Preparar assets para stores

5. **MÊS 2:**
   - [ ] Submit para Google Play
   - [ ] Submit para App Store
   - [ ] Marketing pré-launch
   - [ ] Preparar suporte

---

## 🚨 RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Rejeição Apple por IAP | Média | Alto | Classificar como serviço físico, não mencionar "conteúdo digital" |
| Bugs em produção | Alta | Médio | Testes extensivos, beta fechado primeiro |
| Churn alto de coaches | Média | Alto | Onboarding excelente, suporte ativo, features que geram valor rápido |
| Custos de transação altos | Baixa | Médio | Negociar com Stripe após volume, otimizar platform fee |
| Compliance LGPD | Média | Alto | Contratar consultor, implementar desde o início |
| Performance ruim | Média | Médio | Profile performance, lazy loading, otimizar imagens |

---

**Criado em:** 2025-11-10
**Última atualização:** 2025-11-10
**Versão:** 1.0
**Autor:** Brutal Team Development

---

**Observações:**
- Este é um documento vivo, atualizar conforme progresso
- Priorizar features que geram receita
- Sempre testar em devices reais
- Manter comunicação próxima com early adopters
- Iterar rápido baseado em feedback
