-- Phase 2: Crowdsourced Shrinkflation Reports

-- 1. Create the Reports SQL Table
CREATE TABLE shrink_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barcode TEXT NOT NULL,
  product_name TEXT NOT NULL,
  old_size TEXT NOT NULL,
  new_size TEXT NOT NULL,
  store_name TEXT,
  evidence_image_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table RLS securing the queue pipeline
ALTER TABLE shrink_reports ENABLE ROW LEVEL SECURITY;

-- Note: No INSERT policy is needed! The Next.js API route securely inserts records using the Service Role Key.
CREATE POLICY "Admins have full access to reports queue"
  ON shrink_reports FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- 3. Create the Storage Bucket for the photographic evidence
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shrink_evidence', 'shrink_evidence', true) 
ON CONFLICT (id) DO NOTHING;

-- 4. Storage RLS securing the bucket pipeline
-- Note: No INSERT policy is needed because the Next.js backend injects photos using Service Role
CREATE POLICY "Public can securely view evidence photos" 
  ON storage.objects FOR SELECT TO anon, authenticated 
  USING (bucket_id = 'shrink_evidence');

CREATE POLICY "Admins can manage evidence photos" 
  ON storage.objects FOR ALL TO authenticated 
  USING (bucket_id = 'shrink_evidence' AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
