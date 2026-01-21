import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  try {
    const { orderId, customerEmail, customerName, items, shippingAddress, subtotal, shipping, tax, total, paymentId } = await req.json()

    // Create Supabase client to fetch company settings
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Fetch company email from settings
    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('email, name')
      .single()

    const adminEmail = companySettings?.email || 'jagerclothing.store@gmail.com'
    const companyName = companySettings?.name || 'Jager Clothing'

    // Format items for email
    const itemsHtml = items.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          ${item.name}<br/>
          <small style="color: #666;">Size: ${item.size} | Color: ${item.color}</small>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('')

    // ========== ADMIN EMAIL TEMPLATE ==========
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #AF2018; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">NEW ORDER RECEIVED</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Order #${orderId.substring(0, 8).toUpperCase()}</p>
                  </td>
                </tr>
                
                <!-- Order Details -->
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">Order Details</h2>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      <tr>
                        <th style="padding: 12px; background-color: #f8f8f8; text-align: left; border-bottom: 2px solid #AF2018;">Product</th>
                        <th style="padding: 12px; background-color: #f8f8f8; text-align: center; border-bottom: 2px solid #AF2018;">Qty</th>
                        <th style="padding: 12px; background-color: #f8f8f8; text-align: right; border-bottom: 2px solid #AF2018;">Price</th>
                        <th style="padding: 12px; background-color: #f8f8f8; text-align: right; border-bottom: 2px solid #AF2018;">Total</th>
                      </tr>
                      ${itemsHtml}
                    </table>
                    
                    <!-- Totals -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 8px 0; text-align: right; color: #666;">Subtotal:</td>
                        <td style="padding: 8px 0; text-align: right; width: 120px; font-weight: bold;">₹${subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; text-align: right; color: #666;">Shipping:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold;">₹${shipping.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; text-align: right; color: #666;">Tax:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold;">₹${tax.toFixed(2)}</td>
                      </tr>
                      <tr style="border-top: 2px solid #AF2018;">
                        <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold;">Total:</td>
                        <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #AF2018;">₹${total.toFixed(2)}</td>
                      </tr>
                    </table>
                    
                    <!-- Customer Info -->
                    <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px;">Customer Information</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; padding: 15px; border-radius: 4px;">
                      <tr>
                        <td style="padding: 5px 0;"><strong>Name:</strong> ${customerName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0;"><strong>Email:</strong> ${customerEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0;"><strong>Phone:</strong> ${shippingAddress.phone}</td>
                      </tr>
                    </table>
                    
                    <!-- Shipping Address -->
                    <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px;">Shipping Address</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; padding: 15px; border-radius: 4px;">
                      <tr>
                        <td style="line-height: 1.6;">
                          ${shippingAddress.full_name}<br/>
                          ${shippingAddress.street}<br/>
                          ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}
                        </td>
                      </tr>
                    </table>
                    
                    ${paymentId ? `
                    <!-- Payment Info -->
                    <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px;">Payment Information</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; padding: 15px; border-radius: 4px;">
                      <tr>
                        <td style="padding: 5px 0;"><strong>Payment ID:</strong> ${paymentId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">PAID</span></td>
                      </tr>
                    </table>
                    ` : ''}
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      Log in to your admin panel to process this order
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    // ========== CUSTOMER EMAIL TEMPLATE ==========
    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #AF2018; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">THANK YOU FOR YOUR ORDER!</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Order #${orderId.substring(0, 8).toUpperCase()}</p>
                  </td>
                </tr>
                
                <!-- Thank You Message -->
                <tr>
                  <td style="padding: 30px;">
                    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
                      Hi ${customerName},
                    </p>
                    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
                      Thank you for shopping with ${companyName}! We've received your order and are preparing it for shipment.
                    </p>
                    
                    <h2 style="color: #333; margin: 30px 0 20px 0; font-size: 20px;">Order Summary</h2>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      <tr>
                        <th style="padding: 12px; background-color: #f8f8f8; text-align: left; border-bottom: 2px solid #AF2018;">Product</th>
                        <th style="padding: 12px; background-color: #f8f8f8; text-align: center; border-bottom: 2px solid #AF2018;">Qty</th>
                        <th style="padding: 12px; background-color: #f8f8f8; text-align: right; border-bottom: 2px solid #AF2018;">Price</th>
                        <th style="padding: 12px; background-color: #f8f8f8; text-align: right; border-bottom: 2px solid #AF2018;">Total</th>
                      </tr>
                      ${itemsHtml}
                    </table>
                    
                    <!-- Totals -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 8px 0; text-align: right; color: #666;">Subtotal:</td>
                        <td style="padding: 8px 0; text-align: right; width: 120px; font-weight: bold;">₹${subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; text-align: right; color: #666;">Shipping:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold;">₹${shipping.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; text-align: right; color: #666;">Tax:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold;">₹${tax.toFixed(2)}</td>
                      </tr>
                      <tr style="border-top: 2px solid #AF2018;">
                        <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold;">Total:</td>
                        <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #AF2018;">₹${total.toFixed(2)}</td>
                      </tr>
                    </table>
                    
                    <!-- Shipping Address -->
                    <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px;">Shipping To</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; padding: 15px; border-radius: 4px;">
                      <tr>
                        <td style="line-height: 1.6;">
                          ${shippingAddress.full_name}<br/>
                          ${shippingAddress.street}<br/>
                          ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}<br/>
                          Phone: ${shippingAddress.phone}
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Download Invoice Button -->
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://jagerclothing.in/orders/${orderId}" style="display: inline-block; background-color: #AF2018; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
                        View Order & Download Invoice
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">
                      Thank you for shopping with us!
                    </p>
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      Questions? Reply to this email or contact us at support@jagerclothing.in
                    </p>
                    <div style="margin-top: 20px;">
                      <a href="https://jagerclothing.in" style="display: inline-block; color: #AF2018; text-decoration: none; font-weight: bold;">
                        Shop Again →
                      </a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    // Send email to Admin
    const adminRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Jager Clothing <support@jagerclothing.in>',
        to: [adminEmail],
        subject: `New Order #${orderId.substring(0, 8).toUpperCase()} - ₹${total.toFixed(2)}`,
        html: adminEmailHtml,
      }),
    })

    // Send email to Customer
    const customerRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Jager Clothing <support@jagerclothing.in>',
        to: [customerEmail],
        subject: `Order Confirmed - Jager Clothing #${orderId.substring(0, 8).toUpperCase()}`,
        html: customerEmailHtml,
      }),
    })

    const adminData = await adminRes.json()
    const customerData = await customerRes.json()

    return new Response(JSON.stringify({ admin: adminData, customer: customerData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
