import { useState, useEffect } from "react";
import { X, Package, Truck, CheckCircle, Trash2, Bell } from "lucide-react";
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
        navigate(`/order-confirmation/${notification.order_id}`);
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
            <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b bg-background z-10">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-heading uppercase tracking-tight">Notifications</DialogTitle>
                        {notifications.length > 0 && (
                            <div className="flex gap-4">
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs font-medium hover:text-jager-red transition-colors uppercase tracking-wide"
                                >
                                    Mark all read
                                </button>
                                <button
                                    onClick={handleClearAll}
                                    className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors uppercase tracking-wide"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jager-red"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                            <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                                <Bell className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-lg font-bold font-heading uppercase mb-1">No notifications</p>
                            <p className="text-sm text-muted-foreground">
                                You're all caught up! Check back later for updates.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`group relative px-6 py-5 cursor-pointer transition-colors hover:bg-muted/30 ${notification.is_read ? 'bg-background' : 'bg-jager-red/5'
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        <div className={`shrink-0 mt-1 h-10 w-10 rounded-full flex items-center justify-center ${notification.is_read ? 'bg-muted/50' : 'bg-white shadow-sm border'
                                            }`}>
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-8">
                                            <div className="flex flex-col gap-1">
                                                <h4 className={`text-sm ${notification.is_read ? 'font-medium' : 'font-bold'}`}>
                                                    {notification.title}
                                                </h4>
                                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground/70 mt-1 tracking-wide">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                                        {!notification.is_read && (
                                            <div className="h-2 w-2 rounded-full bg-jager-red self-end mb-1"></div>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                            onClick={(e) => handleClear(notification.id, e)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
