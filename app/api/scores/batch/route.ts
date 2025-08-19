import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit, withOwnership } from '@/lib/api'
import { z } from 'zod'

const batchScoreSchema = z.object({
  scores: z.array(z.object({
    assessment_id: z.string().uuid(),
    student_id: z.string().uuid(),
    raw_score: z.number().min(0).nullable(),
    comment: z.string().nullable(),
  })).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    
    const { scores } = batchScoreSchema.parse(body)
    const supabase = createClient()

    // Get assessment details for validation
    const assessmentIds = [...new Set(scores.map(s => s.assessment_id))]
    const { data: assessments, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, title, max_score')
      .in('id', assessmentIds)
      .eq('owner_id', user.id)

    if (assessmentError || assessments.length !== assessmentIds.length) {
      return NextResponse.json(
        { error: 'One or more assessments not found' },
        { status: 404 }
      )
    }

    // Get student details for validation
    const studentIds = [...new Set(scores.map(s => s.student_id))]
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id, full_name')
      .in('id', studentIds)
      .eq('owner_id', user.id)

    if (studentError || students.length !== studentIds.length) {
      return NextResponse.json(
        { error: 'One or more students not found' },
        { status: 404 }
      )
    }

    // Validate scores against max_scores
    for (const score of scores) {
      const assessment = assessments.find(a => a.id === score.assessment_id)
      if (assessment && score.raw_score !== null && score.raw_score > assessment.max_score) {
        return NextResponse.json(
          { error: `Score for ${assessment.title} cannot exceed maximum score of ${assessment.max_score}` },
          { status: 400 }
        )
      }
    }

    // Prepare scores for upsert
    const scoresToUpsert = scores.map(score => withOwnership({
      ...score,
      last_updated_by: user.id,
    }, user.id))

    // Batch upsert scores
    const { data: upsertedScores, error } = await supabase
      .from('scores')
      .upsert(scoresToUpsert, {
        onConflict: 'assessment_id, student_id'
      })
      .select()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save scores' },
        { status: 500 }
      )
    }

    // Log batch update
    await logAudit(user.id, 'BATCH_UPDATE', 'score', 'batch', {
      count: scores.length,
      assessments: assessments.map(a => a.title),
      students: students.map(s => s.full_name),
    })

    return NextResponse.json({
      success: true,
      updated: upsertedScores.length,
      scores: upsertedScores,
    })
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
