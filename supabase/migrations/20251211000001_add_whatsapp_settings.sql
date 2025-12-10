-- Add whatsapp_number column to company_settings table
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '';

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
