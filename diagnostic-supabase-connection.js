// Diagnostic script to test Supabase connection
// Run with: node diagnostic-supabase-connection.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n')
  
  // Check environment variables
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('Environment variables:')
  console.log('SUPABASE_URL:', url ? '✅ Set' : '❌ Missing')
  console.log('SUPABASE_ANON_KEY:', anonKey ? '✅ Set' : '❌ Missing')
  
  if (!url || !anonKey) {
    console.log('\n❌ Missing required environment variables')
    return
  }
  
  const supabase = createClient(url, anonKey)
  
  // Test basic connection
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('\n❌ Database connection failed:', error.message)
      return
    }
    
    console.log('\n✅ Database connection successful')
    
    // Test auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth status:', user ? '✅ User authenticated' : '⚠️ No user authenticated')
    
    // Test RLS policies
    const { data: rlsTest, error: rlsError } = await supabase
      .from('subjects')
      .select('*')
      .limit(1)
    
    if (rlsError) {
      console.log('RLS test:', '❌', rlsError.message)
    } else {
      console.log('RLS test:', '✅ Passed')
    }
    
  } catch (err) {
    console.log('\n❌ Connection test failed:', err.message)
  }
}

testConnection()
