import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicy() {
    console.log('🔧 Fixing RLS policy for custom_design_requests...\n');

    try {
        // Read the SQL file
        const sqlContent = fs.readFileSync(
            path.resolve(process.cwd(), 'supabase/migrations/20251211000003_fix_custom_requests_rls.sql'),
            'utf-8'
        );

        console.log('📄 SQL to execute:');
        console.log(sqlContent);
        console.log('\n');

        // Execute the SQL using rpc
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

        if (error) {
            console.error('❌ Error executing SQL:', error);
            console.log('\n💡 Trying alternative approach...\n');

            // Alternative: Execute each statement separately
            const statements = [
                `DROP POLICY IF EXISTS "Anyone can insert custom requests" ON custom_design_requests;`,
                `CREATE POLICY "Anyone can insert custom requests"
          ON custom_design_requests FOR INSERT
          TO anon, authenticated
          WITH CHECK (true);`
            ];

            for (const stmt of statements) {
                console.log(`Executing: ${stmt.substring(0, 50)}...`);
                const result = await supabase.rpc('exec_sql', { sql: stmt });
                if (result.error) {
                    console.error('Error:', result.error);
                } else {
                    console.log('✅ Success');
                }
            }

            return;
        }

        console.log('✅ RLS policy fixed successfully!');
        console.log('\n🧪 Testing insert again...');

        // Test insert
        const testData = {
            name: 'Test User After Fix',
            email: 'test@example.com',
            phone: '1234567890',
            whatsapp_number: '1234567890',
            brief: 'Test after RLS fix',
            quantity: 5,
            budget_range: '₹5000',
        };

        const { data: insertData, error: insertError } = await supabase
            .from('custom_design_requests')
            .insert(testData)
            .select();

        if (insertError) {
            console.error('❌ Still getting error:', insertError);
        } else {
            console.log('✅ Insert successful!');
            console.log('Record ID:', insertData[0].id);
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

fixRLSPolicy();
