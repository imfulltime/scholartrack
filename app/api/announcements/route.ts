import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit, withOwnership } from '@/lib/api'
import { z } from 'zod'

const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  scope: z.enum(['SCHOOL', 'CLASS']),
  class_id: z.string().uuid().nullable(),
  published_at: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    
    const validatedData = createAnnouncementSchema.parse(body)
    const supabase = createClient()

    // Validate class ownership if class-scoped
    if (validatedData.scope === 'CLASS' && validatedData.class_id) {
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
    }

    // Ensure class_id is null for school-wide announcements
    if (validatedData.scope === 'SCHOOL') {
      validatedData.class_id = null
    }

    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert(withOwnership(validatedData, user.id))
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create announcement' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'CREATE', 'announcement', announcement.id, {
      title: announcement.title,
      scope: announcement.scope,
      class_id: announcement.class_id,
    })

    return NextResponse.json(announcement)
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

    const { data: announcements, error } = await supabase
      .from('announcements')
      .select(`
        *,
        classes(name, subjects(name))
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch announcements' },
        { status: 500 }
      )
    }

    return NextResponse.json(announcements)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
