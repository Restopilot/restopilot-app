-- =============================================
-- RestoPilot — Script de création Supabase
-- =============================================
-- Copiez ce script dans Supabase > SQL Editor > New Query > Run

-- Table des restaurants
CREATE TABLE restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  color TEXT DEFAULT '#007AFF',
  objectives JSONB DEFAULT '{"0":2800,"1":3000,"2":3200,"3":3500,"4":4200,"5":4800,"6":2500}',
  date_overrides JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des utilisateurs
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'manager' CHECK (role IN ('admin', 'manager')),
  restaurant_id UUID REFERENCES restaurants(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des saisies journalières
CREATE TABLE daily_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  date DATE NOT NULL,
  ca NUMERIC(10,2) NOT NULL DEFAULT 0,
  objectif NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, date)
);

-- Table des factures fournisseurs
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_entry_id UUID NOT NULL REFERENCES daily_entries(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  fournisseur TEXT NOT NULL,
  montant NUMERIC(10,2) NOT NULL,
  categorie TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_entries_resto_date ON daily_entries(restaurant_id, date);
CREATE INDEX idx_invoices_entry ON invoices(daily_entry_id);
CREATE INDEX idx_invoices_resto ON invoices(restaurant_id, date);

-- Activer Row Level Security (requis par Supabase)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policies : accès complet via la clé anon (usage interne entre collaborateurs)
CREATE POLICY "full_access" ON restaurants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON daily_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "full_access" ON invoices FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- Compte admin par défaut
-- Email : admin@restopilot.fr
-- Mot de passe : admin123
-- =============================================
INSERT INTO users (email, password_hash, name, role, restaurant_id)
VALUES ('admin@restopilot.fr', 'admin123', 'Administrateur', 'admin', NULL);
