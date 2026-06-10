# Especificação — Novo Modelo Avalyarin

**Versão:** 1.0  
**Data:** 09/06/2026  
**Autor:** Manus AI + Alão

---

## Visão Geral

O Avalyarin evolui de um app de avaliação para uma **rede social gastronômica** gratuita, com monetização via insights e dados. O app funciona como cardápio online + rede social onde usuários compartilham experiências, estabelecimentos gerenciam presença digital, e influencers comprovam engajamento real.

---

## Modelo de Monetização

| Pilar | Quem paga | Benefícios exclusivos |
|---|---|---|
| Plano Estab | Estabelecimento | Dashboard de insights (visitas, perfil de clientes, horários de pico), sugestões de ações, destaques patrocinados, códigos permanentes |
| Plano Influencer | Influencer | Métricas de conversão real, créditos por indicação, códigos permanentes, selo verificado |
| Plano Usuário+ | Usuário comum | Mais de 1 grupo, funcionalidades extras, caminho para virar influencer |

---

## Fase 1 — QR Code Estático + Códigos Promocionais (MVP)

### 1.1 QR Code por Estabelecimento

Cada estabelecimento possui um **QR Code estático** que leva para sua subpágina no app.

- **URL:** `https://avaliabar-wg3u3svg.manus.space/e/{slug}`
- **Slug:** gerado automaticamente a partir do nome (ex: `samba-burguer`, `don-corleone-pizzaria`)
- **Geração:** disponível no Painel Empresarial para download/impressão
- **Formato:** PNG com logo Avalyarin no centro

### 1.2 Pop-up de Código Promocional

Quando o usuário acessa via QR Code (rota `/e/:slug`), um pop-up aparece:

> "Bem-vindo ao {Nome do Estab}! Tem um código promocional? Insira abaixo."
> 
> [Campo de texto: CÓDIGO]  [Botão: APLICAR]  
> [Link: Continuar sem código →]

**Comportamento:**
- Se código válido + parceria ativa → mostra promoção (ex: "10% OFF na conta!")
- Se código válido mas sem parceria → registra uso, segue para cardápio normalmente
- Se código inválido → mensagem de erro, permite tentar novamente ou continuar sem código
- Se "Continuar sem código" → vai direto para o cardápio com botão de avaliação

### 1.3 Tabela de Códigos Promocionais

| Campo | Tipo | Descrição |
|---|---|---|
| id | int (PK) | ID auto-incremento |
| code | varchar(20) | Código alfanumérico único (ex: YARIN10, SAMBA20) |
| type | enum | `percentage`, `buy_one_get_one`, `free_item`, `fixed_discount` |
| value | decimal | Valor do desconto (% ou R$) |
| description | text | Descrição da promoção visível ao usuário |
| creator_id | varchar | ID do usuário que criou (influencer ou business) |
| creator_type | enum | `influencer`, `business` |
| establishment_id | int | Estab vinculado (NULL = válido em qualquer estab parceiro) |
| starts_at | bigint | Início da validade (timestamp) |
| expires_at | bigint | Fim da validade (NULL = permanente, requer plano pago) |
| max_uses | int | Limite total de usos (NULL = ilimitado) |
| max_uses_per_user | int | Limite por usuário (default: 1) |
| first_visit_only | boolean | Só vale na primeira visita do usuário ao estab |
| status | enum | `pending_approval`, `active`, `rejected`, `expired`, `paused` |
| admin_notes | text | Notas do admin ao aprovar/rejeitar |
| created_at | bigint | Data de criação |

### 1.4 Tabela de Uso de Códigos

| Campo | Tipo | Descrição |
|---|---|---|
| id | int (PK) | ID auto-incremento |
| code_id | int (FK) | Referência ao código usado |
| user_id | varchar | Usuário que usou |
| establishment_id | int | Estab onde foi usado |
| used_at | bigint | Timestamp do uso |
| discount_applied | decimal | Valor real do desconto aplicado |

### 1.5 Endpoints Backend (Fase 1)

| Endpoint | Método | Descrição |
|---|---|---|
| `promo.validate` | query | Valida código + retorna promoção se parceria ativa |
| `promo.use` | mutation | Registra uso do código pelo usuário |
| `promo.create` | mutation | Cria novo código (business ou influencer) → status pending |
| `promo.myCodesList` | query | Lista códigos criados pelo usuário logado |
| `promo.delete` | mutation | Exclui código próprio (se pendente ou pausado) |
| `admin.promoCodes` | query | Lista todos os códigos para aprovação |
| `admin.approveCode` | mutation | Aprova código |
| `admin.rejectCode` | mutation | Rejeita código com nota |
| `establishments.getBySlug` | query | Busca estab por slug (rota pública) |

### 1.6 Telas Frontend (Fase 1)

| Tela | Descrição |
|---|---|
| `/e/:slug` | Página do estab via QR com pop-up de código |
| Painel Empresarial → QR Code | Gerar/baixar QR Code do estab |
| Painel Empresarial → Códigos | Criar/gerenciar códigos promocionais |
| Admin → Códigos | Aprovar/rejeitar códigos pendentes |

---

## Fase 2 — Parcerias Influencer ↔ Estab

### 2.1 Fluxo de Parceria

1. Influencer cria código com `establishment_id` específico
2. Estab recebe notificação de proposta de parceria
3. Estab aceita/rejeita
4. Se aceita → admin aprova o código final
5. Parceria ativa: código do influencer gera promoção naquele estab

### 2.2 Tabela de Parcerias

| Campo | Tipo | Descrição |
|---|---|---|
| id | int (PK) | ID |
| influencer_id | varchar | ID do influencer |
| establishment_id | int | ID do estab |
| code_id | int (FK) | Código vinculado |
| status | enum | `proposed`, `accepted`, `rejected`, `active`, `cancelled` |
| estab_accepted_at | bigint | Quando estab aceitou |
| admin_approved_at | bigint | Quando admin aprovou |

---

## Fase 3 — Dashboards de Insights (Monetização)

### 3.1 Dashboard Estab (plano pago)

- Total de scans do QR Code (por dia/semana/mês)
- Códigos usados (quais, quantas vezes, por quem)
- Perfil dos visitantes (faixa etária, frequência, itens mais pedidos)
- Horários de pico de visita
- Sugestões de ações baseadas em dados

### 3.2 Dashboard Influencer (plano pago)

- Quantas pessoas usaram seu código
- Em quais estabs foram usados
- Taxa de conversão (seguidores → visitas reais)
- Créditos acumulados por indicação
- Ranking de estabs mais visitados via seu código

---

## Fase 4 — Planos Pagos (Stripe)

### 4.1 Integração Stripe

- Pagamento recorrente mensal
- Webhooks para: cobrança bem-sucedida, falha, cancelamento
- Grace period de 30 dias com notificações progressivas

### 4.2 Notificações de Inadimplência

| Dia | Canal | Mensagem |
|---|---|---|
| 0 (vencimento) | E-mail + In-app | "Sua assinatura venceu hoje. Renove para manter seus benefícios." |
| +5 dias | E-mail + In-app | "Faltam 25 dias para perder seu selo." |
| +10 dias | E-mail + In-app | "Faltam 20 dias para perder seu selo." |
| +15 dias | E-mail + In-app | "Faltam 15 dias. Seus insights serão ocultados." |
| +20 dias | E-mail + In-app | "Faltam 10 dias. Renove agora." |
| +25 dias | E-mail + In-app | "Última chance! 5 dias restantes." |
| +30 dias | E-mail + In-app | "Selo removido. Lista/grupo ocultos. Renove para restaurar." |

### 4.3 Solicitação de Influencer

- Formulário com lista de avaliações dos últimos 365 dias
- Mínimo 50 avaliações em estabs diferentes selecionadas
- Itens sem foto/descrição ficam em vermelho com pop-up de aviso
- Admin aprova/rejeita a solicitação
- Localizado no Painel Empresarial → Solicitações → sub-aba "Influencer"

---

## Decisões Técnicas

| Decisão | Definição |
|---|---|
| QR Code | Estático, URL fixa por estab |
| Criação de códigos | Estabs e Influencers, todos com aprovação admin |
| Códigos temporários | Gratuitos (com data de validade) |
| Códigos permanentes | Somente com plano pago |
| Avaliação | Independente de código |
| Fluxo atual | Mantido em paralelo |
| Pop-up de código | Apenas quando acessa via QR (/e/:slug) |
| Desconto | Definido pelo estab na parceria |

---

## Prioridade de Implementação

1. **Fase 1** — QR + Códigos (MVP funcional)
2. **Fase 2** — Parcerias (conecta influencers a estabs)
3. **Fase 3** — Dashboards (monetização por dados)
4. **Fase 4** — Stripe + Planos (receita recorrente)
