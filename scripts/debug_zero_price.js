import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://shpyuonezraahqvpckpl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNocHl1b25lenJhYWhxdnBja3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NjU4MjIsImV4cCI6MjA3OTQ0MTgyMn0.LMBNFN1uBKvgCWHkTVI9k_cCuUVgo5sTG-beABlvTa8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPrices() {
  console.log('Fetching products matching PORSCHE or GTR...');
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id, 
      name, 
      base_price, 
      variants:product_variants (
        id, 
        size, 
        color, 
        stock,
        actual_price, 
        discounted_price,
        is_default
      )
    `)
    .or('name.ilike.%PORSCHE%,name.ilike.%GTR%,name.ilike.%BMW%');

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  if (!products || products.length === 0) {
    console.log('No matching products found.');
    return;
  }

  products.forEach(p => {
    console.log(`\nProduct: ${p.name}`);
    console.log(`Base Price: ${p.base_price}`);
    console.log('Variants:');
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach(v => {
        console.log(`  - [${v.is_default ? 'DEFAULT' : '       '}] ${v.size} / ${v.color} | Stock: ${v.stock} | Actual Price: ${v.actual_price} | Discounted: ${v.discounted_price}`);
      });
    } else {
      console.log('  No variants found.');
    }
  });
}

checkPrices();
