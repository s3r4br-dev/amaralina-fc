-- Script para DESABILITAR RLS temporariamente para testes
-- Ou criar políticas que permitem TUDO para usuários autenticados

-- OPÇÃO 1: Desabilitar RLS completamente (mais simples para testes)
ALTER TABLE jogadores DISABLE ROW LEVEL SECURITY;
ALTER TABLE partidas DISABLE ROW LEVEL SECURITY;
ALTER TABLE partida_jogadores DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

-- Se preferir manter RLS ativo com políticas permissivas, use as linhas abaixo:

-- Primeiro, remover todas as políticas existentes
-- DROP POLICY IF EXISTS "jogadores_select_all" ON jogadores;
-- DROP POLICY IF EXISTS "jogadores_insert_auth" ON jogadores;
-- DROP POLICY IF EXISTS "jogadores_update_auth" ON jogadores;
-- DROP POLICY IF EXISTS "jogadores_delete_auth" ON jogadores;

-- DROP POLICY IF EXISTS "partidas_select_all" ON partidas;
-- DROP POLICY IF EXISTS "partidas_insert_auth" ON partidas;
-- DROP POLICY IF EXISTS "partidas_update_auth" ON partidas;
-- DROP POLICY IF EXISTS "partidas_delete_auth" ON partidas;

-- DROP POLICY IF EXISTS "partida_jogadores_select_all" ON partida_jogadores;
-- DROP POLICY IF EXISTS "partida_jogadores_insert_auth" ON partida_jogadores;
-- DROP POLICY IF EXISTS "partida_jogadores_update_auth" ON partida_jogadores;
-- DROP POLICY IF EXISTS "partida_jogadores_delete_auth" ON partida_jogadores;

-- Criar políticas simples que permitem TUDO para qualquer usuário autenticado
-- CREATE POLICY "allow_all_jogadores" ON jogadores FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all_partidas" ON partidas FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all_partida_jogadores" ON partida_jogadores FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "allow_all_app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);
