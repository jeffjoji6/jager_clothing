import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFormSubmission() {
    console.log('🧪 Testing custom design form submission...\n');

    try {
        // Simulate a form submission
        const testData = {
            name: 'Test User',
            email: 'test@example.com',
            phone: '1234567890',
            whatsapp_number: '1234567890',
            brief: 'This is a test custom design request to verify the database is working correctly.',
            quantity: 10,
            budget_range: '₹5000-₹10000',
            image_url: null,
            status: 'new'
        };

        console.log('📤 Inserting test record...');
        const { data, error } = await supabase
            .from('custom_design_requests')
            .insert(testData)
            .select();

        if (error) {
            console.error('❌ Error inserting record:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            return;
        }

        console.log('✅ Test record inserted successfully!');
        console.log('Record ID:', data[0].id);
        console.log('\n📋 Inserted data:', JSON.stringify(data[0], null, 2));

        // Now verify we can read it back
        console.log('\n🔍 Verifying record can be queried...');
        const { data: queryData, error: queryError } = await supabase
            .from('custom_design_requests')
            .select('*')
            .eq('id', data[0].id)
            .single();

        if (queryError) {
            console.error('❌ Error querying record:', queryError);
            return;
        }

        console.log('✅ Record successfully queried back!');
        console.log('\n🎉 Database is working correctly!');
        console.log('\n💡 Next steps:');
        console.log('   1. Check the admin panel at /admin/design-requests');
        console.log('   2. You should see this test record');
        console.log('   3. Try submitting a real form from /custom-design');

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

testFormSubmission();
