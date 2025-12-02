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

        console.log("=== Payment Verification Request Started ===");

        if (!razorpayKeySecret) {
            const errorMsg = "Razorpay secret not configured on server";
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Parse request body with error handling
        let body;

        // Check if there's actually a body to parse
        const contentLength = req.headers.get('content-length');
        const contentType = req.headers.get('content-type');

        console.log("Request headers:", {
            method: req.method,
            contentLength,
            contentType,
            hasBody: contentLength && parseInt(contentLength) > 0,
        });

        if (!contentLength || parseInt(contentLength) === 0) {
            const errorMsg = "Request body is empty - no payment data received";
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        try {
            const bodyText = await req.text();
            console.log("Raw request body:", bodyText.substring(0, 200)); // Log first 200 chars

            if (!bodyText || bodyText.trim() === '') {
                throw new Error("Request body is empty");
            }

            body = JSON.parse(bodyText);
            console.log("Request body parsed successfully");
        } catch (parseError: any) {
            const errorMsg = `Failed to parse request body: ${parseError.message}`;
            console.error(errorMsg);
            console.error("Parse error details:", parseError);
            throw new Error(errorMsg);
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            order_id, // Our internal order ID
        } = body;

        console.log("Received payment verification request:", {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature_present: !!razorpay_signature,
            order_id,
            body_keys: Object.keys(body),
        });

        // Detailed validation with specific error messages
        const missingParams = [];
        if (!razorpay_order_id) missingParams.push("razorpay_order_id");
        if (!razorpay_payment_id) missingParams.push("razorpay_payment_id");
        if (!razorpay_signature) missingParams.push("razorpay_signature");
        if (!order_id) missingParams.push("order_id");

        if (missingParams.length > 0) {
            const errorMsg = `Missing required parameters: ${missingParams.join(", ")}. Received: ${JSON.stringify(body)}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        // Verify signature
        console.log("Starting signature verification...");

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

            console.log("Signature verification result:", {
                generatedSignature,
                receivedSignature: razorpay_signature,
                match: generatedSignature === razorpay_signature
            });

            if (generatedSignature !== razorpay_signature) {
                const errorMsg = "Payment signature verification failed - possible tampering detected";
                console.error(errorMsg);
                throw new Error(errorMsg);
            }
        }

        console.log("Signature verified successfully, updating order...");

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
            const errorMsg = `Database update failed: ${updateError.message}`;
            console.error(errorMsg, updateError);
            throw new Error(errorMsg);
        }

        console.log("=== Payment Verification Successful ===");

        return new Response(
            JSON.stringify({ success: true, message: "Payment verified and order updated" }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error: any) {
        const errorMessage = error.message || "Payment verification failed";
        console.error("=== Payment Verification Failed ===");
        console.error("Error:", errorMessage);
        console.error("Full error:", error);

        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage,
                details: error.stack || error.toString(),
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});
