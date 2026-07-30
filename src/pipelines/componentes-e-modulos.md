# Componentes e módulos

## Principais telas e componentes

### Tela Home

Arquivo: [app/(tabs)/index.tsx](../../app/(tabs)/index.tsx)

Responsabilidades:
- exibir feed de conteúdo;
- mostrar stories das empresas;
- oferecer atalhos para Match, Rede, IA e Eventos;
- navegar para páginas internas.

### Tela de Match

Arquivo: [app/(tabs)/match.tsx](../../app/(tabs)/match.tsx)

Responsabilidades:
- mostrar vagas em formato de deck;
- permitir swipe com gesto de arrastar;
- contabilizar decisões do usuário.

### Tela de Rede

Arquivo: [app/(tabs)/network.tsx](../../app/(tabs)/network.tsx)

Responsabilidades:
- mostrar grafo de conexões;
- computar caminhos até empresas;
- exibir conexões diretas.

### Assistente IA

Arquivo: [app/(tabs)/assistant.tsx](../../app/(tabs)/assistant.tsx)

Responsabilidades:
- receber mensagens do usuário;
- responder com base em regras e dados mockados;
- exibir histórico de conversa.

### Páginas de detalhe

- [app/company/[id].tsx](../../app/company/[id].tsx): detalhes de empresa.
- [app/job/[id].tsx](../../app/job/[id].tsx): detalhes de vaga.
- [app/user/[id].tsx](../../app/user/[id].tsx): perfil de usuário/conexão.
- [app/story/[companyId].tsx](../../app/story/[companyId].tsx): visualização de story.

## Módulos do src

### Contextos

- [src/contexts/AuthContext.tsx](../contexts/AuthContext.tsx): autenticação e sessão local.
- [src/theme/ThemeContext.tsx](../theme/ThemeContext.tsx): tema visual global.

### Serviços

- [src/services/mock-data.ts](../services/mock-data.ts): base de dados mockada com empresas, vagas, usuários, conexões e eventos.
- [src/services/ai.ts](../services/ai.ts): lógica do assistente IA.
- [src/services/graph.ts](../services/graph.ts): algoritmo de grafo e caminhos mínimos.

### Tipos

- [src/types/index.ts](../types/index.ts): modelos principais usados pelo sistema.

### Utilidades

- [src/utils/storage](../utils/storage): persistência local com suporte a web e mobile.

### Bibliotecas auxiliares

- [src/hooks/use-icon-fonts.ts](../hooks/use-icon-fonts.ts): carregamento de ícones e assets visuais.
