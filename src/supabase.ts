import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dmhumdxefgzqmuysudqi.supabase.co'
const supabaseAnonKey = 'sb_publishable_sg2irjycWPou6lGKzjFKVQ_fwp8ho92'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
