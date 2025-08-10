import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit, withOwnership } from '@/lib/api'
import { z } from 'zod'

const enrollmentSchema = z.object({
  class_id: z.string().uuid(),
  student_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    
    const validatedData = enrollmentSchema.parse(body)
    const supabase = createClient()

    // Verify both class and student belong to the user
    const [{ data: classData }, { data: student }] = await Promise.all([
      supabase
        .from('classes')
        .select('id, name, year_level')
        .eq('id', validatedData.class_id)
        .eq('owner_id', user.id)
        .single(),
      supabase
        .from('students')
        .select('id, full_name, year_level')
        .eq('id', validatedData.student_id)
        .eq('owner_id', user.id)
        .single()
    ])

    if (!classData || !student) {
      return NextResponse.json(
        { error: 'Class or student not found' },
        { status: 404 }
      )
    }

    // Verify year levels match
    if (classData.year_level !== student.year_level) {
      return NextResponse.json(
        { error: 'Student year level does not match class year level' },
        { status: 400 }
      )
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('class_id', validatedData.class_id)
      .eq('student_id', validatedData.student_id)
      .eq('owner_id', user.id)
      .single()

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Student is already enrolled in this class' },
        { status: 400 }
      )
    }

    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .insert(withOwnership(validatedData, user.id))
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to enroll student' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'CREATE', 'enrollment', enrollment.class_id, {
      class_name: classData.name,
      student_name: student.full_name,
      student_id: student.id,
    })

    return NextResponse.json(enrollment)
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

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    
    const validatedData = enrollmentSchema.parse(body)
    const supabase = createClient()

    // Get enrollment details for logging
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select(`
        *,
        classes(name),
        students(full_name)
      `)
      .eq('class_id', validatedData.class_id)
      .eq('student_id', validatedData.student_id)
      .eq('owner_id', user.id)
      .single()

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      )
    }

    // Delete the enrollment
    const { error: deleteError } = await supabase
      .from('enrollments')
      .delete()
      .eq('class_id', validatedData.class_id)
      .eq('student_id', validatedData.student_id)
      .eq('owner_id', user.id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to remove enrollment' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'DELETE', 'enrollment', validatedData.class_id, {
      class_name: enrollment.classes?.name,
      student_name: enrollment.students?.full_name,
      student_id: validatedData.student_id,
    })

    return NextResponse.json({ success: true })
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
