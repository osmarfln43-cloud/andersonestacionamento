-- Create storage bucket for QR code images
INSERT INTO storage.buckets (id, name, public) VALUES ('qrcode-images', 'qrcode-images', true) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload qrcode images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'qrcode-images');

-- Allow public read
CREATE POLICY "Public can read qrcode images" ON storage.objects FOR SELECT USING (bucket_id = 'qrcode-images');

-- Allow authenticated users to update/delete their uploads
CREATE POLICY "Authenticated users can update qrcode images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'qrcode-images');
CREATE POLICY "Authenticated users can delete qrcode images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'qrcode-images');

-- Add qr_code_url column
ALTER TABLE public.configuracoes ADD COLUMN IF NOT EXISTS qr_code_url text DEFAULT NULL;