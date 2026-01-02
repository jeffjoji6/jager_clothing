import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useAuth } from "@/contexts/AuthContext";
import { getUnreadCount } from "@/lib/notificationService";

export const NotificationButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadUnreadCount();

            // Poll for new notifications every 30 seconds
            const interval = setInterval(loadUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadUnreadCount = async () => {
        if (user) {
            const count = await getUnreadCount(user.id);
            setUnreadCount(count);
        }
    };

    const handleNotificationUpdate = () => {
        loadUnreadCount();
    };

    if (!user) return null;

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                className="relative"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-jager-red text-white text-xs flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>
            <NotificationCenter
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onUpdate={handleNotificationUpdate}
            />
        </>
    );
};
