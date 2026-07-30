-- Hall da Fama: Tabela de Premiações por Temporada
-- Armazena os vencedores anuais: Bola de Ouro, Chuteira de Ouro, Garçom de Elite, Luva de Ouro, Melhor Dupla

-- Tabela de premiações de temporada
CREATE TABLE IF NOT EXISTS season_awards (
  id SERIAL PRIMARY KEY,
  season_year INTEGER NOT NULL,
  award_type TEXT NOT NULL CHECK (award_type IN ('bola_de_ouro', 'chuteira_de_ouro', 'garcom_de_elite', 'luva_de_ouro', 'melhor_dupla')),
  jogador_id INTEGER REFERENCES jogadores(id) ON DELETE SET NULL,
  jogador2_id INTEGER REFERENCES jogadores(id) ON DELETE SET NULL, -- Para dupla (segundo jogador)
  stat_value NUMERIC DEFAULT 0,
  stat_description TEXT,
  awarded_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(season_year, award_type)
);

-- Tabela de recordes de partida única (imbatíveis)
CREATE TABLE IF NOT EXISTS match_records (
  id SERIAL PRIMARY KEY,
  record_type TEXT NOT NULL CHECK (record_type IN ('most_goals_single_match', 'most_assists_single_match', 'most_saves_single_match')),
  jogador_id INTEGER REFERENCES jogadores(id) ON DELETE SET NULL,
  partida_id INTEGER REFERENCES partidas(id) ON DELETE SET NULL,
  record_value INTEGER NOT NULL,
  achieved_at DATE NOT NULL,
  player_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_season_awards_year ON season_awards(season_year);
CREATE INDEX IF NOT EXISTS idx_season_awards_type ON season_awards(award_type);
CREATE INDEX IF NOT EXISTS idx_season_awards_jogador ON season_awards(jogador_id);
CREATE INDEX IF NOT EXISTS idx_match_records_type ON match_records(record_type);
CREATE INDEX IF NOT EXISTS idx_match_records_jogador ON match_records(jogador_id);

-- RLS para season_awards
ALTER TABLE season_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "season_awards_select_all" ON season_awards
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "season_awards_insert_admin" ON season_awards
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "season_awards_update_admin" ON season_awards
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "season_awards_delete_admin" ON season_awards
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- RLS para match_records
ALTER TABLE match_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_records_select_all" ON match_records
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "match_records_insert_admin" ON match_records
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "match_records_update_admin" ON match_records
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "match_records_delete_admin" ON match_records
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Inserir recordes de partida única conhecidos (exemplo: Guguete 7 gols)
-- Você pode ajustar os valores conforme os dados reais
INSERT INTO match_records (record_type, jogador_id, record_value, achieved_at, player_name)
SELECT 'most_goals_single_match', j.id, 7, '2024-01-01', 'Guguete'
FROM jogadores j WHERE j.nickname = 'Guguete' OR j.name ILIKE '%Guguete%'
ON CONFLICT DO NOTHING;
