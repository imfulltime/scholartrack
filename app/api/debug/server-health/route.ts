import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    console.log('=== SERVER HEALTH CHECK ===')
    
    // Test 1: Environment variables
    const envCheck = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NODE_ENV: process.env.NODE_ENV,
    }
    console.log('Environment Check:', envCheck)
    
    // Test 2: Supabase client creation
    let supabaseCheck = { success: false, error: null }
    try {
      const supabase = createClient()
      supabaseCheck.success = true
      console.log('Supabase client created successfully')
    } catch (error: any) {
      supabaseCheck.error = error.message
      console.error('Supabase client creation failed:', error)
    }
    
    // Test 3: User authentication
    let userCheck: { success: boolean, error: string | null, user: { id: string, email: string | undefined } | null } = { success: false, error: null, user: null }
    try {
      const user = await getCurrentUser()
      userCheck.success = true
      userCheck.user = { id: user.id, email: user.email }
      console.log('User authentication successful:', user.id, user.email)
    } catch (error: any) {
      userCheck.error = error.message
      console.error('User authentication failed:', error)
    }
    
    // Test 4: Database connection (if user is authenticated)
    let dbCheck: { success: boolean, error: string | null, data: any[] | null } = { success: false, error: null, data: null }
    if (userCheck.success) {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, email')
          .limit(1)
        
        if (error) throw error
        
        dbCheck.success = true
        dbCheck.data = data
        console.log('Database connection successful')
      } catch (error: any) {
        dbCheck.error = error.message
        console.error('Database connection failed:', error)
      }
    }
    
    // Test 5: Audit log functionality (if user is authenticated)
    let auditCheck: { success: boolean, error: string | null } = { success: false, error: null }
    if (userCheck.success && userCheck.user) {
      try {
        await logAudit(userCheck.user.id, 'TEST', 'health_check', 'test', { timestamp: new Date().toISOString() })
        auditCheck.success = true
        console.log('Audit log test successful')
      } catch (error: any) {
        auditCheck.error = error.message
        console.error('Audit log test failed:', error)
      }
    }
    
    const healthStatus = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      supabase: supabaseCheck,
      user: userCheck,
      database: dbCheck,
      audit: auditCheck,
      overall: supabaseCheck.success && userCheck.success && dbCheck.success
    }
    
    console.log('Health check results:', JSON.stringify(healthStatus, null, 2))
    
    return NextResponse.json(healthStatus)
    
  } catch (error: any) {
    console.error('Health check failed completely:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Allow this endpoint to be called without authentication for basic health checks
export async function POST(request: NextRequest) {
  try {
    // Basic health check without authentication
    const body = await request.json()
    console.log('Basic health check called with:', body)
    
    const supabase = createClient()
    
    // Test basic Supabase connection without auth
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    return NextResponse.json({
      success: !error,
      timestamp: new Date().toISOString(),
      supabase_connection: !error,
      error: error?.message || null
    })
    
  } catch (error: any) {
    console.error('Basic health check failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
