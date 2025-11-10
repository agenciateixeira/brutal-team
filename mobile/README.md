# Brutal Team Mobile

App mobile nativo desenvolvido com Expo (React Native) para iOS e Android.

## 🚀 Como rodar

### Pré-requisitos
- Node.js instalado
- Expo Go app instalado no celular ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Instalação

```bash
cd mobile
npm install
```

### Configurar variáveis de ambiente

Renomeie `.env.example` para `.env` e preencha com as credenciais:

```env
EXPO_PUBLIC_SUPABASE_URL=sua_url_aqui
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_key_aqui
```

### Rodar em desenvolvimento

```bash
# Iniciar o servidor
npx expo start

# Ou
npm start
```

Depois de iniciar, você verá um QR code. Escaneie com:
- **iOS:** Câmera nativa do iPhone
- **Android:** App Expo Go

### Rodar em simulador

```bash
# iOS (requer macOS)
npm run ios

# Android (requer Android Studio)
npm run android
```

## 📱 Build para produção

### Android (APK/AAB)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Build
eas build --platform android --profile production
```

### iOS (IPA)

```bash
# Build (requer Apple Developer Account)
eas build --platform ios --profile production
```

## 📂 Estrutura

```
mobile/
├── app/                 # Rotas (Expo Router)
│   ├── index.tsx       # Tela de login
│   └── _layout.tsx     # Layout principal
├── components/         # Componentes reutilizáveis
├── lib/               # Configurações (Supabase, etc)
├── assets/            # Imagens, fontes
└── app.json           # Config do Expo
```

## 🔧 Tecnologias

- **Expo SDK 54** - Framework React Native
- **Expo Router** - Navegação baseada em arquivos
- **Supabase** - Backend (auth, database, storage)
- **TypeScript** - Tipagem estática
- **AsyncStorage** - Persistência local

## 📝 Status

- ✅ Setup inicial
- ✅ Autenticação com Supabase
- ⏳ Dashboard pós-login
- ⏳ Navegação autenticada
- ⏳ Telas de treino/dieta
- ⏳ Push notifications
- ⏳ Gamificação

## 🚧 TODO

Ver arquivo principal: `../APPNATIVO_PROXIMO_PASSO.md`
