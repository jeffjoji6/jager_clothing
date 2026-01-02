import { supabase } from "@/lib/supabase";

export interface UserNotification {
    id: string;
    user_id: string;
    order_id: string;
    title: string;
    message: string;
    type: 'order_update' | 'order_shipped' | 'order_delivered';
    is_read: boolean;
    is_cleared: boolean;
    created_at: string;
    updated_at: string;
}

export const fetchUserNotifications = async (userId: string) => {
    const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_cleared', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return data as UserNotification[];
};

export const getUnreadCount = async (userId: string) => {
    const { count, error } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .eq('is_cleared', false);

    if (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }

    return count || 0;
};

export const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

    if (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }

    return true;
};

export const markAllAsRead = async (userId: string) => {
    const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) {
        console.error('Error marking all as read:', error);
        return false;
    }

    return true;
};

export const clearNotification = async (notificationId: string) => {
    const { error } = await supabase
        .from('user_notifications')
        .update({ is_cleared: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

    if (error) {
        console.error('Error clearing notification:', error);
        return false;
    }

    return true;
};

export const clearAllNotifications = async (userId: string) => {
    const { error } = await supabase
        .from('user_notifications')
        .update({ is_cleared: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

    if (error) {
        console.error('Error clearing all notifications:', error);
        return false;
    }

    return true;
};
