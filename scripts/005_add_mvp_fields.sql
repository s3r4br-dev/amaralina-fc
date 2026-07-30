-- Adicionar campos para MVP e Melhor da Posição
ALTER TABLE partida_jogadores
ADD COLUMN IF NOT EXISTS is_mvp BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_best_defender BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS best_position_type TEXT DEFAULT NULL;
-- best_position_type pode ser: 'zagueiro', 'lateral', ou NULL
