# Enhanced Products Management Setup

## Overview

The enhanced Products management system includes:
- **Image Upload**: Direct upload to Supabase Storage (no URLs needed)
- **Pricing**: Actual price and discounted price with discount percentage
- **Variants Management**: Detailed size/color/stock/price management per variant
- **Amazon Integration**: Add Amazon URLs and ASINs for reference
- **Detailed Information**: SKU, brand, material, care instructions

## Database Setup

### 1. Run Products Enhancement Schema

```sql
-- Run supabase/products-enhancement.sql in Supabase SQL Editor
```

This adds:
- `discounted_price` column to products
- `amazon_url` and `amazon_asin` columns
- `sku`, `brand`, `material`, `care_instructions` columns
- Enhanced variant pricing fields

### 2. Set Up Supabase Storage

#### Option A: Using SQL (Recommended)

Run `supabase/storage-setup.sql` in Supabase SQL Editor.

#### Option B: Manual Setup

1. Go to **Supabase Dashboard → Storage**
2. Click **"New bucket"**
3. Name: `product-images`
4. **Public bucket**: Yes (so images are accessible)
5. Click **"Create bucket"**

6. Go to **Storage → Policies → product-images**
7. Add these policies:

**Public Read Access:**
```sql
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');
```

**Admin Upload Access:**
```sql
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);
```

**Admin Delete Access:**
```sql
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  )
);
```

## Features

### 1. Tabbed Product Form

**Basic Info Tab:**
- Product name and description
- Category and SKU
- Brand
- Image upload (multiple images)
- Featured/New flags

**Pricing Tab:**
- Actual price
- Discounted price (shows discount %)
- Amazon URL
- Amazon ASIN

**Variants Tab:**
- Add/edit size and color combinations
- Stock quantity per variant
- Actual price per variant
- Discounted price per variant
- Visual table view of all variants

**Details Tab:**
- Material information
- Care instructions

### 2. Image Upload

- **Drag & drop** or click to upload
- Multiple images supported
- Automatic upload to Supabase Storage
- Image preview with delete option
- Images stored in `product-images` bucket

### 3. Variant Management

- **Size**: XS, S, M, L, XL, XXL, XXXL
- **Color**: Black, White, Red, Blue, Green, Grey, Navy, Olive, Brown
- **Stock**: Quantity available per variant
- **Pricing**: Can override product base price per variant
- **Real-time editing**: Update stock directly in table

### 4. Amazon Integration

- **Amazon URL**: Full product link for reference
- **Amazon ASIN**: Product identifier
- Quick link to view product on Amazon from admin panel

## Usage

### Adding a New Product

1. Click **"Add Product"** button
2. **Basic Info Tab**: Fill in name, description, upload images
3. **Pricing Tab**: Set actual price and discounted price (optional)
4. **Variants Tab**: Add size/color combinations with stock and prices
5. **Details Tab**: Add material and care instructions
6. Click **"Create Product"**

### Managing Variants

1. Go to **Variants Tab**
2. Select **Size** and **Color**
3. Enter **Stock** quantity
4. Enter **Price** (optional, uses base price if not set)
5. Enter **Discounted Price** (optional)
6. Click **+** to add variant
7. Edit stock directly in the variants table
8. Remove variants with trash icon

### Image Management

1. Click **"Upload Images"** button
2. Select one or multiple images
3. Images upload automatically
4. Preview appears below
5. Click **X** on any image to remove

## Product Display

Products now show:
- Discount badge (if discounted)
- Actual price and discounted price (crossed out)
- SKU information
- Amazon link (if added)
- All variants with stock levels

## Variant Pricing Logic

1. If variant has `actual_price` set → use that
2. If variant has `discounted_price` set → use that for display
3. Otherwise → use product `base_price` + `price_modifier`
4. Discount calculation: `((actual - discounted) / actual) * 100`

## Amazon Reference

The Amazon URL and ASIN fields are for:
- **Reference**: Compare prices with Amazon
- **Research**: See how products are listed on Amazon
- **Customer Support**: Quick access to product info
- **Future Integration**: Could auto-sync pricing/stock

## Storage Quota

Supabase free tier includes:
- 1GB storage
- 2GB bandwidth/month

Monitor usage in **Supabase Dashboard → Storage**

## Troubleshooting

**Images not uploading?**
- Check storage bucket exists: `product-images`
- Verify storage policies are set
- Check browser console for errors
- Ensure file size is reasonable (< 5MB recommended)

**Variants not saving?**
- Check if size/color combination already exists
- Verify all required fields are filled
- Check browser console for errors

**Discount not showing?**
- Ensure both actual_price and discounted_price are set
- Discount must be less than actual price

## Best Practices

1. **Image Optimization**: Compress images before upload (use tools like TinyPNG)
2. **Variant Naming**: Be consistent with size and color names
3. **Stock Updates**: Regularly update stock levels
4. **Amazon Sync**: Keep Amazon URLs updated for reference
5. **SKU Format**: Use consistent SKU format (e.g., `PROD-SIZE-COLOR-001`)

## Next Steps

- [ ] Set up storage bucket
- [ ] Run products enhancement schema
- [ ] Upload product images
- [ ] Create variants for existing products
- [ ] Add Amazon references for products

