-- Seed Products
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  -- 1. Jäger Oversized Tee - Midnight Black
  INSERT INTO products (name, description, base_price, category, images, featured, is_new)
  VALUES (
    'Jäger Oversized Tee - Midnight Black',
    'Premium heavyweight cotton oversized t-shirt. Features a boxy fit, dropped shoulders, and our signature Jäger branding. The ultimate streetwear staple.',
    1499.00,
    'T-Shirts',
    ARRAY['/products/oversized-black-front.png', '/products/oversized-black-back.png'],
    true,
    true
  ) RETURNING id INTO v_product_id;

  -- Variants for Black Tee
  INSERT INTO product_variants (product_id, size, color, stock) VALUES
  (v_product_id, 'S', 'Black', 50),
  (v_product_id, 'M', 'Black', 50),
  (v_product_id, 'L', 'Black', 50),
  (v_product_id, 'XL', 'Black', 50);

  -- 2. Jäger Oversized Tee - Stark White
  INSERT INTO products (name, description, base_price, category, images, featured, is_new)
  VALUES (
    'Jäger Oversized Tee - Stark White',
    'Clean, crisp, and effortlessly cool. This white oversized tee is crafted from premium cotton for maximum comfort and style.',
    1499.00,
    'T-Shirts',
    ARRAY['/products/oversized-white-front.png', '/products/oversized-white-back.png'],
    true,
    true
  ) RETURNING id INTO v_product_id;

  -- Variants for White Tee
  INSERT INTO product_variants (product_id, size, color, stock) VALUES
  (v_product_id, 'S', 'White', 50),
  (v_product_id, 'M', 'White', 50),
  (v_product_id, 'L', 'White', 50),
  (v_product_id, 'XL', 'White', 50);

  -- 3. Jäger Acid Wash Tee - Grunge Grey
  INSERT INTO products (name, description, base_price, category, images, featured, is_new)
  VALUES (
    'Jäger Acid Wash Tee - Grunge Grey',
    'Vintage-inspired acid wash finish for a unique, lived-in look. Each piece is individually treated, making it one-of-a-kind.',
    1699.00,
    'T-Shirts',
    ARRAY['/products/acid-wash-front.png', '/products/acid-wash-back.png'],
    true,
    true
  ) RETURNING id INTO v_product_id;

  -- Variants for Acid Wash Tee
  INSERT INTO product_variants (product_id, size, color, stock) VALUES
  (v_product_id, 'S', 'Grey', 30),
  (v_product_id, 'M', 'Grey', 30),
  (v_product_id, 'L', 'Grey', 30),
  (v_product_id, 'XL', 'Grey', 30);

END $$;
