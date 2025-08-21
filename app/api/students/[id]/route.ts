import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit } from '@/lib/api'
import { z } from 'zod'

const updateStudentSchema = z.object({
  family_name: z.string().min(1),
  first_name: z.string().min(1),
  middle_name: z.string().optional(),
  year_level: z.number().min(1).max(12),
  gender: z.enum(['Male', 'Female']),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    
    const validatedData = updateStudentSchema.parse(body)
    const supabase = createClient()

    // Check if the student exists and belongs to the user
    const { data: existingStudent, error: fetchError } = await supabase
      .from('students')
      .select('*')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single()

    if (fetchError || !existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Update the student
    const { data: student, error } = await supabase
      .from('students')
      .update(validatedData)
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Student update error:', {
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        validatedData
      })
      return NextResponse.json(
        { error: 'Failed to update student', details: error.message },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'UPDATE', 'student', student.id, {
      name: student.display_name || `${student.family_name}, ${student.first_name}${student.middle_name ? ' ' + student.middle_name : ''}`,
      year_level: student.year_level,
      gender: student.gender,
      universal_id: student.universal_id,
      changes: validatedData
    })

    return NextResponse.json(student)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Student update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    // First check if the student exists and belongs to the user
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('*')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single()

    if (fetchError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Delete the student (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .eq('id', params.id)
      .eq('owner_id', user.id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete student' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'DELETE', 'student', params.id, {
      name: student.full_name,
      year_level: student.year_level,
      external_id: student.external_id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
