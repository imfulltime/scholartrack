import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit, withOwnership } from '@/lib/api'
import { z } from 'zod'

const createAssessmentSchema = z.object({
  class_id: z.string().uuid(),
  title: z.string().min(1),
  type: z.enum(['QUIZ', 'EXAM', 'ASSIGNMENT']),
  date: z.string(),
  max_score: z.number().min(0.01),
  weight: z.number().min(0).default(1),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    
    const validatedData = createAssessmentSchema.parse(body)
    const supabase = createClient()

    // Verify the class belongs to the user
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('id', validatedData.class_id)
      .eq('owner_id', user.id)
      .single()

    if (classError || !classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    const { data: assessment, error } = await supabase
      .from('assessments')
      .insert(withOwnership(validatedData, user.id))
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create assessment' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'CREATE', 'assessment', assessment.id, {
      title: assessment.title,
      type: assessment.type,
      class_name: classData.name,
      max_score: assessment.max_score,
    })

    return NextResponse.json(assessment)
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

    const { data: assessments, error } = await supabase
      .from('assessments')
      .select(`
        *,
        classes(name, subjects(name))
      `)
      .eq('owner_id', user.id)
      .order('date', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch assessments' },
        { status: 500 }
      )
    }

    return NextResponse.json(assessments)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
