import {createClient} from '@supabase/supabase-js'
// Používá se pouze veřejný (anon) klíč. Tajný service_role klíč sem NIKDY nepatří.
export const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY)
