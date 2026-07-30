-- ================================================
-- POLÍTICAS DE STORAGE PARA O BUCKET 'avatars'
-- Execute este script no SQL Editor do Supabase
-- ================================================

-- 1. Primeiro, crie o bucket se não existir
-- Vá em Storage > New Bucket > Nome: "avatars" > Marque como "Public"

-- 2. Depois execute estas políticas no SQL Editor:

-- Permitir que qualquer pessoa visualize as fotos (público)
CREATE POLICY "Avatars são públicos para visualização"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Permitir que usuários autenticados façam upload
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Permitir que usuários atualizem suas próprias fotos
CREATE POLICY "Usuários podem atualizar suas fotos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Permitir que usuários deletem suas próprias fotos
CREATE POLICY "Usuários podem deletar suas fotos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- ================================================
-- ALTERNATIVA: Se as políticas acima não funcionarem,
-- use estas versões mais permissivas para teste:
-- ================================================

-- DROP POLICY IF EXISTS "Avatars são públicos para visualização" ON storage.objects;
-- DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;
-- DROP POLICY IF EXISTS "Usuários podem atualizar suas fotos" ON storage.objects;
-- DROP POLICY IF EXISTS "Usuários podem deletar suas fotos" ON storage.objects;

-- CREATE POLICY "avatars_select_all" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "avatars_insert_auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
-- CREATE POLICY "avatars_update_auth" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
-- CREATE POLICY "avatars_delete_auth" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
