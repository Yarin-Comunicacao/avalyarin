# Avalyarin — Fluxo de Captura e Armazenamento de Dados do Usuário

## Slide 1: Capa
- Título: "Avalyarin — Fluxo de Dados do Usuário"
- Subtítulo: "Comparativo: Arquitetura Atual (com Manus) vs. Implementação Independente"
- Contexto: Apresentação técnica para entendimento do ecossistema de dados

## Slide 2: Visão Geral do Fluxo Atual (com Manus)
- Título: "O Manus gerencia toda a infraestrutura de autenticação e armazenamento"
- O usuário acessa o Avalyarin e confirma ter 18+ anos na tela de Age Gate
- Após confirmação, é direcionado ao Onboarding Survey (7 etapas) onde fornece: data de nascimento, região, média de consumo, categorias preferidas e prioridades
- Os dados do survey são armazenados localmente (localStorage) e sincronizados com o banco de dados TiDB (MySQL) gerenciado pelo Manus
- A autenticação é feita via Manus OAuth — o usuário clica em "Entrar" e é redirecionado ao portal Manus, que suporta Google, Facebook e outros provedores
- Sessão mantida via cookie seguro (HttpOnly, SameSite) gerenciado pelo servidor Express
- Dados sensíveis (e-mail, nome) vêm do provedor OAuth e são armazenados no banco com conexão SSL/TLS
- Arquivos (fotos de documentos para verificação de idade) são enviados para S3 via endpoint protegido

## Slide 3: Etapa 1 — Age Gate e Onboarding (com Manus)
- Título: "Coleta inicial de dados acontece antes mesmo do login"
- Tela 1: Age Gate — apenas um checkbox "Tenho mais de 18 anos" (armazenado em localStorage)
- Tela 2: Onboarding Survey — 7 perguntas sequenciais coletam preferências do usuário
- Dados coletados no survey: data de nascimento (roleta), região de SP, média de consumo, categorias favoritas, prioridades de avaliação, frequência de visitas, fontes de descoberta
- Esses dados são salvos em localStorage imediatamente e sincronizados com o banco quando o usuário faz login
- Nenhum dado pessoal identificável (PII) é coletado nesta etapa — apenas preferências e data de nascimento
- O Manus fornece: hospedagem, banco de dados, storage S3, servidor Express, certificado SSL — tudo pré-configurado

## Slide 4: Etapa 2 — Autenticação OAuth (com Manus)
- Título: "Login via Manus OAuth centraliza a segurança em um único ponto"
- Usuário clica em "Entrar com Google" → redirecionado ao portal Manus OAuth
- Manus OAuth atua como intermediário: recebe o token do Google/Facebook e cria uma sessão própria
- Dados recebidos do provedor: nome, e-mail, foto de perfil, openId único
- Sessão criada com JWT assinado (JWT_SECRET gerenciado pelo Manus) e armazenado em cookie HttpOnly
- Vantagem: o Avalyarin nunca vê a senha do usuário nem o token bruto do Google
- Desvantagem: dependência do serviço Manus para autenticação — se o Manus cair, ninguém faz login

## Slide 5: Etapa 3 — Armazenamento de Dados (com Manus)
- Título: "Banco TiDB + S3 gerenciados eliminam preocupação com infraestrutura"
- Banco de dados: TiDB (compatível MySQL) hospedado e gerenciado pelo Manus com backups automáticos
- Tabela `users`: id, openId, name, email, username, birthdate, surveyData (JSON), role, timestamps
- Tabela `age_verification_requests`: documentUrl (S3), requestedBirthdate, status (pending/approved/rejected)
- Storage S3: documentos de verificação de idade são armazenados com chave única e URL assinada
- Conexão ao banco: via DATABASE_URL injetada automaticamente pelo ambiente Manus (SSL obrigatório)
- Custo operacional: zero — incluído na plataforma Manus
- Limitação: sem controle total sobre backups, retenção de dados ou localização geográfica do servidor

## Slide 6: Diagrama do Fluxo Atual (com Manus)
- Título: "Arquitetura simplificada: 3 camadas gerenciadas"
- Camada 1 — Frontend (React + Vite): coleta dados do survey, exibe interface, faz chamadas tRPC
- Camada 2 — Backend (Express + tRPC): valida dados, gerencia sessões, faz upload para S3
- Camada 3 — Dados (TiDB + S3): armazena tudo com criptografia em trânsito (TLS)
- Fluxo: Usuário → Age Gate → Survey → Login OAuth Manus → Dados salvos no TiDB → Arquivos no S3
- Tudo orquestrado pelo Manus: deploy, domínio, SSL, variáveis de ambiente, monitoramento

## Slide 7: Visão Geral SEM o Manus — O que seria necessário
- Título: "Sem Manus, o desenvolvedor assume toda a responsabilidade de infraestrutura"
- Servidor: contratar VPS (DigitalOcean, AWS EC2, ou similar) — R$50-200/mês
- Banco de dados: configurar MySQL/PostgreSQL próprio ou usar serviço gerenciado (PlanetScale, Supabase) — R$0-150/mês
- Storage: configurar bucket S3 na AWS ou usar Cloudflare R2 — R$5-50/mês
- Autenticação: implementar OAuth diretamente com cada provedor (Google, Facebook, Apple, Microsoft)
- SSL: configurar Let's Encrypt ou Cloudflare — gratuito mas requer manutenção
- Deploy: configurar CI/CD (GitHub Actions), Docker, ou usar Vercel/Railway
- Monitoramento: configurar logs, alertas, uptime checks
- LGPD: implementar hash de dados, política de retenção, direito ao esquecimento manualmente

## Slide 8: Autenticação SEM Manus — Complexidade Real
- Título: "Cada provedor OAuth exige registro, configuração e manutenção separados"
- Google: criar projeto no Google Cloud Console, configurar OAuth consent screen, obter Client ID/Secret
- Facebook: criar app no Meta for Developers, passar por revisão de app, configurar permissões
- Apple: requer Apple Developer Account ($99/ano), configurar Sign in with Apple, gerar chaves
- Microsoft: registrar app no Azure AD, configurar redirect URIs, gerenciar tokens
- Para cada provedor: implementar callback handler, validar tokens, extrair dados do perfil
- Verificação de e-mail/celular: integrar Twilio (SMS ~R$0.30/msg) + SendGrid (e-mail ~R$0.001/msg)
- Hashing LGPD: implementar bcrypt para senhas, SHA-256 para dados sensíveis, chaves de criptografia rotativas
- Tempo estimado de implementação: 2-4 semanas para um desenvolvedor experiente

## Slide 9: Armazenamento SEM Manus — Responsabilidades Adicionais
- Título: "Gerenciar dados pessoais sem plataforma exige conformidade manual com LGPD"
- Backup: configurar rotina de backup diário/semanal com retenção definida
- Criptografia at-rest: habilitar criptografia no disco do banco de dados
- Criptografia em trânsito: configurar TLS/SSL nos endpoints do banco
- Hash de PII: implementar hashing (SHA-256) para e-mail e telefone em tabelas de auditoria
- Direito ao esquecimento: criar endpoint para deletar todos os dados de um usuário sob demanda
- Consentimento: implementar modal LGPD com registro de aceite (timestamp + versão dos termos)
- Localização dos dados: garantir que servidores estejam no Brasil ou em conformidade com transferência internacional
- Relatório de impacto: documentar quais dados são coletados, por quê, e por quanto tempo

## Slide 10: Comparativo Final — Com Manus vs. Sem Manus
- Título: "Manus reduz 80% do esforço de infraestrutura, mas limita controle total"
- Tabela comparativa:
  - Tempo de setup: Com Manus = minutos | Sem Manus = 2-4 semanas
  - Custo mensal: Com Manus = incluso no plano | Sem Manus = R$100-400/mês
  - Autenticação: Com Manus = 1 integração (Manus OAuth) | Sem Manus = 4+ integrações separadas
  - Banco de dados: Com Manus = gerenciado (TiDB) | Sem Manus = auto-gerenciado ou PaaS
  - Storage: Com Manus = S3 integrado | Sem Manus = configurar AWS S3/R2
  - SSL/Domínio: Com Manus = automático | Sem Manus = Let's Encrypt + DNS manual
  - LGPD: Com Manus = parcialmente coberto | Sem Manus = 100% responsabilidade do dev
  - Controle: Com Manus = limitado à plataforma | Sem Manus = total
  - Escalabilidade: Com Manus = automática | Sem Manus = manual (load balancer, réplicas)

## Slide 11: Recomendações para o Avalyarin
- Título: "Estratégia híbrida maximiza velocidade de entrega e conformidade"
- Curto prazo (agora): manter Manus como plataforma principal — velocidade de iteração é prioridade
- Médio prazo (3-6 meses): implementar hash LGPD nos dados sensíveis armazenados no TiDB
- Médio prazo: adicionar modal de consentimento LGPD obrigatório antes do cadastro
- Longo prazo (6-12 meses): avaliar migração parcial para infraestrutura própria se o app escalar
- Ação imediata: o Manus já oferece OAuth com Google — para adicionar Facebook/Apple/Microsoft, seria necessário implementar OAuth direto ou aguardar suporte nativo do Manus
- Prioridade LGPD: implementar registro de consentimento e direito ao esquecimento independente da plataforma
