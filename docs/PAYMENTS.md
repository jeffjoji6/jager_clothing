# Payment Integration Guide - Jager Clothing

## Overview

We use **Razorpay** for payments. The integration follows a secure flow:
1.  **Order Creation**: Server-side (Edge Function) creates an order on Razorpay.
2.  **Checkout**: Client opens Razorpay Checkout.
3.  **Verification**: Server-side (Edge Function) verifies the payment signature.

## Architecture

### 1. Create Order
*   **Endpoint**: `create-razorpay-order`
*   **Input**: `{ amount, currency, receipt }`
*   **Output**: `{ id, amount, currency, ... }`

### 2. Verify Payment
*   **Endpoint**: `verify-razorpay-payment`
*   **Input**: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id }`
*   **Logic**:
    *   Generates HMAC SHA256 signature.
    *   Compares with `razorpay_signature`.
    *   If valid, updates Supabase order to `confirmed` and `paid`.

---

## Setup Instructions

### 1. Supabase Edge Functions

You must deploy two functions:

1.  `supabase/functions/create-razorpay-order`
2.  `supabase/functions/verify-razorpay-payment`

**Deploy Commands:**
```bash
supabase functions deploy create-razorpay-order --no-verify-jwt
supabase functions deploy verify-razorpay-payment --no-verify-jwt
```

### 2. Environment Variables

Set these secrets in your Supabase project:

```bash
supabase secrets set RAZORPAY_KEY_ID=your_key_id
supabase secrets set RAZORPAY_KEY_SECRET=your_key_secret
```

### 3. Frontend Configuration

Ensure `.env.local` has:
```env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

---

## Troubleshooting

### Common Issues

#### 1. "Payment failed" immediately
*   **Cause**: Test mode not enabled or wrong key.
*   **Fix**: Check Razorpay Dashboard is in **Test Mode** and `VITE_RAZORPAY_KEY_ID` starts with `rzp_test_`.

#### 2. Payment succeeds but order not updated
*   **Cause**: Verification failed or Edge Function error.
*   **Fix**: Check browser console for `Payment verification failed`. Ensure `RAZORPAY_KEY_SECRET` is set correctly in Supabase secrets.

#### 3. "International cards not supported"
*   **Cause**: Razorpay test mode limitation or account setting.
*   **Fix**: Use Indian test card: `4111 1111 1111 1111`.

### Test Cards

| Type | Card Number | CVV | Expiry |
| :--- | :--- | :--- | :--- |
| **Success** | `4111 1111 1111 1111` | 123 | Future |
| **Failure** | `4000 0000 0000 0002` | 123 | Future |

### Test Mode Bypass
For development without payments, set `VITE_ENABLE_TEST_PAYMENT_BYPASS=true` in `.env.local`.
