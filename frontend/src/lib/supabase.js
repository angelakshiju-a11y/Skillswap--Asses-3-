/**
 * ==========================================
 * Supabase Client Setup
 * ==========================================
 *
 * Single Supabase client instance used across the app.
 * Reads credentials from Vite environment variables.
 *
 * Environment Variables:
 *   VITE_SUPABASE_URL - Supabase project URL
 *   VITE_SUPABASE_ANON_KEY - Supabase anonymous/public key
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'ERROR: Missing Supabase credentials.\n' +
    'Create a .env file in frontend/ with:\n' +
    'VITE_SUPABASE_URL=your-url\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Helper to get current auth session
 */
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) console.error('Session error:', error)
  return session
}

/**
 * Helper to get current user with profile
 */
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile }
}
