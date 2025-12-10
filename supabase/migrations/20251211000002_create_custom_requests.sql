-- Create custom_design_requests table
CREATE TABLE IF NOT EXISTS custom_design_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  brief TEXT,
  quantity INTEGER,
  budget_range TEXT,
  status TEXT DEFAULT 'new', -- new, contacted, in_progress, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE custom_design_requests ENABLE ROW LEVEL SECURITY;

-- Policy for Public insertion (anyone can submit a request)
CREATE POLICY "Anyone can insert custom requests"
  ON custom_design_requests FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy for Users to see their own requests (optional, better for authenticated users)
CREATE POLICY "Users can view own requests"
  ON custom_design_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for Admins to manage everything
CREATE POLICY "Admins can manage all custom requests"
  ON custom_design_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
