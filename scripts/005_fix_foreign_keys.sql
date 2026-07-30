-- Script para verificar e corrigir as foreign keys
-- Este script garante que as relações estejam corretas

-- Verificar se a FK de profiles.linked_player_id existe
-- Se não existir, criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_linked_player_id_fkey'
    AND table_name = 'profiles'
  ) THEN
    -- Adicionar FK se não existir
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_linked_player_id_fkey 
    FOREIGN KEY (linked_player_id) 
    REFERENCES jogadores(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Verificar se a FK de partida_jogadores.jogador_id existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'partida_jogadores_jogador_id_fkey'
    AND table_name = 'partida_jogadores'
  ) THEN
    ALTER TABLE partida_jogadores
    ADD CONSTRAINT partida_jogadores_jogador_id_fkey 
    FOREIGN KEY (jogador_id) 
    REFERENCES jogadores(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Verificar se a FK de partida_jogadores.partida_id existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'partida_jogadores_partida_id_fkey'
    AND table_name = 'partida_jogadores'
  ) THEN
    ALTER TABLE partida_jogadores
    ADD CONSTRAINT partida_jogadores_partida_id_fkey 
    FOREIGN KEY (partida_id) 
    REFERENCES partidas(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Garantir que linked_player_id em profiles possa ser NULL
ALTER TABLE profiles 
ALTER COLUMN linked_player_id DROP NOT NULL;

-- Confirmar que admin@amaralinafc.com é admin
UPDATE profiles SET role = 'admin' WHERE email = 'admin@amaralinafc.com';
