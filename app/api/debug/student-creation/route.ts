import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    console.log('=== STUDENT CREATION DEBUG ===')
    
    const user = await getCurrentUser()
    console.log('User:', user.id, user.email)
    
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const supabase = createClient()
    
    // Test basic database connection
    const { data: testQuery, error: testError } = await supabase
      .from('students')
      .select('count')
      .eq('owner_id', user.id)
      .limit(1)
    
    console.log('Test query result:', testQuery, 'Error:', testError)
    
    // Check if the schema is correct
    const { data: schemaTest, error: schemaError } = await supabase
      .from('students')
      .select('id, family_name, first_name, middle_name, display_name, full_name, year_level, external_id, owner_id')
      .eq('owner_id', user.id)
      .limit(1)
    
    console.log('Schema test result:', schemaTest, 'Error:', schemaError)
    
    // Try to insert a test student
    const testStudentData = {
      family_name: body.family_name || 'TestFamily',
      first_name: body.first_name || 'TestFirst',
      middle_name: body.middle_name || null,
      year_level: body.year_level || 9,
      external_id: body.external_id || null,
      owner_id: user.id
    }
    
    console.log('Attempting to insert:', JSON.stringify(testStudentData, null, 2))
    
    const { data: insertResult, error: insertError } = await supabase
      .from('students')
      .insert(testStudentData)
      .select()
      .single()
    
    console.log('Insert result:', insertResult)
    console.log('Insert error:', insertError)
    
    if (insertError) {
      console.log('Insert error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
    }
    
    return NextResponse.json({
      success: !insertError,
      user: { id: user.id, email: user.email },
      requestBody: body,
      testQuery: { data: testQuery, error: testError },
      schemaTest: { data: schemaTest, error: schemaError },
      insertResult,
      insertError
    })
    
  } catch (error: any) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
