import { supabase } from './supabase';

interface CleanupStats {
    totalFiles: number;
    activeFiles: number;
    unusedFiles: number;
    unusedSize: number;
    unusedPaths: string[];
}

export const scanStorage = async (): Promise<CleanupStats> => {
    try {
        // 1. Fetch all active image URLs from DB
        const { data: variants, error: variantError } = await supabase
            .from('product_variants')
            .select('images, image_url');

        if (variantError) throw variantError;

        const { data: products, error: productError } = await supabase
            .from('products')
            .select('images');

        if (productError) throw productError;

        // Collect all used filenames
        const usedFileNames = new Set<string>();

        const extractFilename = (url: string) => {
            if (!url) return;
            try {
                // Handle full URL or relative path
                const parts = url.split('/');
                return parts[parts.length - 1]; // Simple filename extraction
            } catch (e) {
                console.warn('Invalid URL:', url);
            }
        };

        variants?.forEach(v => {
            if (v.images && Array.isArray(v.images)) {
                v.images.forEach((url: string) => {
                    const name = extractFilename(url);
                    if (name) usedFileNames.add(name);
                });
            }
            // Check legacy image_url just in case
            if (v.image_url) {
                const name = extractFilename(v.image_url);
                if (name) usedFileNames.add(name);
            }
        });

        products?.forEach(p => {
            if (p.images && Array.isArray(p.images)) {
                p.images.forEach((url: string) => {
                    const name = extractFilename(url);
                    if (name) usedFileNames.add(name);
                });
            }
        });

        // 2. List all files in bucket
        // Note: This lists top-level files in 'product-images' folder if that's where they are.
        // Adjust path if they are in subfolders. From uploadImage.ts: `folder/${fileName}` where folder defaults to 'products'

        const { data: files, error: storageError } = await supabase
            .storage
            .from('product-images')
            .list('products', { limit: 1000, offset: 0 }); // Assuming max 1000 files for now

        if (storageError) throw storageError;

        const unusedPaths: string[] = [];
        let unusedSize = 0;

        files?.forEach(file => {
            // file.name is the filename (e.g. "abc.jpg")
            // usedFileNames contains filenames extracted from URLs
            if (!usedFileNames.has(file.name)) {
                unusedPaths.push(`products/${file.name}`);
                unusedSize += file.metadata?.size || 0;
            }
        });

        return {
            totalFiles: files?.length || 0,
            activeFiles: (files?.length || 0) - unusedPaths.length,
            unusedFiles: unusedPaths.length,
            unusedSize,
            unusedPaths
        };
    } catch (error) {
        console.error('Scan failed:', error);
        throw error;
    }
};

export const deleteUnusedFiles = async (paths: string[]): Promise<number> => {
    if (paths.length === 0) return 0;

    const { data, error } = await supabase
        .storage
        .from('product-images')
        .remove(paths);

    if (error) throw error;
    return data?.length || 0;
};

export const resetDatabase = async (password: string, email: string): Promise<void> => {
    // 1. Verify Password
    const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        throw new Error("Invalid password");
    }

    // 2. Delete Transactional Data (Orders, Carts)
    const deleteAll = async (table: string) => {
        // Use a filter that matches all rows (e.g., id is not null)
        // Adjust filter based on table schema if id isn't UUID. Assuming UUID or int > 0.
        // For safety, let's use a filter that is always true for existing records.
        // .neq('id', '00000000-0000-0000-0000-000000000000') works for UUIDs.
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
            console.error(`Failed to clear table ${table}:`, error);
        }
    };

    // Delete in order of dependencies (Child first)
    await deleteAll('cart_items');
    await deleteAll('order_items');
    await deleteAll('orders');
    await deleteAll('custom_requests');
    // await deleteAll('notifications');

    // 3. Delete Products & Inventory
    await deleteAll('stock_history');
    await deleteAll('product_variants');
    await deleteAll('products');

    // 4. Wipe Storage
    // We list files again to get everything (limit 1000)
    const { data: files } = await supabase.storage.from('product-images').list('products', { limit: 1000 });
    if (files && files.length > 0) {
        const paths = files.map(f => `products/${f.name}`);
        const { error: storageError } = await supabase.storage.from('product-images').remove(paths);
        if (storageError) console.error("Failed to wipe storage:", storageError);
    }

    // 5. Exclusions:
    // - customers (PROTECTED per user request)
    // - admin_users (PROTECTED)
    // - company_settings (PROTECTED)
};
