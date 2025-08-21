import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit } from '@/lib/api'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    // Verify the grading period belongs to the user
    const { data: period, error: fetchError } = await supabase
      .from('grading_periods')
      .select('*')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single()

    if (fetchError || !period) {
      return NextResponse.json(
        { error: 'Grading period not found' },
        { status: 404 }
      )
    }

    // First, set all periods for this school year to not current
    const { error: updateAllError } = await supabase
      .from('grading_periods')
      .update({ is_current: false })
      .eq('owner_id', user.id)
      .eq('school_year', period.school_year)

    if (updateAllError) {
      console.error('Error updating all periods:', updateAllError)
      return NextResponse.json(
        { error: 'Failed to update current period' },
        { status: 500 }
      )
    }

    // Then set the selected period as current
    const { error: setCurrentError } = await supabase
      .from('grading_periods')
      .update({ is_current: true })
      .eq('id', params.id)
      .eq('owner_id', user.id)

    if (setCurrentError) {
      console.error('Error setting current period:', setCurrentError)
      return NextResponse.json(
        { error: 'Failed to set current period' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'UPDATE', 'grading_period', params.id, {
      action: 'set_current',
      period_name: period.name,
      school_year: period.school_year
    })

    return NextResponse.json({
      message: `${period.name} set as current grading period`,
      period: period
    })
  } catch (error) {
    console.error('Error setting current period:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
