import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface RequestData {
    userIds: string[];
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            throw new Error("Missing Supabase configuration");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        const { userIds } = await req.json() as RequestData;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return new Response(JSON.stringify({ emails: {} }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Fetch users from auth.users
        // Note: auth.users is not directly queryable via standard client unless we use the admin api
        // But supabase-js admin client allows listUsers but that's paginated and maybe slow for random IDs.
        // Better approach for specific IDs: seemingly no direct batch get by ID in public API without iterating.
        // However, we can use the `rpc` if we had a postgres function, but we are in Edge Function.

        // Actually, we can just use the admin client's `auth.admin.getUserById` efficiently? 
        // No, that's one by one.
        // Efficient way: List users and filter? No, inefficient for large sets.
        // Best way in Edge Function with Service Role: Direct DB connection or just iterate if list is small.
        // For "All Customers" it might be large.

        // Let's try to map over them. If list is HUGE we might hit timeouts.
        // Ideally we shouldn't send 1000 IDs here. 
        // Let's implement robust error handling.

        const userMap: Record<string, string> = {};

        // Optimisation: use `listUsers` and filter is not great.
        // But for < 50 users (pagination default) it's one call.

        // For now, let's fetch them in batches or one-by-one in parallel
        const promises = userIds.map(async (uid) => {
            const { data, error } = await supabase.auth.admin.getUserById(uid);
            if (!error && data?.user) {
                userMap[uid] = data.user.email || "";
            }
        });

        await Promise.all(promises);

        return new Response(JSON.stringify({ emails: userMap }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
