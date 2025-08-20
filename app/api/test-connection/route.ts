import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...')
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase environment variables',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey 
      }, { status: 500 })
    }
    
    const supabase = createClient()
    
    // Test auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Test basic database access
    const { data: testData, error: dbError } = await supabase
      .from('subjects')
      .select('count')
      .limit(1)
    
    return NextResponse.json({
      environment: {
        hasUrl: true,
        hasKey: true,
        urlHost: new URL(supabaseUrl).hostname
      },
      auth: {
        isAuthenticated: !!user,
        userId: user?.id || null,
        error: authError?.message || null
      },
      database: {
        connectionSuccess: !dbError,
        error: dbError?.message || null,
        testQueryResult: testData
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Connection test error:', error)
    return NextResponse.json({ 
      error: 'Connection test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
