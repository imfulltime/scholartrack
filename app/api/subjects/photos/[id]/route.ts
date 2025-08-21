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

    // First check if the photo exists and belongs to the user
    const { data: photo, error: fetchError } = await supabase
      .from('subject_photos')
      .select('*, subjects(name)')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single()

    if (fetchError || !photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Delete the photo
    const { error: deleteError } = await supabase
      .from('subject_photos')
      .delete()
      .eq('id', params.id)
      .eq('owner_id', user.id)

    if (deleteError) {
      console.error('Photo delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete photo' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'DELETE', 'subject_photo', params.id, {
      subject_name: (photo.subjects as any)?.name || 'Unknown',
      caption: photo.caption,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Photo delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
