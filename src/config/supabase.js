import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('Please create a .env file in the client directory with:')
  console.error('VITE_SUPABASE_URL=your_url')
  console.error('VITE_SUPABASE_ANON_KEY=your_key')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection (optional - can remove later)
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .limit(1)
    
    if (error) throw error
    console.log('✅ Supabase connected successfully!', data)
    return true
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message)
    return false
  }
}

