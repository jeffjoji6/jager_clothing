-- Insert Test Product for ₹1
WITH test_product AS (
  INSERT INTO products (
    name, 
    description, 
    base_price, 
    category, 
    images, 
    featured, 
    is_new
  ) VALUES (
    'Test Product (₹1)', 
    'This is a test product for verifying payment flows. Price is ₹1.', 
    1.00, 
    'TEST', 
    ARRAY['https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=1000'], 
    false, 
    false
  ) RETURNING id
)
INSERT INTO product_variants (product_id, size, color, stock, price_modifier)
SELECT id, 'M', 'Black', 100, 0 FROM test_product
UNION ALL
SELECT id, 'L', 'White', 100, 0 FROM test_product;
