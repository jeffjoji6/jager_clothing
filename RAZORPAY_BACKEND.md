# Razorpay Backend Integration Guide

## Overview

Razorpay requires backend API endpoints to securely:

1. Create orders (you can't use Razorpay API keys directly from frontend)
2. Verify payment signatures
3. Handle webhooks

We'll use **Supabase Edge Functions** (recommended) as it's simpler and free.

---

## Option 1: Supabase Edge Functions (Recommended ✅)

### Step 1: Install Supabase CLI

```bash
# Install Supabase CLI globally
npm install -g supabase

# Verify installation
supabase --version
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window. Log in with your Supabase account.

### Step 3: Link Your Project

1. Go to your Supabase Dashboard
2. Go to **Settings** → **General**
3. Copy your **Project Reference ID** (looks like: `abcdefghijklmnop`)

Then run:

```bash
supabase link --project-ref your-project-ref-id
```

### Step 4: Create Edge Function

```bash
# Create a new function
supabase functions new create-razorpay-order

# Create another for payment verification
supabase functions new verify-razorpay-payment
```

This creates folders in `supabase/functions/`

### Step 5: Install Razorpay SDK

```bash
cd supabase/functions/create-razorpay-order
npm init -y
npm install razorpay
```

```bash
cd supabase/functions/verify-razorpay-payment
npm init -y
npm install razorpay
```

### Step 6: Create Order Function

Edit `supabase/functions/create-razorpay-order/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Razorpay from "npm:razorpay@2.9.2";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: Deno.env.get("RAZORPAY_KEY_ID") || "",
      key_secret: Deno.env.get("RAZORPAY_KEY_SECRET") || "",
    });

    // Get request body
    const { amount, currency = "INR", receipt } = await req.json();

    // Validate
    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
```

### Step 7: Create Verification Function

Edit `supabase/functions/verify-razorpay-payment/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import crypto from "https://deno.land/std@0.168.0/node/crypto.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id, payment_id, signature, order_db_id } = await req.json();

    // Verify signature
    const text = `${order_id}|${payment_id}`;
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET") || "";

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(text)
      .digest("hex");

    const isValid = generatedSignature === signature;

    if (!isValid) {
      throw new Error("Invalid payment signature");
    }

    // Update order in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (order_db_id) {
      await supabase
        .from("orders")
        .update({
          status: "confirmed",
          payment_status: "paid",
          razorpay_order_id: order_id,
          razorpay_payment_id: payment_id,
          razorpay_signature: signature,
        })
        .eq("id", order_db_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
```

### Step 8: Set Environment Variables

```bash
# Set secrets for Edge Functions
supabase secrets set RAZORPAY_KEY_ID=your_razorpay_key_id
supabase secrets set RAZORPAY_KEY_SECRET=your_razorpay_key_secret
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Get Service Role Key:**

- Supabase Dashboard → Settings → API
- Copy **service_role** key (NOT the anon key - this is secret!)

### Step 9: Deploy Functions

```bash
# Deploy all functions
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
```

### Step 10: Update Frontend

Update `src/lib/razorpay.ts` to use your Edge Functions:

```typescript
// Create Razorpay order via Supabase Edge Function
export const createRazorpayOrder = async (
  amount: number,
  receipt: string
): Promise<RazorpayOrderResponse> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { data, error } = await supabase.functions.invoke(
    "create-razorpay-order",
    {
      body: { amount, currency: "INR", receipt },
    }
  );

  if (error) throw error;
  return data;
};

// Verify payment via Supabase Edge Function
export const verifyRazorpayPayment = async (
  orderId: string,
  paymentId: string,
  signature: string,
  orderDbId: string
): Promise<boolean> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { data, error } = await supabase.functions.invoke(
    "verify-razorpay-payment",
    {
      body: {
        order_id: orderId,
        payment_id: paymentId,
        signature,
        order_db_id: orderDbId,
      },
    }
  );

  if (error) throw error;
  return data.success;
};
```

Update `src/pages/Checkout.tsx` to use these functions instead of the placeholder.

---

## Option 2: Node.js Backend on Render (Alternative)

If you prefer a separate backend service:

### Step 1: Create Backend Folder

```bash
mkdir backend
cd backend
npm init -y
npm install express razorpay cors dotenv
npm install -D @types/express @types/cors typescript ts-node nodemon
```

### Step 2: Create Express Server

Create `backend/server.ts`:

```typescript
import express from "express";
import Razorpay from "razorpay";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Create order
app.post("/api/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    });

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Verify payment
app.post("/api/verify-payment", async (req, res) => {
  try {
    const { order_id, payment_id, signature } = req.body;

    const crypto = require("crypto");
    const text = `${order_id}|${payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest("hex");

    const isValid = generatedSignature === signature;

    res.json({
      success: true,
      verified: isValid,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 3: Deploy to Render

1. Create `backend/render.yaml`:

```yaml
services:
  - type: web
    name: jager-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: RAZORPAY_KEY_ID
        sync: false
      - key: RAZORPAY_KEY_SECRET
        sync: false
      - key: PORT
        value: 3000
```

2. Push to GitHub
3. Connect to Render
4. Set environment variables
5. Deploy

---

## Recommendation

**Use Option 1 (Supabase Edge Functions)** because:

- ✅ No separate deployment needed
- ✅ Free tier available
- ✅ Serverless - scales automatically
- ✅ Easier to maintain
- ✅ Built into your Supabase project

---

## Testing

After setup:

1. Test order creation:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/create-razorpay-order \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1999, "receipt": "test123"}'
```

2. Test in your app - complete checkout flow

---

## Next Steps

After backend is set up:

1. Update frontend to use new API
2. Test complete payment flow
3. Deploy to production
