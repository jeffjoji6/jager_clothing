import { supabase } from './supabase';

export const uploadImage = async (file: File, folder: string = 'products'): Promise<string> => {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

export const deleteImage = async (filePath: string): Promise<void> => {
  try {
    // Extract path from URL
    const path = filePath.split('/product-images/')[1];
    if (!path) return;

    const { error } = await supabase.storage
      .from('product-images')
      .remove([path]);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting image:', error);
    // Don't throw - allow deletion even if image delete fails
  }
};

