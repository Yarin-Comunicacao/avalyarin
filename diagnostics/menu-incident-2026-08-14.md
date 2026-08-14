# Diagnóstico do incidente de cardápios

Data: 2026-08-14

## Evidências

- Conexão ao TiDB funcionou usando o DATABASE_URL local.
- Contagens encontradas no banco: 197 estabelecimentos, 197 ativos, 195 com `hasMenu = 1`, 238 registros em `menu_items` e 212 em `menu_categories`.
- O endpoint público de produção `establishments.getWithMenu` respondeu HTTP 200 para `tgi-fridays-patio-paulista` e retornou itens no campo `menu`.
- A função pública `getEstablishmentWithMenu` consulta `menu_items` por `establishmentId` e devolve `menu` e `menuCategoryOrder`.
- `EstablishmentPage.tsx` lê `establishment.menu`, agrupa os itens por categoria e renderiza a seção CARDÁPIO quando `menu.length > 0`.
- Não há evidência de apagamento generalizado dos cardápios nem de alteração recente no schema relacionada a `menu_items`; os commits recentes da página pública foram anteriores ao incidente.

## Hipóteses ainda abertas

1. A falha pode estar restrita ao painel Business, cujo carregamento depende de autenticação e do vínculo do estabelecimento à conta.
2. Pode haver um estabelecimento específico sem vínculo correto, slug diferente ou resposta em cache.
3. Pode ser uma falha visual/deploy/cache no frontend, apesar de a API pública retornar os itens corretamente.

## Próximo dado necessário

Identificar se o desaparecimento ocorre na página pública do estabelecimento (`/estabelecimento/...`), no painel Business > Cardápio ou em algum card da busca/categorias.
