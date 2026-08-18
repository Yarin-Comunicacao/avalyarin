# Auditoria de navegação e suporte — descobertas iniciais

## Rotas

A análise automática do `App.tsx` encontrou 115 padrões de rota registrados. A varredura de destinos internos literais em `client/src/**/*.tsx` encontrou 41 destinos e nenhum destino literal sem rota correspondente.

A auditoria ainda precisa validar destinos dinâmicos (`/estabelecimento/${slug}`, `/perfil/${username}`, `/mensagens/${username}` etc.) e aliases que carregam o mesmo componente.

## Aliases já identificados

| Destino | Destino lógico compartilhado |
|---|---|
| `/admin/usuarios` | `AdminPanel`, seção Equipe |
| `/admin/equipe` | `AdminPanel`, seção Equipe |
| `/admin/estabs` | `AdminPanel`, seção Negócio |
| `/admin/negocio` | `AdminPanel`, seção Negócio |
| `/admin/especialistas` | `AdminPanel`, seção Permissões |
| `/admin/permissoes` | `AdminPanel`, seção Permissões |
| `/admin/config` | `AdminPanel`, seção Config |
| `/owner/config` | `AdminPanel`, seção Config (com bloqueio para admin e mensagem de Owner) |
| `/owner/analytics` | `AdminPanel`, seção Negócio |
| `/owner/equipe` | `AdminPanel`, seção Equipe em modo Owner |
| `/owner/crescimento`, `/owner/financeiro`, `/owner/roles`, `/owner/brandbook` | `OwnerPanel`, abas internas distintas |
| `/owner/codigo` | `OwnerPanel`, conteúdo de código, mas sem aba visível no array `tabs` |
| `/admin/moderacao` | `AdminPanel`, seção Moderação |

## Suporte atual

O modelo `support_tickets` exige `establishmentId` e foi desenhado para o suporte atribuído a estabelecimentos. As rotas existentes `support.createTicket`, `support.myTickets` e `support.resolveTicket` estão protegidas por `supportProcedure`, portanto não atendem diretamente a usuários, business ou demais roles que precisem reportar um bug geral da plataforma.

## Próximas verificações

1. Comparar todos os destinos dinâmicos com os padrões de rota.
2. Mapear os botões/abas visíveis dos painéis Admin e Owner versus aliases de URL.
3. Criar ou adaptar um fluxo de reporte técnico com contexto automático (rota, navegador/dispositivo, usuário, descrição, severidade e evidências), além da fila de atendimento para suporte/admin/owner.

## Correção aplicada durante a auditoria

Foi identificado um conflito real: `/busca` estava declarado duas vezes no `Switch` do `App.tsx`. Como o primeiro match vence, `SearchResults` não era alcançado; a rota carregava o componente legado `Home`. A declaração legada e o import de `Home` foram removidos, mantendo `/busca` apontando para `SearchResults`, que é o componente compatível com os parâmetros de busca usados pelo Navbar.

## Fechamento da auditoria de suporte

O painel de suporte tinha referências para `/suporte/chat` e para a aba `Resolvidos`, mas o App só registrava `/suporte/estabs` e `/suporte/tickets`. Foram adicionadas as rotas `/suporte`, `/suporte/resolvidos`, `/suporte/chat` e `/suporte/bugs`. As abas do SupportProfile agora alteram a URL, permitem deep-link e permanecem sincronizadas ao recarregar a página.

Também foi criado o modelo `bug_reports`, separado dos tickets vinculados a estabelecimentos. Usuários autenticados de todos os roles podem abrir o formulário pelo botão flutuante universal. O reporte registra título, descrição, categoria, severidade, rota atual, plataforma, user-agent, viewport, estado online, versão e contexto técnico não sensível. A inbox está disponível em `/suporte/bugs`; suporte, admin e owner podem atualizar status, severidade e notas de triagem/resolução. Cada registro recebe um protocolo `bug000001`.
