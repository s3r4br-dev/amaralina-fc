-- Índices para melhorar performance das consultas

-- Índice na coluna date para filtros por período
CREATE INDEX IF NOT EXISTS idx_partidas_date ON partidas(date DESC);

-- Índice na coluna status para filtrar partidas finalizadas
CREATE INDEX IF NOT EXISTS idx_partidas_status ON partidas(status);

-- Índice composto para filtros frequentes de partidas
CREATE INDEX IF NOT EXISTS idx_partidas_date_status ON partidas(date DESC, status);

-- Índices para partida_jogadores (tabela de junção)
CREATE INDEX IF NOT EXISTS idx_partida_jogadores_partida_id ON partida_jogadores(partida_id);
CREATE INDEX IF NOT EXISTS idx_partida_jogadores_jogador_id ON partida_jogadores(jogador_id);

-- Índice composto para consultas que buscam por partida e jogador
CREATE INDEX IF NOT EXISTS idx_partida_jogadores_partida_jogador ON partida_jogadores(partida_id, jogador_id);

-- Índice para jogadores por status (ativos/inativos)
CREATE INDEX IF NOT EXISTS idx_jogadores_status ON jogadores(status);

-- Índice para profiles por email (para busca de login)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Índice para profiles por role (admin/user)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
