import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit } from '@/lib/api'
import { z } from 'zod'

const publishSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    
    const { status } = publishSchema.parse(body)
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

    // Update the status
    const { error: updateError } = await supabase
      .from('assessments')
      .update({ status })
      .eq('id', params.id)
      .eq('owner_id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update assessment status' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'PUBLISH', 'assessment', params.id, {
      title: assessment.title,
      class_name: assessment.classes?.name,
      status_change: `${assessment.status} -> ${status}`,
    })

    return NextResponse.json({ success: true, status })
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
