-- Create newsletter_subscriptions table if not exists
CREATE TABLE IF NOT EXISTS notification_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow public to insert (subscribe)
CREATE POLICY "Enable insert for everyone" ON notification_subscriptions
    FOR INSERT
    WITH CHECK (true);

-- Allow public to see own subscription (if needed, mostly for check)
CREATE POLICY "Enable select for everyone" ON notification_subscriptions
    FOR SELECT
    USING (true);

-- Allow public to update own subscription (reactivation)
CREATE POLICY "Enable update for everyone" ON notification_subscriptions
    FOR UPDATE
    USING (true);
