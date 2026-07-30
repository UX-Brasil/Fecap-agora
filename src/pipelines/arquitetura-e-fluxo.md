# Arquitetura e fluxo do sistema

## Arquitetura geral

O sistema é uma aplicação mobile baseada em:

- Expo Router para navegação entre telas;
- React Native para interface;
- TypeScript para tipagem;
- providers de contexto para autenticação e tema;
- serviços mockados para simular dados do ecossistema acadêmico e profissional.

## Fluxo principal de uso

1. Splash inicial
   - O app verifica se o usuário já passou pelo onboarding.
   - Se não houver onboarding, ele é levado para a tela de introdução.

2. Onboarding
   - Apresenta os principais diferenciais do Fecap Ágora.
   - Ao finalizar, salva o estado no armazenamento local.

3. Autenticação
   - O usuário entra ou cria conta.
   - O contexto de autenticação mantém o usuário logado localmente.

4. Navegação principal
   - Após autenticar, o usuário entra nas abas Home, Match, Rede, IA e Perfil.

## Providers e contexto

### AuthProvider

Responsável por:

- armazenar o usuário autenticado;
- simular login e cadastro;
- persistir os dados localmente;
- permitir atualização do perfil.

### ThemeProvider

Responsável por:

- gerenciar o tema claro/escuro;
- expor cores, espaçamentos, tipografia e sombras;
- persistir a preferência no armazenamento.

## Camadas de responsabilidade

- Camada de interface: telas em [app](../../app)
- Camada de estado: providers em [src/contexts](../contexts)
- Camada de regras: serviços em [src/services](../services)
- Camada de modelos: tipos em [src/types](../types)
- Camada de persistência: utilidades em [src/utils](../utils)

## Fluxo de dados

- O usuário interage com as telas.
- As telas consomem dados dos serviços mockados.
- A autenticação e o tema usam armazenamento local para persistir preferências.
- A rede e o assistente IA calculam respostas com base em dados estruturados.
