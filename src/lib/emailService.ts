import { supabase } from "@/lib/supabase";

interface OrderEmailData {
    orderId: string;
    customerEmail: string;
    customerName: string;
    items: Array<{
        name: string;
        size: string;
        color: string;
        quantity: number;
        price: number;
    }>;
    shippingAddress: {
        full_name: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        phone: string;
    };
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    paymentId?: string;
}

export const sendOrderNotificationEmail = async (data: OrderEmailData) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            console.error("No session found for sending email");
            return { success: false, error: "No session" };
        }

        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-notification`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session.access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("Failed to send order notification:", error);
            return { success: false, error };
        }

        const result = await response.json();
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Error sending order notification:", error);
        return { success: false, error: error.message };
    }
};

export const sendCustomDesignNotificationEmail = async (data: {
    customerName: string;
    customerEmail: string;
    brief: string;
    quantity: string;
    budget: string;
    imageUrl?: string;
}) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-custom-design-notification`,
            {
                method: "POST",
                headers: {
                    "Authorization": session ? `Bearer ${session.access_token}` : "",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("Failed to send custom design notification:", error);
            return { success: false, error };
        }

        const result = await response.json();
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Error sending custom design notification:", error);
        return { success: false, error: error.message };
    }
};
