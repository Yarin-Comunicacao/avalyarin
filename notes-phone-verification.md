# Notas: Verificação de Celular

## Estado Atual
- Tabela `users` tem campo `verified` (boolean) — usado para selo de verificação por QR (3 avaliações presenciais em 3 estabs diferentes)
- NÃO existe campo `phoneVerified` ou `phone` na tabela users
- Tabela `establishments` tem campo `phone` (varchar 64) — telefone do estabelecimento
- Preciso CRIAR um campo `phoneVerified` e `phone` na tabela users

## Plano
1. Adicionar campos `phone` e `phoneVerified` na tabela users
2. Na NotificacoesPage: se !user.phoneVerified, mostrar tela de "Verifique seu celular"
3. Na página de estabelecimento: WhatsApp só clicável se user.phoneVerified === true

## Arquivos relevantes
- drizzle/schema.ts (tabela users, linha 3-24)
- server/_core/context.ts (cria ctx.user do tipo User)
- client/src/pages/NotificacoesPage.tsx (notificações)
- Endpoint auth.me retorna ctx.user diretamente (linha 309 routers.ts)
- WhatsApp provavelmente na página de detalhes do estabelecimento
