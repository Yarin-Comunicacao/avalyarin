# Context Notes (sessão atual)

## Problemas identificados no CSV (2026-07-12 19:09)

### Problema 1: Duplicatas com mesmo openId
- 15 registros com openId = 'google_117795824834500260293' (IDs 1003950003 a 1003950015)
- O UNIQUE constraint no campo openId NÃO está impedindo duplicatas
- O upsertUser usa `onDuplicateKeyUpdate` mas a chave primária é `id`, não `openId`
- Quando o id é gerado como MAX(id)+1, cada INSERT é um novo registro (id diferente)
- O `onDuplicateKeyUpdate` só funciona quando há conflito na PRIMARY KEY ou UNIQUE KEY
- CAUSA RAIZ: O campo openId tem UNIQUE no schema Drizzle mas pode não ter no banco real
- OU: O upsertUser gera um id novo a cada vez, então nunca há conflito

### Problema 2: Erro "V.options?.map is not a function"
- Acontece no onboarding survey após inserir data de nascimento
- O erro indica que um campo `options` está sendo tratado como array mas é null/undefined/string
- Provavelmente no componente OnboardingSurvey que renderiza perguntas com opções
- O survey.get retorna surveyData do banco, e as perguntas vêm de survey_questions
- Se survey_questions tem um campo `options` que é JSON mas está salvo como string, o .map() falha

### Solução para Problema 1:
- O upsertUser no db.ts precisa PRIMEIRO verificar se o user já existe por openId
- Se existir, fazer UPDATE; se não, fazer INSERT com id gerado
- NÃO usar onDuplicateKeyUpdate porque o id gerado é sempre novo

### Solução para Problema 2:
- Verificar o componente OnboardingSurvey e como ele lê as opções das perguntas
- Garantir que options é parseado como array antes de .map()

## Arquivos relevantes
- server/db.ts: upsertUser (linha ~87)
- server/auth-own.ts: handleGoogleLogin (linha ~169)
- client/src/components/OnboardingSurvey.tsx ou similar
- drizzle/schema.ts: survey_questions table

## Estado do banco
- Rose tem 15 registros duplicados (IDs 1003950003-1003950015)
- Apenas o ID 1003950003 tem dados completos (email, name, profilePhotoUrl)
- Os outros são registros vazios criados pelo upsertUser do sdk.ts/context.ts

## Deploy
- Render Build Command: pnpm install && pnpm build (NÃO roda db:push)
- O banco TiDB Cloud tem AUTO_INCREMENT mas o app gera id explícito
