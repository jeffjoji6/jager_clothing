-- Reorder F1 Oversized Tee variants to make GRAY the default color
-- This script updates the created_at timestamp to change the order

-- First, let's see the current order
SELECT 
    pv.id,
    p.name as product_name,
    pv.color,
    pv.size,
    pv.created_at
FROM product_variants pv
JOIN products p ON p.id = pv.product_id
WHERE p.name LIKE '%F1%OVERSIZED%'
ORDER BY pv.created_at;

-- Update GRAY variants to have earlier timestamps (making them first)
-- Update BLACK variants to have later timestamps (making them second)
-- Update WHITE variants to have even later timestamps (making them third)

DO $$
DECLARE
    product_id_var UUID;
    base_time TIMESTAMP;
BEGIN
    -- Get the F1 product ID
    SELECT id INTO product_id_var
    FROM products
    WHERE name LIKE '%F1%OVERSIZED%'
    LIMIT 1;

    -- Set a base timestamp (use a date in the past)
    base_time := '2024-01-01 00:00:00'::TIMESTAMP;

    -- Update GRAY variants to be first (earliest timestamp)
    UPDATE product_variants
    SET created_at = base_time + (ROW_NUMBER() OVER (ORDER BY size) || ' seconds')::INTERVAL
    WHERE product_id = product_id_var
    AND color = 'GREY';

    -- Update BLACK variants to be second
    UPDATE product_variants
    SET created_at = base_time + ((100 + ROW_NUMBER() OVER (ORDER BY size)) || ' seconds')::INTERVAL
    WHERE product_id = product_id_var
    AND color = 'BLACK';

    -- Update WHITE variants to be third
    UPDATE product_variants
    SET created_at = base_time + ((200 + ROW_NUMBER() OVER (ORDER BY size)) || ' seconds')::INTERVAL
    WHERE product_id = product_id_var
    AND color = 'WHITE';

    RAISE NOTICE 'Variants reordered successfully';
END $$;

-- Verify the new order
SELECT 
    pv.id,
    p.name as product_name,
    pv.color,
    pv.size,
    pv.created_at
FROM product_variants pv
JOIN products p ON p.id = pv.product_id
WHERE p.name LIKE '%F1%OVERSIZED%'
ORDER BY pv.created_at;
