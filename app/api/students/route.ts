import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit, withOwnership } from '@/lib/api'
import { z } from 'zod'

const createStudentSchema = z.object({
  family_name: z.string().min(1),
  first_name: z.string().min(1),
  middle_name: z.string().optional(),
  year_level: z.number().min(1).max(12),
  gender: z.enum(['Male', 'Female']),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    
    const validatedData = createStudentSchema.parse(body)
    const supabase = createClient()

    // No need to check external_id since it's been removed

    // Compute names for backward-compat and to avoid relying solely on DB triggers
    const computedFullName = `${validatedData.first_name}${validatedData.middle_name ? ' ' + validatedData.middle_name : ''} ${validatedData.family_name}`
    const computedDisplayName = `${validatedData.family_name}, ${validatedData.first_name}${validatedData.middle_name ? ' ' + validatedData.middle_name : ''}`

    const insertPayload = withOwnership(
      {
        family_name: validatedData.family_name,
        first_name: validatedData.first_name,
        middle_name: validatedData.middle_name ?? null,
        full_name: computedFullName,
        // display_name column exists server-side
        display_name: computedDisplayName,
        year_level: validatedData.year_level,
        gender: validatedData.gender,
      },
      user.id
    )

    const { data: student, error } = await supabase
      .from('students')
      .insert(insertPayload)
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
      gender: student.gender,
      universal_id: student.universal_id,
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
      .order('family_name')
      .order('first_name')

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
