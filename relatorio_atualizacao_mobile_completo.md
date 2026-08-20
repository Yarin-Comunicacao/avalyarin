# Relatório Técnico de Atualização e Correção Mobile — Avalyarin

Este documento consolida todas as correções de interface nativa (Capacitor / Android), a auditoria de segurança de layout em **todos os roles** e a refatoração dos fluxos de autenticação solicitados pelo usuário.

## 1. Ajustes de Interface Nativa e Safe Area por Role

Para garantir que nenhum conteúdo fique sobrecarregado sob a barra de status do sistema (hora, Wi-Fi e nível de bateria) ou seja cortado no modo *edge-to-edge* do Android, realizamos uma varredura em todos os componentes de perfil, painéis administrativos, empresariais e profissionais:

| Role / Módulo | Componente Principal | Correção Aplicada |
| :--- | :--- | :--- |
| **Usuário (`user`)** | `UserProfile.tsx` | Adicionada a classe `.safe-area-screen` no container raiz, isolando o avatar, nome e estatísticas. |
| **Empresarial (`business`)** | `BusinessProfile.tsx`, `BusinessPanel.tsx`, `BusinessInsights.tsx`, `BusinessDivulgacoes.tsx`, `BusinessEquipe.tsx`, `BusinessLocais.tsx` | Proteção contra sobreposição em todas as abas e estados de carregamento com wrappers seguros (`safe-area-screen`). |
| **Especialista (`specialist`)** | `SpecialistProfile.tsx`, `SpecialistPanel.tsx`, `SpecialistProfilePage.tsx` | Alinhamento do cabeçalho dourado e painel de influência utilizando o Navbar seguro com recuo dinâmico de topo. |
| **Crítico (`critic`)** | `CriticProfile.tsx`, `CriticPanel.tsx` | Ajuste de safefinish e estados de carregamento com o tema azul safira. |
| **Suporte (`support`)** | `SupportProfile.tsx` | Proteção de topo para os chats e triage de bugs na aba de perfil. |
| **Admin / Owner** | `AdminPanel.tsx`, `OwnerPanel.tsx`, `SystemPanel.tsx`, `AdminEstabDetail.tsx`, `OwnerLogsPage.tsx`, `OwnerSurvey.tsx` | Inclusão de Safe Area nos estados de carregamento, páginas de detalhes e cabeçalhos fixos próprios. |

---

## 2. Correção da Barra de Status e Contraste

- **Estilo da Status Bar**: Alterado de `LIGHT` para `DARK` no arquivo `capacitor.config.ts`. Como o design system oficial do Avalyarin utiliza o fundo creme quente (`#FDF8F0`), ícones claros ficavam invisíveis. Com o estilo `DARK`, o sistema operacional exibe os indicadores escuros perfeitamente legíveis.
- **Splash Screen e Carregamento**: Substituição de fontes externas antigas por assets locais otimizados (`/logo-brand.png`), eliminando o efeito de tela vazia ou carregamento sem identidade visual no aplicativo nativo.

---

## 3. Próximos Passos para o Desenvolvedor no Android Studio

Como as alterações foram publicadas e sincronizadas no repositório GitHub (`main`), para atualizar o seu Samsung A15 basta executar os seguintes passos no seu computador:

1. Na raiz do projeto (`Avalyarin`), atualize o código:
   ```bash
   git pull origin main
   ```
2. Recompile o site e sincronize com o ambiente nativo:
   ```bash
   pnpm build
   npx cap sync android
   ```
3. Abra a pasta `android` no **Android Studio**, aguarde a sincronização do Gradle e clique no botão **Play (Run)** para testar o aplicativo atualizado no seu dispositivo.
