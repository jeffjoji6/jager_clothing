# Setup Guide - Jäger Clothing E-Commerce

## Phase 1: Supabase Setup

### Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project" and sign up (free tier is available)
3. Create a new project
   - Choose an organization
   - Name: `jager-clothing` (or your preferred name)
   - Database Password: **Save this password!** You'll need it later
   - Region: Choose closest to you (for India, use `ap-south-1`)
   - Click "Create new project"
   - Wait 2-3 minutes for project to be ready

### Step 2: Run Database Schema

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Open the file `supabase/schema.sql` from this project
4. Copy ALL the SQL code from that file
5. Paste it into the Supabase SQL Editor
6. Click "Run" (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned" - this means it worked!

### Step 3: Get API Keys

1. In Supabase dashboard, go to **Settings** → **API** (left sidebar)
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 4: Create Environment Variables File

1. In your project root, create a file named `.env.local`
2. Add these lines (replace with YOUR values from Step 3):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id (optional for now)
```

**Important:**

- Never commit `.env.local` to git (it's already in `.gitignore`)
- Use the actual values from your Supabase dashboard

### Step 5: Test Locally

1. Run `npm install` (if you haven't already)
2. Run `npm run dev`
3. Open http://localhost:8080
4. Try to sign up for an account
5. Check Supabase dashboard → **Authentication** → **Users** to see if your account was created

---

## Phase 2: Add Products (Optional - For Testing)

### Option A: Via Supabase Dashboard

1. Go to **Table Editor** in Supabase
2. Click on `products` table
3. Click "Insert" → "Insert row"
4. Add a product:
   - name: "OVERSIZED HOODIE - BLACK"
   - base_price: 1999
   - category: "HOODIES"
   - images: `["/product-hoodie-black.jpg"]` (or use Supabase Storage URLs)
   - featured: true
   - is_new: true
5. Click "Save"

6. Then add variants in `product_variants` table:
   - product_id: (the ID from the product you just created)
   - size: "M"
   - color: "BLACK"
   - stock: 10
   - price_modifier: 0

### Option B: Via SQL (Faster)

You can run this in SQL Editor to add sample products:

```sql
-- Insert sample product
INSERT INTO products (name, description, base_price, category, images, featured, is_new)
VALUES (
  'OVERSIZED HOODIE - BLACK',
  'Premium 400 GSM heavyweight cotton blend. Oversized fit with dropped shoulders.',
  1999,
  'HOODIES',
  ARRAY['/product-hoodie-black.jpg'],
  true,
  true
) RETURNING id;

-- Then use the returned ID to insert variants
-- (Replace PRODUCT_ID with the ID returned above)
INSERT INTO product_variants (product_id, size, color, stock, price_modifier)
VALUES
  ('PRODUCT_ID', 'S', 'BLACK', 10, 0),
  ('PRODUCT_ID', 'M', 'BLACK', 10, 0),
  ('PRODUCT_ID', 'L', 'BLACK', 10, 0),
  ('PRODUCT_ID', 'XL', 'BLACK', 10, 0),
  ('PRODUCT_ID', 'XXL', 'BLACK', 10, 0);
```

---

## Phase 3: Razorpay Setup (For Payments)

### Step 1: Create Razorpay Account

1. Go to https://razorpay.com
2. Sign up for an account
3. Complete KYC verification (required for live payments)
4. Get your API keys from Dashboard → Settings → API Keys

### Step 2: Add Razorpay Key to .env.local

```env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx (use test key for development)
```

### Step 3: Backend API for Razorpay (REQUIRED)

**Important:** Razorpay order creation MUST be done on backend for security.

You need to create a backend API endpoint that:

1. Creates Razorpay orders
2. Verifies payment signatures
3. Updates order status

**Option A: Use Supabase Edge Functions** (Recommended - simpler)

- Create a Supabase Edge Function to handle Razorpay order creation
- Deploy it to Supabase

**Option B: Create Node.js Backend on Render** (More control)

- Create Express.js API
- Deploy to Render
- Update `src/lib/razorpay.ts` to call your backend API

**For now:** The checkout will work but payment will fail until backend is set up. You can test the rest of the flow.

---

## Phase 4: Image Storage (Optional but Recommended)

### Upload Product Images to Supabase Storage

1. In Supabase, go to **Storage**
2. Create a bucket named `product-images`
3. Make it public
4. Upload your product images
5. Get the public URLs and use them in product `images` array

Example:

```sql
UPDATE products
SET images = ARRAY['https://xxxxx.supabase.co/storage/v1/object/public/product-images/hoodie.jpg']
WHERE id = 'your-product-id';
```

---

## Current Status Check

### ✅ Ready to Run (Local Testing)

- ✅ Frontend code complete
- ✅ Supabase integration ready
- ✅ Database schema ready
- ✅ Supabase setup + environment variables (COMPLETED)
- ✅ Sample products to test (COMPLETED)

### ⚠️ Needs Backend Work

- ❌ Razorpay order creation (must be on backend)
- ❌ Payment verification webhook
- ❌ Order status updates

### 🚀 Ready for Deployment

- ✅ Build configuration ready
- ✅ Environment variables configured
- ⚠️ Needs: Supabase production setup
- ⚠️ Needs: Razorpay production keys
- ⚠️ Needs: Backend API deployment (for payments)

---

## Quick Start Checklist

- [x] Create Supabase account
- [x ] Create Supabase project
- [ x] Run `supabase/schema.sql` in SQL Editor
- [x ] Copy Supabase URL and anon key
- [x ] Create `.env.local` file with keys
- [x ] Run `npm run dev` and test signup/login
- [x ] Add at least 1 product + variants
- [x ] Test adding items to cart
  - [ ] Set up Razorpay backend API → See `RAZORPAY_BACKEND.md`
  - [ ] Deploy to Render → See `DEPLOY_RENDER.md`

---

## Next Phase After Setup

1. **Product Management**

   - Add all your products
   - Upload product images
   - Set inventory levels

2. **Payment Integration**

   - Build backend API for Razorpay
   - Test payment flow
   - Set up webhooks

3. **Testing**

   - Test complete order flow
   - Test cart persistence
   - Test user authentication

4. **Deployment**

   - Deploy frontend to Render
   - Deploy backend to Render (if needed)
   - Configure custom domain
   - Set up production environment variables

5. **Admin Features** (Future)
   - Admin dashboard for orders
   - Product management UI
   - Inventory management

---

## Troubleshooting

### "Missing Supabase environment variables" error

- Check `.env.local` file exists
- Verify variable names start with `VITE_`
- Restart dev server after adding env vars

### Database errors

- Verify schema.sql ran successfully
- Check table names match exactly
- Ensure RLS policies are enabled

### Authentication not working

- Check Supabase project is active
- Verify API keys are correct
- Check Supabase dashboard → Authentication → Settings

### Cart not persisting

- Check if user is logged in
- Verify cart table exists
- Check browser console for errors

---

## Implementation Guides

- **Razorpay Backend Setup**: See `RAZORPAY_BACKEND.md` for detailed instructions
- **Render Deployment**: See `DEPLOY_RENDER.md` for step-by-step deployment guide

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Razorpay Docs: https://razorpay.com/docs
- Render Docs: https://render.com/docs
