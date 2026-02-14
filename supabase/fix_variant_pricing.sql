-- Comprehensive Fix: Pricing & Default Variant Logic (UPDATED)
-- 1. Fix standard prices (899/699)
-- 2. Reorder variants:
--    - F1 Oversized Tee: GRAY is Default (First) -> ₹899
--    - Porsche 911 GT3 RS: WHITE is Default (First) -> ₹699
--    - Jager GTR Nissan: BLACK is Default (First) -> ₹699
-- 3. Update product base_price and variant order

-- PART 1: Standardize Prices (Fix 1, 10, etc)
UPDATE product_variants SET actual_price = 899, discounted_price = NULL WHERE color IN ('GRAY', 'GREY', 'RED');
UPDATE product_variants SET actual_price = 699, discounted_price = NULL WHERE color IN ('BLACK', 'WHITE');

-- PART 2: Set Defaults (Reorder Variants)

-- Make GRAY the first variant for F1 Oversized Tee
DO $$
DECLARE
    pid UUID;
BEGIN
    SELECT id INTO pid FROM products WHERE name ILIKE '%F1%OVERSIZED%' LIMIT 1;
    IF pid IS NOT NULL THEN
        -- Shift timestamps to order: GRAY -> BLACK -> WHITE
        UPDATE product_variants SET created_at = '2024-01-01 00:00:00' WHERE product_id = pid AND color IN ('GREY', 'GRAY');
        UPDATE product_variants SET created_at = '2024-01-01 01:00:00' WHERE product_id = pid AND color = 'BLACK';
        UPDATE product_variants SET created_at = '2024-01-01 02:00:00' WHERE product_id = pid AND color = 'WHITE';
    END IF;
END $$;

-- Make WHITE the first variant for Porsche (User mentioned White is default)
DO $$
DECLARE
    pid UUID;
BEGIN
    SELECT id INTO pid FROM products WHERE name ILIKE '%PORSCHE%' LIMIT 1;
    IF pid IS NOT NULL THEN
        UPDATE product_variants SET created_at = '2024-01-01 00:00:00' WHERE product_id = pid AND color = 'WHITE';
        UPDATE product_variants SET created_at = '2024-01-01 01:00:00' WHERE product_id = pid AND color = 'BLACK';
        UPDATE product_variants SET created_at = '2024-01-01 02:00:00' WHERE product_id = pid AND color IN ('GREY', 'GRAY');
    END IF;
END $$;

-- Make BLACK the first variant for Jager GTR Nissan (User confirmed Black is default)
DO $$
DECLARE
    pid UUID;
BEGIN
    SELECT id INTO pid FROM products WHERE name ILIKE '%GTR%NISSAN%' LIMIT 1;
    IF pid IS NOT NULL THEN
        UPDATE product_variants SET created_at = '2024-01-01 00:00:00' WHERE product_id = pid AND color = 'BLACK';
        UPDATE product_variants SET created_at = '2024-01-01 01:00:00' WHERE product_id = pid AND color IN ('GREY', 'GRAY');
        UPDATE product_variants SET created_at = '2024-01-01 02:00:00' WHERE product_id = pid AND color = 'WHITE';
    END IF;
END $$;

-- PART 3: Sync Product Base Price with FIRST Variant Price
-- This ensures Collection Page shows the price of the Default Variant
UPDATE products p
SET base_price = COALESCE(
    (SELECT pv.actual_price 
     FROM product_variants pv 
     WHERE pv.product_id = p.id 
       AND pv.is_archived = false
     ORDER BY pv.created_at ASC
     LIMIT 1),
    p.base_price
);

-- Verify Results
SELECT 
    p.name,
    p.base_price as "Collection Price",
    (SELECT color FROM product_variants WHERE product_id = p.id ORDER BY created_at ASC LIMIT 1) as "Default Color",
    (SELECT actual_price FROM product_variants WHERE product_id = p.id ORDER BY created_at ASC LIMIT 1) as "Default Price"
FROM products p
WHERE p.name LIKE '%F1%' OR p.name LIKE '%PORSCHE%' OR p.name LIKE '%MERCEDES%' OR p.name LIKE '%NISSAN%';
