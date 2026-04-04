
-- Create storage bucket for vehicle photos
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-photos', 'vehicle-photos', true) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload vehicle photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'vehicle-photos');

-- Allow public read
CREATE POLICY "Public can read vehicle photos" ON storage.objects FOR SELECT USING (bucket_id = 'vehicle-photos');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete vehicle photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'vehicle-photos');

-- Add foto_url column to movimentacoes
ALTER TABLE public.movimentacoes ADD COLUMN IF NOT EXISTS foto_url text DEFAULT NULL;
