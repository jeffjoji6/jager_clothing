# Deploy to Render - Step by Step Guide

## Prerequisites

- ✅ Code pushed to GitHub repository
- ✅ Supabase project set up
- ✅ Environment variables ready

---

## Step 1: Push Code to GitHub

If you haven't already:

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/jagerclothing_frontend.git

# Push to GitHub
git push -u origin main
```

**Important:** Make sure `.env.local` is NOT committed (it's in `.gitignore`)

---

## Step 2: Create Render Account

1. Go to https://render.com
2. Sign up (you can use GitHub to sign in)
3. Verify your email if needed

---

## Step 3: Create New Static Site

1. In Render dashboard, click **"New +"** button
2. Select **"Static Site"**

---

## Step 4: Connect GitHub Repository

1. **Connect Repository**:
   - If first time: Click "Connect GitHub" and authorize Render
   - Select your repository: `jagerclothing_frontend`
   - Click "Connect"

2. **Configure Build**:
   - **Name**: `jager-clothing` (or your preferred name)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (or `.` if you want to be explicit)
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`

---

## Step 5: Set Environment Variables

This is crucial! Add all your environment variables:

1. Click **"Advanced"** at the bottom
2. Click **"Add Environment Variable"** for each:

   ```
   VITE_SUPABASE_URL = https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key-here
   VITE_RAZORPAY_KEY_ID = your-razorpay-key-id
   ```

3. **Important**: 
   - Use the **exact same names** (starting with `VITE_`)
   - Copy values from your `.env.local` file
   - Get Supabase keys from: Supabase Dashboard → Settings → API
   - Get Razorpay key from: Razorpay Dashboard → Settings → API Keys

---

## Step 6: Create Static Site

1. Click **"Create Static Site"**
2. Render will:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Build your app (`npm run build`)
   - Deploy to CDN

3. Wait 2-5 minutes for first deployment

---

## Step 7: Get Your Live URL

Once deployed, you'll get a URL like:
```
https://jager-clothing.onrender.com
```

Click on it to see your live site!

---

## Step 8: Test Production Site

1. **Test Homepage**: Should load correctly
2. **Test Authentication**: Sign up/login should work
3. **Test Products**: Collection should show products
4. **Check Console**: Open browser DevTools → Console for errors

---

## Step 9: Custom Domain (Optional)

If you want your own domain:

1. In Render dashboard, go to your Static Site
2. Click **"Settings"**
3. Scroll to **"Custom Domains"**
4. Click **"Add Custom Domain"**
5. Enter your domain (e.g., `shop.jagerclothing.com`)
6. Follow DNS configuration instructions
7. Render will automatically provision SSL certificate

---

## Environment Variables Checklist

Make sure these are set in Render:

- [ ] `VITE_SUPABASE_URL` - Your Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- [ ] `VITE_RAZORPAY_KEY_ID` - Your Razorpay key (optional if not using payments yet)

---

## Auto-Deploy on Push

By default, Render auto-deploys when you push to `main` branch:

1. Make changes locally
2. Commit: `git commit -m "Your changes"`
3. Push: `git push origin main`
4. Render automatically builds and deploys (2-5 minutes)

You can see deployment status in Render dashboard.

---

## Manual Deploy

To manually trigger deployment:

1. Go to your Static Site in Render
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## Troubleshooting

### Build Fails

**Error: "Build command failed"**
- Check build logs in Render dashboard
- Common issues:
  - Missing dependencies
  - TypeScript errors
  - Environment variables not set

**Fix:**
```bash
# Test build locally first
npm run build
# Fix any errors before deploying
```

### Site Shows "Blank Page"

**Possible causes:**
- Environment variables not set correctly
- Build output directory wrong
- Routes not configured

**Fix:**
- Check browser console for errors
- Verify `dist` folder has `index.html`
- Check environment variables are set in Render

### Environment Variables Not Working

**Check:**
- Variable names start with `VITE_`
- Values are correct (no extra spaces)
- You redeployed after adding variables

**Fix:**
- After adding env vars, trigger manual deploy
- Restart service if using Web Service

### CORS Errors

If you see CORS errors:
- This shouldn't happen with Supabase (they handle CORS)
- Check Supabase Dashboard → Settings → API → Allowed origins
- Add your Render URL: `https://your-app.onrender.com`

---

## Production Checklist

Before going live:

- [ ] All environment variables set in Render
- [ ] Test signup/login works
- [ ] Test products load correctly
- [ ] Test cart functionality
- [ ] Test checkout flow
- [ ] Check mobile responsiveness
- [ ] Set up custom domain (optional)
- [ ] Configure error monitoring (optional)

---

## Free Tier Limits

Render Free Tier:
- ✅ Static sites: Free forever
- ✅ 750 hours/month for Web Services
- ✅ Sleeps after 15 minutes of inactivity (for Web Services)
- ✅ Auto-sleep/wake

For production, consider:
- **Paid tier** for Web Services (no sleep)
- **Custom domains** work on free tier
- **SSL certificates** included free

---

## Next Steps After Deployment

1. ✅ Share your live URL
2. ✅ Test complete user flow
3. ✅ Set up Google Analytics (optional)
4. ✅ Configure error tracking (Sentry, etc.)
5. ✅ Set up backups (Supabase handles this)

---

## Quick Reference

**Render Dashboard**: https://dashboard.render.com

**Your Site URL**: Check in Render dashboard after deployment

**Update Site**: Just push to GitHub - auto-deploys!

**View Logs**: Render dashboard → Your site → "Logs" tab

---

## Success! 🎉

Your e-commerce site is now live!

Share your URL and start selling! 🚀

