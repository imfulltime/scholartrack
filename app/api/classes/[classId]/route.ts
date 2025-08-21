import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit } from '@/lib/api'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    // First check if the class exists and belongs to the user
    const { data: classData, error: fetchError } = await supabase
      .from('classes')
      .select('*, subjects(name)')
      .eq('id', params.classId)
      .eq('owner_id', user.id)
      .single()

    if (fetchError || !classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Delete the class (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('classes')
      .delete()
      .eq('id', params.classId)
      .eq('owner_id', user.id)

    if (deleteError) {
      console.error('Class delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete class' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'DELETE', 'class', params.classId, {
      name: classData.name,
      subject: (classData.subjects as any)?.name,
      year_level: classData.year_level,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Class delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
