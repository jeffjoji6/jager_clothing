# Setup & Deployment Guide - Jager Clothing

## Overview

This guide covers the complete setup process for the Jager Clothing e-commerce platform, from local development to production deployment.

## Prerequisites

*   Node.js (v18+)
*   npm
*   Git
*   Supabase Account
*   Razorpay Account (for payments)
*   Render Account (for deployment)

---

## Phase 1: Local Development Setup

### 1. Clone & Install

```bash
git clone <repository-url>
cd jager_clothing
npm install
```

### 2. Supabase Setup

1.  **Create Project**: Go to [Supabase](https://supabase.com), create a new project (e.g., `jager-clothing`).
2.  **Database Schema**:
    *   Go to **SQL Editor**.
    *   Run the contents of `supabase/schema.sql`.
    *   (Optional) Run `supabase/custom-products-schema.sql` if you need custom product features.
3.  **Get Credentials**:
    *   Go to **Settings** → **API**.
    *   Copy **Project URL** and **anon public** key.

### 3. Environment Variables

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
VITE_ENABLE_TEST_PAYMENT_BYPASS=false
```

### 4. Run Locally

```bash
npm run dev
```
Open [http://localhost:8080](http://localhost:8080).

---

## Phase 2: Payment Integration (Razorpay)

For secure payments, you must set up Supabase Edge Functions.

### 1. Install Supabase CLI

```bash
brew install supabase/tap/supabase  # macOS
# OR see https://supabase.com/docs/guides/cli for other OS
```

### 2. Login & Link

```bash
supabase login
supabase link --project-ref your-project-ref-id
```

### 3. Deploy Edge Functions

```bash
supabase functions deploy create-razorpay-order --no-verify-jwt
supabase functions deploy verify-razorpay-payment --no-verify-jwt
```

### 4. Set Secrets

```bash
supabase secrets set RAZORPAY_KEY_ID=your_key_id
supabase secrets set RAZORPAY_KEY_SECRET=your_key_secret
```

See `docs/PAYMENTS.md` for detailed payment troubleshooting and verification logic.

---

## Phase 3: Deployment (Render)

### 1. Push to GitHub

Ensure your code is pushed to a GitHub repository.

### 2. Create Static Site on Render

1.  Go to [Render Dashboard](https://dashboard.render.com).
2.  Click **New +** → **Static Site**.
3.  Connect your GitHub repository.

### 3. Configure Build

*   **Build Command**: `npm run build`
*   **Publish Directory**: `dist`

### 4. Environment Variables

Add these in Render **Environment** settings:

*   `VITE_SUPABASE_URL`
*   `VITE_SUPABASE_ANON_KEY`
*   `VITE_RAZORPAY_KEY_ID`

### 5. Deploy

Click **Create Static Site**. Render will build and deploy your app.

---

## Troubleshooting

*   **Missing Env Vars**: Ensure `.env.local` exists locally and vars are set in Render for production.
*   **Database Errors**: Check if `schema.sql` was run successfully.
*   **Payment Failures**: Check `docs/PAYMENTS.md` and ensure Edge Functions are deployed.

## Quick Reference

*   **Local Dev**: `npm run dev`
*   **Build**: `npm run build`
*   **Supabase Dashboard**: [supabase.com/dashboard](https://supabase.com/dashboard)
