import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://shpyuonezraahqvpckpl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNocHl1b25lenJhYWhxdnBja3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NjU4MjIsImV4cCI6MjA3OTQ0MTgyMn0.LMBNFN1uBKvgCWHkTVI9k_cCuUVgo5sTG-beABlvTa8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBasePrices() {
  console.log('Fetching products...');
  
  // Fetch ALL products to check
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id, 
      name, 
      base_price, 
      variants:product_variants (
        id, 
        stock,
        actual_price,
        created_at
      )
    `);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Fetched ${products?.length || 0} products.`);

  let fixCount = 0;

  for (const p of products || []) {
    const currentPrice = Number(p.base_price || 0);

    // If price is 0 (or null/undefined), attempt fix
    if (currentPrice === 0) {
      console.log(`\nProduct "${p.name}" (ID: ${p.id}) has base_price: ${p.base_price}.`);
      
      const variants = p.variants || [];
      if (variants.length > 0) {
        // Sort by created_at to find "first" variant (often logical default)
        const sortedVariants = variants.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        // Find first variant with price > 0
        const validVariant = sortedVariants.find(v => Number(v.actual_price) > 0);
        
        if (validVariant) {
          const newPrice = Number(validVariant.actual_price);
          console.log(`  -> Found valid variant price: ${newPrice} (Variant ID: ${validVariant.id})`);
          console.log(`  -> Updating product base_price...`);

          const { error: updateError } = await supabase
            .from('products')
            .update({ base_price: newPrice })
            .eq('id', p.id);
            
          if (updateError) {
             console.error(`  [ERROR] Failed to update:`, updateError.message);
          } else {
             console.log(`  [SUCCESS] Updated base_price to ${newPrice}.`);
             fixCount++;
          }
        } else {
          console.log(`  [SKIPPING] No variants have a valid price > 0.`);
          variants.forEach(v => console.log(`    - Variant ${v.id}: price=${v.actual_price}`));
        }
      } else {
        console.log(`  [SKIPPING] Product has no variants.`);
      }
    }
  }

  console.log(`\nDone. Fixed ${fixCount} products.`);
}

fixBasePrices();
