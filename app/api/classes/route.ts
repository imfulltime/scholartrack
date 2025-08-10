import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit, withOwnership } from '@/lib/api'
import { z } from 'zod'

const createClassSchema = z.object({
  name: z.string().min(1),
  subject_id: z.string().uuid(),
  year_level: z.number().min(1).max(12),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    
    const validatedData = createClassSchema.parse(body)
    const supabase = createClient()

    // Verify the subject belongs to the user
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('id', validatedData.subject_id)
      .eq('owner_id', user.id)
      .single()

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      )
    }

    const { data: classData, error } = await supabase
      .from('classes')
      .insert(withOwnership(validatedData, user.id))
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create class' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'CREATE', 'class', classData.id, {
      name: classData.name,
      subject: subject.name,
      year_level: classData.year_level,
    })

    return NextResponse.json(classData)
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

    const { data: classes, error } = await supabase
      .from('classes')
      .select(`
        *,
        subjects(name, code)
      `)
      .eq('owner_id', user.id)
      .order('name')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch classes' },
        { status: 500 }
      )
    }

    return NextResponse.json(classes)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
