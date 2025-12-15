-- Add shipping settings columns to company_settings table
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS shipping_rate DECIMAL(10,2) DEFAULT 100.00;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS free_shipping_threshold DECIMAL(10,2) DEFAULT 499.00;
