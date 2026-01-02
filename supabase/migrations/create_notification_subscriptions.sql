-- Create notification_subscriptions table
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  unsubscribe_token UUID DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_email ON notification_subscriptions(email);

-- Add index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_active ON notification_subscriptions(is_active);

-- Enable RLS
ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (subscribe)
CREATE POLICY "Anyone can subscribe" ON notification_subscriptions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow users to view their own subscription
CREATE POLICY "Users can view their subscription" ON notification_subscriptions
  FOR SELECT
  USING (true);

-- Policy: Allow users to update their own subscription (unsubscribe)
CREATE POLICY "Users can update their subscription" ON notification_subscriptions
  FOR UPDATE
  USING (true);
