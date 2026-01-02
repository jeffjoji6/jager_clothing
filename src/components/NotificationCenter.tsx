import { useState, useEffect } from "react";
import { X, Package, Truck, CheckCircle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    fetchUserNotifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    UserNotification,
} from "@/lib/notificationService";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export const NotificationCenter = ({ isOpen, onClose, onUpdate }: NotificationCenterProps) => {
    const [notifications, setNotifications] = useState<UserNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && user) {
            loadNotifications();
        }
    }, [isOpen, user]);

    const loadNotifications = async () => {
        if (!user) return;

        setLoading(true);
        const data = await fetchUserNotifications(user.id);
        setNotifications(data);
        setLoading(false);
    };

    const handleNotificationClick = async (notification: UserNotification) => {
        // Mark as read
        await markAsRead(notification.id);
        onUpdate();

        // Navigate to order details
        navigate(`/orders/${notification.order_id}`);
        onClose();
    };

    const handleClear = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        await clearNotification(notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        onUpdate();
        toast.success("Notification cleared");
    };

    const handleMarkAllRead = async () => {
        if (!user) return;

        await markAllAsRead(user.id);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        onUpdate();
        toast.success("All notifications marked as read");
    };

    const handleClearAll = async () => {
        if (!user) return;

        await clearAllNotifications(user.id);
        setNotifications([]);
        onUpdate();
        toast.success("All notifications cleared");
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'order_shipped':
                return <Truck className="h-5 w-5 text-blue-500" />;
            case 'order_delivered':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            default:
                return <Package className="h-5 w-5 text-jager-red" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-heading uppercase">Notifications</DialogTitle>
                        {notifications.length > 0 && (
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleMarkAllRead}
                                    className="text-xs"
                                >
                                    Mark all read
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearAll}
                                    className="text-xs text-destructive hover:text-destructive"
                                >
                                    Clear all
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jager-red"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <p className="text-lg font-medium text-muted-foreground">No notifications</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                You're all caught up!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2 py-4">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`group relative p-4 rounded-lg border cursor-pointer transition-all hover:bg-secondary/50 ${notification.is_read ? 'bg-background' : 'bg-secondary/20 border-jager-red/20'
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <div className="shrink-0 mt-1">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="font-semibold text-sm">{notification.title}</h4>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                    onClick={(e) => handleClear(notification.id, e)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-jager-red"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
