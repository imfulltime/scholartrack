import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit, withOwnership } from '@/lib/api'
import { z } from 'zod'

const createAssessmentTypeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  percentage_weight: z.number().min(0.01).max(100),
  is_active: z.boolean().default(true),
  grading_period_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    
    const validatedData = createAssessmentTypeSchema.parse(body)
    const supabase = createClient()

    // Check if name already exists for this user in the same grading period
    let existingTypeQuery = supabase
      .from('assessment_types')
      .select('id')
      .eq('name', validatedData.name)
      .eq('owner_id', user.id)

    if (validatedData.grading_period_id) {
      existingTypeQuery = existingTypeQuery.eq('grading_period_id', validatedData.grading_period_id)
    } else {
      existingTypeQuery = existingTypeQuery.is('grading_period_id', null)
    }

    const { data: existingType } = await existingTypeQuery.single()

    if (existingType) {
      return NextResponse.json(
        { error: 'An assessment type with this name already exists' },
        { status: 400 }
      )
    }

    // If active, check total percentage doesn't exceed 100% for this grading period
    if (validatedData.is_active) {
      let activeTypesQuery = supabase
        .from('assessment_types')
        .select('percentage_weight')
        .eq('owner_id', user.id)
        .eq('is_active', true)

      if (validatedData.grading_period_id) {
        activeTypesQuery = activeTypesQuery.eq('grading_period_id', validatedData.grading_period_id)
      } else {
        activeTypesQuery = activeTypesQuery.is('grading_period_id', null)
      }

      const { data: activeTypes } = await activeTypesQuery

      const totalPercentage = (activeTypes || []).reduce(
        (sum, type) => sum + type.percentage_weight, 
        0
      ) + validatedData.percentage_weight

      if (totalPercentage > 100) {
        return NextResponse.json(
          { error: `Total percentage would be ${totalPercentage.toFixed(1)}%. Maximum is 100%.` },
          { status: 400 }
        )
      }
    }

    const { data: assessmentType, error } = await supabase
      .from('assessment_types')
      .insert(withOwnership(validatedData, user.id))
      .select()
      .single()

    if (error) {
      console.error('Assessment type creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create assessment type' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'CREATE', 'assessment_type', assessmentType.id, {
      name: assessmentType.name,
      percentage_weight: assessmentType.percentage_weight,
      is_active: assessmentType.is_active,
    })

    return NextResponse.json(assessmentType)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Assessment type creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    const gradingPeriodId = searchParams.get('gradingPeriodId')
    
    const supabase = createClient()

    let query = supabase
      .from('assessment_types')
      .select('*')
      .eq('owner_id', user.id)

    if (gradingPeriodId) {
      query = query.eq('grading_period_id', gradingPeriodId)
    }

    const { data: assessmentTypes, error } = await query
      .order('is_default', { ascending: false })
      .order('percentage_weight', { ascending: false })

    if (error) {
      console.error('Error fetching assessment types:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assessment types' },
        { status: 500 }
      )
    }

    return NextResponse.json(assessmentTypes)
  } catch (error) {
    console.error('Error fetching assessment types:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
