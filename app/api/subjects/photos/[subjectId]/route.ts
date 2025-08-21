import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    // Fetch photos for the subject that haven't expired
    const { data: photos, error } = await supabase
      .from('subject_photos')
      .select('*')
      .eq('subject_id', params.subjectId)
      .eq('owner_id', user.id)
      .gt('expires_at', new Date().toISOString())
      .order('display_order')

    if (error) {
      console.error('Error fetching photos:', error)
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      )
    }

    return NextResponse.json(photos)
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
