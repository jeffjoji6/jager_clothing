import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StockChangeRequest {
    action: 'deduct' | 'restore' | 'adjust';
    order_id?: string;
    items?: Array<{
        product_variant_id: string;
        quantity: number;
    }>;
    variant_id?: string;
    amount?: number;
    reason?: string;
    notes?: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const authHeader = req.headers.get("Authorization")!;
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabaseClient.auth.getUser(token);

        if (!user) {
            throw new Error("Unauthorized");
        }

        const requestData: StockChangeRequest = await req.json();
        const { action, order_id, items, variant_id, amount, reason, notes } = requestData;

        let result;

        switch (action) {
            case 'deduct':
                // Deduct stock for order items
                if (!order_id || !items) {
                    throw new Error("order_id and items are required for deduct action");
                }
                result = await deductStock(supabaseClient, order_id, items, user.id);
                break;

            case 'restore':
                // Restore stock for cancelled order
                if (!order_id) {
                    throw new Error("order_id is required for restore action");
                }
                result = await restoreStock(supabaseClient, order_id, user.id);
                break;

            case 'adjust':
                // Manual stock adjustment
                if (!variant_id || amount === undefined || !reason) {
                    throw new Error("variant_id, amount, and reason are required for adjust action");
                }
                result = await adjustStock(supabaseClient, variant_id, amount, reason, notes || '', user.id);
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Error in manage-stock:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});

async function deductStock(supabase: any, orderId: string, items: any[], userId: string) {
    const results = [];

    for (const item of items) {
        const { product_variant_id, quantity } = item;

        // Get current stock
        const { data: variant, error: fetchError } = await supabase
            .from('product_variants')
            .select('stock')
            .eq('id', product_variant_id)
            .single();

        if (fetchError) throw new Error(`Failed to fetch variant: ${fetchError.message}`);

        const previousStock = variant.stock;
        const newStock = previousStock - quantity;

        if (newStock < 0) {
            throw new Error(`Insufficient stock for variant ${product_variant_id}. Available: ${previousStock}, Required: ${quantity}`);
        }

        // Update stock
        const { error: updateError } = await supabase
            .from('product_variants')
            .update({ stock: newStock })
            .eq('id', product_variant_id);

        if (updateError) throw new Error(`Failed to update stock: ${updateError.message}`);

        // Log to stock history
        const { error: historyError } = await supabase
            .from('stock_history')
            .insert({
                product_variant_id,
                change_amount: -quantity,
                previous_stock: previousStock,
                new_stock: newStock,
                reason: 'order_placed',
                order_id: orderId,
                performed_by: userId,
            });

        if (historyError) console.error('Failed to log stock history:', historyError);

        results.push({ product_variant_id, previous_stock: previousStock, new_stock: newStock });
    }

    return { success: true, results };
}

async function restoreStock(supabase: any, orderId: string, userId: string) {
    // Get order items
    const { data: orderItems, error: fetchError } = await supabase
        .from('order_items')
        .select('product_variant_id, quantity')
        .eq('order_id', orderId);

    if (fetchError) throw new Error(`Failed to fetch order items: ${fetchError.message}`);

    const results = [];

    for (const item of orderItems) {
        if (!item.product_variant_id) continue; // Skip if variant was deleted

        const { product_variant_id, quantity } = item;

        // Get current stock
        const { data: variant, error: variantError } = await supabase
            .from('product_variants')
            .select('stock')
            .eq('id', product_variant_id)
            .single();

        if (variantError) {
            console.error(`Variant ${product_variant_id} not found, skipping restore`);
            continue;
        }

        const previousStock = variant.stock;
        const newStock = previousStock + quantity;

        // Update stock
        const { error: updateError } = await supabase
            .from('product_variants')
            .update({ stock: newStock })
            .eq('id', product_variant_id);

        if (updateError) throw new Error(`Failed to restore stock: ${updateError.message}`);

        // Log to stock history
        const { error: historyError } = await supabase
            .from('stock_history')
            .insert({
                product_variant_id,
                change_amount: quantity,
                previous_stock: previousStock,
                new_stock: newStock,
                reason: 'order_cancelled',
                order_id: orderId,
                performed_by: userId,
            });

        if (historyError) console.error('Failed to log stock history:', historyError);

        results.push({ product_variant_id, previous_stock: previousStock, new_stock: newStock });
    }

    return { success: true, results };
}

async function adjustStock(supabase: any, variantId: string, amount: number, reason: string, notes: string, userId: string) {
    // Get current stock
    const { data: variant, error: fetchError } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('id', variantId)
        .single();

    if (fetchError) throw new Error(`Failed to fetch variant: ${fetchError.message}`);

    const previousStock = variant.stock;
    const newStock = previousStock + amount;

    if (newStock < 0) {
        throw new Error(`Cannot adjust stock below 0. Current: ${previousStock}, Adjustment: ${amount}`);
    }

    // Update stock
    const { error: updateError } = await supabase
        .from('product_variants')
        .update({ stock: newStock })
        .eq('id', variantId);

    if (updateError) throw new Error(`Failed to update stock: ${updateError.message}`);

    // Log to stock history
    const { error: historyError } = await supabase
        .from('stock_history')
        .insert({
            product_variant_id: variantId,
            change_amount: amount,
            previous_stock: previousStock,
            new_stock: newStock,
            reason,
            performed_by: userId,
            notes,
        });

    if (historyError) console.error('Failed to log stock history:', historyError);

    return { success: true, previous_stock: previousStock, new_stock: newStock };
}
