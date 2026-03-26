-- Enable Earthdistance extensions
CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "cube" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "earthdistance" WITH SCHEMA public;

-- Table: products
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  variant TEXT,
  current_size DECIMAL,
  unit TEXT,
  image_url TEXT,
  score INTEGER DEFAULT NULL,
  score_override INTEGER DEFAULT NULL,
  score_override_note TEXT,
  data_source TEXT DEFAULT 'manual',
  verified BOOLEAN DEFAULT false,
  hidden BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_score ON products(score);

-- Table: size_history
CREATE TABLE size_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  size DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  date_detected DATE NOT NULL,
  date_approximate BOOLEAN DEFAULT false,
  source TEXT NOT NULL,
  source_url TEXT,
  verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  evidence_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_size_history_product ON size_history(product_id);
CREATE INDEX idx_size_history_date ON size_history(date_detected);

-- Table: prices
CREATE TABLE prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_name TEXT,
  store_chain TEXT,
  store_location TEXT,
  price DECIMAL NOT NULL,
  price_per_unit DECIMAL,
  currency TEXT DEFAULT 'USD',
  date_recorded DATE NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prices_product ON prices(product_id);
CREATE INDEX idx_prices_store ON prices(store_chain);
CREATE INDEX idx_prices_date ON prices(date_recorded);

-- Table: stores
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  chain TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  lat DECIMAL,
  lng DECIMAL,
  scan_count INTEGER DEFAULT 0,
  last_scan_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stores_chain ON stores(chain);
CREATE INDEX idx_stores_location ON stores USING gist (
  ll_to_earth(lat, lng)
);

-- Table: product_lineage
CREATE TABLE product_lineage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  old_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  new_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  transition_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(old_product_id, new_product_id)
);

-- Table: swaps
CREATE TABLE swaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  alternative_id UUID REFERENCES products(id) ON DELETE CASCADE,
  swap_type TEXT NOT NULL,
  switch_count INTEGER DEFAULT 0,
  source TEXT DEFAULT 'algorithmic',
  sponsored BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, alternative_id)
);

CREATE INDEX idx_swaps_product ON swaps(product_id);

-- Table: profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  is_admin BOOLEAN DEFAULT false,
  is_pro BOOLEAN DEFAULT false,
  badge_level TEXT DEFAULT 'none',
  reports_submitted INTEGER DEFAULT 0,
  reports_verified INTEGER DEFAULT 0,
  pro_days_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ
);

-- Table: import_log
CREATE TABLE import_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  import_type TEXT NOT NULL,
  source TEXT NOT NULL,
  records_total INTEGER,
  records_created INTEGER,
  records_updated INTEGER,
  records_skipped INTEGER,
  records_errored INTEGER,
  error_details JSONB,
  imported_by TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Auto-update updated_at for products
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_modtime
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_log ENABLE ROW LEVEL SECURITY;

-- Admins Policy Generator Function (for succinctness, repeating the pattern)
-- Admins have full access to products
CREATE POLICY "Admins have full access to products"
  ON products FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Public can read non-hidden products"
  ON products FOR SELECT
  TO anon
  USING (hidden = false);

-- size_history Admin
CREATE POLICY "Admins have full access to size_history"
  ON size_history FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Public can read size_history" ON size_history FOR SELECT TO anon USING (true);
CREATE POLICY "Public authenticated can read size_history" ON size_history FOR SELECT TO authenticated USING (true);

-- prices Admin
CREATE POLICY "Admins have full access to prices"
  ON prices FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Public can read prices" ON prices FOR SELECT TO anon USING (true);
CREATE POLICY "Public authenticated can read prices" ON prices FOR SELECT TO authenticated USING (true);

-- stores Admin
CREATE POLICY "Admins have full access to stores"
  ON stores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Public can read stores" ON stores FOR SELECT TO anon USING (true);
CREATE POLICY "Public authenticated can read stores" ON stores FOR SELECT TO authenticated USING (true);

-- product_lineage Admin
CREATE POLICY "Admins have full access to product_lineage"
  ON product_lineage FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Public can read product_lineage" ON product_lineage FOR SELECT TO anon USING (true);
CREATE POLICY "Public authenticated can read product_lineage" ON product_lineage FOR SELECT TO authenticated USING (true);

-- swaps Admin
CREATE POLICY "Admins have full access to swaps"
  ON swaps FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
CREATE POLICY "Public can read swaps" ON swaps FOR SELECT TO anon USING (true);
CREATE POLICY "Public authenticated can read swaps" ON swaps FOR SELECT TO authenticated USING (true);

-- profiles Admin
-- (Removed recursive Admin policy to prevent 42P17 infinite recursion)
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- import_log Admin
CREATE POLICY "Admins have full access to import_log"
  ON import_log FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
