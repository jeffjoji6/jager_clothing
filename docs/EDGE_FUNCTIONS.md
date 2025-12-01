# Edge Functions Guide - Jager Clothing

## Overview

Supabase Edge Functions are used for secure server-side logic, primarily for payment processing.

## Available Functions

### 1. `create-razorpay-order`
*   **Purpose**: Creates an order on Razorpay securely using the Key Secret.
*   **Path**: `supabase/functions/create-razorpay-order/index.ts`
*   **Trigger**: Called by frontend during checkout.

### 2. `verify-razorpay-payment`
*   **Purpose**: Verifies the payment signature returned by Razorpay.
*   **Path**: `supabase/functions/verify-razorpay-payment/index.ts`
*   **Trigger**: Called by frontend after successful payment.

## Setup & Deployment

### 1. Install CLI
```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref <your-project-ref>
```

### 2. Set Secrets
```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxx
supabase secrets set RAZORPAY_KEY_SECRET=your_secret_key
```

### 3. Deploy
```bash
supabase functions deploy create-razorpay-order --no-verify-jwt
supabase functions deploy verify-razorpay-payment --no-verify-jwt
```

## Troubleshooting

*   **Function not found**: Ensure you deployed with the correct name.
*   **CORS Error**: The functions include CORS headers. If errors persist, check if the function is crashing (logs).
*   **Auth Error**: Ensure the client passes the `Authorization: Bearer <anon_key>` header (Supabase client does this automatically).

## Logs
View logs to debug issues:
```bash
supabase functions logs create-razorpay-order
supabase functions logs verify-razorpay-payment
```
