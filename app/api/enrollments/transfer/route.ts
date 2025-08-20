import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const transferSchema = z.object({
  fromClassId: z.string().uuid(),
  toClassId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()),
  transferType: z.enum(['move', 'copy']),
  reason: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromClassId, toClassId, studentIds, transferType, reason } = transferSchema.parse(body)

    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify both classes are owned by the user
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('id, name')
      .in('id', [fromClassId, toClassId])
      .eq('owner_id', user.id)

    if (classError || !classes || classes.length !== 2) {
      return NextResponse.json({ error: 'One or both classes not found' }, { status: 404 })
    }

    const fromClass = classes.find(c => c.id === fromClassId)
    const toClass = classes.find(c => c.id === toClassId)

    // Check which students are currently enrolled in the from class
    const { data: currentEnrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('class_id', fromClassId)
      .in('student_id', studentIds)
      .eq('owner_id', user.id)

    if (enrollmentError) {
      console.error('Enrollment check error:', enrollmentError)
      return NextResponse.json({ error: 'Failed to check enrollments' }, { status: 500 })
    }

    const enrolledStudentIds = currentEnrollments?.map(e => e.student_id) || []
    
    if (enrolledStudentIds.length === 0) {
      return NextResponse.json({ error: 'No students found in source class' }, { status: 400 })
    }

    // Check for existing enrollments in target class to avoid duplicates
    const { data: existingTargetEnrollments } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('class_id', toClassId)
      .in('student_id', enrolledStudentIds)
      .eq('owner_id', user.id)

    const existingTargetStudentIds = new Set(existingTargetEnrollments?.map(e => e.student_id) || [])
    const studentsToTransfer = enrolledStudentIds.filter(id => !existingTargetStudentIds.has(id))

    let result = { transferred: 0, skipped: 0, errors: [] as string[] }

    if (studentsToTransfer.length > 0) {
      // Create new enrollments in target class
      const newEnrollments = studentsToTransfer.map(studentId => ({
        class_id: toClassId,
        student_id: studentId,
        owner_id: user.id,
      }))

      const { error: createError } = await supabase
        .from('enrollments')
        .insert(newEnrollments)

      if (createError) {
        console.error('Transfer enrollment error:', createError)
        return NextResponse.json({ error: 'Failed to create new enrollments' }, { status: 500 })
      }

      result.transferred = studentsToTransfer.length

      // If move operation, remove from source class
      if (transferType === 'move') {
        const { error: removeError } = await supabase
          .from('enrollments')
          .delete()
          .eq('class_id', fromClassId)
          .in('student_id', studentsToTransfer)
          .eq('owner_id', user.id)

        if (removeError) {
          console.error('Remove enrollment error:', removeError)
          // Note: At this point, students are enrolled in both classes
          // This could be cleaned up manually or via a background job
          result.errors.push('Students were copied to new class but not removed from original class')
        }
      }
    }

    result.skipped = enrolledStudentIds.length - result.transferred

    // Log audit trail
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: transferType === 'move' ? 'TRANSFER_STUDENTS' : 'COPY_STUDENTS',
      entity: 'enrollment',
      entity_id: toClassId,
      meta: { 
        from_class: fromClass?.name,
        to_class: toClass?.name,
        student_count: result.transferred,
        transfer_type: transferType,
        reason,
        skipped_count: result.skipped,
        student_ids: studentsToTransfer 
      },
      owner_id: user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }

    console.error('Transfer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
