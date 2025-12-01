import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Razorpay from "npm:razorpay@2.9.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    // Get Razorpay credentials from environment
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Razorpay credentials not configured",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    // Parse request body
    const { amount, currency = "INR", receipt } = await req.json();

    // Validate amount
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid amount",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    });

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create Razorpay order",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

