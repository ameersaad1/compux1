import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'رابط_مشروعك_من_سوبابيس'
const supabaseAnonKey = 'مفتاح_ANON_KEY_الخاص_بمشروعك'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
