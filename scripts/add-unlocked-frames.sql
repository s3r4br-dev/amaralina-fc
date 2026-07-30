-- Migration: Adicionar coluna unlocked_frames na tabela profiles
-- Para permitir que admins desbloqueiem molduras manualmente

-- Adicionar coluna unlocked_frames como array de texto
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS unlocked_frames text[] DEFAULT '{}';

-- Comentário explicativo
COMMENT ON COLUMN profiles.unlocked_frames IS 'Lista de molduras desbloqueadas manualmente (bronze, silver, gold, emerald, ruby, sapphire, diamond)';

-- Desbloquear todas as molduras para o admin
UPDATE profiles
SET unlocked_frames = ARRAY['bronze', 'silver', 'gold', 'emerald', 'ruby', 'sapphire', 'diamond']
WHERE email = 'admin@amaralinafc.com';
