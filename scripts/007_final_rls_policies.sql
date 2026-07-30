-- Script final para corrigir todas as políticas RLS
-- Garante que admin@amaralinafc.com tenha permissão total

-- =====================================================
-- TABELA: jogadores
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS jogadores_select_all ON public.jogadores;
DROP POLICY IF EXISTS jogadores_insert_admin ON public.jogadores;
DROP POLICY IF EXISTS jogadores_update_admin ON public.jogadores;
DROP POLICY IF EXISTS jogadores_delete_admin ON public.jogadores;

-- Criar políticas novas
CREATE POLICY jogadores_select_all ON public.jogadores
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY jogadores_insert_admin ON public.jogadores
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email = 'admin@amaralinafc.com')
    )
  );

CREATE POLICY jogadores_update_admin ON public.jogadores
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email = 'admin@amaralinafc.com')
    )
  );

CREATE POLICY jogadores_delete_admin ON public.jogadores
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email = 'admin@amaralinafc.com')
    )
  );

-- =====================================================
-- TABELA: partidas
-- =====================================================

DROP POLICY IF EXISTS partidas_select_all ON public.partidas;
DROP POLICY IF EXISTS partidas_insert_admin ON public.partidas;
DROP POLICY IF EXISTS partidas_update_admin ON public.partidas;
DROP POLICY IF EXISTS partidas_delete_admin ON public.partidas;

CREATE POLICY partidas_select_all ON public.partidas
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY partidas_insert_admin ON public.partidas
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email = 'admin@amaralinafc.com')
    )
  );

CREATE POLICY partidas_update_admin ON public.partidas
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email = 'admin@amaralinafc.com')
    )
  );

CREATE POLICY partidas_delete_admin ON public.partidas
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email = 'admin@amaralinafc.com')
    )
  );

-- =====================================================
-- TABELA: partida_jogadores
-- =====================================================

DROP POLICY IF EXISTS partida_jogadores_select_all ON public.partida_jogadores;
DROP POLICY IF EXISTS partida_jogadores_insert_admin ON public.partida_jogadores;
DROP POLICY IF EXISTS partida_jogadores_update_admin ON public.partida_jogadores;
DROP POLICY IF EXISTS partida_jogadores_delete_admin ON public.partida_jogadores;

CREATE POLICY partida_jogadores_select_all ON public.partida_jogadores
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY partida_jogadores_insert_admin ON public.partida_jogadores
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email = 'admin@amaralinafc.com')
    )
  );

CREATE POLICY partida_jogadores_update_admin ON public.partida_jogadores
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email = 'admin@amaralinafc.com')
    )
  );

CREATE POLICY partida_jogadores_delete_admin ON public.partida_jogadores
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email = 'admin@amaralinafc.com')
    )
  );

-- =====================================================
-- TABELA: profiles
-- =====================================================

DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_delete_admin ON public.profiles;

CREATE POLICY profiles_select_all ON public.profiles
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (p.role = 'admin' OR p.email = 'admin@amaralinafc.com')
    )
  );

CREATE POLICY profiles_delete_admin ON public.profiles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (p.role = 'admin' OR p.email = 'admin@amaralinafc.com')
    )
  );

-- =====================================================
-- TABELA: app_settings
-- =====================================================

DROP POLICY IF EXISTS app_settings_select_all ON public.app_settings;
DROP POLICY IF EXISTS app_settings_insert_admin ON public.app_settings;
DROP POLICY IF EXISTS app_settings_update_admin ON public.app_settings;

CREATE POLICY app_settings_select_all ON public.app_settings
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY app_settings_insert_admin ON public.app_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email = 'admin@amaralinafc.com')
    )
  );

CREATE POLICY app_settings_update_admin ON public.app_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email = 'admin@amaralinafc.com')
    )
  );
