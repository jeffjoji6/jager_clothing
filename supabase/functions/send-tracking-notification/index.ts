import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface TrackingData {
    orderId: string;
    customerEmail: string;
    customerName: string;
    trackingId?: string;
    trackingUrl?: string;
    carrierName?: string;
}

serve(async (req) => {
    try {
        const { orderId, customerEmail, customerName, trackingId, trackingUrl, carrierName } = await req.json() as TrackingData

        // Create Supabase client to fetch company settings
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // Fetch company name from settings
        const { data: companySettings } = await supabase
            .from('company_settings')
            .select('name')
            .single()

        const companyName = companySettings?.name || 'Jager Clothing'

        // Build tracking section HTML
        let trackingSection = ''
        if (trackingId || trackingUrl) {
            trackingSection = `
                <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">📦 Tracking Information</h3>
                    ${carrierName ? `<p style="margin: 0 0 10px 0; color: #666;">Carrier: <strong>${carrierName}</strong></p>` : ''}
                    ${trackingId ? `<p style="margin: 0 0 15px 0; color: #333; font-family: monospace; font-size: 18px; font-weight: bold;">${trackingId}</p>` : ''}
                    ${trackingUrl ? `
                        <a href="${trackingUrl}" style="display: inline-block; background-color: #AF2018; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                            Track Your Package →
                        </a>
                    ` : ''}
                </div>
            `
        }

        const emailHtml = `
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
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🚚 YOUR ORDER HAS SHIPPED!</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Order #${orderId.substring(0, 8).toUpperCase()}</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
                      Hi ${customerName},
                    </p>
                    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
                      Great news! Your ${companyName} order is on its way to you.
                    </p>
                    
                    ${trackingSection}
                    
                    <p style="font-size: 14px; color: #666; margin: 20px 0;">
                      If you have any questions about your delivery, feel free to reply to this email.
                    </p>
                    
                    <!-- View Order Button -->
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://jagerclothing.in/orders/${orderId}" style="display: inline-block; background-color: #333; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                        View Order Details
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0 0 10px 0; color: #333; font-size: 16px; font-weight: bold;">
                      Thank you for shopping with ${companyName}!
                    </p>
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      Questions? Contact us at support@jagerclothing.in
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

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Jager Clothing <support@jagerclothing.in>',
                to: [customerEmail],
                subject: `Your Order Has Shipped! 🚚 #${orderId.substring(0, 8).toUpperCase()}`,
                html: emailHtml,
            }),
        })

        const data = await res.json()

        return new Response(JSON.stringify(data), {
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
