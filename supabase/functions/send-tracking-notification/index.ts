import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const resend = new Resend(resendApiKey);
    const { orderId, customerEmail, customerName, trackingId, trackingUrl, carrierName } = await req.json();

    if (!orderId || !customerEmail) {
      throw new Error("Missing required fields: orderId, customerEmail");
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
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">ORDER SHIPPED! 🚚</h1>
                    <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Order #${orderId.substring(0, 8).toUpperCase()} is on its way</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
                      Hi ${customerName},
                    </p>
                    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
                      Great news! Your order has been shipped and is making its way to you.
                    </p>
                    
                    <!-- Tracking Info Box -->
                    <div style="background-color: #f8f8f8; border-left: 4px solid #AF2018; padding: 20px; margin: 30px 0; border-radius: 4px;">
                      ${carrierName ? `<p style="margin: 0 0 10px 0; color: #666; font-size: 14px; text-transform: uppercase; font-weight: bold;">Carrier: ${carrierName}</p>` : ''}
                      ${trackingId ? `<h2 style="margin: 0 0 10px 0; color: #333; font-size: 24px; font-family: monospace;">${trackingId}</h2>` : ''}
                      
                      ${trackingUrl ? `
                      <div style="margin-top: 20px;">
                        <a href="${trackingUrl}" style="display: inline-block; background-color: #333; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">
                          Track Package
                        </a>
                      </div>
                      ` : ''}
                    </div>

                    <p style="font-size: 14px; color: #666; margin: 0;">
                      Note: It may take up to 24 hours for tracking information to update.
                    </p>
                    
                    <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                      <a href="https://jagerclothing.in/orders/${orderId}" style="text-decoration: none; color: #AF2018; font-weight: bold;">
                        View Order Details →
                      </a>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      Jager Clothing
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const data = await resend.emails.send({
      from: 'Jager Clothing <support@jagerclothing.in>',
      to: [customerEmail],
      subject: `Your Order Has Shipped! 🚚 #${orderId.substring(0, 8).toUpperCase()}`,
      html: emailHtml,
    });

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error sending tracking email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
