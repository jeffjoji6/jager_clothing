import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationCount } from "@/hooks/useNotificationCount";

export const NotificationButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();
    const { unreadCount, refreshCount } = useNotificationCount();

    const handleNotificationUpdate = () => {
        refreshCount();
    };

    if (!user) return null;

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                aria-label="Notifications"
            >
                <div className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-jager-red text-white text-[10px] flex items-center justify-center font-bold leading-none pointer-events-none">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </Button>
            <NotificationCenter
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onUpdate={handleNotificationUpdate}
            />
        </>
    );
};
