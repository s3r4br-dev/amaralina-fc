-- Tabela para histórico de recordistas do Hall da Fama
-- Armazena todos os jogadores que já ocuparam o topo de cada categoria

CREATE TABLE IF NOT EXISTS hall_records (
  id SERIAL PRIMARY KEY,
  jogador_id INTEGER NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'artilheiro', 'assistencias', 'vitorias', etc.
  record_value NUMERIC NOT NULL, -- Valor do recorde na época
  achieved_at DATE NOT NULL DEFAULT CURRENT_DATE, -- Data em que atingiu o recorde
  is_current BOOLEAN DEFAULT true, -- Se ainda é o recordista atual
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_hall_records_jogador ON hall_records(jogador_id);
CREATE INDEX IF NOT EXISTS idx_hall_records_category ON hall_records(category);
CREATE INDEX IF NOT EXISTS idx_hall_records_current ON hall_records(is_current);

-- RLS Policies
ALTER TABLE hall_records ENABLE ROW LEVEL SECURITY;

-- Todos podem ler
CREATE POLICY hall_records_select_all ON hall_records
  FOR SELECT USING (true);

-- Apenas admins podem inserir/atualizar/deletar
CREATE POLICY hall_records_insert_admin ON hall_records
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY hall_records_update_admin ON hall_records
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY hall_records_delete_admin ON hall_records
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_hall_records_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hall_records_updated_at
  BEFORE UPDATE ON hall_records
  FOR EACH ROW
  EXECUTE FUNCTION update_hall_records_timestamp();
