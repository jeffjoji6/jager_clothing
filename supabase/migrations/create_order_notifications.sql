-- Create user_notifications table for order status updates
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'order_update', -- 'order_update', 'order_shipped', 'order_delivered'
  is_read BOOLEAN DEFAULT false,
  is_cleared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_order_id ON user_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_cleared ON user_notifications(is_cleared);

-- Enable RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON user_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read/cleared)
CREATE POLICY "Users can update own notifications" ON user_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: System can insert notifications
CREATE POLICY "System can insert notifications" ON user_notifications
  FOR INSERT
  WITH CHECK (true);

-- Function to create notification when order status changes
CREATE OR REPLACE FUNCTION create_order_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
BEGIN
  -- Only create notification if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Determine notification content based on new status
    CASE NEW.status
      WHEN 'confirmed' THEN
        notification_title := 'Order Confirmed';
        notification_message := 'Your order #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' has been confirmed and is being prepared.';
        notification_type := 'order_update';
      WHEN 'processing' THEN
        notification_title := 'Order Processing';
        notification_message := 'Your order #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' is being processed.';
        notification_type := 'order_update';
      WHEN 'shipped' THEN
        notification_title := 'Order Shipped! 🚚';
        notification_message := 'Great news! Your order #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' has been shipped and is on its way.';
        notification_type := 'order_shipped';
      WHEN 'delivered' THEN
        notification_title := 'Order Delivered! 🎉';
        notification_message := 'Your order #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' has been delivered. Enjoy your Jäger gear!';
        notification_type := 'order_delivered';
      WHEN 'cancelled' THEN
        notification_title := 'Order Cancelled';
        notification_message := 'Your order #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' has been cancelled.';
        notification_type := 'order_update';
      ELSE
        -- For other status changes, create a generic notification
        notification_title := 'Order Status Updated';
        notification_message := 'Your order #' || SUBSTRING(NEW.id::TEXT, 1, 8) || ' status has been updated to: ' || NEW.status;
        notification_type := 'order_update';
    END CASE;

    -- Insert notification for the user
    INSERT INTO user_notifications (user_id, order_id, title, message, type)
    VALUES (NEW.user_id, NEW.id, notification_title, notification_message, notification_type);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS order_status_notification_trigger ON orders;
CREATE TRIGGER order_status_notification_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_order_status_notification();
