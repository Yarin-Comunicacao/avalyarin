# Variáveis de Ambiente — Avalyarin

Este documento lista todas as variáveis de ambiente necessárias para rodar o projeto fora da infraestrutura Manus.

## Database (TiDB / MySQL)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | Connection string MySQL/TiDB | `mysql://user:pass@host:4000/database` |
| `DATABASE_SSL_CA` | (Opcional) Caminho para CA cert SSL | `/etc/ssl/certs/ca-certificates.crt` |

## Autenticação (Google OAuth)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `GOOGLE_CLIENT_ID` | ID do cliente OAuth Google | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Chave secreta do cliente OAuth | `GOCSPX-xxx` |
| `JWT_SECRET` | Secret para assinar cookies de sessão (min 32 chars) | `random-64-char-string` |

## Storage (Cloudflare R2)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `R2_ACCOUNT_ID` | Account ID da Cloudflare | `34bf9a273161d88cd7a18b69b4bd3e35` |
| `R2_ACCESS_KEY_ID` | Access Key ID do R2 | `18cf5db233fd...` |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key do R2 | `16e513949a29...` |
| `R2_BUCKET_NAME` | Nome do bucket | `avalyarin-assets` |
| `R2_PUBLIC_URL` | (Opcional) URL pública do bucket | `https://assets.avalyarin.com` |

## Google Maps (Frontend)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_GOOGLE_MAPS_API_KEY` | API Key do Google Maps | `AIzaSy...` |

## LLM (Opcional — para features com IA)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `LLM_API_URL` | Endpoint OpenAI-compatible | `https://api.openai.com/v1/chat/completions` |
| `LLM_API_KEY` | API Key do LLM | `sk-...` |
| `LLM_MODEL` | Modelo a usar | `gpt-4o-mini` |

## App Config

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `OWNER_OPEN_ID` | OpenID do owner (primeiro login se vazio) | `google_12345` |
| `OWNER_NAME` | Nome do owner | `Alan Figueredo` |
| `PORT` | Porta do servidor (padrão 3000) | `3000` |

---

## Configuração do Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crie um projeto ou selecione existente
3. Vá em **Credenciais** → **Criar credenciais** → **ID do cliente OAuth**
4. Tipo: **Aplicativo da Web**
5. Adicione em **URIs de redirecionamento autorizados**:
   - `http://localhost:3000/api/auth/google/callback` (desenvolvimento)
   - `https://seu-dominio.com/api/auth/google/callback` (produção)
6. Copie o **Client ID** e **Client Secret**

## Configuração do TiDB

A connection string do TiDB Cloud segue o formato:
```
mysql://USER.root:PASSWORD@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/DATABASE
```

O SSL é habilitado automaticamente quando a URL contém `tidbcloud.com`.

## Configuração do Cloudflare R2

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com/) → R2
2. Crie um bucket (ex: `avalyarin-assets`)
3. Vá em **Manage R2 API Tokens** → **Create API Token**
4. Permissões: Object Read & Write
5. Copie o **Access Key ID** e **Secret Access Key**
6. O **Account ID** está na URL do dashboard
