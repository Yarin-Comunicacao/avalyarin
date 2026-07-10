# Análise de Gaps — Manual Técnico Operacional Avalyarin v2

## Dados desatualizados no Manual (versão 22/Jun/2026)

### Seção 1 — Introdução
- Diz "7 roles" mas o role `influencer` foi renomeado para `specialist`
- Diz "406 testes" — atualmente são 477+
- Diz "16 fases" — atualmente são 20+ fases
- Diz "187 estabelecimentos" — verificar número atual

### Seção 5 — Banco de Dados
- Não menciona tabelas novas:
  - `event_location_options` (votação de local em eventos)
  - `event_location_votes` (votos de local)
  - `promo_code_establishments` (relação N:N entre códigos e estabs)
  - `establishment_badges` (selos visuais)
  - `specialist_profiles` (perfis de especialistas, antes influencer_profiles?)
  - `specialist_applications` (antes influencer_applications)
- Domínio 4 (Grupos): não menciona votação de local em eventos
- Domínio 5 (Business): não menciona promo_code_establishments
- Domínio 6: ainda usa "Influencers e Críticos" — deve ser "Especialistas e Críticos"

### Seção 6 — Roles
- Role `influencer` deve ser `specialist` (Especialista)
- Descrição do specialist: "Avaliações com destaque, parcerias, grupo de seguidores"
- Cor do specialist: Dourado (estrela dourada, borda vermelha no avatar)
- Cor do critic: Azul Safira (estrela safira, borda prateada no avatar)

### Seção 7 — Fluxos (a verificar nas páginas seguintes)
- Falta fluxo de criação de evento com votação de local
- Falta fluxo de códigos promocionais multi-estabelecimento (critic/specialist → business)
- Falta fluxo de busca de pessoas na aba Grupos
- Falta fluxo do Mapa interativo

### Seção 14 — Planos e Monetização
- Verificar se os limites estão corretos (free=10 avaliações, premium=ilimitado)

### Seção 15 — Navegação por Role
- BottomNav do Critic e Specialist: Início, Busca, Scan, Grupos, Perfil
- BottomNav do Admin: Busca, Equipe, Negócio, Permissões, Config
- BottomNav do Business: Início, Busca, Scan, Divulgação, Perfil
- Falta mencionar o Painel como aba dentro do Perfil (não mais página separada)

### Seção 16 — Fases
- Falta documentar fases 17-20+ (eventos com votação, códigos promo multi-estab, estrelas 4 pontas, etc.)

### Funcionalidades novas não documentadas
1. Sistema de eventos com votação de local (2-5 opções, checkbox múltipla)
2. Códigos promocionais multi-estabelecimento (critic/specialist criam, business aprova)
3. Estrelas de 4 pontas (FourPointStar) — proporção 2:1, safira para critic, dourada para specialist
4. Borda vermelha no avatar specialist, prateada no critic
5. Painel integrado como aba no perfil (não mais página separada)
6. Busca de pessoas na aba Grupos
7. Scan como item do BottomNav (substituiu Maps)
8. Mapa interativo com markers por categoria e coordenadas
9. Sistema de badges/selos visuais para estabelecimentos
10. Notificações de códigos promocionais para business
