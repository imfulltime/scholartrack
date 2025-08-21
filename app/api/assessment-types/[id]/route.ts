import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, logAudit } from '@/lib/api'
import { z } from 'zod'

const updateAssessmentTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  percentage_weight: z.number().min(0.01).max(100).optional(),
  is_active: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    
    const validatedData = updateAssessmentTypeSchema.parse(body)
    const supabase = createClient()

    // First check if the assessment type exists and belongs to the user
    const { data: assessmentType, error: fetchError } = await supabase
      .from('assessment_types')
      .select('*')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single()

    if (fetchError || !assessmentType) {
      return NextResponse.json(
        { error: 'Assessment type not found' },
        { status: 404 }
      )
    }

    // Check if name conflicts with another assessment type
    if (validatedData.name && validatedData.name !== assessmentType.name) {
      const { data: existingType } = await supabase
        .from('assessment_types')
        .select('id')
        .eq('name', validatedData.name)
        .eq('owner_id', user.id)
        .neq('id', params.id)
        .single()

      if (existingType) {
        return NextResponse.json(
          { error: 'An assessment type with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Check percentage totals if changing weight or active status
    const newPercentage = validatedData.percentage_weight ?? assessmentType.percentage_weight
    const newIsActive = validatedData.is_active ?? assessmentType.is_active

    if (newIsActive && (validatedData.percentage_weight !== undefined || validatedData.is_active !== undefined)) {
      const { data: otherActiveTypes } = await supabase
        .from('assessment_types')
        .select('percentage_weight')
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .neq('id', params.id)

      const otherTotal = (otherActiveTypes || []).reduce(
        (sum, type) => sum + type.percentage_weight, 
        0
      )
      const newTotal = otherTotal + newPercentage

      if (newTotal > 100) {
        return NextResponse.json(
          { error: `Total percentage would be ${newTotal.toFixed(1)}%. Maximum is 100%.` },
          { status: 400 }
        )
      }
    }

    const { data: updatedType, error: updateError } = await supabase
      .from('assessment_types')
      .update(validatedData)
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Assessment type update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update assessment type' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'UPDATE', 'assessment_type', params.id, {
      name: updatedType.name,
      changes: validatedData,
    })

    return NextResponse.json(updatedType)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Assessment type update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    // First check if the assessment type exists and belongs to the user
    const { data: assessmentType, error: fetchError } = await supabase
      .from('assessment_types')
      .select('*')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single()

    if (fetchError || !assessmentType) {
      return NextResponse.json(
        { error: 'Assessment type not found' },
        { status: 404 }
      )
    }

    // Check if there are any assessments using this type
    const { count } = await supabase
      .from('assessments')
      .select('id', { count: 'exact' })
      .eq('assessment_type_id', params.id)
      .eq('owner_id', user.id)

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete assessment type. ${count} assessment(s) are using this type.` },
        { status: 400 }
      )
    }

    // Prevent deletion of default types
    if (assessmentType.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete default assessment types' },
        { status: 400 }
      )
    }

    // Delete the assessment type
    const { error: deleteError } = await supabase
      .from('assessment_types')
      .delete()
      .eq('id', params.id)
      .eq('owner_id', user.id)

    if (deleteError) {
      console.error('Assessment type delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete assessment type' },
        { status: 500 }
      )
    }

    // Log the action
    await logAudit(user.id, 'DELETE', 'assessment_type', params.id, {
      name: assessmentType.name,
      percentage_weight: assessmentType.percentage_weight,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Assessment type delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
