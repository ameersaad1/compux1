import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://itytmiclxhsbhtcjckcc.supabase.co';
const supabaseAnonKey = 'sb_publishable_D-OfOhi5JPkzXVuJDeAqAg_0HQ5LCof';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
