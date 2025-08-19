import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit, withOwnership } from '@/lib/api'
import { z } from 'zod'

const scoreSchema = z.object({
  assessment_id: z.string().uuid(),
  student_id: z.string().uuid(),
  raw_score: z.number().min(0).nullable(),
  comment: z.string().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    
    const validatedData = scoreSchema.parse(body)
    const supabase = createClient()

    // Verify the assessment belongs to the user
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, title, max_score')
      .eq('id', validatedData.assessment_id)
      .eq('owner_id', user.id)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Verify the student belongs to the user
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('id', validatedData.student_id)
      .eq('owner_id', user.id)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Validate score against max_score
    if (validatedData.raw_score !== null && validatedData.raw_score > assessment.max_score) {
      return NextResponse.json(
        { error: `Score cannot exceed maximum score of ${assessment.max_score}` },
        { status: 400 }
      )
    }

    // Upsert the score
    const scoreData = withOwnership({
      ...validatedData,
      last_updated_by: user.id,
    }, user.id)

    const { data: score, error } = await supabase
      .from('scores')
      .upsert(scoreData, {
        onConflict: 'assessment_id, student_id'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save score' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'UPDATE', 'score', validatedData.assessment_id, {
      student_name: student.full_name,
      assessment_title: assessment.title,
      score: validatedData.raw_score,
      comment: validatedData.comment,
    })

    return NextResponse.json(score)
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
