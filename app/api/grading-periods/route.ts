import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    // Get current school year
    const currentYear = new Date().getFullYear()
    const schoolYear = new Date().getMonth() >= 6 
      ? `${currentYear}-${currentYear + 1}`
      : `${currentYear - 1}-${currentYear}`

    // Fetch grading periods for current school year
    const { data: gradingPeriods, error: periodsError } = await supabase
      .from('grading_periods')
      .select('*')
      .eq('owner_id', user.id)
      .eq('school_year', schoolYear)
      .order('period_number')

    if (periodsError) {
      console.error('Error fetching grading periods:', periodsError)
      return NextResponse.json(
        { error: 'Failed to fetch grading periods' },
        { status: 500 }
      )
    }

    // Fetch assessment types for these periods
    let assessmentTypes: any[] = []
    if (gradingPeriods && gradingPeriods.length > 0) {
      const periodIds = gradingPeriods.map(p => p.id)
      const { data: types, error: typesError } = await supabase
        .from('assessment_types')
        .select('*')
        .eq('owner_id', user.id)
        .in('grading_period_id', periodIds)
        .order('grading_period_id')
        .order('percentage_weight', { ascending: false })

      if (!typesError) {
        assessmentTypes = types || []
      }
    }

    return NextResponse.json({
      school_year: schoolYear,
      grading_periods: gradingPeriods || [],
      assessment_types: assessmentTypes
    })
  } catch (error) {
    console.error('Error fetching grading periods:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
