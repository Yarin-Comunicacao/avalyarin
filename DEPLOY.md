# Deploy — Avalyarin (Fora da Infraestrutura Manus)

Este guia explica como rodar o projeto de forma independente.

## Pré-requisitos

- Node.js 22+
- pnpm 9+
- Banco MySQL/TiDB acessível
- Bucket Cloudflare R2 configurado
- Projeto OAuth no Google Cloud Console

## 1. Clonar e Instalar

```bash
git clone https://github.com/seu-usuario/avalia-bar.git
cd avalia-bar
pnpm install
```

## 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as variáveis documentadas em `ENV_SETUP.md`.

Exemplo mínimo:
```env
DATABASE_URL=mysql://3o1KcwvkeAxCR1d.root:SENHA@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/sys
JWT_SECRET=gere-uma-string-aleatoria-de-64-caracteres
GOOGLE_CLIENT_ID=685803123505-xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
R2_ACCOUNT_ID=34bf9a273161d88cd7a18b69b4bd3e35
R2_ACCESS_KEY_ID=18cf5db233fd7a255409a2e12f59ff3c
R2_SECRET_ACCESS_KEY=16e513949a299db7eee2afe87594f6937e13eff5904a315a4018f8e60ca2df8f
R2_BUCKET_NAME=avalyarin-assets
VITE_GOOGLE_MAPS_API_KEY=sua-api-key-google-maps
```

## 3. Configurar Banco de Dados

```bash
# Gerar e aplicar migrações
pnpm db:push
```

Para TiDB Cloud, o SSL é habilitado automaticamente quando a URL contém `tidbcloud.com`.

## 4. Desenvolvimento Local

```bash
pnpm dev
```

O servidor inicia em `http://localhost:3000`.

## 5. Build de Produção

```bash
pnpm build
```

Gera:
- `dist/` — Bundle do frontend (Vite)
- `dist/index.js` — Servidor Node.js (esbuild)

## 6. Rodar em Produção

```bash
NODE_ENV=production node dist/index.js
```

O servidor serve tanto a API (`/api/*`) quanto o frontend estático.

## 7. Deploy em Plataformas

### Railway / Render / Fly.io

1. Conecte o repositório GitHub
2. Configure as variáveis de ambiente no painel
3. Build command: `pnpm install && pnpm build`
4. Start command: `node dist/index.js`

### Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Arquitetura

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│  Express +   │────▶│   TiDB      │
│   (React)   │     │  tRPC Server │     │   (MySQL)   │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────┴───────┐
                    │ Cloudflare   │
                    │     R2       │
                    └──────────────┘
```

## Autenticação

O login usa Google OAuth direto:
1. Usuário clica "Entrar com Google"
2. Redireciona para Google → callback em `/api/auth/google/callback`
3. Servidor cria/atualiza usuário no banco e emite JWT cookie
4. Frontend lê sessão via `trpc.auth.me`

## Storage

Arquivos são armazenados no Cloudflare R2 e servidos via `/manus-storage/:key` com presigned URLs.

## Variáveis Manus (Legado)

As seguintes variáveis **não são mais necessárias** fora do Manus:
- `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY`
- `VITE_FRONTEND_FORGE_API_KEY` / `VITE_FRONTEND_FORGE_API_URL`
- `OAUTH_SERVER_URL` / `VITE_OAUTH_PORTAL_URL`
- `VITE_APP_ID`
- `VITE_ANALYTICS_ENDPOINT` / `VITE_ANALYTICS_WEBSITE_ID`
