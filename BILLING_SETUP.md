# Billing System with GST Setup Guide

## Overview

The billing system includes:

- **Invoice Generation**: Create invoices with automatic GST calculation
- **GST Breakdown**: CGST and SGST calculation (18% total, split 9% each)
- **Payment Tracking**: Track invoice payment status
- **PDF Generation**: Download invoices and packing slips as PDFs

## Database Setup

1. **Run the Billing Schema SQL**

   Navigate to your Supabase SQL Editor and run:

   ```sql
   -- Run supabase/billing-schema.sql
   ```

   This creates:

   - `invoices` table for invoice records
   - `invoice_items` table for line items
   - `company_settings` table for company/GST information
   - Helper functions for invoice number generation and GST calculation

2. **Configure Company Settings**

   Update your company information and GST details:

   ```sql
   UPDATE company_settings
   SET
     company_name = 'Jager Clothing',
     address = 'Your Company Address',
     city = 'Your City',
     state = 'Your State',
     zip = 'ZIP Code',
     phone = '+91 XXXXX XXXXX',
     email = 'info@jagerclothing.com',
     gstin = 'YOUR_GSTIN_HERE',
     default_tax_rate = 18.00,
     invoice_prefix = 'INV'
   WHERE id = '00000000-0000-0000-0000-000000000001';
   ```

## Features

### 1. Invoice Generation

- Automatic invoice number generation (format: `INV-YYYYMM-001`)
- GST calculation (default 18%)
- CGST/SGST split (9% each)
- Links to orders

### 2. PDF Generation

- **Packing Slip**: Shipping label with order contents
- **Invoice**: Tax invoice with GST breakdown
- Professional formatting
- Company logo and details

### 3. Payment Tracking

- Track payment status (Pending, Paid, Partial, Cancelled)
- Update payment dates
- Filter invoices by status

## Usage

### Creating an Invoice

1. Navigate to **Admin Panel → Billing**
2. Click **"Create Invoice"**
3. Select an order from the dropdown
4. Click **"Create Invoice with GST"**
5. Invoice is automatically generated with:
   - Unique invoice number
   - GST breakdown (CGST + SGST)
   - All order items

### Downloading PDFs

1. From **Order Details** page:

   - Click **"Generate Packing Slip"** for shipping label
   - Click **"Generate Invoice (GST)"** for tax invoice

2. From **Billing** page:
   - Click download icon (📥) next to any invoice
   - Invoice PDF will be generated

### Updating Payment Status

1. In **Billing** page
2. Use the dropdown to change payment status
3. Status updates automatically

## GST Calculation

The system uses **inclusive GST** calculation:

```
Subtotal = Item prices (including GST)
Taxable Amount = Subtotal / (1 + Tax Rate/100)
Total GST = Subtotal - Taxable Amount
CGST = Total GST / 2 (9%)
SGST = Total GST / 2 (9%)
Grand Total = Subtotal (already includes GST)
```

Example:

- Item Total: ₹10,000
- Taxable Amount: ₹8,474.58
- CGST (9%): ₹763.41
- SGST (9%): ₹763.41
- Total GST: ₹1,526.82
- Grand Total: ₹10,000

## Customization

### Update Company Info in PDFs

Edit `src/lib/pdfGenerator.ts`:

```typescript
const DEFAULT_COMPANY: CompanyInfo = {
  name: "Jager Clothing",
  address: "Your Company Address",
  city: "City",
  state: "State",
  zip: "ZIP Code",
  phone: "+91 XXXXX XXXXX",
  email: "info@jagerclothing.com",
  gstin: "GSTIN123456789",
};
```

Or update in database `company_settings` table.

### Change GST Rate

Default is 18%. To change:

```sql
UPDATE company_settings
SET default_tax_rate = 5.00  -- For 5% GST
WHERE id = '00000000-0000-0000-0000-000000000001';
```

### Invoice Number Format

Default: `INV-YYYYMM-001`

To customize, modify the `generate_invoice_number()` function in `billing-schema.sql`.

## Testing

1. **Create Test Invoice**:

   - Go to Billing page
   - Create invoice from an existing order
   - Verify GST calculation

2. **Download PDF**:

   - Click download on an invoice
   - Verify PDF format and GST breakdown

3. **Update Payment**:
   - Change payment status
   - Verify status updates correctly

## Troubleshooting

**Invoice creation fails?**

- Check if `generate_invoice_number()` function exists
- Verify order exists and has items
- Check company_settings table has default record

**GST calculation incorrect?**

- Verify tax_rate in company_settings
- Check `calculate_gst()` function exists
- Review GST calculation formula

**PDF not generating?**

- Check browser console for errors
- Verify jspdf package is installed: `npm list jspdf`
- Check company settings are configured

## Next Steps

- [ ] Configure actual company GSTIN
- [ ] Update company address and details
- [ ] Test invoice generation
- [ ] Set up automated invoice creation for orders
- [ ] Add email functionality to send invoices
