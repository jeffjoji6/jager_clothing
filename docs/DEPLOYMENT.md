# Deployment Guide: Hosting on Render

This guide explains how to host the **Jager Clothing** frontend on [Render](https://render.com) and connect it to your Supabase backend.

## Prerequisites
- A [GitHub](https://github.com) account (where your code is pushed).
- A [Render](https://render.com) account.
- Your **Supabase Project URL** and **Anon Key**.

## Step 1: Push Code to GitHub
Ensure your latest code is pushed to a GitHub repository.
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Step 2: Create a Static Site on Render
1.  Log in to your [Render Dashboard](https://dashboard.render.com).
2.  Click **New +** and select **Static Site**.
3.  Connect your GitHub account and select the `jager_clothing` repository.
4.  Configure the following settings:
    -   **Name:** `jager-clothing` (or your preferred name)
    -   **Branch:** `main`
    -   **Root Directory:** `.` (leave empty or dot)
    -   **Build Command:** `npm run build`
    -   **Publish Directory:** `dist`

## Step 3: Configure Environment Variables
Render needs your Supabase keys to connect to the backend.

1.  Scroll down to the **Environment Variables** section.
2.  Add the following keys (copy values from your local `.env` or Supabase Dashboard):

| Key | Value |
| :--- | :--- |
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `your-long-anon-key-string` |
| `VITE_RAZORPAY_KEY_ID` | `rzp_test_...` (or live key) |
| `VITE_ENABLE_TEST_PAYMENT_BYPASS` | `false` (set to `true` ONLY if testing) |

3.  Click **Create Static Site**.

## Step 4: Update Supabase Auth Settings
Since your site domain will change (e.g., `https://jager-clothing.onrender.com`), you need to tell Supabase to allow logins from this new URL.

1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Navigate to **Authentication** -> **URL Configuration**.
3.  Add your Render URL (e.g., `https://jager-clothing.onrender.com`) to the **Site URL** and **Redirect URLs**.
4.  Click **Save**.

## Step 5: Verify Deployment
1.  Wait for the build to finish on Render.
2.  Click the URL provided by Render (e.g., `https://jager-clothing.onrender.com`).
3.  Test the site:
    -   **Login/Signup:** Ensure you can log in.
    -   **Products:** Check if products load.
    -   **Cart/Checkout:** Verify the flow works.

## Troubleshooting
-   **404 on Refresh:** If refreshing a page gives a 404 error, you need to configure a Rewrite rule in Render.
    -   Go to **Settings** -> **Redirects/Rewrites**.
    -   Add a rule:
        -   **Source:** `/*`
        -   **Destination:** `/index.html`
        -   **Action:** `Rewrite`
