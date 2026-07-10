# Preparação para Login Próprio — Facebook/Google/Email

## Contexto
O app atualmente usa Manus OAuth (`server/_core/oauth.ts` + `server/_core/sdk.ts`).
O Alão quer substituir por login próprio com 3 opções:
1. **Facebook** — captar foto de perfil automaticamente
2. **Google** — captar foto de perfil automaticamente
3. **Email** — login por email/senha ou magic link

## Arquitetura Atual
- `server/_core/oauth.ts` → registerOAuthRoutes (GET /api/oauth/callback)
- `server/_core/sdk.ts` → ManusSDK.authenticateRequest() verifica JWT do cookie
- `server/_core/context.ts` → cria TrpcContext com user do SDK
- `client/src/const.ts` → getLoginUrl() redireciona para Manus OAuth portal
- `client/src/_core/hooks/useAuth.ts` → trpc.auth.me.useQuery()

## Plano de Migração

### Schema (já preparado)
- `users.profilePhotoUrl` — campo para foto (já adicionado)
- `users.profilePhotoKey` — chave S3 (já adicionado)
- `users.loginMethod` — campo existente (varchar 64) — usar para "facebook", "google", "email"
- `users.email` — campo existente (varchar 320)
- Adicionar: `users.passwordHash` (para login por email)
- Adicionar: `users.emailVerified` (boolean)
- Adicionar: `users.facebookId` (varchar 64, unique)
- Adicionar: `users.googleId` (varchar 64, unique)

### Novos Endpoints Necessários
1. `POST /api/auth/facebook` — recebe access_token do FB SDK, valida, cria/vincula user
2. `POST /api/auth/google` — recebe id_token do Google Sign-In, valida, cria/vincula user
3. `POST /api/auth/register` — email + senha, cria user
4. `POST /api/auth/login` — email + senha, retorna JWT
5. `POST /api/auth/forgot-password` — envia email de reset
6. `POST /api/auth/reset-password` — token + nova senha

### Captação de Foto de Perfil
- **Facebook**: Graph API `/me/picture?type=large&redirect=false` → retorna URL
- **Google**: campo `picture` do id_token decodificado
- Ao criar conta via social login, baixar a foto e salvar via `storagePut`

### Frontend
- Tela de login com 3 botões: "Entrar com Facebook", "Entrar com Google", "Entrar com Email"
- Facebook SDK: `FB.login()` → access_token → POST /api/auth/facebook
- Google Sign-In: `google.accounts.id.initialize()` → id_token → POST /api/auth/google
- Email: formulário de email/senha → POST /api/auth/login

### Dependências
- `bcrypt` ou `argon2` — hash de senha
- Facebook App ID (yarinagencia@gmail.com)
- Google OAuth Client ID (yarinagencia@gmail.com)

### Migração de Usuários Existentes
- Usuários existentes têm `openId` do Manus OAuth
- Ao ativar login próprio, vincular por email: se o email do Facebook/Google bater com um user existente, vincular
- Manter `openId` para compatibilidade durante transição

## Status
- [x] Campo profilePhotoUrl/Key adicionado ao schema
- [x] Endpoint uploadProfilePhoto implementado
- [x] Componente ProfilePhotoUploader criado
- [ ] Adicionar campos facebookId, googleId, passwordHash, emailVerified ao schema
- [ ] Implementar endpoints de auth próprio
- [ ] Implementar tela de login com social buttons
- [ ] Configurar Facebook App e Google OAuth Client
- [ ] Captação automática de foto ao login social
