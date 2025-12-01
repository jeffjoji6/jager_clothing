# Admin Guide - Jager Clothing

## Overview

The Jager Admin Panel (`/admin`) allows management of orders, customers, products, and custom requests.

## Setup

1.  **Database Schema**: Run `supabase/admin-schema.sql`.
2.  **Create Admin User**:
    *   Sign up in the app.
    *   Get your User ID from Supabase Auth.
    *   Run SQL: `INSERT INTO admin_users (id, role) VALUES ('YOUR_ID', 'admin');`

## Features

### 1. Dashboard
*   Sales overview, revenue breakdown, and order status alerts.

### 2. Order Management
*   View/Edit orders.
*   Update status (New -> Processing -> Shipped).
*   Generate Packing Slips (PDF).

### 3. Product Management
*   **Basic Info**: Name, description, category.
*   **Pricing**: Base price, discounted price.
*   **Variants**: Manage size/color combinations and stock.
*   **Images**: Upload directly to Supabase Storage (`product-images` bucket).

### 4. Billing & Invoices
*   **Generate Invoices**: Automatic GST calculation (18% default).
*   **Download PDFs**: Tax Invoices and Packing Slips.
*   **Setup**:
    *   Run `supabase/billing-schema.sql`.
    *   Configure company details in `company_settings` table.

### 5. Jager Pro (Custom Requests)
*   Manage custom design requests.
*   Workflow: Request -> Design -> Approval -> Order.

## Configuration

### Storage
*   Create `product-images` bucket (Public).
*   Add RLS policies for public read and admin write.

### Billing Settings
Update `company_settings` table with your GSTIN and address.

```sql
UPDATE company_settings
SET company_name = 'Jager Clothing', gstin = 'YOUR_GSTIN'
WHERE id = '00000000-0000-0000-0000-000000000001';
```

## Troubleshooting

*   **500 Error on Admin Load**: RLS policies might be missing. Run `supabase/fix-admin-rls.sql`.
*   **Images Not Uploading**: Check Storage policies.
*   **Invoices Not Generating**: Ensure `billing-schema.sql` was run.
