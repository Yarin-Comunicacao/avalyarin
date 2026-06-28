# Debug: Perguntas condicionais não aparecem

## Dados no banco (phase=onboarding):
- id=1, questionId=birthdate, type=birthdate, parent=null
- id=30001, questionId=role, type=single, parent=null (NOVA - pergunta pai)
- id=2, questionId=region, type=single, parent=null
- id=3, questionId=frequency, type=single, parent=null
- id=4, questionId=spend, type=single, parent=null
- id=5, questionId=categories, type=multi, parent=null
- id=6, questionId=priorities, type=multi, parent=null
- id=7, questionId=discovery, type=multi, parent=null
- id=60001, questionId=establishment, type=single, parent=30001, trigger=yes
- id=90001, questionId=establishment, type=establishment, parent=30001, trigger=yes

## Problema:
As perguntas 60001 e 90001 têm parent_question_id=30001 e trigger_option="yes".
A pergunta 30001 (role) é a pergunta pai.

Preciso verificar:
1. Se o endpoint survey.questions retorna as condicionais
2. Se o frontend está filtrando corretamente
3. Se o triggerOption "yes" corresponde a alguma opção da pergunta pai (30001)
