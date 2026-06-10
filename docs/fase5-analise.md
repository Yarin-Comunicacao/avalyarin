# Fase 5 — Mudanças no Fluxo Existente

## Análise do Estado Atual e Impactos

---

## 1. Avaliação Presencial (via QR Code) coexistindo com Avaliações Remotas

### Estado Atual

O sistema já possui a rota `/e/:slug` (QRScanPage) que é acessada quando o usuário escaneia o QR Code no estabelecimento. Porém, **não há diferenciação entre avaliação presencial e remota** no banco de dados ou na lógica de negócio:

- A tabela `ratings` não possui campo `source` ou `visitType` para distinguir se a avaliação foi feita presencialmente (via QR) ou remotamente (pelo app)
- O `sessionStorage` guarda `avalyarin_qr_scan` com o timestamp do scan, mas essa informação **não é enviada ao backend** quando a avaliação é salva
- O fluxo atual: QR → QRScanPage (código promo) → "Ver Cardápio" → EstablishmentPage → "Avaliar" → RatingPage — mas nenhum passo marca a avaliação como "presencial"

### O que precisa mudar

| Item | Descrição |
|------|-----------|
| Schema | Adicionar campo `source` enum (`presencial`, `remota`) na tabela `ratings` |
| Backend | O endpoint `ratings.save` deve aceitar o campo `source` e persistir |
| Frontend (QRScanPage) | Salvar flag no sessionStorage quando usuário escaneia QR |
| Frontend (RatingPage) | Ler o sessionStorage e enviar `source: "presencial"` se o scan foi feito nos últimos 60 minutos |
| Regras de negócio | Avaliações presenciais podem ter **peso maior** no ranking, badge especial, ou critérios extras (ex: "Atendimento" só aparece na presencial) |
| Validação temporal | QR scan válido por 60 minutos — após isso, a avaliação é considerada remota |

### Impacto na Conta

- **Usuários**: ganham badge "Avaliador Presencial" e suas avaliações presenciais têm destaque visual (ícone de QR) na lista
- **Influencers**: avaliações presenciais contam como "qualificadas" com mais peso na solicitação
- **Estabelecimentos**: no Dashboard de Insights, podem ver a proporção presencial vs remota
- **Admin**: pode filtrar avaliações por tipo no painel

---

## 2. Role "Influencer" com Permissões de UI Específicas

### Estado Atual

O role `influencer` existe no schema e é atribuído quando o admin aprova a solicitação. Porém, **o influencer não tem UI dedicada**:

- Não existe um "Painel do Influencer" — ele usa o menu normal de usuário
- O menu lateral não mostra opções exclusivas para influencers (apenas "Influencers Favoritos" que é para todos)
- O influencer pode: propor parcerias (`influencer.proposePartnership`) e ver suas parcerias (`influencer.myPartnerships`)
- O influencer **pode avaliar normalmente** (não é bloqueado como business)
- O influencer **não tem acesso ao Painel Empresarial** (só business/admin/owner)

### O que precisa mudar

| Item | Descrição |
|------|-----------|
| Menu lateral | Adicionar seção "Painel Influencer" visível apenas para `role === "influencer"` |
| Nova página | Criar `/painel-influencer` com abas: Minhas Parcerias, Meus Códigos, Meu Grupo, Métricas |
| Códigos promo | Influencer pode criar códigos promo próprios (já funciona via `promo.create`) — precisa de UI dedicada |
| Grupo de influencer | Influencer pode criar/gerenciar seu grupo de seguidores (já funciona no backend) — precisa de UI |
| Selo visual | Badge "Influencer Verificado" no perfil público e nas avaliações |
| Avaliações ilimitadas | Influencer aprovado deve ter avaliações ilimitadas (como embaixador) independente do plano pago |
| Limite de promo codes | Influencer deve poder criar códigos ilimitados (independente do plano) |

### Impacto na Conta

- **Influencer**: ganha painel exclusivo, selo verificado, avaliações ilimitadas, códigos promo ilimitados
- **Seguidores**: podem seguir o grupo do influencer e ver suas avaliações em destaque
- **Estabelecimentos**: veem quais influencers avaliaram seu bar e podem propor parcerias
- **Admin**: gerencia aprovações e pode revogar o status de influencer

---

## 3. Solicitação de Influencers com Validação de 50 Avaliações Qualificadas

### Estado Atual

O sistema de solicitação **já está implementado e funcional**:

- Página `/influencer/solicitar` com lista de avaliações dos últimos 365 dias
- Validação: mínimo 50 avaliações qualificadas de 50 estabelecimentos diferentes
- Critério de qualificação: todos os itens da avaliação devem ter comentário com ≥20 caracteres
- Admin pode aprovar/rejeitar no painel (sub-aba "Influencer" em Solicitações)
- Ao aprovar, o role do usuário muda para `influencer`

### O que precisa ajustar

| Item | Descrição |
|------|-----------|
| Critério presencial | Considerar se avaliações presenciais devem ter peso maior (ex: 30 presenciais + 20 remotas = ok) |
| Renovação | Definir se o status de influencer expira (ex: precisa manter 10 avaliações/mês) |
| Revogação | Se o influencer ficar inativo por X meses, voltar para role `user` automaticamente |
| Feedback visual | Mostrar progresso na Home para usuários com 20+ avaliações ("Faltam X para se candidatar") |
| Notificação | Notificar o usuário quando a solicitação for aprovada/rejeitada |

### Impacto na Conta

- **Usuários aspirantes**: veem progresso claro e motivação para avaliar mais
- **Influencers ativos**: mantêm o status com atividade regular
- **Admin**: tem controle sobre renovação e revogação

---

## 4. Conta Business: Adaptação ao Novo Modelo

### Estado Atual

A conta business **já está implementada** com as seguintes restrições:

- **Não pode avaliar** — `ratings.save` bloqueia com `role === "business"`
- **Menu filtrado** — seções de avaliação, grupos e insígnias são ocultas
- **Painel Empresarial** — acesso exclusivo com abas: Estabelecimentos, Solicitações, Cardápio, Notificações, QR Code, Códigos Promo, Parcerias, Meu Plano, Insights
- **Notificações** — recebe notificação quando seu estabelecimento é avaliado
- **Planos empresariais** — Básico (grátis) e Premium (R$29,90)

### O que precisa ajustar para o novo modelo

| Item | Descrição |
|------|-----------|
| Parcerias com influencers | Business pode **propor** parcerias a influencers (atualmente só influencer propõe) |
| Responder parcerias | Business já pode aceitar/rejeitar propostas — OK |
| Códigos para influencers | Business pode criar códigos promo exclusivos para influencers parceiros |
| Insights de influencer | No Dashboard, ver quais influencers avaliaram e o impacto nas visitas |
| Destaque via parceria | Quando uma parceria é aprovada, o estabelecimento ganha destaque no carrossel |
| Convite direto | Business pode enviar convite a um influencer específico para avaliar |

### Impacto na Conta

- **Business**: ganha ferramentas de marketing via influencers, pode iniciar parcerias ativamente
- **Influencer**: recebe convites de estabelecimentos e pode aceitar/rejeitar
- **Admin**: aprova parcerias de ambos os lados (influencer→estab e estab→influencer)
- **Usuários**: veem avaliações de influencers com selo e destaque

---

## Resumo de Implementação

| Prioridade | Mudança | Complexidade |
|:----------:|---------|:------------:|
| 1 | Campo `source` na tabela ratings + lógica presencial | Baixa |
| 2 | Painel do Influencer (nova página com abas) | Média |
| 3 | Permissões especiais do influencer (avaliações/códigos ilimitados) | Baixa |
| 4 | Selo visual de influencer verificado | Baixa |
| 5 | Business pode propor parcerias a influencers | Média |
| 6 | Progresso de candidatura na Home | Baixa |
| 7 | Sistema de renovação/revogação de influencer | Média |

---

## Decisões Pendentes (para Alão)

1. **Avaliação presencial**: qual o tempo máximo entre o scan do QR e a avaliação para ser considerada "presencial"? (sugestão: 60 minutos)
2. **Peso da presencial**: avaliações presenciais devem ter peso maior no ranking? Se sim, quanto? (sugestão: 1.2x)
3. **Renovação de influencer**: o status deve expirar? Se sim, após quantos meses de inatividade? (sugestão: 3 meses sem avaliação)
4. **Business propor parceria**: o business deve poder propor parceria diretamente ou apenas aceitar propostas de influencers?
5. **Critério "Originalidade"**: em quais categorias/estabelecimentos deve aparecer? (pendente desde antes)
