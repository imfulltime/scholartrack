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

    // First check if the subject exists and belongs to the user
    const { data: subject, error: fetchError } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single()

    if (fetchError || !subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      )
    }

    // Delete the subject (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('subjects')
      .delete()
      .eq('id', params.id)
      .eq('owner_id', user.id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete subject' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'DELETE', 'subject', params.id, {
      name: subject.name,
      code: subject.code,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
