# Testing Guide - Jager Clothing

## Overview

This guide covers testing strategies for the Jager Clothing platform, including Razorpay payments.

## Pre-Testing Checklist

*   [ ] Razorpay Test Mode enabled.
*   [ ] Test API keys in `.env.local`.
*   [ ] Edge Functions deployed (for payments).
*   [ ] Test user accounts created.

## Testing Scenarios

### 1. Authentication
*   **Sign Up**: Verify email confirmation (if enabled) or immediate login.
*   **Login**: Test valid/invalid credentials.
*   **Password Reset**: Verify reset flow.

### 2. Shopping Flow
*   **Browse**: Home -> Collection -> Product Detail.
*   **Cart**: Add items, update quantity, remove items.
*   **Checkout**:
    *   Add/Edit shipping address.
    *   Verify shipping logic (Free > ₹2499).
    *   Verify tax calculation (18%).

### 3. Payments (Razorpay)

**Test Cards:**
*   **Success**: `4111 1111 1111 1111` (Any CVV/Expiry)
*   **Failure**: `4000 0000 0000 0002`

**Scenarios:**
1.  **Success**: Complete payment -> Order Confirmed -> Cart Cleared.
2.  **Failure**: Use failure card -> Error Message -> Order Cancelled.
3.  **Cancellation**: Close modal -> "Payment Cancelled" -> Order Cancelled.

### 4. Custom Lab
*   **Basic**: Upload image, select product, add to cart.
*   **Pro**: Submit request form, verify database entry.

### 5. Admin Panel
*   **Orders**: View, update status, generate packing slip.
*   **Products**: Add/Edit product, upload images.
*   **Jager Pro**: Manage requests.

## Test Mode Bypass

For rapid testing without the Razorpay modal, enable bypass mode in `.env.local`:

```env
VITE_ENABLE_TEST_PAYMENT_BYPASS=true
```

**Behavior:**
*   "Place Order" immediately simulates success.
*   Useful for UI/UX testing of the post-purchase flow.

## Troubleshooting

*   **Payment Failed**: Check console for errors. Verify `VITE_RAZORPAY_KEY_ID`.
*   **Order Not Created**: Check Supabase RLS policies.
*   **Admin 500 Error**: Run `supabase/fix-admin-rls.sql`.
