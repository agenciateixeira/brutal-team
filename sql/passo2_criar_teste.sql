-- CRIAR dados de teste para HOJE
INSERT INTO workout_tracking (aluno_id, date, completed)
VALUES ('501a3efe-84a6-4c71-b135-4c59b41a4e0e', CURRENT_DATE, true)
ON CONFLICT (aluno_id, date)
DO UPDATE SET completed = true, updated_at = NOW();

INSERT INTO meal_tracking (aluno_id, date, cafe_da_manha, almoco, janta)
VALUES ('501a3efe-84a6-4c71-b135-4c59b41a4e0e', CURRENT_DATE, true, true, true)
ON CONFLICT (aluno_id, date)
DO UPDATE SET cafe_da_manha = true, almoco = true, janta = true, updated_at = NOW();

-- Ver se foi criado
SELECT 'WORKOUT CRIADO' as tipo, * FROM workout_tracking
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
  AND date = CURRENT_DATE;

SELECT 'MEAL CRIADO' as tipo, * FROM meal_tracking
WHERE aluno_id = '501a3efe-84a6-4c71-b135-4c59b41a4e0e'
  AND date = CURRENT_DATE;
