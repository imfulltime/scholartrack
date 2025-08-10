import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit, withOwnership } from '@/lib/api'
import { z } from 'zod'

const createSubjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(10),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    
    const validatedData = createSubjectSchema.parse(body)
    const supabase = createClient()

    // Check if subject code already exists for this user
    const { data: existingSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('code', validatedData.code)
      .eq('owner_id', user.id)
      .single()

    if (existingSubject) {
      return NextResponse.json(
        { error: 'A subject with this code already exists' },
        { status: 400 }
      )
    }

    const { data: subject, error } = await supabase
      .from('subjects')
      .insert(withOwnership(validatedData, user.id))
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create subject' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'CREATE', 'subject', subject.id, {
      name: subject.name,
      code: subject.code,
    })

    return NextResponse.json(subject)
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

    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('owner_id', user.id)
      .order('name')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch subjects' },
        { status: 500 }
      )
    }

    return NextResponse.json(subjects)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
