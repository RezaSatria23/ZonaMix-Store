import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://abc123.supabase.co'
const supabaseKey = 'ey...' // Anon/public key

export const supabase = createClient(supabaseUrl, supabaseKey)