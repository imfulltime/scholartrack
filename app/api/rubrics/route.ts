import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createRubricSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  criteria: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    weight: z.number().min(0).max(100),
  })),
  scale: z.object({
    min: z.number(),
    max: z.number(),
    labels: z.array(z.string()),
  }),
  classId: z.string().uuid(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('rubrics')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (classId) {
      query = query.eq('class_id', classId)
    }

    const { data: rubrics, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json(rubrics)
  } catch (error) {
    console.error('Get rubrics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createRubricSchema.parse(body)

    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create rubric
    const { data: rubric, error } = await supabase
      .from('rubrics')
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        criteria: validatedData.criteria,
        scale: validatedData.scale,
        class_id: validatedData.classId,
        owner_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create rubric' }, { status: 500 })
    }

    // Log audit trail
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'CREATE_RUBRIC',
      entity: 'rubric',
      entity_id: rubric.id,
      meta: { rubric_name: validatedData.name },
      owner_id: user.id,
    })

    return NextResponse.json(rubric, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }

    console.error('Create rubric error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
