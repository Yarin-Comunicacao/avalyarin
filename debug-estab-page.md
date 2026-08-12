# Debug: Botão Avaliar - RESOLVIDO

## Resultado do teste no preview (dev server):
- A página do estabelecimento agora carrega SEM exigir login
- O botão "AVALIAR ESTE ESTABELECIMENTO" aparece como link fixo (index 20) e botão (index 21)
- O link aponta para `/avaliar/pizzaria-teste-avalyarin` (slug correto)
- O bypass de rotas públicas está funcionando (não mostra Auth Choice nem Survey)

## O que foi corrigido:
1. App.tsx: adicionado `isPublicRoute` check para rotas `/e/`, `/estabelecimento/`, `/avaliar/`
2. Essas rotas agora pulam o Auth Choice e a Survey, indo direto ao Router
3. O Age Gate ainda é exigido (correto, pois é sobre bebidas alcoólicas)

## Sobre o QR Code popup:
O popup gera URL `/e/:slug` que é uma rota pública agora.
O botão no popup deve funcionar corretamente após publicar.
