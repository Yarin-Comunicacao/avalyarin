# Heartbeat — Ideias de Automação para o Avalyarin

Este documento lista todas as possibilidades de uso do sistema de tarefas agendadas (Heartbeat/Cron) para o Avalyarin. Cada item pode ser implementado como um endpoint + configuração de cron.

---

## Já Implementados

| Endpoint | Frequência | Descrição |
|---|---|---|
| `/api/scheduled/expire-roles` | Diário (3h UTC) | Expira roles critic/specialist após 35 dias sem pagamento |
| `/api/scheduled/expire-business-plans` | Diário (3h UTC) | Rebaixa planos business com carência progressiva (20/15/5 dias) |

---

## 1. Engajamento e Retenção de Usuários

### 1.1 Nudge de Avaliação
- **Frequência:** Diário (10h)
- **Lógica:** Verifica users que fizeram check-in ou visitaram a página de um bar ontem mas não avaliaram. Envia notificação: "Você visitou o Bar X ontem, que tal avaliar?"
- **Dados necessários:** Histórico de visualizações de página, check-ins (futuro)

### 1.2 Streak Rewards
- **Frequência:** Diário (0h)
- **Lógica:** Verifica quem avaliou X dias seguidos e concede badges/pontos automaticamente. Ex: 7 dias seguidos = badge "Dedicado", 30 dias = "Maratonista"
- **Dados necessários:** Tabela de ratings com timestamps

### 1.3 Reativação de Inativos
- **Frequência:** Semanal (segunda, 9h)
- **Lógica:** Identifica users que não avaliaram há 7, 14 ou 30 dias. Envia notificação personalizada com sugestão de bar próximo ou novo na região
- **Dados necessários:** Última avaliação do user, localização preferida

### 1.4 Desafios Semanais
- **Frequência:** Semanal (segunda, 0h)
- **Lógica:** Cria automaticamente desafios temáticos baseados em dados do sistema. Ex: "Avalie 3 bares de cerveja artesanal esta semana", "Descubra um bar novo em Vila Madalena"
- **Dados necessários:** Categorias, regiões, tendências

### 1.5 Aniversário de Cadastro
- **Frequência:** Diário (8h)
- **Lógica:** Verifica users que completam 1 mês, 6 meses, 1 ano de cadastro. Envia parabéns + resumo de conquistas + benefício especial
- **Dados necessários:** Data de criação do user

---

## 2. Inteligência e Rankings

### 2.1 Recalcular Rankings
- **Frequência:** A cada 1h
- **Lógica:** Atualiza rankings como "Top 10 Bares de Pinheiros", "Melhores Drinks da Semana", "Estabelecimentos em Alta". Considera apenas avaliações dos últimos 90 dias com peso decrescente
- **Dados necessários:** Ratings, categorias, localização

### 2.2 Trending Items
- **Frequência:** A cada 6h
- **Lógica:** Detecta itens do cardápio com crescimento acelerado de avaliações. Gera feed "Drink X está bombando no Bar Y" ou "Novo prato do Chef Z já tem nota 9.2"
- **Dados necessários:** Rating_items com timestamps, comparação com período anterior

### 2.3 Detecção de Anomalias
- **Frequência:** A cada 2h
- **Lógica:** Identifica padrões suspeitos: muitas notas 10 no mesmo dia para o mesmo bar, avaliações de contas recém-criadas, padrões de review bombing. Marca para revisão do admin
- **Dados necessários:** Ratings, users, timestamps, IPs (futuro)

### 2.4 Score de Confiabilidade
- **Frequência:** Semanal (domingo, 2h)
- **Lógica:** Recalcula o peso das avaliações de cada user baseado em: quantidade de avaliações, consistência, tempo de conta, diversidade de bares avaliados. Users mais confiáveis têm avaliações com mais peso
- **Dados necessários:** Histórico completo de ratings por user

### 2.5 Sazonalidade
- **Frequência:** Mensal (dia 1, 3h)
- **Lógica:** Identifica padrões sazonais: drinks de verão vs inverno, pratos mais pedidos por estação, horários de pico por época do ano. Gera insights para o painel Business
- **Dados necessários:** Ratings com timestamps ao longo de meses/anos

---

## 3. Business Intelligence (Painel Business)

### 3.1 Relatório Semanal Automático
- **Frequência:** Semanal (segunda, 7h)
- **Lógica:** Gera relatório com métricas da semana para cada business: nota média, número de avaliações, itens mais elogiados, itens com queda, comparativo com semana anterior. Envia por notificação/email
- **Dados necessários:** Ratings da semana, establishment_id

### 3.2 Alerta de Queda de Nota
- **Frequência:** Diário (8h)
- **Lógica:** Compara nota média dos últimos 7 dias com os 7 dias anteriores. Se caiu mais de 10%, notifica o business owner com detalhes dos itens afetados
- **Dados necessários:** Ratings recentes, médias históricas

### 3.3 Comparativo com Concorrentes
- **Frequência:** Semanal (quarta, 9h)
- **Lógica:** Gera insight comparativo: "Seu bar está 0.3 pontos abaixo da média da região em Drinks" ou "Seu atendimento está no Top 3 de Vila Madalena"
- **Dados necessários:** Ratings de todos os bares da mesma região/categoria

### 3.4 Sugestão de Melhorias via LLM
- **Frequência:** Semanal (sexta, 10h)
- **Lógica:** Usa LLM para analisar as avaliações negativas/médias da semana e gerar sugestões acionáveis: "Clientes mencionaram demora no atendimento 4x esta semana — considere reforçar equipe nos horários de pico"
- **Dados necessários:** Textos de reviews (quando implementado), ratings por critério

### 3.5 Previsão de Demanda
- **Frequência:** Semanal (domingo, 22h)
- **Lógica:** Baseado em avaliações, horários e padrões históricos, sugere dias/horários de maior movimento. "Sexta 19h-22h é seu horário de pico — 40% das avaliações são nesse período"
- **Dados necessários:** Timestamps de ratings, dia da semana, horário

---

## 4. Conteúdo Automático

### 4.1 Newsletter Automática
- **Frequência:** Semanal (quinta, 14h)
- **Lógica:** Compila "Melhores Descobertas da Semana": novos bares cadastrados, itens com nota alta, bares que subiram no ranking. Formata e envia para users inscritos
- **Dados necessários:** Novos establishments, ratings altos recentes

### 4.2 Feed de Novidades
- **Frequência:** Diário (12h)
- **Lógica:** Gera posts automáticos para o feed: "Novo bar cadastrado em Vila Madalena!", "O drink Negroni do Bar X alcançou nota 9.5!", "3 novos itens no cardápio do Restaurante Y"
- **Dados necessários:** Novos cadastros, ratings altos, novos menu_items

### 4.3 Resumo Mensal do User
- **Frequência:** Mensal (dia 1, 9h)
- **Lógica:** Gera resumo personalizado: "Você avaliou 12 bares, seu favorito foi X, sua categoria preferida é Y, você deu nota média 7.8, seu item mais bem avaliado foi Z"
- **Dados necessários:** Ratings do user no mês

### 4.4 Geração de SEO
- **Frequência:** Semanal (terça, 4h)
- **Lógica:** Cria/atualiza meta descriptions das páginas de estabelecimentos baseado nas avaliações mais recentes. Ex: "Bar X — Nota 8.7 | Destaque: Caipirinha de Maracujá (9.2) | 45 avaliações"
- **Dados necessários:** Ratings, top items, contagem de avaliações

---

## 5. Manutenção e Qualidade de Dados

### 5.1 Verificar URLs de Imagens
- **Frequência:** Semanal (sábado, 3h)
- **Lógica:** Faz HEAD request em todas as URLs de imagens (fotos de fachada, cardápio, perfil). Marca como "imagem quebrada" as que retornam 404/500
- **Dados necessários:** URLs de imagens no banco

### 5.2 Detectar Duplicatas
- **Frequência:** Semanal (domingo, 4h)
- **Lógica:** Identifica estabelecimentos ou itens de cardápio potencialmente duplicados usando similaridade de nome + endereço. Marca para revisão do admin
- **Dados necessários:** Nomes, endereços, coordenadas

### 5.3 Atualizar Preços
- **Frequência:** Mensal (dia 15, 6h)
- **Lógica:** Marca itens como "preço possivelmente desatualizado" se não foram confirmados/atualizados há mais de 3 meses. Notifica o business owner para atualizar
- **Dados necessários:** updatedAt dos menu_items, preços

### 5.4 Limpar Contas Fantasma
- **Frequência:** Mensal (dia 1, 2h)
- **Lógica:** Remove ou desativa users que nunca fizeram login após 90 dias do cadastro, ou que não têm nenhuma avaliação após 180 dias
- **Dados necessários:** lastLoginAt, contagem de ratings

### 5.5 Validar Endereços
- **Frequência:** Semanal (domingo, 5h)
- **Lógica:** Verifica se coordenadas GPS dos estabelecimentos batem com o endereço cadastrado usando geocoding reverso. Marca inconsistências para revisão
- **Dados necessários:** Lat/lng, endereço, Google Maps API

---

## 6. Gamificação e Social

### 6.1 Distribuir Badges Automáticos
- **Frequência:** Diário (1h)
- **Lógica:** Verifica conquistas desbloqueadas: "Explorador de Pinheiros" (10+ bares na região), "Sommelier" (20+ avaliações de vinho), "Madrugador" (avaliou após meia-noite), "Diversificado" (avaliou em 5+ categorias)
- **Dados necessários:** Ratings por região, categoria, horário

### 6.2 Ranking Mensal
- **Frequência:** Mensal (dia 1, 0h)
- **Lógica:** Reseta e calcula "Avaliador do Mês" por região/categoria. Concede badge especial e destaque no perfil
- **Dados necessários:** Contagem e qualidade de ratings no mês

### 6.3 Grupos — Resumo Semanal
- **Frequência:** Semanal (domingo, 18h)
- **Lógica:** Envia para cada grupo um resumo: "Esta semana o grupo avaliou 8 bares, destaque para o Bar X com nota 9.1. João foi o mais ativo com 5 avaliações"
- **Dados necessários:** Ratings dos membros do grupo na semana

### 6.4 Conquistas Desbloqueadas
- **Frequência:** A cada 30min
- **Lógica:** Verifica em tempo quase-real se algum user desbloqueou uma conquista e notifica imediatamente: "Parabéns! Você desbloqueou: Primeira avaliação de vinho!"
- **Dados necessários:** Sistema de conquistas com critérios definidos

---

## 7. Integração com Serviços Externos

### 7.1 Sincronizar com Google Maps
- **Frequência:** Semanal (quarta, 3h)
- **Lógica:** Atualiza dados de horário de funcionamento, endereço, telefone dos estabelecimentos consultando a API do Google Places. Marca alterações para revisão
- **Dados necessários:** Place IDs, Google Maps API

### 7.2 Monitorar Redes Sociais
- **Frequência:** A cada 6h
- **Lógica:** Busca menções aos bares cadastrados no Twitter/Instagram e correlaciona com avaliações. Gera insight: "O Bar X foi mencionado 15x no Instagram esta semana"
- **Dados necessários:** APIs de redes sociais, nomes dos bares

### 7.3 Webhook para Parceiros
- **Frequência:** Diário (7h)
- **Lógica:** Notifica parceiros (iFood, Rappi, guias gastronômicos) sobre novos bares bem avaliados ou mudanças significativas de nota
- **Dados necessários:** Webhooks configurados, ratings recentes

### 7.4 Exportar para Planilha/Drive
- **Frequência:** Semanal (segunda, 6h)
- **Lógica:** Gera relatório CSV/Excel com dados consolidados e salva no Google Drive do owner. Útil para análise externa ou compartilhamento com equipe
- **Dados necessários:** Todos os dados do sistema, Google Drive API

---

## 8. Monetização

### 8.1 Cobranças Recorrentes
- **Frequência:** Diário (6h)
- **Lógica:** Verifica pagamentos pendentes e envia lembretes progressivos: 7 dias antes ("Seu plano vence em breve"), 3 dias antes ("Renove para não perder benefícios"), no dia ("Último dia!")
- **Dados necessários:** expiresAt dos planos, gateway de pagamento

### 8.2 Upsell Automático
- **Frequência:** Semanal (terça, 11h)
- **Lógica:** Identifica users muito ativos no plano free (ex: atingiu limite de 10 avaliações/dia 3x na semana) e sugere upgrade: "Você está aproveitando ao máximo! Com o plano Conhecedor, avaliações são ilimitadas"
- **Dados necessários:** Contagem de ratings diários, plano atual

### 8.3 Trial Expiring
- **Frequência:** Diário (9h)
- **Lógica:** Notifica users 3 dias antes do trial/período gratuito acabar: "Seu período de teste como Crítico termina em 3 dias. Assine para manter seus benefícios"
- **Dados necessários:** Data de início do trial, duração

### 8.4 Renovação Automática
- **Frequência:** Diário (0h)
- **Lógica:** Processa cobranças de planos que vencem hoje. Se cartão recusar, inicia período de carência. Se aprovado, renova automaticamente e notifica
- **Dados necessários:** Gateway de pagamento (Stripe), expiresAt

---

## Priorização Sugerida

**Alta prioridade (implementar primeiro):**
1. 8.1 Cobranças Recorrentes
2. 2.1 Recalcular Rankings
3. 3.2 Alerta de Queda de Nota
4. 6.1 Distribuir Badges Automáticos
5. 1.3 Reativação de Inativos

**Média prioridade:**
6. 3.1 Relatório Semanal Automático
7. 4.2 Feed de Novidades
8. 5.3 Atualizar Preços
9. 1.2 Streak Rewards
10. 2.2 Trending Items

**Baixa prioridade (futuro):**
11. 3.4 Sugestão de Melhorias via LLM
12. 7.1 Sincronizar com Google Maps
13. 4.4 Geração de SEO
14. 2.5 Sazonalidade
15. 7.2 Monitorar Redes Sociais

---

## Como Implementar

Para cada item:
1. Criar endpoint em `server/_core/index.ts`: `app.post("/api/scheduled/nome-da-tarefa", handler)`
2. Implementar lógica no `server/db-*.ts` ou arquivo dedicado
3. Configurar cron via: `manus-heartbeat create --name nome --cron "expressão" --path /api/scheduled/nome-da-tarefa`

**Expressões cron comuns:**
- `0 0 3 * * *` — todo dia às 3h
- `0 0 */6 * * *` — a cada 6 horas
- `0 0 9 * * 1` — toda segunda às 9h
- `0 0 0 1 * *` — dia 1 de cada mês à meia-noite
- `0 */30 * * * *` — a cada 30 minutos
