# Estrutura do projeto

## Estrutura geral

```text
frontend/
├── app/                 # Rotas e telas do Expo Router
├── assets/              # Imagens e fontes
├── constants/           # Constantes e test ids
├── scripts/             # Scripts auxiliares de instalação e guard
├── src/                 # Lógica de negócio, contexto, tema e serviços
└── package.json         # Dependências e scripts do projeto
```

## Pasta app

A pasta [app](../../app) contém as telas e as rotas do sistema. Ela define o fluxo principal da navegação com Expo Router.

### Principais arquivos

- [app/_layout.tsx](../../app/_layout.tsx): layout raiz da aplicação.
- [app/index.tsx](../../app/index.tsx): splash inicial e decisão de rota.
- [app/onboarding.tsx](../../app/onboarding.tsx): tela de introdução.
- [app/(auth)/login.tsx](../../app/(auth)/login.tsx): tela de login.
- [app/(auth)/signup.tsx](../../app/(auth)/signup.tsx): tela de cadastro.
- [app/(tabs)/_layout.tsx](../../app/(tabs)/_layout.tsx): layout das abas principais.
- [app/(tabs)/index.tsx](../../app/(tabs)/index.tsx): home/feed.
- [app/(tabs)/match.tsx](../../app/(tabs)/match.tsx): tela de match de vagas.
- [app/(tabs)/network.tsx](../../app/(tabs)/network.tsx): grafo de conexões.
- [app/(tabs)/assistant.tsx](../../app/(tabs)/assistant.tsx): assistente IA.
- [app/(tabs)/profile.tsx](../../app/(tabs)/profile.tsx): perfil do usuário.

## Pasta src

A pasta [src](../) contém os módulos reutilizáveis do sistema.

### Subpastas principais

- [src/contexts](../contexts): providers de contexto, como autenticação e tema.
- [src/hooks](../hooks): hooks reutilizáveis.
- [src/lib](../lib): integrações externas, como Supabase.
- [src/services](../services): dados mockados, IA, grafo e helpers de rede.
- [src/theme](../theme): tokens e provider visual.
- [src/types](../types): modelos TypeScript.
- [src/utils](../utils): utilidades de persistência e armazenamento.

## Arquitetura de arquivos

O projeto segue um padrão simples e modular:

- telas ficam em [app](../../app);
- estado global e providers ficam em [src/contexts](../contexts);
- dados e regras de negócio ficam em [src/services](../services);
- design system e tema ficam em [src/theme](../theme);
- modelos ficam em [src/types](../types).
