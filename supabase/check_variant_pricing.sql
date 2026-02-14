-- Check F1 Oversized Tee variant pricing data
SELECT 
    p.name as product_name,
    p.base_price,
    pv.color,
    pv.size,
    pv.stock,
    pv.actual_price,
    pv.discounted_price,
    pv.price_modifier,
    -- Calculate what the price should be
    COALESCE(
        pv.actual_price,
        COALESCE(pv.discounted_price, p.base_price + COALESCE(pv.price_modifier, 0))
    ) as calculated_price
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE p.name LIKE '%F1%OVERSIZED%'
ORDER BY pv.created_at, pv.size;

-- Also check Mercedes
SELECT 
    p.name as product_name,
    p.base_price,
    pv.color,
    pv.size,
    pv.stock,
    pv.actual_price,
    pv.discounted_price,
    pv.price_modifier,
    COALESCE(
        pv.actual_price,
        COALESCE(pv.discounted_price, p.base_price + COALESCE(pv.price_modifier, 0))
    ) as calculated_price
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
WHERE p.name LIKE '%MERCEDES%'
ORDER BY pv.created_at, pv.size
LIMIT 10;
