-- Fix RLS policies to allow admin to insert/update/delete
-- Version 2.0 - Complete policy recreation

-- Drop existing policies and recreate with correct admin check
-- The admin check uses: auth.jwt() ->> 'email' = 'admin@amaralinafc.com'
-- OR checks the profiles table for role = 'admin'

-- JOGADORES TABLE
DROP POLICY IF EXISTS jogadores_insert_admin ON jogadores;
DROP POLICY IF EXISTS jogadores_update_admin ON jogadores;
DROP POLICY IF EXISTS jogadores_delete_admin ON jogadores;

CREATE POLICY jogadores_insert_admin ON jogadores
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'email' = 'admin@amaralinafc.com'
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY jogadores_update_admin ON jogadores
  FOR UPDATE TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@amaralinafc.com'
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY jogadores_delete_admin ON jogadores
  FOR DELETE TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@amaralinafc.com'
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- PARTIDAS TABLE
DROP POLICY IF EXISTS partidas_insert_admin ON partidas;
DROP POLICY IF EXISTS partidas_update_admin ON partidas;
DROP POLICY IF EXISTS partidas_delete_admin ON partidas;

CREATE POLICY partidas_insert_admin ON partidas
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'email' = 'admin@amaralinafc.com'
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY partidas_update_admin ON partidas
  FOR UPDATE TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@amaralinafc.com'
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY partidas_delete_admin ON partidas
  FOR DELETE TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@amaralinafc.com'
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- PARTIDA_JOGADORES TABLE
DROP POLICY IF EXISTS partida_jogadores_insert_admin ON partida_jogadores;
DROP POLICY IF EXISTS partida_jogadores_update_admin ON partida_jogadores;
DROP POLICY IF EXISTS partida_jogadores_delete_admin ON partida_jogadores;

CREATE POLICY partida_jogadores_insert_admin ON partida_jogadores
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'email' = 'admin@amaralinafc.com'
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY partida_jogadores_update_admin ON partida_jogadores
  FOR UPDATE TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@amaralinafc.com'
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY partida_jogadores_delete_admin ON partida_jogadores
  FOR DELETE TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@amaralinafc.com'
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- PROFILES TABLE
DROP POLICY IF EXISTS profiles_update_admin ON profiles;
DROP POLICY IF EXISTS profiles_delete_admin ON profiles;

CREATE POLICY profiles_update_admin ON profiles
  FOR UPDATE TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@amaralinafc.com'
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY profiles_delete_admin ON profiles
  FOR DELETE TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@amaralinafc.com'
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Ensure admin@amaralinafc.com has admin role in profiles
UPDATE profiles SET role = 'admin' WHERE email = 'admin@amaralinafc.com';
