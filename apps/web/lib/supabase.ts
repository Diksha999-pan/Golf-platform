import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Client-side Supabase client (use this in all components)
export const createClient = () => createClientComponentClient<Database>()

// Server-side admin client for API routes (bypasses RLS)
export const createServerClient = () =>
  createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export { createClientComponentClient }