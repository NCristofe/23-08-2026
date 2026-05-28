# 💕 Nosso Amor

<p align="center">
  App privado do casal — um espaço só nosso para conversar, guardar memórias e jogar juntos.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-20232A?style=flat-square&logo=react&logoColor=61DAFB"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-0F172A?style=flat-square&logo=tailwind-css&logoColor=38BDF8"/>
  <img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black"/>
  <img src="https://img.shields.io/badge/Vercel-Deploy-000000?style=flat-square&logo=vercel&logoColor=white"/>
  <img src="https://img.shields.io/badge/PWA-Instalável-5A0FC8?style=flat-square&logo=pwa&logoColor=white"/>
</p>

> Iniciado em **23 de agosto de 2025**.

---

## ✨ Funcionalidades

### 🏠 Início
- Contador em tempo real do relacionamento (anos, meses, dias, horas, minutos e segundos)
- Contagem regressiva para o próximo aniversário

### 💬 Chat
- Mensagens em tempo real via Firebase Firestore
- Indicador de presença — online / visto por último às HH:mm
- Atalhos de mensagens rápidas
- Notificação em tempo real quando o parceiro envia uma mensagem

### 🗺️ Momentos
- Trilha visual da história do casal
- Cada momento tem emoji personalizável, título, data e descrição
- Ordenação cronológica — do começo até o presente

### 🎮 Jogos

| Jogo | Descrição |
|------|-----------|
| **Quiz do Casal** | Crie 4 perguntas para o seu amor responder e veja o resultado |
| **Adivinhe a Palavra** | Palavras secretas de 3 a 6 letras com placar de vitórias e celebração em tempo real ao acertar |
| **Surpresa do Dia** | Mensagem especial aleatória com corações animados |

### ⚙️ Configurações (Menu hamburguer)
- Navegação entre telas
- Toggle de modo escuro / claro com persistência
- Logout

---

## 🛠️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript |
| Build | Vite 6 |
| Estilo | Tailwind CSS v4 |
| Animações | Framer Motion |
| Roteamento | React Router v7 |
| Banco de dados | Firebase Firestore (tempo real) |
| Hospedagem | Vercel |
| PWA | vite-plugin-pwa (instalável no celular) |

---

## 🚀 Rodando localmente

**Pré-requisitos:** Node.js 18+

```bash
# 1. Clone o repositório
git clone https://github.com/NCristofe/23-08-2026.git
cd 23-08-2026

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Preencha .env.local com as chaves do seu projeto Firebase

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

---

## 🔑 Variáveis de ambiente

Crie `.env.local` na raiz com:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

VITE_APP_PASSWORD=
```

Para deploy na Vercel, adicione as mesmas variáveis em **Settings → Environment Variables**.

---

## 🔥 Regras do Firestore

Publique em **Firestore → Rules** no console do Firebase:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /milestones/{id}         { allow read, write: if true; }
    match /messages/{id}           { allow read, write: if true; }
    match /photos/{id}             { allow read, write: if true; }
    match /quiz/{id}               { allow read, write: if true; }
    match /quiz_history/{id}       { allow read, write: if true; }
    match /users_status/{id}       { allow read, write: if true; }
    match /games/{id}              { allow read, write: if true; }
    match /word_games/{id}         { allow read, write: if true; }
    match /word_games_history/{id} { allow read, write: if true; }
    match /{document=**}           { allow read, write: if false; }
  }
}
```

---

## 📁 Estrutura do projeto

```
src/
├── app/
│   ├── components/
│   │   ├── Layout.tsx      # Shell, menu hamburguer, presença online, notificações
│   │   ├── Login.tsx       # Login com senha e seleção de usuário
│   │   ├── Home.tsx        # Contador do relacionamento e próximo aniversário
│   │   ├── Messages.tsx    # Chat em tempo real
│   │   ├── Timeline.tsx    # Trilha visual de momentos
│   │   ├── Extras.tsx      # Jogos e surpresas
│   │   └── Gallery.tsx     # Galeria de fotos
│   ├── auth.ts             # Autenticação por senha (sessionStorage)
│   └── routes.ts           # Rotas do app
├── Firebase.ts             # Inicialização do Firebase
└── styles/
    ├── theme.css           # Tokens de cor (light / dark mode)
    └── index.css           # Importações globais
```

---

## 📦 Scripts

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview do build local
```

---

<p align="center">
  Feito com ❤️ por <strong>Natanael Cristofe</strong>
</p>
