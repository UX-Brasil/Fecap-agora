# Telas e rotas

## Rotas principais

| Rota | Tela | Descrição |
|---|---|---|
| / | Splash | Tela inicial que redireciona para onboarding, login ou tabs |
| /onboarding | Onboarding | Apresentação do produto |
| /(auth)/login | Login | Autenticação do usuário |
| /(auth)/signup | Cadastro | Criação da conta |
| /(tabs) | Home/abas | Navegação principal com abas |
| /(tabs)/index | Home | Feed, stories e atalhos |
| /(tabs)/match | Match | Swipe de vagas |
| /(tabs)/network | Rede | Grafo de conexões |
| /(tabs)/assistant | Assistente IA | Chat de apoio |
| /(tabs)/profile | Perfil | Perfil do usuário |
| /company/[id] | Empresa | Página detalhada da empresa |
| /job/[id] | Vaga | Detalhes da oportunidade |
| /story/[companyId] | Story | Visualização de stories das empresas |
| /user/[id] | Usuário | Perfil de pessoa/conexão |
| /search | Busca | Pesquisa de empresas, pessoas e vagas |
| /notifications | Notificações | Lista de notificações |
| /settings | Configurações | Preferências do app |

## Comportamento das telas

### Splash

- Decide automaticamente o próximo destino com base no estado de onboarding e autenticação.

### Onboarding

- Exibe 3 slides com mensagens principais do produto.
- Armazena a confirmação de conclusão.

### Login e cadastro

- Utilizam formulários com validação básica.
- Permitem entrar em modo demonstrativo.
- O cadastro integra com o cliente Supabase em uma estrutura futura.

### Home

- Mostra feed de empresas e oportunidades.
- Exibe stories e atalhos de navegação.

### Match

- Apresenta vagas em formato de swipe.
- Registra curtidas, passes e superlikes.

### Rede

- Renderiza um grafo simples de conexões.
- Destaca o caminho até empresas específicas.

### Assistente IA

- Responde a perguntas sobre empresas, vagas, mentorias, hackathons e rede.

### Empresa, vaga e usuário

- Exibem detalhes mais completos com base nos dados mockados.
- Mostram contexto de conexão entre o usuário atual e o alvo.
