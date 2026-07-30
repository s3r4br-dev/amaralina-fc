-- Script para corrigir políticas RLS
-- Permite que admins façam operações de escrita

-- Primeiro, vamos recriar as políticas de jogadores para usar a verificação correta de admin
DROP POLICY IF EXISTS "jogadores_insert_admin" ON jogadores;
DROP POLICY IF EXISTS "jogadores_update_admin" ON jogadores;
DROP POLICY IF EXISTS "jogadores_delete_admin" ON jogadores;

-- Política de insert para admins
CREATE POLICY "jogadores_insert_admin" ON jogadores
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política de update para admins
CREATE POLICY "jogadores_update_admin" ON jogadores
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Política de delete para admins
CREATE POLICY "jogadores_delete_admin" ON jogadores
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Recriar políticas de partidas
DROP POLICY IF EXISTS "partidas_insert_admin" ON partidas;
DROP POLICY IF EXISTS "partidas_update_admin" ON partidas;
DROP POLICY IF EXISTS "partidas_delete_admin" ON partidas;

CREATE POLICY "partidas_insert_admin" ON partidas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "partidas_update_admin" ON partidas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "partidas_delete_admin" ON partidas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Recriar políticas de partida_jogadores
DROP POLICY IF EXISTS "partida_jogadores_insert_admin" ON partida_jogadores;
DROP POLICY IF EXISTS "partida_jogadores_update_admin" ON partida_jogadores;
DROP POLICY IF EXISTS "partida_jogadores_delete_admin" ON partida_jogadores;

CREATE POLICY "partida_jogadores_insert_admin" ON partida_jogadores
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "partida_jogadores_update_admin" ON partida_jogadores
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "partida_jogadores_delete_admin" ON partida_jogadores
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Garantir que o email admin@amaralinafc.com seja admin
UPDATE profiles SET role = 'admin' WHERE email = 'admin@amaralinafc.com';
