import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bulkEnrollSchema = z.object({
  classId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()),
  action: z.enum(['enroll', 'unenroll']),
})

const bulkUnenrollSchema = z.object({
  classId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { classId, studentIds, action } = bulkEnrollSchema.parse(body)

    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify class ownership
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('owner_id', user.id)
      .single()

    if (classError || !classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    let result = { enrolled: 0, skipped: 0 }

    if (action === 'enroll') {
      // Get existing enrollments to avoid duplicates
      const { data: existingEnrollments } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('class_id', classId)
        .in('student_id', studentIds)

      const existingStudentIds = new Set(existingEnrollments?.map(e => e.student_id) || [])
      const newStudentIds = studentIds.filter(id => !existingStudentIds.has(id))

      if (newStudentIds.length > 0) {
        const enrollments = newStudentIds.map(studentId => ({
          class_id: classId,
          student_id: studentId,
          owner_id: user.id,
        }))

        const { error: enrollError } = await supabase
          .from('enrollments')
          .insert(enrollments)

        if (enrollError) {
          console.error('Enrollment error:', enrollError)
          return NextResponse.json({ error: 'Failed to enroll students' }, { status: 500 })
        }

        result.enrolled = newStudentIds.length
      }

      result.skipped = studentIds.length - result.enrolled

      // Log audit trail
      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'BULK_ENROLL',
        entity: 'enrollment',
        entity_id: classId,
        meta: { 
          student_count: result.enrolled,
          skipped_count: result.skipped,
          student_ids: newStudentIds 
        },
        owner_id: user.id,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }

    console.error('Bulk enrollment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { classId, studentIds } = bulkUnenrollSchema.parse(body)

    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify class ownership
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('owner_id', user.id)
      .single()

    if (classError || !classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Remove enrollments
    const { error: unenrollError, count } = await supabase
      .from('enrollments')
      .delete()
      .eq('class_id', classId)
      .in('student_id', studentIds)
      .eq('owner_id', user.id)

    if (unenrollError) {
      console.error('Unenrollment error:', unenrollError)
      return NextResponse.json({ error: 'Failed to unenroll students' }, { status: 500 })
    }

    // Log audit trail
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'BULK_UNENROLL',
      entity: 'enrollment',
      entity_id: classId,
      meta: { 
        student_count: count || 0,
        student_ids: studentIds 
      },
      owner_id: user.id,
    })

    return NextResponse.json({ unenrolled: count || 0 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }

    console.error('Bulk unenrollment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
