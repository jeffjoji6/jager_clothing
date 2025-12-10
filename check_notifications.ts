import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkNotifications() {
    const { count, error } = await supabase.from('notifications').select('*', { count: 'exact', head: true });
    console.log(error ? '❌ No notifications table' : '✅ Notifications table exists');
}

checkNotifications();
