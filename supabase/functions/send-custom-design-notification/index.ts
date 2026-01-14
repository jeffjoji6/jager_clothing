import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = 'jagerclothing.store@gmail.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customerName, customerEmail, brief, quantity, budget, imageUrls = [] } = await req.json()

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
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">NEW CUSTOM DESIGN REQUEST</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">Customer Information</h2>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f8f8; padding: 15px; border-radius: 4px; margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 5px 0;"><strong>Name:</strong> ${customerName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0;"><strong>Email:</strong> ${customerEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0;"><strong>Quantity:</strong> ${quantity}</td>
                      </tr>
                      ${budget ? `<tr><td style="padding: 5px 0;"><strong>Budget:</strong> ${budget}</td></tr>` : ''}
                    </table>
                    
                    <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px;">Project Brief</h3>
                    <div style="background-color: #f8f8f8; padding: 15px; border-radius: 4px; line-height: 1.6; margin-bottom: 30px;">
                      ${brief.replace(/\n/g, '<br/>')}
                    </div>
                    
                    ${imageUrls && imageUrls.length > 0 ? `
                    <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px;">Reference Images (${imageUrls.length})</h3>
                    <div style="background-color: #f8f8f8; padding: 15px; border-radius: 4px; text-align: center;">
                      ${imageUrls.map((url: string) => `
                        <div style="margin-bottom: 15px;">
                          <img src="${url}" alt="Reference" style="max-width: 100%; height: auto; border-radius: 4px; display: block; margin: 0 auto;"/>
                          <p style="margin: 5px 0 10px 0; font-size: 12px; color: #666;">
                            <a href="${url}" style="color: #AF2018;">View Original</a>
                          </p>
                        </div>
                      `).join('')}
                    </div>
                    ` : ''}
                    
                    <div style="margin-top: 30px; padding: 20px; background-color: #e8f5e9; border-radius: 4px; border-left: 4px solid #4caf50;">
                      <p style="margin: 0; color: #2e7d32; font-weight: bold;">✓ Follow up via WhatsApp</p>
                      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Contact the customer to discuss their custom design requirements</p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      Jäger Custom Design - Premium Custom Apparel
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
        to: [ADMIN_EMAIL],
        subject: `New Custom Design Request from ${customerName}`,
        html: emailHtml,
      }),
    })

    const data = await res.json()

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
