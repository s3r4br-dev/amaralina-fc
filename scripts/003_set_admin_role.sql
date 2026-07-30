-- Atualiza o role do admin@amaralinafc.com para 'admin'
UPDATE profiles 
SET role = 'admin' 
WHERE LOWER(email) = 'admin@amaralinafc.com';

-- Confirma a atualização
SELECT id, email, name, role, status FROM profiles WHERE LOWER(email) = 'admin@amaralinafc.com';
