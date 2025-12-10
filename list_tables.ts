import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('🔍 Listing all tables in public schema...\n');

    try {
        // We can't query information_schema with anon key usually due to permissions.
        // However, we can try to infer from common tables or just use the list I know from migrations.
        // Let's try to list standard tables I expect.

        const tablesToCheck = [
            'admin_users',
            'company_settings',
            'custom_design_requests',
            'orders',
            'order_items',
            'products',
            'product_variants',
            'profiles',
            'invoices'
        ];

        console.log('Checking access to potentially existing tables:');

        for (const table of tablesToCheck) {
            const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
            if (error) {
                console.log(`❌ ${table}: Error (${error.message})`);
            } else {
                console.log(`✅ ${table}: Exists (${count} records)`);
            }
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

listTables();
