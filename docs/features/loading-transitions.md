# Sistema de Loading e Transições

> Sistema completo de feedback visual com ícones animados e transições suaves

## 📋 Visão Geral

Sistema de loading global que aparece durante navegações e ações assíncronas, com ícones SVG animados que alternam representando diferentes aspectos do fitness.

## ✨ Features

### 1. Loading Screen

**Arquivo:** `src/components/ui/LoadingScreen.tsx`

#### Características:
- Fundo branco limpo
- 4 ícones SVG que alternam a cada 800ms:
  - 🏋️ Halter (Dumbbell) - Treino
  - 🍎 Maçã (Apple) - Nutrição
  - 👤 Atleta (User) - Atleta
  - ❤️ Coração (Heart) - Saúde

#### Animações:
- Ring externo girando (spin)
- Ícone central com pulse
- Fade-in ao trocar ícone
- Dots de loading com bounce sequencial
- Fade-out suave ao fechar (300ms)

#### Props:
```typescript
interface LoadingScreenProps {
  message?: string;       // Mensagem a exibir
  isFadingOut?: boolean; // Estado de fade-out
}
```

### 2. Loading Provider

**Arquivo:** `src/components/providers/LoadingProvider.tsx`

#### Context Global:
```typescript
interface LoadingContextType {
  showLoading: (message?: string, minTime?: number) => void;
  hideLoading: () => void;
}
```

#### Tempos Configurados:
- **Login/Cadastro:** 3000ms (3 segundos)
- **Navegação Interna:** 1300ms (1.3 segundos)
- **Personalizado:** Pode ser especificado

#### Como Usar:
```tsx
import { useLoading } from '@/components/providers/LoadingProvider';

function MyComponent() {
  const { showLoading, hideLoading } = useLoading();

  const handleAction = async () => {
    showLoading('Processando...', 2000); // 2s mínimo

    try {
      await minhaAcao();
    } finally {
      hideLoading();
    }
  };
}
```

### 3. Page Transitions

**Arquivo:** `src/components/ui/PageTransition.tsx`

#### Funcionalidade:
- Detecta mudanças de rota (pathname)
- Aplica fade-out ao sair (100ms)
- Aplica fade-in ao entrar (500ms)
- Transição suave entre páginas

#### Código:
```tsx
<div className="transition-opacity duration-500 ease-in-out">
  {children}
</div>
```

### 4. NavLink Component

**Arquivo:** `src/components/ui/NavLink.tsx`

#### Features:
- Link com loading automático
- Reduz opacity ao clicar (150ms)
- Delay de 150ms antes de mostrar loading
- Feedback visual imediato

#### Exemplo de Uso:
```tsx
<NavLink
  href="/aluno/dashboard"
  loadingMessage="Carregando Dashboard..."
  className="nav-item"
>
  Dashboard
</NavLink>
```

## 🎬 Fluxo Completo de Navegação

```
1. Usuário clica no link
   ├─> NavLink reduz opacity para 70% (150ms)
   └─> Aguarda 150ms

2. Mostra loading screen
   ├─> Fade-in suave
   └─> Ícones começam a alternar

3. Carrega nova página
   ├─> 1.3s (área logada)
   └─> 3.0s (login/cadastro)

4. Loading faz fade-out
   └─> 300ms de transição

5. Nova página faz fade-in
   └─> 500ms de transição
```

## 📦 Integração no Projeto

### Layout Root
**Arquivo:** `src/app/layout.tsx`

```tsx
<LoadingProvider>
  <Suspense fallback={null}>
    <RouteLoadingProvider>
      <PageTransition>
        {children}
      </PageTransition>
    </RouteLoadingProvider>
  </Suspense>
</LoadingProvider>
```

### Login
**Arquivo:** `src/app/login/page.tsx`

```tsx
const handleLogin = async () => {
  showLoading('Entrando...', 3000);
  // ... autenticação
  showLoading('Preparando seu dashboard...', 3000);
  router.push('/aluno/dashboard');
};
```

### Logout
**Arquivo:** `src/components/ui/Sidebar.tsx`

```tsx
const handleLogout = async () => {
  const userName = profile.full_name || profile.email.split('@')[0];
  showLoading(`Te aguardamos amanhã, ${userName}!`, 1300);

  await supabase.auth.signOut();
  router.push('/login');
};
```

## 🎨 Estilos e Cores

### Loading Screen
- **Background:** `bg-white`
- **Ícones:**
  - Halter: `text-primary-500` (Rose)
  - Maçã: `text-green-500`
  - Atleta: `text-blue-500`
  - Coração: `text-red-500`
- **Ring:** `border-primary-500`
- **Container:** `bg-gray-50` com sombra

### Transições
- **Fade-in página:** 500ms ease-in-out
- **Fade-out loading:** 300ms
- **Opacity link:** 150ms
- **Troca de ícone:** 800ms interval

## 🔧 Customização

### Alterar Tempo Mínimo

```tsx
// No LoadingProvider.tsx
const DEFAULT_MIN_TIME = 3000;      // Login/Cadastro
const NAVIGATION_MIN_TIME = 1300;   // Navegação interna

// Ao usar
showLoading('Mensagem', 2000); // Customizado
```

### Adicionar Novos Ícones

```tsx
// No LoadingScreen.tsx
const loadingIcons = [
  { Icon: Dumbbell, label: 'Treino', color: 'text-primary-500' },
  { Icon: Apple, label: 'Nutrição', color: 'text-green-500' },
  // Adicione aqui
  { Icon: NovoIcone, label: 'Novo', color: 'text-purple-500' },
];
```

### Mudar Velocidade de Alternância

```tsx
// No useEffect do LoadingScreen
setInterval(() => {
  setCurrentIconIndex((prev) => (prev + 1) % loadingIcons.length);
}, 800); // Altere este valor (em ms)
```

## 📱 Comportamento Mobile

- Responsivo em todas as telas
- Ícones escalados adequadamente
- Texto legível em qualquer tamanho
- Performance otimizada

## ⚡ Performance

- Usa `useCallback` para evitar re-renders
- Cleanup de timers no unmount
- Transições CSS (GPU accelerated)
- Lazy loading onde possível

## 🐛 Troubleshooting

### Loading não aparece
```tsx
// Certifique-se de que está dentro do LoadingProvider
<LoadingProvider>
  <YourComponent />
</LoadingProvider>
```

### Transição muito rápida
```tsx
// Aumente o tempo mínimo
showLoading('Mensagem', 3000); // Em vez de padrão
```

### Ícone não alterna
```tsx
// Verifique se o useEffect está correto
useEffect(() => {
  const interval = setInterval(/* ... */);
  return () => clearInterval(interval); // Importante!
}, []);
```

## 📊 Métricas

- Tempo médio de loading: 1.3s
- Tempo de fade-in: 500ms
- Tempo de fade-out: 300ms
- Intervalo de troca: 800ms
- Total de ícones: 4

---

**Última atualização:** 25/10/2025
