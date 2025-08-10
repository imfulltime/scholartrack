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

    // First check if the assessment exists and belongs to the user
    const { data: assessment, error: fetchError } = await supabase
      .from('assessments')
      .select('*, classes(name)')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single()

    if (fetchError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Delete the assessment (cascade will handle related scores)
    const { error: deleteError } = await supabase
      .from('assessments')
      .delete()
      .eq('id', params.id)
      .eq('owner_id', user.id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete assessment' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'DELETE', 'assessment', params.id, {
      title: assessment.title,
      type: assessment.type,
      class_name: assessment.classes?.name,
      max_score: assessment.max_score,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
