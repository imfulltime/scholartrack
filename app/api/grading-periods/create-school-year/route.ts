import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    // Generate next school year
    const currentYear = new Date().getFullYear()
    const nextSchoolYear = new Date().getMonth() >= 6 
      ? `${currentYear + 1}-${currentYear + 2}`
      : `${currentYear}-${currentYear + 1}`

    // Check if school year already exists
    const { data: existingPeriods } = await supabase
      .from('grading_periods')
      .select('id')
      .eq('owner_id', user.id)
      .eq('school_year', nextSchoolYear)
      .limit(1)

    if (existingPeriods && existingPeriods.length > 0) {
      return NextResponse.json(
        { error: `School year ${nextSchoolYear} already exists` },
        { status: 400 }
      )
    }

    // Call the database function to create school year
    const { data: result, error } = await supabase
      .rpc('create_default_school_year', {
        p_owner_id: user.id,
        p_school_year: nextSchoolYear
      })

    if (error) {
      console.error('Error creating school year:', error)
      return NextResponse.json(
        { error: 'Failed to create school year' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'CREATE', 'school_year', nextSchoolYear, {
      school_year: nextSchoolYear,
      grading_periods_created: 4,
      assessment_types_created: 12 // 3 per period * 4 periods
    })

    return NextResponse.json({
      message: `School year ${nextSchoolYear} created successfully`,
      school_year: nextSchoolYear,
      data: result
    })
  } catch (error) {
    console.error('Error creating school year:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
