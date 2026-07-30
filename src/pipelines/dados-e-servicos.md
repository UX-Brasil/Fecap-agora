# Dados, serviços e integrações

## Dados mockados

O sistema utiliza um conjunto robusto de dados mockados para simular um ecossistema real de oportunidades e conexões.

### Entidades principais

- Empresas
- Vagas
- Usuários
- Conexões
- Eventos
- Stories
- Feed
- Notificações

### Fonte principal

Arquivo: [src/services/mock-data.ts](../services/mock-data.ts)

Esse arquivo concentra:
- lista de empresas;
- oportunidades de trabalho;
- usuários e perfis;
- grafo de conexões;
- eventos e stories;
- notificações do feed.

## Serviços

### Assistente de IA

Arquivo: [src/services/ai.ts](../services/ai.ts)

Responsável por responder perguntas relacionadas a:
- empresas;
- vagas;
- eventos;
- mentorias;
- rede de conexões.

### Grafo de conexões

Arquivo: [src/services/graph.ts](../services/graph.ts)

Responsável por:
- montar o grafo de conexões;
- calcular menor caminho entre usuários;
- encontrar o caminho até empresas;
- computar layout do grafo para a UI.

## Integrações

### Supabase

Arquivo: [src/lib/supabase.ts](../lib/supabase.ts)

O projeto já está preparado para usar Supabase com:
- autenticação;
- consulta de dados;
- integração futura com dados reais.

### Armazenamento local

A aplicação usa armazenamento local para:
- persistir tema;
- persistir sessão de usuário;
- salvar estado de onboarding.

## Modelo de dados central

Os tipos principais estão em [src/types/index.ts](../types/index.ts), incluindo:
- Company
- UserProfile
- JobOpportunity
- StoryItem
- Event
- Connection
- Notification
- ChatMessage
