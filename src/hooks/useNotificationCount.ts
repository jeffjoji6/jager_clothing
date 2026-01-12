import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUnreadCount } from "@/lib/notificationService";

export const useNotificationCount = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();

    const loadUnreadCount = async () => {
        if (user) {
            const count = await getUnreadCount(user.id);
            setUnreadCount(count);
        } else {
            setUnreadCount(0);
        }
    };

    useEffect(() => {
        if (user) {
            loadUnreadCount();

            // Poll for new notifications every 30 seconds
            const interval = setInterval(loadUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    return { unreadCount, refreshCount: loadUnreadCount };
};
