import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY  // Gebruik de Service Role Key (veilig in Vercel)

export const supabase = createClient(supabaseUrl, supabaseKey)
