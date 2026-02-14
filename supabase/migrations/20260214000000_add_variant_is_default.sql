-- Add is_default column to product_variants to explicitly control default color

ALTER TABLE product_variants
ADD COLUMN is_default BOOLEAN DEFAULT false;

-- Create an index for performance
CREATE INDEX idx_product_variants_is_default ON product_variants(is_default);

-- Populate existing defaults based on current sort order (TIMESTAMP)
-- For each product, mark the FIRST variant (created_at ASC) as default
WITH first_variants AS (
    SELECT id 
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY created_at ASC) as rn
        FROM product_variants
        WHERE is_archived = false
    ) t 
    WHERE rn = 1
)
UPDATE product_variants
SET is_default = true
WHERE id IN (SELECT id FROM first_variants);

-- Ensure only one default per product (constraint check trigger function)
CREATE OR REPLACE FUNCTION check_single_default_variant()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        -- Unset is_default for other variants of this product
        UPDATE product_variants
        SET is_default = false
        WHERE product_id = NEW.product_id 
          AND id != NEW.id 
          AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_variant
BEFORE INSERT OR UPDATE OF is_default ON product_variants
FOR EACH ROW
WHEN (NEW.is_default = true)
EXECUTE FUNCTION check_single_default_variant();
