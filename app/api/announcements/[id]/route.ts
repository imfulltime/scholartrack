import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit } from '@/lib/api'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    // First check if the announcement exists and belongs to the user
    const { data: announcement, error: fetchError } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single()

    if (fetchError || !announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    // Delete the announcement
    const { error: deleteError } = await supabase
      .from('announcements')
      .delete()
      .eq('id', params.id)
      .eq('owner_id', user.id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete announcement' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'DELETE', 'announcement', params.id, {
      title: announcement.title,
      scope: announcement.scope,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
