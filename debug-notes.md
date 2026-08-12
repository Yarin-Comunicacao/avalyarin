# Debug: Gasto Médio

O endpoint `survey.questions` retorna os valores CORRETOS do banco:
- Até R$ 50
- R$ 50 a R$ 100
- R$ 100 a R$ 150
- R$ 150 a R$ 250
- R$ 250 a R$ 350

updatedAt: 2026-06-26T20:27:49.000Z (foi atualizado pelo Owner)

O problema NÃO está no backend. Os dados estão corretos no banco e no endpoint.

Possível causa: O usuário está vendo a versão PUBLICADA (deploy antigo) que ainda tem o código hardcoded.
O deploy atual pode estar usando o código antigo que tinha QUESTIONS hardcoded no frontend.
