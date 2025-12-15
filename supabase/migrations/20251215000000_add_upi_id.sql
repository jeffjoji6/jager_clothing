-- Add UPI ID column to company_settings table
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS upi_id TEXT;
