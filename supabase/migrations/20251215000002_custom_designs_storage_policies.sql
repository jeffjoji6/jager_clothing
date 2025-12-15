-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for custom designs if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-designs', 'custom-designs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public uploads to custom-designs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from custom-designs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to custom-designs" ON storage.objects;

-- Policy 1: Allow anyone (authenticated or not) to upload to custom-designs bucket
CREATE POLICY "Allow public uploads to custom-designs"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'custom-designs');

-- Policy 2: Allow anyone to read from custom-designs bucket (since it's public)
CREATE POLICY "Allow public reads from custom-designs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'custom-designs');

-- Policy 3: Allow authenticated users to update their own uploads (optional, for future use)
CREATE POLICY "Allow authenticated uploads to custom-designs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'custom-designs')
WITH CHECK (bucket_id = 'custom-designs');
