# API Response Analysis

The endpoint returns 10 questions for onboarding phase. The two conditional questions ARE returned:

- id=60001: questionId="establishment", type="single", parentQuestionId=30001, triggerOption="yes"
  - title: "ESCOLHA SEU ESTABELECIMENTO"
  - options: [{"label":"teste","value":"teste"}]
  
- id=90001: questionId="establishment", type="establishment", parentQuestionId=30001, triggerOption="yes"
  - title: "ESCOLHA SEU ESTABELECIMENTO"
  - options: null

Both have parentQuestionId=30001 and triggerOption="yes".
The parent (id=30001) has options: [{label:"Sim, sou dono...",value:"yes"},{label:"Não...",value:"no"}]

So the conditional logic SHOULD work: when user selects "yes" on question 30001, questions 60001 and 90001 should appear.

## Problem identified:
Both conditional questions have the SAME questionId="establishment". The code uses `question.id` (which is questionId string) as the key in the answers map. This means they would collide!

Also, question 60001 has type="single" but no real establishment options (just "teste"). This seems like a test question that might confuse things.

## The real issue:
The questions ARE being returned by the API and the frontend logic is correct. The user might be testing on the PUBLISHED version which still has old code. Or there's a rendering issue with duplicate questionIds.
