-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC DEFAULT 0,
    usage_limit INT,
    used_count INT DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- Update orders table to support coupons
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- RLS Policies
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage coupons" ON coupons
    FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM admin_users WHERE role IN ('admin', 'staff')
    ));

-- Public cannot select directly (must use RPC)
-- No public SELECT policy.

-- RPC Function to validate coupon securely
CREATE OR REPLACE FUNCTION validate_coupon(
    code_input TEXT,
    cart_total NUMERIC
) RETURNS JSON AS $$
DECLARE
    coupon_record RECORD;
BEGIN
    -- normalize code
    code_input := UPPER(TRIM(code_input));

    SELECT * INTO coupon_record FROM coupons 
    WHERE code = code_input AND is_active = true;

    -- Checks
    IF coupon_record IS NULL THEN
        RETURN json_build_object('valid', false, 'message', 'Invalid coupon code');
    END IF;

    IF coupon_record.expires_at IS NOT NULL AND coupon_record.expires_at < NOW() THEN
        RETURN json_build_object('valid', false, 'message', 'Coupon expired');
    END IF;

    IF coupon_record.usage_limit IS NOT NULL AND coupon_record.used_count >= coupon_record.usage_limit THEN
        RETURN json_build_object('valid', false, 'message', 'Coupon usage limit reached');
    END IF;

    IF cart_total < coupon_record.min_order_amount THEN
        RETURN json_build_object('valid', false, 'message', 'Minimum order amount not met for this coupon');
    END IF;

    -- Calculate discount
    DECLARE
        discount NUMERIC := 0;
    BEGIN
        IF coupon_record.discount_type = 'percentage' THEN
            discount := (cart_total * coupon_record.discount_value) / 100;
        ELSE
            discount := coupon_record.discount_value;
        END IF;

        -- Ensure discount doesn't exceed total
        IF discount > cart_total THEN
            discount := cart_total;
        END IF;

        RETURN json_build_object(
            'valid', true,
            'discount', discount,
            'type', coupon_record.discount_type,
            'code', coupon_record.code,
            'message', 'Coupon applied successfully'
        );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to increment usage (should be called on successful order placement)
CREATE OR REPLACE FUNCTION increment_coupon_usage(code_input TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE coupons 
    SET used_count = used_count + 1 
    WHERE code = UPPER(TRIM(code_input));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to public/authenticated
GRANT EXECUTE ON FUNCTION validate_coupon(TEXT, NUMERIC) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_coupon_usage(TEXT) TO anon, authenticated;
