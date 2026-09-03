import { createClient } from '@supabase/supabase-js';

// استخدام مفتاح النشر الآمن للـ Frontend
const supabaseUrl = 'https://dmhumdxefgzqmuysudqi.supabase.co';
const supabaseAnonKey = 'sb_publishable_sg2irjycWPou6lGKzjFKVQ_fwp8ho92';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * دالة رفع الملفات والصور إلى Supabase Storage
 */
export async function uploadMediaFile(file: File, bucket: string = 'media'): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Upload exception:', err);
    return null;
  }
}
