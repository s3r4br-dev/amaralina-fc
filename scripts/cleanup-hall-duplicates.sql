-- Script para limpar registros duplicados na tabela hall_records
-- Mantém apenas o registro mais recente de cada jogador por categoria

-- 1. Criar tabela temporária com os registros únicos a manter
CREATE TEMP TABLE hall_records_to_keep AS
SELECT DISTINCT ON (jogador_id, category) 
  id,
  jogador_id,
  category,
  record_value,
  achieved_at,
  is_current
FROM hall_records
ORDER BY jogador_id, category, achieved_at DESC, id DESC;

-- 2. Deletar todos os registros que não estão na lista de manter
DELETE FROM hall_records
WHERE id NOT IN (SELECT id FROM hall_records_to_keep);

-- 3. Garantir que apenas um registro esteja marcado como current por categoria
-- Primeiro, desmarcar todos
UPDATE hall_records SET is_current = false;

-- 4. Marcar como current o registro com maior record_value por categoria
UPDATE hall_records hr
SET is_current = true
FROM (
  SELECT DISTINCT ON (category) id
  FROM hall_records
  ORDER BY category, record_value DESC, achieved_at DESC
) AS top_records
WHERE hr.id = top_records.id;

-- 5. Adicionar constraint único se não existir (previne futuras duplicatas)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'hall_records_unique_jogador_category'
  ) THEN
    ALTER TABLE hall_records 
    ADD CONSTRAINT hall_records_unique_jogador_category 
    UNIQUE (jogador_id, category);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- 6. Dropar tabela temporária
DROP TABLE IF EXISTS hall_records_to_keep;

-- Resultado: mostrar registros restantes
SELECT 
  hr.category,
  j.nickname,
  hr.record_value,
  hr.achieved_at,
  hr.is_current
FROM hall_records hr
JOIN jogadores j ON j.id = hr.jogador_id
ORDER BY hr.category, hr.record_value DESC;
