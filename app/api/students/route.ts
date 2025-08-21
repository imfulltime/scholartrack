import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit, withOwnership } from '@/lib/api'
import { z } from 'zod'

const createStudentSchema = z.object({
  family_name: z.string().min(1),
  first_name: z.string().min(1),
  middle_name: z.string().optional(),
  year_level: z.number().min(1).max(12),
  external_id: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    
    const validatedData = createStudentSchema.parse(body)
    const supabase = createClient()

    // Check if external_id already exists for this user (if provided)
    if (validatedData.external_id) {
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('external_id', validatedData.external_id)
        .eq('owner_id', user.id)
        .single()

      if (existingStudent) {
        return NextResponse.json(
          { error: 'A student with this ID already exists' },
          { status: 400 }
        )
      }
    }

    const { data: student, error } = await supabase
      .from('students')
      .insert(withOwnership(validatedData, user.id))
      .select()
      .single()

    if (error) {
      console.error('Student creation error:', {
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        validatedData
      })
      return NextResponse.json(
        { error: 'Failed to create student', details: error.message },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'CREATE', 'student', student.id, {
      name: student.display_name || `${student.family_name}, ${student.first_name}${student.middle_name ? ' ' + student.middle_name : ''}`,
      year_level: student.year_level,
      external_id: student.external_id,
    })

    return NextResponse.json(student)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .eq('owner_id', user.id)
      .order('full_name')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      )
    }

    return NextResponse.json(students)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
