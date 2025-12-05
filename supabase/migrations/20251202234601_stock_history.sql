-- Stock History Table for Audit Trail
-- This table tracks all stock changes for inventory management

CREATE TABLE IF NOT EXISTS stock_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL, -- positive for additions, negative for deductions
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('order_placed', 'order_cancelled', 'manual_adjustment', 'restock', 'damaged', 'lost', 'returned')),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_history_variant ON stock_history(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_order ON stock_history(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_created ON stock_history(created_at DESC);

-- Enable RLS
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Admins can view all stock history" ON stock_history;
CREATE POLICY "Admins can view all stock history" ON stock_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

DROP POLICY IF EXISTS "Admins can insert stock history" ON stock_history;
CREATE POLICY "Admins can insert stock history" ON stock_history FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Function to automatically create stock history when stock changes
CREATE OR REPLACE FUNCTION log_stock_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if stock actually changed
  IF OLD.stock IS DISTINCT FROM NEW.stock THEN
    INSERT INTO stock_history (
      product_variant_id,
      change_amount,
      previous_stock,
      new_stock,
      reason,
      performed_by
    ) VALUES (
      NEW.id,
      NEW.stock - OLD.stock,
      OLD.stock,
      NEW.stock,
      'manual_adjustment', -- Default reason, can be overridden by application
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically log stock changes
-- Note: This will be triggered for ALL stock updates, including from Edge Functions
-- The Edge Function should explicitly insert into stock_history with the correct reason
DROP TRIGGER IF EXISTS trigger_log_stock_change ON product_variants;
-- CREATE TRIGGER trigger_log_stock_change
-- AFTER UPDATE ON product_variants
-- FOR EACH ROW
-- EXECUTE FUNCTION log_stock_change();
-- Commented out to avoid duplicate entries when Edge Function explicitly logs
