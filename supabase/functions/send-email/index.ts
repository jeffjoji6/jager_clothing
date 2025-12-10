import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
    to: string; // Single recipient (legacy support)
    recipients?: string[]; // Multiple recipients
    subject: string;
    html: string;
    from?: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (!resendApiKey) {
            throw new Error("RESEND_API_KEY is not set");
        }

        const resend = new Resend(resendApiKey);
        const { to, recipients, subject, html, from } = await req.json() as EmailRequest;

        // Determine target emails
        const targets = recipients && recipients.length > 0 ? recipients : (to ? [to] : []);

        if (targets.length === 0 || !subject || !html) {
            throw new Error("Missing required fields: to/recipients, subject, html");
        }

        const sender = from || "Jager Clothing <onboarding@resend.dev>";

        // Send emails in parallel
        // Note: Resend has rate limits. For very large batches (e.g. >100), 
        // we should probably batch this or use Resend's batch API if available in this SDK version.
        // For this implementation, we'll map promises.

        const results = await Promise.allSettled(targets.map(email =>
            resend.emails.send({
                from: sender,
                to: email,
                subject,
                html,
            })
        ));

        // Check for failures
        const failures = results.filter(r => r.status === 'rejected');
        const successes = results.filter(r => r.status === 'fulfilled');

        return new Response(JSON.stringify({
            success: true,
            sent_count: successes.length,
            failed_count: failures.length,
            results: results
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("Error sending email:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
