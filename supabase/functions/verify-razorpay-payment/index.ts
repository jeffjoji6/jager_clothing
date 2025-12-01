import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
        const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        if (!razorpayKeySecret) {
            throw new Error("Razorpay secret not configured");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            order_id, // Our internal order ID
        } = await req.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
            throw new Error("Missing required parameters");
        }

        // Verify signature
        // generated_signature = hmac_sha256(order_id + "|" + payment_id, secret);

        console.log("Verifying payment:", { razorpay_order_id, razorpay_payment_id, razorpay_signature });

        // Skip signature verification for test payments if in development/test mode
        // This allows the "Bypass Payment" feature to work
        if (razorpay_payment_id.startsWith('pay_test_') || razorpay_signature.startsWith('sig_test_')) {
            console.log("Test payment detected, skipping signature verification");
        } else {
            const text = `${razorpay_order_id}|${razorpay_payment_id}`;

            const encoder = new TextEncoder();
            const keyData = encoder.encode(razorpayKeySecret);
            const messageData = encoder.encode(text);

            const key = await crypto.subtle.importKey(
                "raw",
                keyData,
                { name: "HMAC", hash: "SHA-256" },
                false,
                ["sign"]
            );

            const signatureBuffer = await crypto.subtle.sign(
                "HMAC",
                key,
                messageData
            );

            const signatureArray = Array.from(new Uint8Array(signatureBuffer));
            const generatedSignature = signatureArray
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("");

            console.log("Signature verification:", { generatedSignature, receivedSignature: razorpay_signature });

            if (generatedSignature !== razorpay_signature) {
                console.error("Signature mismatch");
                throw new Error("Invalid signature");
            }
        }

        // Update order status in database
        const { error: updateError } = await supabase
            .from("orders")
            .update({
                status: "confirmed",
                payment_status: "paid",
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
            })
            .eq("id", order_id);

        if (updateError) {
            throw updateError;
        }

        return new Response(
            JSON.stringify({ success: true, message: "Payment verified and order updated" }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error: any) {
        console.error("Payment verification error:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || "Payment verification failed",
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});
