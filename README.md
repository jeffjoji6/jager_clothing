# Jager Clothing

Premium streetwear and custom apparel e-commerce platform.

## Tech Stack

- React + TypeScript
- Vite
- Supabase (Backend & Database)
- Tailwind CSS
- shadcn/ui

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Documentation

See the `/docs` folder for detailed setup and configuration guides.

### Key Documentation Files

- **[Edge Function Quick Start](./docs/EDGE_FUNCTION_QUICK_START.md)** - ⚡ 5-minute setup guide
- **[Edge Function Setup](./docs/EDGE_FUNCTION_SETUP.md)** - Complete Edge Function setup guide
- **[Testing Plan](./docs/TESTING_PLAN.md)** - Comprehensive testing guide including Razorpay test mode setup
- **[Quick Testing Checklist](./docs/TESTING_CHECKLIST.md)** - Quick reference for testing
- **[Setup Guide](./docs/SETUP.md)** - Initial project setup
- **[Razorpay Backend](./docs/RAZORPAY_BACKEND.md)** - Backend integration guide

## Environment Variables

Create a `.env.local` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

**Note:**

- `VITE_RAZORPAY_KEY_ID` is required (get from Razorpay Dashboard → Test Mode → API Keys)
- `VITE_RAZORPAY_KEY_SECRET` is **NOT needed** in frontend (causes CORS errors)
- For production, set up Supabase Edge Functions (see [Razorpay Backend](./docs/RAZORPAY_BACKEND.md))
