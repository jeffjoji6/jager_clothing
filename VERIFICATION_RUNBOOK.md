# Verification Runbook - Jager Clothing

This runbook outlines the step-by-step process to verify the entire application, ensuring every feature and button works as expected.

## Phase 1: Authentication & User Profile
**Goal:** Verify user onboarding and account management.

1.  **Sign Up (New User)**
    *   [ x] Navigate to `/signup`.
    *   [ x] Enter valid email, password, and name.
    *   [ x] Submit form.
    *   [ x] Verify redirection to Home or Login.
    *   [x ] Check Supabase Auth (if possible) or verify login works immediately.

2.  **Login**
    *   [x ] Navigate to `/login`.
    *   [x ] Enter invalid credentials -> Verify error message.
    *   [ x] Enter valid credentials -> Verify redirection to Home.

3.  **Forgot Password**
    *   [ x] Navigate to `/auth/forgot-password`.
    *   [ x] Enter email -> Verify success message (email sending might be mocked or require SMTP).

4.  **Profile Management**
    *   [x ] Navigate to `/profile`.
    *   [ x] Verify user details are displayed.
    *   [x ] **Addresses**:
        *  x [ ] Click "Add Address".
        *   [ ]x Fill form (Name, Street, City, State, ZIP, Phone).
        *   [x ] Save -> Verify address appears in list.
        *   [x ] Edit address -> Change a field -> Save -> Verify update.
        *   [x] Delete address -> Verify removal.

## Phase 2: Core Shopping Experience
**Goal:** Verify browsing and cart functionality.

1.  **Homepage**
    *   [x ] Verify Hero section loads.
    *   [ x] Click "SHOP THE DROP" -> Verify navigation to `/collection`.
    *   [ xx] Verify Featured Products section displays items.
    *   [ x] Click a product card -> Verify navigation to `/product/:id`.

2.  **Collection Page**
    *   [ x] Verify all products load.
    *   [ ] **Filters**:
        *   [x ] Select Category (e.g., Hoodies) -> Verify list updates.
        *   [x ] Select Size/Color -> Verify list updates.
    *   [ ] **Sorting**:
        *   [x ] Change sort to "Price: Low to High" -> Verify order.

3.  **Product Details**
    *   [x ] Verify Image Gallery (click thumbnails if multiple).
    *   [ x] Select Size (Required) -> Verify "Add to Cart" enables.
    *   [ x] Select Quantity.
    *   [x ] Click "Add to Cart" -> Verify success toast/notification.
    *   [x ] Verify Cart icon badge updates.

4.  **Cart**
    *   [ x] Click Cart icon -> Open Cart drawer/page.
    *   [ x] Verify item details (Name, Size, Price).
    *   [ x] Increase Quantity -> Verify Subtotal updates.
    *   [ x] Decrease Quantity -> Verify Subtotal updates.
    *   [ x] Remove Item -> Verify item disappears.

## Phase 3: Checkout & Payments
**Goal:** Verify order placement and payment processing.

1.  **Checkout Flow**
    *   [ ] Add item to cart -> Proceed to Checkout.
    *   [ ] **Shipping Address**:
        *   [ ] Select existing address OR add new one.
    *   [ ] **Order Summary**:
        *   [ ] Verify Subtotal.
        *   [ ] Verify Shipping (Free if > ₹2499, else ₹99).
        *   [ ] Verify Tax (18%).
        *   [ ] Verify Total.

2.  **Payment (Razorpay Test Mode)**
    *   [ ] Click "Place Order".
    *   [ ] **Scenario A: Success**
        *   [ ] Razorpay Modal opens.
        *   [ ] Card: `4111 1111 1111 1111`.
        *   [ ] Pay -> Verify redirection to Order Confirmation.
        *   [ ] Verify Order ID and Status ("Confirmed").
    *   [ ] **Scenario B: Failure (Optional)**
        *   [ ] Use Card: `4000 0000 0000 0002`.
        *   [ ] Verify error handling.

3.  **Order History**
    *   [ ] Navigate to `/orders`.
    *   [ ] Verify new order appears in list.
    *   [ ] Click Order -> Verify details.

## Phase 4: Admin Panel
**Goal:** Verify back-office operations.

1.  **Access**
    *   [ ] Navigate to `/admin`.
    *   [ ] Verify Dashboard loads (Stats, Charts).

2.  **Order Management**
    *   [ ] Navigate to "Orders".
    *   [ ] Find the order created in Phase 3.
    *   [ ] **Status Update**:
        *   [ ] Change status to "Processing" -> Save.
        *   [ ] Verify status update in list.
    *   [ ] **Packing Slip**:
        *   [ ] Click "Generate Packing Slip" -> Verify PDF download.

3.  **Product Management**
    *   [ ] Navigate to "Products".
    *   [ ] **Add Product**:
        *   [ ] Fill details (Name, Price, Category).
        *   [ ] Upload Image.
        *   [ ] Add Variants (Size/Color/Stock).
        *   [ ] Save -> Verify product appears in list.
    *   [ ] **Edit Product**:
        *   [ ] Change price -> Save.

## Phase 5: Custom Lab (Test Last)
**Goal:** Verify custom design flows.

1.  **Basic Custom Lab**
    *   [ ] Navigate to `/custom-lab/basic`.
    *   [ ] Upload Image.
    *   [ ] Select Product/Color/Size.
    *   [ ] Add to Cart -> Verify cart item.

2.  **Pro Custom Lab**
    *   [ ] Navigate to `/custom-lab/pro`.
    *   [ ] Fill Request Form.
    *   [ ] Submit -> Verify success (Database entry/WhatsApp redirect).
