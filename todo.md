# Project TODO

- [x] Database schema (users, establishments, menu_items, ratings, rating_items, business_claims)
- [x] tRPC routers (categories, establishments, ratings, admin, business)
- [x] Homepage with hero, categories grid, how-it-works
- [x] Category listing page
- [x] Establishment detail page with menu tabs
- [x] Rating page with Direct/Analytic modes
- [x] Badge system with qualification tracking
- [x] Survey system (multi-phase)
- [x] Theme system (5 themes)
- [x] Search page with tRPC
- [x] Admin Panel page (/admin) with stats, user management, claims review
- [x] Business Panel page (/painel-empresarial) with claim submission, establishment management, menu editing
- [x] App Menu links for Admin and Business panels (role-based visibility)
- [x] Claim button on EstablishmentPage ("É dono deste estabelecimento?")
- [x] Connect RatingPage save to tRPC (saveRating mutation) with auth check
- [x] Item comments persisted to database via rating_items.comment
- [x] Spend data (subtotal, service, couvert, valet, parking) saved to DB
- [x] overallScore validation updated for bonus system (0-115)
- [x] Write vitest tests for ratings.save mutation
- [x] Write vitest tests for admin/business procedures (schema validation)
- [x] Remove "Entrar" button from navbar left side (keep login only in menu)
- [x] Query establishments with Instagram links and report count (195 found)
- [x] Fetch Instagram profile photos and update establishment images (71 updated)
- [x] Apply 4-group category division on home page (Gastronomia, Bares & Vida Noturna, Café & Doces, Saudável & Bem-estar)
- [x] Update "Como Funciona" step 1: title "Escolha uma das categorias", desc "Selecione o estabelecimento cadastrado que você visitou."
- [x] Design and create user_rankings DB table (userId, categoryId, establishmentId, position, updatedAt)
- [x] Create tRPC procedures for rankings (getRanking, saveRanking, getUserRatedEstablishments)
- [x] Build ranking voting UI page with top 10 / top 3 logic per category
- [x] Implement discovery banner when user has fewer than 3 rated places in a category
- [x] Integrate ranking prompt into post-rating flow (after saving a rating)
- [x] Write vitest tests for ranking procedures
- [x] Hide menu items below 'Últimas Visitas' for non-logged users (show only after login)
- [x] Show 'Minha Conta' option after user registers/logs in
- [x] Make 'Meus Dados' page show static read-only data (no edit option)
- [x] Merge 'Cadastro' and 'Contas Conectadas' into new 'Meu Usuário' tab
- [x] Username field: no spaces allowed, auto-suggest variations, uniqueness check
- [x] Preferences section: show survey choices, increase surveys every 5 badges
- [x] Últimas Visitas: fix images on web version
- [x] Connected accounts section (Facebook, Instagram, Google) below username/preferences
- [x] Create LGPD consent terms document (modelo em docs)
- [x] Research LGPD-compliant data from Facebook, Instagram, Google
- [x] Create establishment registration form in Admin Panel
- [x] Replace age range survey question with roulette-style birthdate picker (day/month/year)
- [x] Enforce 16-year minimum age (born on or before today minus 16 years)
- [x] Add document upload flow for age verification (RG/CPF photo) when user wants to change birthdate below minimum
- [x] Refactor MeuUsuario preferences to show only categories and priorities (hide other data)
- [x] Move birthdate, region, and average spend to MeusDados page (read-only display)
- [x] Change minimum age from 16 to 18 years (max date: 07/05/2008)
- [x] Add age gate screen (checkbox "Tenho mais de 18 anos") as first screen before onboarding
- [x] Add AI-generated images (day restaurant + night bar) flanking the age gate checkbox
- [x] BirthdateRoulette: add 2 invisible blank spaces before minimum year, remove error message
- [x] BirthdateRoulette: show calculated age in parentheses next to selected date
- [x] Remove "mínimo 16 anos" references from survey description
- [x] Roulette should scroll to the selected date position on load
- [x] Add 2 blank spaces before day 01 and before Janeiro in BirthdateRoulette
- [x] Create presentation comparing user data capture flow with Manus vs without Manus
- [x] Add real-time visual validation with success icon when valid date is selected in BirthdateRoulette
- [x] Reclassify establishments using keyword rules (phase 1 - clear cases)
- [x] Reclassify ambiguous establishments using LLM (phase 2 - AI-assisted)
- [x] ~~Continue Instagram verification in batches of 50~~ (descartado pelo usuário)
- [x] Google Maps enrichment: Boteco Moderno (18 establishments)
- [x] Instagram enrichment: Boteco Moderno (18 establishments)
- [x] Google Maps enrichment: Pub (22 establishments)
- [x] Google Maps enrichment: Coquetelaria (26 establishments)
- [x] Google Maps enrichment: Bar Musical (32 establishments)
- [x] Google Maps enrichment: Cervejaria (51 establishments)
- [x] Google Maps enrichment: Autoral/Contemporâneo (75 establishments)
- [x] Google Maps enrichment: Confeitaria (173 establishments)
- [x] Google Maps enrichment: Balada (212 establishments)
- [x] Google Maps enrichment: Saudável (254 establishments)
- [x] Google Maps enrichment: Hamburgueria (326 establishments)
- [x] Google Maps enrichment: Pizzaria (399 establishments)
- [x] Google Maps enrichment: Boteco Tradicional (518 establishments)
- [x] Google Maps enrichment: Padaria (629 establishments)
- [x] Google Maps enrichment: Cafeteria (830 establishments)
- [x] Google Maps enrichment: Cozinha Internacional (1013 establishments)
- [x] Google Maps enrichment: Cozinha Brasileira (1514 establishments)
- [x] Google Maps enrichment: Bar & Lanchonete (1654 establishments)
- [x] ~~Instagram enrichment: remaining categories~~ (descartado pelo usuário)
- [x] Remove 8 establishments not found on Google Maps (IDs: 7729, 2601, 4280, 7019, 1194, 1354, 6119, 7053)
- [x] Optimize hours text: group consecutive days with same schedule (e.g., "Seg a Qui: 11:30–15:00")
- [x] Re-process 332 establishments that failed due to "Data too long" with optimized hours
- [x] Review and correct manually-entered establishments (address, hours, phone, coordinates) — 7,383 corrections applied
- [x] Remove 16 invalid establishments (generic names, typos, Portugal addresses, street names as bar names)
- [x] Admin Panel: Add "Código Fonte" tab with code backup/recovery documentation
- [x] Admin Panel: Enforce required fields (address, hours, phone, neighborhood, category) in new establishment form
- [x] Remove "Região" from required fields in establishment creation (not used in existing data)
- [x] Add proper placeholders with format examples in establishment creation form
- [x] Add phone mask (11) 99999-9999 in establishment creation form
- [x] Remove profile icon from left side of navbar
- [x] Generate cover photos for all 17 categories on home page
- [x] Adicionar estabelecimento "Luiza Lafer Confeitaria" com Instagram @luizalaferconfeitaria
- [x] Adicionar cardápio da Luiza Lafer Confeitaria (24 itens: 6 bolos, 4 tortas, 9 doces, 3 presenteáveis, 2 challah)
- [x] Remover duplicidades de franquias (mesmo endereço) do banco — 112 duplicatas removidas
- [x] Remover parques/Herbalife do banco (não são estabelecimentos gastronômicos) — 26 removidos
- [x] Remover nutricionistas do banco (não são estabelecimentos gastronômicos) — incluído acima
- [x] Adicionar estabelecimento EAPSP (Rua Vupabussu) ao banco — 48 itens de cardápio inseridos
- [x] Adicionar cardápio da Raw Burger — 45 itens em 7 categorias (PriceListo, maio 2026)
- [x] Comparar e atualizar cardápio da Raw Burger com dados do cardápio físico (foto) — 40 itens em 7 categorias
- [x] Bug: cardápio não aparece na página do estabelecimento Raw Burger N Bar — categorias corrigidas para valores reconhecidos pelo frontend
- [x] Bug: tela de avaliação não mostra todos os itens do cardápio — corrigido filtros para incluir todas as categorias + adicionadas seções Cervejas, Destilados, Drinks, Pães
- [x] Usar imagem de fundo da tela 18+ como fundo padrão do app inteiro
- [x] Substituir hero banner da Home pelas imagens dia/noite da tela 18+
- [x] Corrigir layout Home: remover sobreposição de imagens, usar apenas uma imagem de fundo para toda a página
- [x] Verificar subcategorias possíveis de Saudável
- [x] Cardápio com fundo/card visual na EstablishmentPage (igual ao estilo do botão Avaliar)
- [x] Botão "Avaliar este estabelecimento" fixo na parte inferior da tela (position fixed bottom)
- [x] Verificar se Mocotó Vila Leopoldina está cadastrado no app (NÃO está - confirmar com usuário se deseja adicionar)
- [x] Cadastrar cardápio da Famiglia Mancini (47 itens: 5 entradas, 24 pratos, 7 sobremesas, 7 drinks, 4 bebidas)
- [x] Adicionar cardápio (hasMenu) como campo obrigatório para exibição de estabelecimentos
- [x] Ocultar estabelecimentos incompletos no app (sem nome, categoria, endereço, bairro, telefone, Instagram, horário ou cardápio)
- [x] Filtrar queries públicas (listagem por categoria, busca, nearby) para excluir incompletos
- [x] Manter estabelecimentos incompletos visíveis no Admin Panel para gestão
- [x] Aplicar filtro de completude nas queries por slug (getEstablishmentBySlug, getEstablishmentWithMenu) para bloquear acesso direto
- [x] Filtrar resultados de busca por menu para excluir itens de estabelecimentos incompletos
- [x] Verificar que Admin Panel usa queries sem filtro de completude (rota admin.establishmentsByCategory com bypassFilter=true)
- [x] Adicionar testes Vitest para filtro de completude (18 testes passando)
- [x] Dividir categoria Saudável em 3: Vegan, Açaí e Saudável (geral)
- [x] Criar novas categorias Vegan e Açaí no banco de dados
- [x] Redistribuir estabelecimentos da categoria Saudável para Vegan e Açaí conforme tipo
- [x] Atualizar frontend para exibir as 3 categorias no grupo Saudável & Bem-estar
- [x] Nova imagem de capa para Balada: grupo de pessoas estilosas posando com drinks (água, caipirinha, negroni, champagne, whiskey), paleta quente
- [x] Remover texto da splash screen do PWA — deixar apenas o logo, sem palavras
- [x] Endereço com bottom sheet: copiar, abrir no Maps, abrir no Uber ao clicar no endereço do estabelecimento
- [x] Mover "Últimas Visitas" do menu lateral para dentro de "Meu Usuário" (mobile)
- [x] Criar imagem de compartilhamento para Stories do Instagram (card visual 9:16 com nota, bar, itens avaliados)
- [x] Criar aba Notificações no menu lateral (badges alcançados, pesquisas de preferência, atualizações de grupos)
- [x] Migrar perguntas bônus da avaliação para pesquisas de preferência na aba Notificações
- [x] Schema de banco: tabelas groups, group_members, group_invites, user_plans
- [x] Backend: CRUD de grupos (criar, listar, editar, deletar)
- [x] Backend: sistema de convites (@usuário) com aceitar/recusar
- [x] Backend: seguir/deixar de seguir grupos de influencers
- [x] Backend: compartilhar avaliações no grupo
- [x] Frontend: página de Grupos com abas "Meus Grupos" e "Grupos que Sigo"
- [x] Frontend: criar grupo privado (Tipo 1) com seleção de membros
- [x] Frontend: criar grupo de influencer (Tipo 2) — apenas plano pago
- [x] Frontend: visualizar avaliações compartilhadas dentro do grupo
- [x] Integrar convites de grupo na aba Notificações (aceitar/recusar com tRPC)
- [x] Lógica de plano: gratuito = 3 grupos, pago = ilimitado
- [x] Lógica de plano: grupo influencer requer plano pago para criar
- [x] Fix: Abas do Painel Admin sobrepostas no mobile — tabs ilegíveis em telas pequenas
- [x] Fix: Tela de avaliação — mensagem cortada no topo no mobile, adicionar folga/padding
- [x] Alterar mensagem da tela de avaliação para: "Olá {{nome}}, que bom que veio ao {{estabelecimento}}! Selecione apenas os itens que você consumiu e nos fale da sua experiência."
- [x] Tela intermediária após verificação de idade: "Cadastre-se" (login → onboarding) e "Já Tenho Cadastro" (login → home)
- [x] Fix: Imagem de fundo do hero na Home distorcida no mobile e ao redimensionar janela
- [x] Seletor de imagem de fundo na área de Tema do menu lateral (foto noturna, foto diurna, fotos de categorias)
- [x] Criar ícones/símbolos únicos para cada categoria de estabelecimento
- [x] Criar página NearbyPage (/perto-de-mim) com listagem completa de estabelecimentos próximos + ícones de categoria
- [x] Conectar botão "Ver mais" da seção Perto de Você à nova página NearbyPage
- [x] Sistema de badges de nobreza — lógica derivada em db-nobility.ts (sem tabela extra necessária, cálculo em tempo real)
- [x] Campo visit_date na tabela de avaliações (ratings)
- [x] Lógica backend: cálculo de nobreza por categoria (52 aval + 15 locais / 12 meses)
- [x] Lógica backend: cálculo de nobreza por bairro (104 aval + 30 locais / 12 meses)
- [x] Lógica backend: cálculo de nobreza por estabelecimento (52 aval / 12 meses)
- [x] Procedures tRPC para consultar badges de nobreza do usuário
- [x] Campo de data da visita na tela de avaliação (antes de selecionar itens)
- [x] Tela de badges de nobreza no perfil do usuário
- [x] Testes vitest para lógica de cálculo de nobreza (constantes e lógica pura)
- [x] Renomear "Badges de Nobreza" / "Títulos de Nobreza" para "Insígnias" nos textos visíveis ao usuário (frontend)
- [x] Sistema de pontos com validade rolling 365 dias (pontos expiram após 12 meses)
- [x] Lógica backend para calcular pontos válidos do usuário (soma de pontos das avaliações dos últimos 365 dias)
- [x] Sistema de 16 níveis de progressão com thresholds definidos
- [x] Geração de frases personalizadas por IA (invokeLLM) ao subir de nível, baseada nas categorias avaliadas
- [x] Salvar frase da insígnia de nível no banco (apenas última exibida no perfil)
- [x] Interface de perfil exibindo nível atual, pontos válidos, progresso até próximo nível
- [x] Testes vitest para lógica de pontos e níveis
- [x] Alterar sistema de pontos: ao invés de expirar totalmente, usar peso decrescente por idade (1.0 até 1 ano, 0.2 até 2 anos, 0.1 até 3 anos, 0.025 acima de 3 anos)
- [x] Insígnias especiais de bairro com nome do local (ex: "Desbravador de Pinheiros", "Cartógrafo do Butantã")
- [x] Carrossel 9:16 de postagens de estabelecimentos na Home
- [x] Testes para formação correta de títulos de insígnias especiais com preposição (de/do/da + bairro)
- [x] PostsCarousel: adicionar estado de erro e fallback UX
- [x] PostsCarousel: adicionar carrossel "Salvos" para usuários logados com estabelecimentos seguidos
- [x] Admin Estab: separar listagem por categorias com ordem alfabética dentro de cada
- [x] Admin Estab: abas Ativos/Ocultos dentro de cada categoria
- [x] Admin Estab: botão Ocultar (para ativos) e Ativar (para ocultos)
- [x] Admin Estab: página individual do Estab clicável com edição de cardápio
- [x] Schema: campo hidden/active no establishments + imageUrl no menu_items (tabela já existia)
- [x] Otimização de imagens: instalar Sharp e converter uploads para WebP (thumbnail 400x400 + full 1200x1200)
- [x] Schema: adicionar campo imageThumbUrl/imageThumbKey ao menu_items
- [x] Frontend: lazy loading com thumbnails na listagem do cardápio
- [x] Categorias do cardápio: sempre iniciar com letra maiúscula (capitalize no input e exibição)
- [x] Categorias do cardápio: campo sortOrder para ordenação personalizada
- [x] Categorias do cardápio: drag-and-drop para reordenar (dnd-kit)
- [x] Navegação de volta no AdminEstabDetail: retornar para Admin > Estabelecimentos com categoria correta selecionada
- [x] Validação automática: estabs sem endereço/horário/cardápio ficam ocultos automaticamente
- [x] Badge vermelho nas categorias do admin mostrando quantidade de estabs incompletos
- [x] Badge vermelho no estabelecimento (à esquerda do botão Ocultar) com número de itens faltantes
- [x] Linha vermelha no cardápio para itens sem foto (destaque visual)
- [x] Notificações no Painel Empresarial para usuários "Empresa" sobre itens sem foto
- [x] Badges nas categorias: mostrar pendências apenas dos estabs ativos (não ocultos)
- [x] Mover para Ocultos automaticamente todos os estabs ativos sem endereço/horário/cardápio
- [x] Ícones diferentes por categoria no Admin Estabelecimentos: folha verde (Saudável), caneca cerveja (Bar), prato (Gastronomia), xícara café (Cafés e Doces)
- [x] Menu lateral: Minha Conta deve vir fechado por padrão, submenu só aparece ao clicar
- [x] Novo status "Pendente" para estabelecimentos (além de Ativo e Oculto)
- [x] Mover todos os estabelecimentos atualmente ocultos para status Pendente
- [x] Atualizar schema, backend e frontend para suportar 3 status
- [x] Adicionar campo description ao schema de establishments
- [x] Limpar nomes: extrair descrições longas do nome para campo description
- [x] Endereço: deve começar com logradouro padrão (Rua, Avenida, Alameda, Praça, Travessa, Largo, Estrada, Rodovia)
- [x] Endereço: mover complementos (Shopping, Galeria, etc.) do campo endereço para campo complemento
- [x] Número: extrair números do endereço para campo addressNumber
- [x] Complemento: Shopping, galeria, sala, loja, conjunto, edifício — campo separado
- [x] Marcar como Pendente todos os estabs sem endereço com logradouro válido
- [x] Remover estabs com nomes inválidos (A, O, Menu, Liberdade, Paulista, Mapa, Centro de SP, Pinheiros)
- [x] Remover estabs fora de SP capital (Botucatu, Limeira, Brasília)
- [x] Corrigir abreviações remanescentes (Pç→Praça, L.→Largo, R.→Rua)
- [x] Corrigir endereços com prefixos inválidos (Shopping X - Rua Y, ZAP, CEP, etc.)
- [x] Backend: novos campos (description, complement, addressNumber) nas queries de leitura/escrita
- [x] Frontend: formulário de edição de informações no AdminEstabDetail com todos os novos campos
- [x] Bairro: deve ser o bairro exato do Google (não subprefeitura)
- [x] Validações no backend para novos campos (regex de logradouro, número, complemento, descrição)
- [x] Limpeza em massa dos 7.277 pendentes: 100% endereços com logradouro válido
- [x] Corrigir typos em massa (Ruaa→Rua, Avenidade→Avenida)
- [x] Extrair complementos embutidos nos endereços dos pendentes
- [x] Separar nomes longos com descrições (pipes, dois pontos, traços)
- [x] Remover 5 estabs sem endereço algum (dados insuficientes)
- [x] Identificar duplicidades (mesmo endereço + número) em todos os estabelecimentos (170 encontradas)
- [x] Verificar no Google Maps o nome e bairro correto dos 11 grupos com bairros divergentes
- [x] Verificar 11 duplicidades com bairros divergentes no Google Maps
- [x] Corrigir bairros (Consolação, Vila Madalena, Jardim Luzitânia, Vila Mariana, Vila Nova Conceição) e remover 11 duplicatas
- [x] Gerar planilha das 158 duplicidades restantes (mesmo bairro) para revisão manual do usuário
- [x] Renomear categoria Hamburgueria para "Hamburgueria e Lanches"
- [x] Mover Black Dog e Pastel da Praça para categoria Hamburgueria e Lanches
- [x] Excluir todos os estabelecimentos pendentes do banco (6.292 removidos, restam 187 ativos)
- [x] Ocultar nota Google de estabs com nota abaixo de 4.7 (mostrar apenas quantidade de avaliações)
- [x] Para estabs com nota 4.7 a 5.0: exibir nota com 5 estrelas pintadas proporcionalmente + quantidade "no Google"
- [x] Exibir avaliações Avalyarin ao lado das avaliações Google
- [x] Avaliações Avalyarin clicáveis: mostrar resumo do pedido (itens pedidos, data, @usuário em fonte menor)
- [x] Ordenação por relevância: análise LLM de profundidade/utilidade dos comentários (detalhes técnicos > genéricos)
- [x] Bug: nota overall mostra 25/10 — cálculo corrigido para escala 0-10 (média direta + normalização analítica)
- [x] Bug: após avaliação redireciona para /badges genérica — corrigido para /insignias ou /conta/usuario
- [x] Remover Pontos Bônus completamente da avaliação (step removido, cálculo limpo)
- [x] Bug: cerveja não apareceu para avaliar no Mania de Churrasco — corrigido (avaliação direta no modo analítico misto)
- [x] Critério "Originalidade" apenas em: Gastrobar, Coquetelaria, Autoral, Boteco Moderno, Confeitaria, Vegan e Vegetariano
- [x] Bug: nota 25/10 desproporcional no modo direto — corrigido (escala 0-10, dados migrados no banco)
- [x] Remover Pontos Bônus completamente da avaliação (step de bônus + cálculo da nota)
- [x] Bug: redirecionamento pós-avaliação vai para /badges genérico — corrigido para /insignias ou /conta/usuario
- [x] Criar página unificada "Minhas Avaliações" (/minhas-avaliacoes) com 4 abas: Avaliações, Meu Ranking, Locais Visitados, Galeria
- [x] Menu lateral: "Minhas Avaliações" como item expansível com sub-itens apontando para /minhas-avaliacoes/:tab
- [x] Redirecionamento pós-avaliação: ir para /minhas-avaliacoes/avaliacoes
- [x] Adicionar campo `code` visual nas tabelas: users, categories, establishments, ratings, groups, menu_items
- [x] Gerar codes para dados existentes (users: 1-200000000, categories: ca001-ca999, establishments: es000001-es999999, ratings: ra000001, groups: gr000001, menu_items: mi000001)
- [x] Geração automática de code ao criar novos registros no backend
- [x] Botão de salvar (bandeirinha/bookmark) na página do estabelecimento
- [x] Backend: endpoints para salvar/remover estabelecimento dos favoritos (já existiam)
- [x] Frontend: estado visual do bookmark (salvo/não salvo) na EstablishmentPage
- [x] Integrar Brandbook como subpágina na área de Admin (/admin/brandbook)
- [x] Criar tabela establishment_categories (relação N:N) para múltiplas categorias por estabelecimento
- [x] Migrar dados existentes de categoryId para a nova tabela de relação
- [x] Atualizar schema Drizzle, queries backend e frontend para usar relação N:N
- [x] Criar categoria "Vegetariano" e "Restaurante"
- [x] Vincular Quebec a múltiplas categorias (Boteco Moderno + Restaurante)
- [x] Verificar e atualizar frontend (CategoryPage) para exibir corretamente estabs com múltiplas categorias (N:N)
- [x] Corrigir bairros dos 188 estabelecimentos ativos para o bairro exato do Google Maps (não subprefeitura)
- [x] Corrigir bug: cerveja não avaliada no modo analítico misto (agora usa avaliação direta para bebidas)
- [x] Criar categoria "Gastrobar" e reclassificar 6 estabs (Melts, Marú, Ministro, Oink, Othê, Fábrica Drinks)
- [x] Criar categoria "Lanches" e mover Black Dog Paulista + Pastel da Praça para ela
- [x] Redesenhar tela inicial: seção "Minhas Preferidas" (5 categorias da survey)
- [x] Redesenhar tela inicial: seção "Explore outros grupos" (4 grupos com imagens)
- [x] Renomear grupo "Saudável e Bem-estar" para "Saudável & Natural"
- [x] Redesenhar tela inicial: seção "Veja todas as Categorias" com GIF animado
- [x] Criar GIF animado alternando entre imagens de categorias
- [x] Gerar imagens para os 4 grupos de categorias
- [x] Corrigir fluxo: categorias individuais não devem aparecer na Home — devem abrir apenas ao clicar em um grupo na seção "Explore outros grupos"
- [x] Adicionar tipos de destaque: "Novidade" (new_item) e "Parceria" (collab) ao sistema
- [x] Implementar durações diferenciadas por tipo: brand=30d, menu_daily=até fechar, promotion=7d, event=15d ou até data do evento, new_item=30d, collab=21d
- [x] Links clicáveis no carrossel expandido: nome do bar → página do estab, bairro → busca por bairro, badge tipo → busca por tipo
- [x] Bug: cardápio vazio no Bar Teste Avalyarin — matchCat() atualizado para suportar plural/singular e nomes compostos
- [x] Bug: estab salvo não aparece na aba de salvos do usuário — novo endpoint posts.savedEstablishments com JOIN completo
- [x] Bug: itens do cardápio não aparecem na tela de avaliação do Bar Teste — corrigido com normalizeCategory() que mapeia plural/composto para singular canônico
- [x] Bug: botão "Reivindicar" no estab redireciona direto ao Painel Empresarial — agora abre ClaimFormModal inline com questionário completo
- [x] Bug: tabs do Painel Empresarial sobrepostas no mobile — labels abreviados no mobile (sm:hidden/sm:inline), scroll horizontal com scrollbar-hide
- [x] Fix: margem entre barra de busca e conteúdo na tela de avaliação — pt-24 → pt-32
- [x] Fix: date picker da avaliação deve iniciar no mês/ano vigente — defaultMonth={new Date()}
- [x] Fix: scroll to top ao navegar entre páginas — componente ScrollToTop com useLocation no Router
- [x] Contas business: ocultar funcionalidades de avaliação — menu filtrado, botão Avaliar oculto, RatingPage redireciona, backend bloqueia save
- [x] Notificação ao business owner quando receber nova avaliação — tabela business_notifications, insert após saveRating, UI na tab Notificações do BusinessPanel

## Fase 1 — QR Code + Códigos Promocionais
- [x] Adicionar campo slug aos estabelecimentos (já existia no schema)
- [x] Criar tabela promo_codes no banco
- [x] Criar tabela promo_code_uses no banco
- [x] Endpoint: establishments.getBySlug (já existia)
- [x] Endpoint: promo.validate (validar código + retornar promoção)
- [x] Endpoint: promo.use (registrar uso do código)
- [x] Endpoint: promo.create (criar código, status pending_approval)
- [x] Endpoint: promo.myCodesList (listar códigos do usuário)
- [x] Endpoint: promo.delete (excluir código próprio)
- [x] Endpoint: admin.promoCodes (listar códigos para aprovação)
- [x] Endpoint: admin.approveCode (aprovar código)
- [x] Endpoint: admin.rejectCode (rejeitar código)
- [x] Frontend: rota /e/:slug com cardápio + pop-up de código
- [x] Frontend: Painel Empresarial → aba QR Code (gerar/baixar)
- [x] Frontend: Painel Empresarial → aba Códigos Promocionais (criar/gerenciar)
- [x] Frontend: Admin → seção Códigos (aprovar/rejeitar)

## Fase 2 — Sistema de Influencer + Parcerias

- [x] Adicionar role 'influencer' ao enum de roles no schema
- [x] Criar tabela influencer_applications (solicitação com avaliações selecionadas)
- [x] Criar tabela partnerships (parceria influencer↔estab com status)
- [x] Endpoint: influencer.submitApplication (submeter solicitação com avaliações selecionadas)
- [x] Endpoint: influencer.myRatings (listar avaliações dos últimos 365 dias com status qualificada/não)
- [x] Endpoint: admin.influencerApplications (listar solicitações pendentes)
- [x] Endpoint: admin.approveInfluencer / admin.rejectInfluencer
- [x] Frontend: formulário de solicitação influencer com lista de avaliações (vermelho se não qualificada)
- [x] Frontend: sub-abas no Admin Solicitações (Estabelecimento | Influencer)
- [x] Endpoint: influencer.proposePartnership (influencer propõe parceria a estab)
- [x] Endpoint: business.respondPartnership (estab aceita/rejeita)
- [x] Endpoint: admin.approvePartnership / admin.rejectPartnership (admin aprova/rejeita parceria final)
- [x] Frontend: tela de parcerias no Painel Empresarial
- [x] Testes vitest para sistema de influencer (12 testes passando)

## Fase 3 — Sistema de Planos e Monetização

- [x] Atualizar enum de planos no schema: free, premium (R$9,90), embaixador (R$19,90)
- [x] Criar tabela subscriptions (histórico de assinaturas, método pagamento, status)
- [x] Criar tabela business_subscriptions (planos para estabelecimentos)
- [x] Backend: endpoint para consultar plano atual e limites (plans.options, plans.myPlan)
- [x] Backend: limite de avaliações por dia baseado no plano (free=3, premium=5, embaixador=ilimitado)
- [x] Backend: endpoint para upgrade/downgrade de plano (plans.upgrade, plans.cancel)
- [x] Backend: controle de códigos promo por plano (free=1 ativo, premium=5, embaixador=ilimitado)
- [x] Frontend: redesenhar página de Planos com os 3 tiers e features reais
- [x] Frontend: toast de upgrade quando usuário atinge limite diário de avaliações (redireciona para /conta/planos)
- [x] Frontend: indicador de plano no perfil/menu (badge dinâmico "Free"/"Premium"/"Embaixador")
- [x] Frontend: planos para estabelecimentos no Painel Empresarial (aba "Meu Plano")
- [x] Testes vitest para limites de plano (23 testes passando)

## Fase 4 — Dashboard de Insights

- [x] Backend: db-analytics.ts com queries agregadas e cache em memória (5 min admin, 10 min business, 15 min user)
- [x] Backend: endpoint analytics.adminDashboard (métricas globais: users, ratings, estabs, growth, top estabs, planos)
- [x] Backend: endpoint analytics.businessInsights (overview, scoreOverTime, topItems, worstItems, ratingDistribution, recentTrend)
- [x] Backend: endpoint analytics.myStats (totalRatings, avgScore, categorias, bairro favorito, ratingsByMonth, topRated)
- [x] Frontend: Aba Insights no Admin com cards de métricas, gráfico de avaliações/dia, top estabs, distribuição de planos
- [x] Frontend: Aba Insights no Painel Empresarial (nota média, evolução 30d, top/worst itens, tendência 7d/30d)
- [x] Frontend: Aba Estatísticas no Minhas Avaliações (resumo pessoal, favoritos, gráfico mensal, melhores locais)
- [x] Testes vitest para endpoints de analytics (10 testes passando, 320 total)

## Fase 5 — Mudanças no Fluxo Existente

### 5.1 Avaliação Presencial (QR + Geolocalização)
- [x] Schema: campo `source` enum (presencial, hibrido, remote) adicionado na tabela ratings
- [x] Schema: tabela `qr_scans` criada (userId, establishmentId, scannedAt, lat, lng)
- [x] Schema: establishments já possuíam lat/lng — usado para validação de proximidade
- [x] Backend: endpoint qr.registerScan com geolocalização
- [x] Backend: classificação automática — presencial (≤8h), híbrido (8h-48h), remoto (sem QR)
- [x] Backend: geolocalização como complemento (valida proximidade ~200m)
- [x] Frontend: solicita permissão de geolocalização ao escanear QR (QRScanPage)
- [x] Frontend: indicador visual de source (presencial/híbrido/remoto) no header da avaliação

### 5.2 Selo Verificado + Regras de Influencer
- [x] Schema: campo `verified` boolean adicionado na tabela users
- [x] Backend: lógica de selo verificado (3 QR scans em 3 estabs diferentes) — critério oculto, checkAndGrantVerified()
- [x] Backend: bloquear avaliações remotas para influencers (só presencial/híbrido via QR)
- [x] Backend: influencer tem avaliações ilimitadas (PLAN_LIMITS override)
- [x] Frontend: ícone de verificado (BadgeCheck azul) ao lado do nome nas avaliações

### 5.3 Painel do Influencer
- [x] Frontend: página /painel-influencer com 4 abas (Visão Geral, Parcerias, Códigos, Meu Perfil)
- [x] Frontend: link "Painel Influencer" no menu lateral (visível apenas para role influencer)
- [x] Frontend: UI para gerenciar códigos promo na aba Códigos

### 5.4 Página Pública do Influencer + Follow
- [x] Schema: tabela `influencer_follows` criada (userId, influencerId, createdAt)
- [x] Backend: endpoints follow/unfollow/isFollowing/following/feed
- [x] Backend: endpoint para feed de avaliações dos influencers seguidos
- [x] Frontend: página /influencer/:id (perfil público, stats, avaliações recentes, botão seguir)
- [x] Frontend: endpoint influencerProfile.list para descoberta de influencers

### 5.5 Conta Business — Adaptação
- [x] Backend: business.proposePartnership (bidirecional — estab propõe a influencer)
- [x] Backend: business.availableInfluencers (lista influencers para proposta)
- [x] Frontend: formulário de propor parceria no Painel Empresarial (aba Parcerias)

### Testes
- [x] 14 testes vitest para Fase 5 (334 total passando)

## Fase 6 — Layouts de Perfil (Rede Social) + Role Suporte

### 6.1 Schema & Backend
- [x] Adicionar role 'support' ao enum de roles no schema (user, influencer, business, support, admin, owner)
- [x] Criar tabela support_assignments (supportUserId, establishmentId, assignedAt, assignedBy)
- [x] Criar tabela support_tickets (id, establishmentId, supportUserId, title, description, priority, status, createdAt, resolvedAt)
- [x] Backend: regras de visibilidade de roles (user vê user/influencer/business; influencer/business veem +support; support vê +admin; admin/owner veem todos)
- [x] Backend: endpoints de suporte (tickets.list, tickets.resolve, tickets.create, myAssignments)
- [x] Backend: admin.assignEstabsToSupport (vincular estabs à carteira do suporte)
- [x] Backend: admin.revokeEstabFromSupport (remover estab da carteira)
- [x] Backend: suporte só pode acessar/editar estabs da sua carteira (middleware de validação)

### 6.2 Frontend — Perfil Usuário (estilo rede social)
- [x] Página de perfil com layout Instagram: avatar+câmera, métricas (avaliações|avaliados) à direita, nome/nível/bio à direita do avatar
- [x] Abas: Avaliações (grid carrossel) | Rankings (troféu) | Títulos (coroa) | Salvos
- [x] Grid de avaliações: logo do estab como capa, nota amber, dots de carrossel, selo verificado azul para presenciais
- [x] Upload de fotos na avaliação (S3) + carrossel no card expandido
- [x] Menu inferior: Início | Destaques (megafone) | Grupos | Busca | Perfil (apenas ativo em amber)

### 6.3 Frontend — Perfil Influencer
- [x] Avatar com borda dourada + estrela 4 pontas (pontas cima/baixo maiores, saindo da borda)
- [x] 4 métricas: avaliações | seguidores | seguindo | parcerias
- [x] Badge "Influencer" dourado + nível
- [x] Painel de Parcerias exclusivo (ativas, pendentes, alcance)
- [x] Botões: "Seguir" (filled amber) + "Propor Parceria" (outline)
- [x] 5 abas: Avaliações | Destaques | Rankings | Parcerias | Títulos
- [x] Grid com selo verificado em TODAS + tag "PARCERIA" nas patrocinadas
- [x] Menu inferior com anel dourado no perfil

### 6.4 Frontend — Perfil Business
- [x] Header com dropdown de múltiplos estabelecimentos (seta para baixo)
- [x] Logo do estab + métricas (nota média, avaliações, visitantes)
- [x] Painel de Insights (esta semana, vs anterior, média)
- [x] Botões: Editar Cardápio | Novo Post | QR Code
- [x] 5 abas: Cardápio | Posts | Avaliações | Insights | Promos
- [x] Menu inferior: Início | Destaques | Meu Bar (orange) | Insights | Config
- [x] Dropdown: listar estabs vinculados + opção "Adicionar estabelecimento"

### 6.5 Frontend — Perfil Suporte
- [x] Avatar com borda teal + badge headset
- [x] Info: nome + "Suporte" + carteira de estabs + status online
- [x] 3 cards: Estabs vinculados | Tickets abertos | Resolvidos hoje
- [x] Lista de tickets abertos com prioridade (BAIXA/MÉDIA/ALTA)
- [x] Log de ações recentes
- [x] Menu inferior: Início | Tickets | Estabs (teal central) | Chat | Perfil
- [x] Só pode ver/editar estabs da sua carteira

### 6.6 Frontend — Perfil Admin
- [x] Avatar com borda vermelha + escudo
- [x] 4 cards stats: Usuários ativos | Estabelecimentos | Avaliações total | Pendentes
- [x] Seção Aprovações Pendentes (claims, influencers, promos) com Aprovar/Rejeitar
- [x] Ações Rápidas: Gerenciar Usuários, Moderar, Claims, Relatórios
- [x] Menu inferior: Início | Usuários | Admin (red) | Analytics | Config

### 6.7 Frontend — Perfil Owner
- [x] Avatar com coroa dourada + badge "Owner"
- [x] Visão Geral da Plataforma (usuários, estabs, avaliações, receita)
- [x] Saúde do Sistema (servidor, BD, testes)
- [x] Controles do Owner (6 cards: Roles, Admins, Config, Financeiro, Backup, Logs)
- [x] Atividade Recente
- [x] Menu inferior: Início | Analytics | Owner (gold) | Admin | Sistema

### 6.8 Testes
- [x] Testes vitest para role support (CRUD tickets, assignments, validação de carteira) — coberto em support.test.ts
- [x] Testes vitest para regras de visibilidade de roles (21 testes passando)
- [x] Testes vitest para dropdown de múltiplos estabs (business) — coberto em relevance-photos.test.ts

## Bugs Reportados
- [x] Fix: Páginas Destaques, Insights e Config retornando 404 (rotas do BottomNav business sem componentes)

## Fase 7 — Páginas Owner e Sistema
- [x] Backend: endpoint owner.stats (KPIs, receita, crescimento, roles)
- [x] Backend: endpoint owner.financials (receita por plano, MRR, churn)
- [x] Backend: endpoint owner.growth (novos usuários/mês, novos estabs/mês, conversão)
- [x] Backend: endpoint system.health (status servidor, BD, testes, integrações)
- [x] Backend: endpoint system.auditLog (ações críticas recentes)
- [x] Frontend: Página OwnerPanel com KPIs, Financeiro, Crescimento, Gestão de Roles, Parcerias
- [x] Frontend: Página SystemPanel com Status, BD, Testes, Logs, Audit Trail, Backup, Feature Flags
- [x] Rotas /owner e /owner/sistema no App.tsx
- [x] Testes vitest para endpoints owner e system — coberto em owner-system.test.ts + relevance-photos.test.ts
## Fase 7.1 — Página de Suite de Testes
- [x] JSON com 334 testes extraído da planilha e salvo em client/src/data/test-suite.json
- [x] Página TestSuitePage.tsx com lista completa dos 334 testes, filtros por módulo/arquivo, busca por nome/funcionalidade
- [x] Número 334 clicável no SystemPanel (aba Testes) com Link para /owner/sistema/testes
- [x] Rota /owner/sistema/testes registrada no App.tsx (antes de /owner/sistema para match correto)
## Fase 8 — Remover menu hambúrguer para user/influencer/business/support
- [x] Menu hambúrguer visível apenas para admin e owner
- [x] Redistribuir funcionalidades do menu lateral no BottomNav para user/influencer/business/support
- [x] Criar página hub "Conta" acessível pelo BottomNav (agrupa: Meus Dados, Planos, Tema, Fundo, Notificações, Insígnias, Logout)
- [x] BottomNav user: Início, Destaques, Busca, Avaliações, Conta
- [x] BottomNav influencer: Início, Destaques, Busca, Avaliações, Conta
- [x] BottomNav business: Início, Meu Bar, Insights, Alertas, Conta
- [x] BottomNav support: Início, Tickets, Estabs, Chat, Conta
- [x] Navbar sem botão hambúrguer para user/influencer/business/support
- [x] Funcionalidades de Grupos e Salvos acessíveis via página Conta ou sub-abas
- [x] Botão "Editar Perfil" na página Conta com campos de Minha Conta + Meu Usuário (Nome, Sobrenome, Username) — endpoint profile.update criado
- [x] Critérios de qualificação para avaliar: 18+, Nome e Sobrenome preenchidos, username definido — bloqueio na RatingPage
- [x] Padronizar nomes de roles no Painel Admin > Usuários: Owner, Admin, Support, Business, Influencer, User
## Fase 8.1 — Ajustes de menu e margens
- [x] Remover item "Admin" do menu hambúrguer (AppMenu) — já acessível pelo BottomNav
- [x] Corrigir padding-bottom em todas as páginas para não serem cortadas pelo BottomNav (pb-24 em todas)
- [x] Corrigir padding-top em todas as páginas para não serem cortadas pela Navbar (pt-28 já existente em todas)
## Fase 8.2 — Reorganização do Admin (supervisão do Support)
- [x] BottomNav admin: Início, Equipe, Influencers, Estabs, Config
- [x] Rotas /admin/equipe, /admin/influencers, /admin/estabs mapeadas para abas do AdminPanel

## Fase 9 — Calendário de Eventos (User)
- [x] Schema: tabela group_events (id, groupId, creatorId, establishmentId, title, description, eventDate, createdAt)
- [x] Schema: tabela event_rsvps (id, eventId, userId, status: confirmed/maybe/declined, respondedAt)
- [x] DB helpers: createEvent, getGroupEvents, getEventById, rsvpEvent, getEventRsvps
- [x] Endpoints tRPC: events.create, events.listByGroup, events.getById, events.rsvp, events.myEvents
- [x] Página CalendarioGrupo: calendário mensal + lista de eventos do grupo
- [x] Página EventoDetalhe: detalhes do evento + lista de presenças + botões RSVP
- [x] Rotas no App.tsx: /grupo/:id/calendario, /evento/:id
- [x] Notificação ao criar evento (membros do grupo) — badge com contagem de eventos no botão de calendário

## Fase 9.1 — Calendário Business + Fix Alertas
- [x] Corrigir ícone Alertas no BottomNav do business (leva para 404)
- [x] Adicionar aba Calendário no BusinessPanel (dentro de Meu Bar)
- [x] Endpoint para listar eventos agendados por estabelecimento (events.listByEstablishment)
- [x] Visão business: lista de eventos, contagem de confirmados/talvez/recusados, vagas

## Fase 9.2 — Navegação contextual nas setas de voltar
- [x] Corrigir setas de voltar: navegar para página pai do mesmo menu (não para /) em todas as páginas

## Fase 9.3 — Calendário para Influencer
- [x] Adicionar aba/seção Calendário no InfluencerPanel (eventos dos grupos do influencer)

## Fase 9.4 — Mover "Como Funciona" para pop-up de finalização de cadastro
- [x] Remover seção "Como Funciona" da Home
- [x] Criar pop-up "Como Funciona" exibido ao finalizar cadastro da conta (HowItWorksDialog)

## Fase 9.5 — Captação de localização permanente na criação da conta
- [x] Solicitar permissão de localização durante o onboarding e salvar no perfil do usuário

## Fase 9.6 — Scanner de QR code dentro do app (câmera via browser)
- [x] Instalar biblioteca html5-qrcode para leitura de QR via câmera
- [x] Criar página /scan com scanner de câmera e lazy loading
- [x] Integrar botão Scan no BottomNav (user e influencer)
- [x] Manter fluxo atual da câmera nativa (/e/:slug) funcionando

## Fase 10 — Integração Connect Yarin
- [x] Campo Connect Yarin automático no perfil (URL gerada: yarinconn-4cnl6xuq.manus.space/{username})
- [x] Exibir link Connect Yarin no perfil público (user/business/influencer)
- [x] Atualizar URL automaticamente quando username muda (usa getConnectYarinUrl(username) — constante em shared/const.ts)
- [ ] Preparar estrutura para consumir API do Connect Yarin (aguardando token + endpoints)

## Fase 10.1 — Aba Integrações (Owner/Admin)
- [x] Criar tabela integrations no banco (key/value para tokens e configs)
- [x] Criar endpoints tRPC para salvar/ler integrações (adminProcedure)
- [x] Criar aba "Integrações" no AdminPanel com campo para token Connect Yarin
- [x] Adicionar campo para GTM ID (Google Tag Manager) na aba Integrações
- [x] Injetar script do GTM no frontend quando o ID estiver configurado
- [x] Estrutura extensível para futuros tokens/integrações

## Fase 11 — Role Crítico Gastronômico
- [x] Adicionar role "critic" ao enum de roles no schema
- [x] Criar tabela critic_profiles (veículo, bio, especialidade, verificado)
- [x] Criar endpoints tRPC para aplicação/aprovação de crítico (admin aprova)
- [x] Criar painel do Crítico no frontend (similar ao Influencer, com campo de veículo/blog)
- [x] Adaptar selo de insígnia de estabelecimento: "Selo Crítico" (crítico avaliou com nota ≥ 8.0)
- [x] Exibir badge "Crítico Gastronômico" no perfil público e nas avaliações

## Fase 11.1 — Ajustes Painel Crítico (layout + peso avaliações)
- [x] Refatorar CriticPanel para layout idêntico ao InfluencerPanel (abas: Visão Geral, Calendário, Avaliações, Códigos, Perfil)
- [x] Estrela azul safira brilhante ao lado da foto do crítico (drop-shadow glow)
- [x] CriticProfile refatorado com layout idêntico ao InfluencerProfile (tabs, grid, métricas)
- [x] Avaliações de críticos com nota ≥ 9 aparecem primeiro na lista do estabelecimento (ORDER BY CASE)
- [x] Corrigido threshold do Selo Crítico de 80 para 8 (escala 0-10)

## Fase 11.2 — Sub-aba Avaliações no Estabelecimento
- [x] Criar sub-aba "Avaliações" na EstablishmentPage com cards visuais (toggle Cardápio/Avaliações)
- [x] Cada card mostra: nome do avaliador, nota, data, itens avaliados, comentário
- [x] Itens do cardápio clicáveis levam para a aba Avaliações com filtro por item (filterItemName)
- [x] Cards de avaliações de críticos exibem estrela azul safira brilhante (glow + badge CRÍTICO)

## Fase 12 — Sistema de Chat e Compartilhamento

### 12.1 — Chat em Grupos
- [x] Criar tabela group_messages no banco (senderId, groupId, content max 140 chars, type, referenceId, referenceSlug)
- [x] Criar endpoints tRPC para enviar/listar mensagens do grupo (sendMessage + messages)
- [x] Criar componente GroupChat no frontend (colapsável dentro da página do grupo)
- [x] Limite de 140 caracteres por mensagem (texto simples)
- [x] Roles permitidos: user, influencer, critic (membros do grupo)

### 12.2 — Chat Support 1:1
- [x] Criar tabela support_messages no banco (senderId, recipientId, content, createdAt, isRead)
- [x] Criar endpoints tRPC para support enviar/receber mensagens 1:1 (sendSupportMessage, supportMessages, supportConversations, markRead)
- [x] Frontend: aba Chat no SupportProfile (lista de conversas + thread)
- [x] Frontend: UserSupportChat para usuários verem mensagens do support

### 12.3 — Lista de Transmissão Business
- [x] Botão "Salvar" já existe (SaveBookmarkButton) — ao salvar, user entra no canal automaticamente
- [x] toggleSave atualizado para follow/unfollow business_followers automaticamente
- [x] Criar tabela business_broadcasts (establishmentId, content max 280 chars, createdAt)
- [x] Criar tabela business_followers (establishmentId, userId) — quem salvou
- [x] Endpoints: business.sendBroadcast + business.broadcasts + posts.broadcastFeed
- [x] Frontend: aba Transmissões no BusinessPanel (enviar + histórico)
- [x] Frontend: seção "NOVIDADES" na página Meus Locais (feed de broadcasts)

### 12.4 — Compartilhar para Grupos + Web Share API
- [x] Componente ShareToGroup reutilizável (dropdown com grupos + web share)
- [x] Botão "Compartilhar" em avaliações (cards no ReviewsSection)
- [x] Botão "Compartilhar" em estabelecimentos (EstablishmentPage header)
- [x] Botão "Compartilhar perfil" no PublicProfilePage
- [x] Mensagem especial no GroupChat (card clicável com ícone por tipo)
- [x] Web Share API como opção "Compartilhar externamente" (fallback: copiar link)

### 12.5 — Seguir Users + Chat 1:1 Mútuo
- [x] Criar tabelas user_follows e direct_messages no banco
- [x] Endpoints tRPC: follow, unfollow, isFollowing, isMutual, followers, following, mutualFollowers
- [x] Botão "Seguir" no PublicProfilePage (toggle seguir/deixar de seguir + contagem seguidores/seguindo)
- [x] Chat 1:1 entre users que se seguem mutuamente (botão DM só aparece se mútuo)
- [x] Página MensagensPage (/mensagens) com lista de conversas + thread
- [x] Link "Mensagens Diretas" no AppMenu (seção Grupos)
- [x] Remover limites de grupo para plano gratuito (maxGroups: null)
- [x] Remover checagem de limite de 3 grupos no db-groups.ts

### 13 — Ajustes Aba "Meu Bar" no BusinessPanel
- [x] Tornar bares clicáveis (link para página do estabelecimento via slug)
- [x] Remover botão de editar do lado DIREITO dos cards de bar
- [x] Campos nome, endereço, telefone e @ read-only com aviso para solicitar alteração ao suporte
- [x] Botão "Solicitar alteração ao suporte" abre chat inline com suporte (histórico + input)
- [x] Renomear BottomNav de "Meu Bar" para "Meus Locais"
- [x] Renomear aba e título de "Meus Estabelecimentos" para "Meus Locais"
- [x] Renomear estab "Bar Teste Avalyarin" (ID 90003) para "Conta Teste Pinheiros"
- [x] Suporte (Rosangela, rossegon@gmail.com) já recebe mensagens do Alan automaticamente

### 14 — Feed de Fotos (Galeria, Curtir, Compartilhar)
- [x] Schema: tabela photo_likes (userId, photoId, createdAt)
- [x] Schema: tabela photo_shares (userId, photoId, groupId, comment, createdAt)
- [x] Endpoints tRPC: toggleLike, likesBatch, shareToGroup, myGallery, userGallery
- [x] Componente PhotoGrid (grid 4:5 no perfil)
- [x] Componente PhotoExpanded (expansão 9:16 com comentário, curtir, compartilhar)
- [x] Componente SharePhotoModal (bottom sheet para compartilhar para grupos)
- [x] Integrar galeria funcional na aba Galeria de MinhasAvaliacoes
- [x] Integrar curtir + compartilhar + expandir na página do estabelecimento (AvalyarinReviews)
- [x] Integrar no PublicProfilePage (perfil público do user/influencer/critic)

### 15 — Ajustes Galeria + Logo + Bug "O" isolado
- [x] Investigar e remover "O" isolado nos estabs do Alan (era reviewCount===0 renderizado como texto JSX)
- [x] Logo 1:1 na página do estab: imagem quadrada ao lado esquerdo do nome/endereço/horário/telefone
- [x] Galeria: quando avaliação não tem foto, mostrar logo do estabelecimento no grid
- [x] Campo `logo` adicionado ao schema de establishments
- [x] Endpoints /api/upload-logo (500x500 1:1 WebP) e /api/upload-cover (1200x800 WebP)
- [x] Upload de logo e capa no painel business (Meus Locais)
- [x] Campos image e logo aceitos nos endpoints updateEstablishment (admin + business)

### 16 — Sistema de Detecção de Duplicidade de Estabelecimentos
- [x] Schema: tabela duplicate_alerts (existingEstablishmentId, newEstablishmentId, reason, status, flaggedBy, reviewedBy, notes, createdAt, reviewedAt)
- [x] Detecção automática: ao cadastrar estab, verificar mesmo endereço + mesmo telefone no banco (detectDuplicates helper)
- [x] Endpoint tRPC: listar alertas de duplicidade pendentes (admin.duplicateAlerts)
- [x] Endpoint tRPC: resolver alerta (admin.reviewDuplicate — aprova/rejeita, desativa antigo se aprovado)
- [x] Endpoint tRPC: support pode sinalizar duplicidade manualmente (support.flagDuplicate)
- [x] Endpoint tRPC: support pode detectar duplicatas (support.detectDuplicates)
- [x] UI Admin: aba "Duplicidade" no AdminPanel com lista de conflitos e botões aprovar/rejeitar
- [x] UI Support: aba "Duplicidade" no SupportProfile com detecção e sinalização de duplicatas
- [x] Regra: mesmo endereço + mesmo telefone + nome diferente = forte indício de substituição
- [x] Regra: complemento obrigatório para estabs em shoppings/galerias/food halls (validação no createEstablishment com regex MULTI_TENANT_KEYWORDS)
- [x] Testes vitest para galeria, duplicidade e validação de complemento (14 testes)

### Parceria Business-to-Business + Fluxo Support + Correção Destaques
- [x] Schema: adicionar campo partnerEstablishmentId e partnershipType (influencer/business) na tabela partnerships
- [x] Schema: adicionar status pending_support ao enum de partnerships
- [x] Endpoints: business pode propor parceria a outro business (B2B)
- [x] Endpoints: support aprova/rejeita parcerias (em vez de admin)
- [x] UI BusinessPanel: dropdown tipo parceria (Business/Influencer) antes do formulário
- [x] UI BusinessPanel: formulário condicional — se Influencer mostra lista de influencers, se Business mostra lista de estabelecimentos
- [x] UI BusinessPanel: mensagem "A revisão dos pedidos pode demorar até 24 horas." no status pending_support
- [x] Correção destaques: implementar heartbeat/cron para expireOldPosts() automático (a cada hora)
- [x] Correção destaques: UI de criação de posts no BusinessPanel (aba Destaques com formulário completo)
- [x] Correção destaques: aplicar durações corretas por tipo ao criar post via UI

- [x] Fix: listagem de parceiros B2B limitada a 50 — implementar busca com filtro e remover limite fixo

## Fase 18 — Aba de Eventos nos Estabelecimentos

- [x] Schema: criar tabela events (establishmentId, coverImage, startDate, endDate, description, entryType, location, eventType)
- [x] Schema: criar tabela event_batches (eventId, batchNumber, batchName, price)
- [x] Endpoints tRPC: business.createEvent, business.listEvents, business.cancelEvent
- [x] Endpoints tRPC: establishments.activeEvents (com filtro de expiração automática)
- [x] UI BusinessPanel: formulário de criação de evento com todos os campos obrigatórios
- [x] UI BusinessPanel: foto de capa (upload S3)
- [x] UI BusinessPanel: horário início/fim do evento
- [x] UI BusinessPanel: descrição 200-550 caracteres
- [x] UI BusinessPanel: local (padrão = estab, ou endereço customizado com validação de logradouro)
- [x] UI BusinessPanel: entrada paga/gratuita com lotes (até 10) e valor na porta
- [x] UI BusinessPanel: tipo de atração (Esporte, Show, Festa, etc. — 16 opções)
- [x] UI Estabelecimento: nova aba "Eventos" com cards de eventos ativos
- [x] UI Estabelecimento: cards expiram automaticamente após endDate + badge AO VIVO + filtro por tipo
- [x] Testes: cobrir criação e listagem de eventos (22 testes passando)

## Fase 18.1 — Melhorias no Sistema de Eventos

- [x] Campo hiperlink de compra de ingresso no evento (todos os business; insights de cliques = plano pago)
- [x] Data de virada automática por lote (cada lote tem data limite, próximo lote ativa automaticamente)
- [x] Schema: adicionar campo ticketUrl ao establishment_events
- [x] Schema: adicionar campo expiresAt ao event_batches
- [x] UI BusinessPanel: campo de link de ingresso (disponível para todos os business)
- [x] UI BusinessPanel: date picker por lote para virada automática
- [x] UI EstablishmentPage: botão "Comprar Ingresso" no card do evento (se ticketUrl preenchido)
- [x] UI EstablishmentPage: exibir lote ativo atual baseado na data de virada

## Fase 19 — Botão de Edição (Owner) na Página do Estabelecimento
- [x] Endpoint tRPC: owner.updateEstablishment (editar nome, endereço, bairro, horário, telefone, instagram, categoria, descrição, logo, foto de capa)
- [x] UI EstablishmentPage: botão lápis visível apenas para role owner
- [x] UI EstablishmentPage: modal de edição com todos os campos + upload de logo e foto de capa
- [x] Upload de logo e foto de capa via S3 (storagePut)

## Fase 20 — Aba Survey no Painel Owner (Gerenciamento de Perguntas)
- [x] Criar tabela survey_questions no banco de dados para perguntas editáveis
- [x] Criar backend CRUD (list/create/update/delete/reorder) para survey_questions (ownerProcedure)
- [x] Criar página OwnerSurvey.tsx com interface para visualizar e editar perguntas
- [x] Adicionar aba "Survey" no BottomNav do Owner (role-visibility.ts)
- [x] Registrar rota /owner/survey no App.tsx

## Fase 21 — Tela de Login/Cadastro para Usuários Deslogados
- [x] Criar tela única para usuários deslogados com botões "Cadastre-se" e "Entre"
- [x] Exibir essa tela quando o usuário não estiver autenticado (em vez da tela vazia)

## Fase 22 — Drag-and-Drop de Opções e Perguntas Condicionais no Survey
- [x] Adicionar colunas parent_question_id e trigger_option na tabela survey_questions
- [x] Atualizar backend para suportar perguntas condicionais (criar/editar com parent + trigger)
- [x] Implementar drag-and-drop para reordenar opções dentro de cada pergunta
- [x] Implementar UI para criar/gerenciar perguntas condicionais (sub-perguntas por resposta)

## Fase 23 — Fix BottomNav: Tela deslogado e flash de role
- [x] BottomNav deslogado: mostrar apenas "Conta" (sem Busca, Scan, Grupos, Avaliações)
- [x] Fix flash de botões errados: esconder BottomNav enquanto auth.me está carregando para evitar flash de role incorreto

## Fase 24 — Mudar frase do app
- [x] Alterar "Sistema de Avaliação Dinâmico para Bares e Restaurantes — Pinheiros & Vila Madalena, SP" para "Rede Social de Avaliações de São Paulo"

## Fase 25 — Migração de IDs (nova estrutura de faixas)
- [x] Backup completo do banco antes da migração
- [x] Migrar IDs de users conforme faixas: owners 1-29, admins 30-99, support 1000-99999, business 1M-29.9M, users+inf+crit 60M+
- [x] Migrar IDs de establishments para faixa 30M-59.9M
- [x] Atualizar todas as foreign keys em todas as tabelas referenciando users e establishments
- [x] Verificar integridade do banco após migração

## Fase 26 — Perfil: renomear Conta → Perfil e redesenhar como grid de fotos
- [x] Renomear botão "Conta" para "Perfil" no BottomNav para roles user, influencer e critic
- [x] Redesenhar a página de Perfil como coleção de fotos das avaliações (grid estilo Instagram/mockup)
- [x] Manter funcionalidades de conta (editar perfil, tema, logout) acessíveis via ícone de configurações (link para /conta)

## Fase 27 — Navegação: logo não clicável + setas de voltar com history.back()
- [x] Remover link clicável do logo "Y Avalyarin" no Navbar
- [x] Substituir todas as setas de voltar por window.history.back() em todas as páginas/roles

## Fase 28 — Remover Grupos da ContaPage + Bug Lista de Salvos
- [x] Remover item "Grupos" da ContaPage para roles user, influencer e critic (já está no BottomNav)
- [x] Corrigir bug: Lista de Salvos não mostrava bares salvos (causa: query SQL referenciava colunas inexistentes e.googleRating e e.googleRatingsTotal — corrigido para e.rating e e.reviewCount)

## Fase 29 — Reestruturar painel Business (BottomNav + abas)
- [x] Renomear "Alertas" para "Divulgação" no BottomNav do Business
- [x] Separar rotas: /business/locais, /business/insights, /business/divulgacoes
- [x] Meus Locais (7 abas): Meus Locais, Solicitações, Cardápio, Notificações, QR Code, Meu Plano, Destaques
- [x] Mover notificações de pendências (fotos faltantes) para aba Cardápio com itens em vermelho + ícone lápis
- [x] Insights (3 abas): Meu Plano, Insights, Calendário de Eventos
- [x] Divulgações (4 abas): Códigos Promocionais, Parcerias, Lista de Transmissão, Eventos do Estab
- [x] Adicionar aba Chat em Meus Locais (conversa por estab com support, usando establishmentId como thread key)

## Fase 30 — Setas de navegação nas abas
- [x] Implementar setas esquerda/direita nas abas quando não couberem na tela (BusinessLocais, BusinessInsights, BusinessDivulgacoes)

## Fase 31 — Bug: chat do support não separa conversas por estab
- [x] Corrigir: mensagens de diferentes estabs aparecem juntas no chat do support (reescrito SupportChat para listar conversas por establishmentId)

## Fase 32 — Reorganizar abas Business e corrigir funcionalidades
- [x] Reordenar abas Meus Locais: Meus Locais - Cardápio - Chat - Solicitações - Meu Plano
- [x] Remover aba QR Code e Notificações das tabs (QR vai para card, Notificação vira sub-aba de Cardápio)
- [x] Mover aba Destaques para Divulgação
- [x] Tornar lápis clicável no Cardápio para expandir edição do item (EditItemForm inline)
- [x] Notificação como sub-aba dentro de Cardápio com contagem exata de erros por item (não por conta)
- [x] QR Code como botão em cada card de estab em Meus Locais (popup com info)

## Fase 33 — Survey dinâmica (refletir alterações do Owner imediatamente)
- [x] Investigar por que alterações na survey (ex: gasto médio) não refletem para novos usuários
- [x] Fazer perguntas da survey serem carregadas dinamicamente do banco (não hardcoded no frontend)
- [x] OnboardingSurvey refatorado: carrega perguntas via trpc.survey.questions (phase=onboarding)
- [x] ExplorerSurvey refatorado: carrega perguntas via trpc.survey.questions (phase=explorer)
- [x] ConnoisseurSurvey refatorado: carrega perguntas via trpc.survey.questions (phase=connoisseur)
- [x] Endpoint público survey.questions criado (publicProcedure, filtra por phase e active=true)

## Fase 34 — Perguntas condicionais na survey
- [x] Dropdown no OwnerSurvey para selecionar pergunta pai (parentQuestionId) ao criar/editar pergunta
- [x] Dropdown de opção trigger (triggerOption) populado com as opções da pergunta pai selecionada
- [x] Frontend: consumir perguntas condicionais nos surveys (mostrar sub-pergunta quando resposta da pai = triggerOption)

## Fase 35 — Tipo de pergunta "Estabelecimento" na survey + Dropdown de ícones
- [x] Adicionar tipo 'establishment' no enum de tipos de pergunta (schema + OwnerSurvey)
- [x] Criar endpoint público para listar todos os estabelecimentos (para uso na survey)
- [x] Renderizar tipo 'establishment' no frontend dos surveys (lista com busca/filtro)
- [x] Vincular resposta do tipo establishment à criação de solicitação business no onComplete do onboarding
- [x] Substituir campo de texto livre de ícone por dropdown com busca (Lucide icons + emojis)

## Fase 36 — Botão Avaliar acessível sem login
- [x] Bypass de Auth Choice e Survey para rotas públicas (/e/, /estabelecimento/, /avaliar/)
- [x] Botão AVALIAR VISITA na QRScanPage (rota /e/:slug) usando slug correto
- [x] Botão fixo AVALIAR ESTE ESTABELECIMENTO na EstablishmentPage sem exigir menu cadastrado
- [x] Age Gate mantido para todas as rotas (exigência legal sobre bebidas alcoólicas)

## Fase 37 — Bugs: Botão Avaliar + Crash RatingPage
- [x] Fix: Botão fixo AVALIAR não aparece na EstablishmentPage quando logado (bottom-16 para ficar acima do BottomNav)
- [x] Fix: Erro de crash na RatingPage ao clicar avaliar após QR scan (hooks condicionais movidos antes dos early returns)

## Fase 38 — Busca Inteligente com LLM
- [x] Investigar dados disponíveis (estabs, cardápios, características) para alimentar a busca
- [x] Criar endpoint backend de busca inteligente com LLM (interpreta linguagem natural + busca no banco)
- [x] Implementar UI de busca: barra expande com até 5 sugestões (prioridade: nome estab > nome item > descrição item), última opção "Todos os resultados"
- [x] Integrar LLM para interpretar queries ambíguas (ex: "rolê com cadeiras de praia", "chopp brahma perto de mim")
- [x] SearchBar.tsx: usa smartSearch para queries de linguagem natural (3+ palavras ou preposições PT-BR)
- [x] SearchResults.tsx: mostra badge "IA" + texto de interpretação quando smartSearch é usado
- [x] 0 erros TypeScript, 435 testes passando

## Fase 39 — Campo "O que faltou para o 10?" (notas 7-9)
- [x] Adicionar coluna `what_missed_for_ten` (TEXT) + `low_score_reasons` (JSON) na tabela rating_items
- [x] Atualizar backend: salvar campos no endpoint de avaliação (ratings.save)
- [x] Frontend: exibir caixa de texto "O que faltou para o 10?" quando nota é 7-9
- [x] Manter sistema atual de motivos pré-definidos para notas 1-6
- [x] Nota 10: nenhum campo adicional (satisfação plena)
- [ ] LLM processa respostas para extrair padrões e alimentar Insights/Ações (futuro)
- [x] Verificar TypeScript (0 erros), rodar testes (435 passando) e salvar checkpoint

## Fase 40 — Nova Estrutura de Insights Business (5 sub-abas + 20 insights + Ações IA)
- [x] Reestruturar BusinessInsights.tsx: 5 sub-abas (Plano, Painel, Insights, Ações, Calendário)
- [x] Backend: endpoint healthScore (nota média 40% + taxa retorno 20% + tendência 20% + sentimento 20%)
- [x] Backend: endpoint insightsByTier (20 insights calculados com dados reais do banco)
- [x] Backend: endpoint businessActions (ações geradas por LLM com base nos dados + "faltou para o 10")
- [x] Frontend: sub-aba Painel (Health Score, 3 alertas prioritários, sparkline tendência, próxima ação)
- [x] Frontend: sub-aba Insights (20 cards por Tier, blur para Free, desbloqueado para Pro)
- [x] Frontend: sub-aba Ações (cards com prioridade, impacto, passo a passo, botão concluir)
- [x] Lógica de blur/paywall baseada no campo businessPlan do usuário
- [x] Verificar TypeScript (0 erros), rodar testes (435 passando) e salvar checkpoint

## Bugfix — Ajustes reportados (01/07/2026)
- [x] 1.1: Erro ao gerar imagem no botão "Compartilhar" — reescrito com Canvas API nativa (sem html2canvas)
- [x] 1.2: Botões das abas em Avaliações — adicionado shrink-0 + scroll horizontal com padding adequado
- [x] 1.3: Remover setas "Voltar" da página Avaliações — substituído por ícone Star
- [x] 1.4: Galeria do Perfil — agora mostra todas as avaliações (com ou sem foto) como cards visuais

## Fase 41 — Reestruturação Insights Business (3 abas: Dashboard, Desempenho, Plano de Ação)
- [x] Reestruturar BusinessInsights.tsx: 3 abas (Dashboard, Desempenho, Plano de Ação)
- [x] Backend: endpoint dashboardData (pizza idade, barra itens vendidos, pizza regiões, barra horários, linha temporal com outliers)
- [x] Backend: endpoint desempenho por tema (Público, Produto, Experiência, Competição, Marketing)
- [x] Frontend: Dashboard com dropdown período (7/14/21/30/60/180/365d) + 5 gráficos
- [x] Frontend: Gráfico linha temporal com detecção de outliers (2x desvio padrão abaixo da média)
- [x] Frontend: Desempenho com 5 temas contendo os 20 insights (sem nomenclatura Tier)
- [x] Frontend: Plano de Ação com sugestões IA + outliers detectados + "faltou para o 10"
- [x] Blur/paywall para plano Free (R$97/mês para desbloquear)
- [x] Verificar TypeScript (0 erros), rodar testes (435 passando) e salvar checkpoint

## Ajustes Insights Business — Dropdown + Abas + Props (01/07/2026)
- [x] Mover dropdown de estabelecimento para ACIMA das abas (compartilhado entre todas)
- [x] Reordenar abas: "Meu Plano" como PRIMEIRA aba (da esquerda para direita)
- [x] Refatorar BusinessDashboardTab para aceitar prop establishmentId (remover seletor local)
- [x] Refatorar BusinessDesempenhoTab para aceitar prop establishmentId (remover seletor local)
- [x] Refatorar BusinessPlanoAcaoTab para aceitar prop establishmentId (remover seletor local)
- [x] Refatorar BusinessPlanTab para aceitar prop establishmentId (remover seletor local)
- [x] Atualizar preço do plano Premium para R$97/mês em BusinessPlanTab
- [x] Atualizar features do Premium: Dashboard completo, 20 insights, Plano de Ação com IA, Detecção de outliers
- [x] Verificar TypeScript (0 erros), rodar testes (435 passando) e salvar checkpoint

## Ajuste Gráfico Linha Temporal — Eixos X e Y (01/07/2026)
- [x] Eixo Y: mostrar linhas de grade com valores pares (2, 4, 6, 8, 10)
- [x] Eixo X: máximo 15 labels de dias no período (regras por período)
- [x] 7 dias: dd/mm para cada dia (7 labels)
- [x] 14 dias: dd/mm para cada dia (14 labels)
- [x] 21 dias: dd/mm pulando alguns dias (15 labels)
- [x] 30 dias: dd/mm pulando a cada 2 dias (15 labels), até 30 pontos no gráfico
- [x] 60 dias: dd/mm pulando a cada 4 dias (15 labels)
- [x] 180 dias: dd/mm com intervalos de 8-9 dias (15 labels)
- [x] 365 dias: eixo X em meses (Jan, Fev, Mar...)
- [x] Verificar TypeScript (0 erros), rodar testes e salvar checkpoint

## Ajuste — Upload de foto por item na avaliação (01/07/2026)
- [x] Mover upload de foto do final da avaliação para dentro de cada item avaliado
- [x] Cada item deve ter seu próprio botão de câmera/galeria para anexar foto
- [x] Manter compatibilidade com o backend (salvar foto vinculada ao rating_item)
- [x] Verificar TypeScript (0 erros), rodar testes e salvar checkpoint

## Correções — Analítico "faltou para o 10" + Backup download (01/07/2026)
- [x] Modo Analítico: adicionar campo "O que faltou para o 10?" nos subcritérios quando nota 7-9
- [x] Admin > Código > Backup: corrigir download para baixar arquivo automaticamente (não abrir nova aba)
- [x] Verificar TypeScript (0 erros), rodar testes e salvar checkpoint

## Melhorias — Validação analítica + Resumo da Conta (01/07/2026)
- [x] Analítico: scroll automático para campo não preenchido quando validação falha
- [x] Resumo da Conta: trocar "Sem" por "Não Cobrado" na taxa de serviço
- [x] Resumo da Conta: adicionar checkbox "Cobrado Separadamente" em Couvert, Valet e Estacionamento
- [x] Resumo da Conta: redesenhar Total como notinha com itens, preços e taxa de serviço
- [x] Resumo da Conta: adicionar checkbox "Valor divergente" abaixo do total com campo de valor correto e foto da nota
- [x] Verificar TypeScript (0 erros), rodar testes e salvar checkpoint

## Melhorias — Avaliação Analítica + BottomNav Owner (01/07/2026)
- [x] Analítico: incluir subcritérios de Apresentação adaptados para bebidas
- [x] Analítico: scroll automático ao topo ao mudar para Critérios Gerais
- [x] Qualificar: mover comentário para inline (dentro de cada item) + estilo @avalyarin no resumo
- [x] Owner: BottomNav expandido com roles (Busca, User, Critic, Influencer, Business, Support, Admin, Owner)
- [x] Owner: Sub-menu acima do BottomNav que muda conforme a role selecionada
- [x] Verificar TypeScript (0 erros), rodar testes e salvar checkpoint

## Ajuste — Comentário abaixo da foto + placeholder dinâmico (01/07/2026)
- [x] Mover campo "Comentário sobre o item" para logo abaixo da foto (antes da nota de sabor)
- [x] Placeholder dinâmico: "Ex: Melhor {{item}} de {{bairro}}!" com nome real do item e bairro
- [x] Aplicar tanto no modo Direto quanto no Analítico
- [x] Verificar TypeScript (0 erros), rodar testes e salvar checkpoint

## Melhoria — Intervalo personalizado no Insights (01/07/2026)
- [x] Adicionar botão "Intervalo" ao lado do dropdown de dias no Insights Business
- [x] Ao clicar em Intervalo, abrir mini calendário com data de início e data de fim
- [x] Usar o intervalo personalizado para filtrar dados do dashboard e desempenho
- [x] Verificar TypeScript (0 erros), rodar testes e salvar checkpoint

## Ajuste — Consistência só aparece com avaliação anterior (01/07/2026)
- [x] Subcritério "Consistência" só deve aparecer se o usuário já avaliou o estabelecimento antes
- [x] Verificar se existe query de histórico do usuário no estab ou criar uma
- [x] Filtrar Consistência nos critérios globais (analítico) e no modo direto se aplicável
- [x] Verificar TypeScript (0 erros), rodar testes e salvar checkpoint

## Ajuste — Linha Temporal mostra todos os dias do intervalo (01/07/2026)
- [x] Gráfico deve mostrar todos os dias do intervalo no eixo X (mesmo sem avaliações)
- [x] Fim do intervalo à esquerda (mais recente à esquerda, mais antigo à direita) — CORREÇÃO: mais recente à direita
- [x] Intervalo de 1 dia: ponto centralizado
- [x] Verificar TypeScript (0 erros), rodar testes e salvar checkpoint

## Correções — Data da visita e scroll entre itens (01/07/2026)
- [x] Exibir data da visita declarada (visitDate) ao invés de createdAt nas avaliações
- [x] Scroll ao topo ao avançar de um item para o próximo durante a avaliação
- [x] Verificar TypeScript (0 erros), rodar testes e salvar checkpoint

## Correções — Galeria carrossel + comentário obrigatório (01/07/2026)
- [x] Galeria do Perfil: agrupar fotos da mesma avaliação como carrossel com setas
- [x] Galeria expandida: exibir comentário do item junto à foto
- [x] Comentário do item obrigatório durante a avaliação (não pode avançar sem preencher)
- [x] Verificar TypeScript (0 erros), rodar testes e salvar checkpoint

## Correções — Performance imagens, galeria agrupada, resumo avaliações (01/07/2026)
- [x] Investigar e corrigir performance de carregamento de imagens no perfil (lazy loading + decoding async já implementados; gargalo é inerente ao redirect 307 das presigned URLs)
- [x] Galeria do perfil: corrigir agrupamento por visita (fotos da mesma avaliação juntas)
- [x] Aba Avaliações: ao clicar, mostrar resumo com notas por bloco (não redirecionar ao estab)
- [x] Apenas o nome do estab deve ser clicável (leva ao local)
- [x] Verificar TypeScript (0 erros), rodar testes e salvar checkpoint

## Prevenção de Avaliação Duplicada (mesmo estab + mesma data)
- [x] Backend: validar no saveRating se já existe avaliação do mesmo usuário + mesmo estab + mesma visitDate
- [x] Frontend: exibir aviso ao usuário quando tentar avaliar estab que já foi avaliado na mesma data
- [x] Testes vitest para validação de duplicata (8 testes passando)
- [x] Verificar TypeScript (0 erros), rodar testes (443 passando) e salvar checkpoint

## Roleta de Horário na Data da Visita
- [x] Criar componente TimeRoulette (roleta estilo survey: horas 0-23 à esquerda, minutos 0-55 de 5 em 5 à direita)
- [x] Integrar TimeRoulette na tela de seleção de data da visita (RatingPage)
- [x] Combinar hora/minuto selecionados com a data da visita no visitDate enviado ao backend
- [x] Verificar TypeScript (0 erros), rodar testes (443 passando) e salvar checkpoint

## Promoção de Usuário + Aba Mapa (02/07/2026)
- [x] Promover alan_1927@hotmail.com para role=owner no banco
- [x] Criar endpoint tRPC para listar estabelecimentos com coordenadas (lat/lng)
- [x] Criar página MapaPage com Google Maps mostrando todos os estabelecimentos como markers
- [x] Integrar aba Mapa na navegação bottom (ícone de mapa)
- [x] Verificar TypeScript (0 erros), rodar testes (443 passando) e salvar checkpoint

## Correções BottomNav + Remover Menu Lateral + Margem Owner (02/07/2026)
- [x] Restaurar Grupos na BottomNav (user/influencer) e manter Mapa como aba adicional
- [x] Remover menu lateral (AppMenu) de todas as páginas — sem menus laterais
- [x] Ajustar margem inferior do botão "Avaliar" para owners (duplo menu inferior é maior) — bottom-[8.5rem]
- [x] Verificar TypeScript (0 erros), rodar testes (443 passando) e salvar checkpoint

## Pendências Futuras (aguardando)
- [ ] Testes da aba Mapa (validar exibição por role, dados dos markers, comportamento com/sem coordenadas)
- [ ] Adicionar mapa de navegação de páginas ao Manual Técnico Operacional (aguardando envio do arquivo)

## Reestruturação BottomNav Admin (03/07/2026)
- [x] BottomNav Admin: 5 ícones — Busca, Equipe, Negócio, Permissões, Config
- [x] Equipe: 5 abas (User, Critic, Influencer, Business, Support) — lista pessoas por role
- [x] Negócio: 4 abas (Dashboard, Estabelecimentos, Promoções, Planos)
- [x] Permissões: 3 abas (Solicitações, Verificação, Insights)
- [x] Config: 1 aba (Integrações)
- [x] Código e Brandbook devem existir somente para Owner (não Admin) — movidos para OwnerPanel
- [x] Verificar TypeScript (0 erros), rodar testes (443 passando) e salvar checkpoint

## Planilha Morumbi Shopping + Cadastro de Estabelecimentos
- [x] Pesquisar dados dos 42 estabs (endereço, complemento, site, telefone, horário)
- [x] Verificar Instagram de cada estab para cardápio atualizado
- [x] Montar planilha consolidada (Nome, Endereço, Complemento, Site, Telefone, Horário, Instagram, Cardápio, Categoria)
- [x] Adicionar ao app os 30 estabs com todas as informações completas (inseridos no banco)

## Dividir categoria Restaurante em Churrascaria + Casual Dining (03/07/2026)
- [x] Criar novas categorias Casa de Carnes (70003) e Casual Dining (70004) no banco
- [x] Redistribuir: Casa de Carnes (Barbacoa, Brasa Charrua, Corrientes, Esplanada, Fogo de Chão, Pobre Juan), Casual Dining (Coco Bambu, Outback, TGI Fridays), Daje Roma → Cozinha Internacional
- [x] Desativar categoria Restaurante (60002) — 0 estabs restantes
- [x] Atualizar frontend (Home, AllCategoriesPage, CategoryGroupPage) para exibir casa-de-carnes e casual-dining no grupo Gastronomia

## Renomear categorias + Sistema de Selos (03/07/2026)
- [x] Renomear Saudável (ID 15) para Natural no banco
- [x] Renomear Vegan (ID 70001) para Veg + Vegan no banco
- [x] Criar tabela establishment_badges no schema (vegetariano, vegano, sem_gluten)
- [x] Migrar schema com pnpm db:push
- [x] Criar endpoints tRPC para gerenciar selos (admin atribuir/remover)
- [x] Exibir selos ao lado do nome do estab no frontend (Leaf, Sprout, WheatOff)
- [x] Verificar TypeScript (0 erros), rodar testes e salvar checkpoint
- [x] Baixar fotos de fachada dos 30 estabs do Morumbi Shopping e associar como capa no banco
