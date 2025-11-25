# Admin Panel Setup Guide

## Overview

The Jager Admin Panel provides a comprehensive dashboard for managing your e-commerce platform. It includes order management, customer CRM, product catalog, Jager Pro requests, analytics, and settings.

## Database Setup

1. **Run the Admin Schema SQL**

   Navigate to your Supabase SQL Editor and run the `supabase/admin-schema.sql` file. This creates:

   - `admin_users` table for role-based access control
   - `jager_pro_requests` table for custom design requests
   - `jager_basic_requests` table for basic custom orders
   - `order_history` table for tracking order changes
   - `customer_emails` table for email logs
   - `email_templates` table for email templates

2. **Update Orders Table**

   The admin schema adds columns to the orders table:

   - `order_type`: 'collection', 'basic_custom', 'pro_custom'
   - `tracking_number`: For shipping tracking
   - `notes`: Internal notes
   - Updated status enum to include: 'new', 'pending_print', 'printing', 'quality_check', 'ready_to_ship', 'shipped', 'delivered', 'cancelled'

3. **Fix RLS Policies (IMPORTANT - Fixes 500 Error)**

   If you encounter a 500 error when accessing `/admin`, run this fix in Supabase SQL Editor:

   ```sql
   -- Run supabase/fix-admin-rls.sql OR manually run:

   DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
   DROP POLICY IF EXISTS "Admins can manage admin users" ON admin_users;

   -- Allow users to view their own admin_users record (prevents circular dependency)
   CREATE POLICY "Users can view their own admin record" ON admin_users
     FOR SELECT USING (auth.uid() = id);

   -- Allow admins to view all admin users
   CREATE POLICY "Admins can view all admin users" ON admin_users
     FOR SELECT USING (
       EXISTS (
         SELECT 1 FROM admin_users
         WHERE id = auth.uid() AND role IN ('admin', 'staff')
       )
     );

   -- Allow admins to manage admin users
   CREATE POLICY "Admins can manage admin users" ON admin_users
     FOR ALL USING (
       EXISTS (
         SELECT 1 FROM admin_users
         WHERE id = auth.uid() AND role = 'admin'
       )
     );
   ```

4. **Create Your Admin User**

   After creating your account via the signup page, you need to add yourself as an admin:

   ```sql
   INSERT INTO admin_users (id, role, permissions)
   VALUES ('YOUR_USER_ID_HERE', 'admin', '{}');
   ```

   To find your user ID:

   - Go to Supabase Dashboard → Authentication → Users
   - Copy your user ID (UUID)
   - Or check your browser's localStorage/auth state

## Accessing the Admin Panel

1. Log in with your admin account
2. Navigate to `/admin` in your browser
3. You should see the dashboard

## Admin Panel Features

### 1. Dashboard

- Sales overview with total revenue and orders
- Revenue breakdown (Collection vs Custom)
- Order status summary
- **Urgent alerts** for overdue orders (>2 days in "New" or "Pending Print")
- New Jager Pro requests counter
- Top 5 selling products

### 2. Orders Management

- **Unified order list** for all order types
- **Filters**: Status, Type (Collection/Basic/Pro), Date range, Search
- **Order details page** with:
  - Customer information and shipping address
  - Products ordered with SKU, size, color, quantity
  - Order history log
  - Status update dropdown
  - Tracking number input
  - PDF packing slip generation (requires `jspdf` package)
  - Internal notes

**PDF Generation Setup:**

```bash
npm install jspdf @types/jspdf
```

Then uncomment the PDF generation code in `src/pages/admin/OrderDetail.tsx`.

### 3. Customers (CRM)

- Customer list with search
- Order history per customer
- Lifetime value calculation
- **Email functionality** - Send emails to customers
  - Note: Requires backend email service (SendGrid, Resend, etc.)
  - Email logs are saved to `customer_emails` table

**Email Service Setup:**
You'll need to set up an email service API endpoint. The frontend saves email logs, but actual sending requires a backend API.

### 4. Products

- Product catalog management
- Add/Edit/Delete products
- Manage product details:
  - Name, description, price
  - Category
  - Images (URLs)
  - Featured/New flags
- Product variants managed separately

### 5. Jager Pro Management

- View all custom design requests
- Status workflow:
  - New Request → Brief Review → Assigned to Designer → Design in Progress → Waiting for Approval → Approved
- Assign designers to requests
- Upload customer files and designer drafts
- Convert approved requests to orders

### 6. Reports & Analytics

- **Sales Report**: Revenue by day/week/month
- **Product Report**: Top selling products
- **Channel Report**: Revenue breakdown by Collection/Basic/Pro
- Charts and visualizations
- Date range filtering (Week, Month, Year)

### 7. Settings

- **User Management**: Create admin/staff/designer accounts
  - Note: Admin user creation requires backend API (Supabase Admin API)
- Email templates (coming soon)
- Shipping settings (coming soon)

## Role-Based Access

The admin panel supports three roles:

1. **Admin**: Full access to all features
2. **Staff**: Access to orders, customers, products (no settings access)
3. **Designer**: Access to Jager Pro requests and dashboard

Roles are managed in the `admin_users` table.

## Backend Requirements

Some features require backend APIs:

1. **Email Sending**:

   - Frontend saves email logs to database
   - Actual sending requires email service API (SendGrid, Resend, etc.)
   - See `src/pages/admin/Customers.tsx` for email implementation

2. **Admin User Creation**:

   - Creating new admin users requires Supabase Admin API
   - Should be done via backend API endpoint
   - See `src/pages/admin/Settings.tsx`

3. **Customer Email Fetching**:
   - Currently uses placeholder emails
   - In production, fetch from backend API or store email in addresses table
   - See `src/pages/admin/Customers.tsx`

## Environment Variables

No additional environment variables required for admin panel. Uses existing:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Testing

1. **Create Admin User**: Add yourself to `admin_users` table
2. **Test Dashboard**: Check stats and alerts
3. **Test Orders**: Create a test order and manage it through the workflow
4. **Test Jager Pro**: Submit a pro request and manage it
5. **Test Reports**: Verify sales data is displayed correctly

## Known Limitations

1. PDF generation requires `jspdf` package installation
2. Email sending requires backend email service
3. Admin user creation requires backend API
4. Customer emails are placeholders - needs backend API
5. Order conversion from Jager Pro needs implementation

## Future Enhancements

- [ ] Implement full PDF generation with company logo
- [ ] Integrate email service (SendGrid/Resend)
- [ ] Add barcode generation for packing slips
- [ ] Implement admin user creation API
- [ ] Add email template editor
- [ ] Add shipping zones configuration
- [ ] Add inventory management
- [ ] Add product variant management UI
- [ ] Add bulk order actions
- [ ] Add export functionality (CSV/Excel)

## Troubleshooting

**Can't access admin panel?**

- Check if your user ID exists in `admin_users` table
- Verify your role is 'admin', 'staff', or 'designer'
- Check browser console for errors

**Orders not showing?**

- Verify RLS policies allow admin access
- Check if orders table has `order_type` column
- Verify status values match the enum

**Dashboard stats are zero?**

- Check if orders exist in database
- Verify order statuses match expected values
- Check date filters

## Support

For issues or questions, refer to the main project documentation or contact the development team.
