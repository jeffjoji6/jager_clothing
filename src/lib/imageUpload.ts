import { supabase } from './supabase';

// Helper to determine if a URL is from Cloudinary (for potential optimized delivery)
export const isCloudinaryUrl = (url: string) => url?.includes('cloudinary.com');

// Cloudinary Credentials from Env
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// We accept folder and bucket for backward compatibility with existing calls.
// bucket is ignored for Cloudinary (uses generic cloud).
export const uploadImage = async (file: File, folder: string = 'jager-uploads', bucket?: string): Promise<string | null> => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    console.error("Missing Cloudinary credentials");
    throw new Error("Cloudinary configuration missing in .env");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  // Use the provided folder or default
  if (folder) {
    formData.append('folder', folder);
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    // Return HTTPS URL
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    return null;
  }
};

export const uploadToSupabase = async (file: File, bucket: string = 'product-images'): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    return null;
  }
};

export const deleteImage = async (path: string) => {
  // Cloudinary deletion via Client-Side (Unsigned) is generally NOT allowed for security.
  // We log a warning. If deletion is critical, it requires a Backend function with API Secret.
  console.warn("Skipping Cloudinary delete (requires backend signature).");

  // Backward compatibility: If the path looks like a Supabase path (not a full http URL), try deleting from Supabase.
  if (path && !path.startsWith('http')) {
    // It's likely a relative path from old Supabase logic (e.g. "products/abc.jpg")
    const { error } = await supabase.storage.from('product-images').remove([path]);
    if (error) console.error("Supabase delete error:", error);
  }
};
