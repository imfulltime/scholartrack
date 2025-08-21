import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { classId: string; studentId: string } }
) {
  try {
    const user = await getCurrentUser()
    const supabase = createClient()

    // Verify class belongs to teacher
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('id', params.classId)
      .eq('owner_id', user.id)
      .single()

    if (classError || !classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Verify student exists
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id, display_name, family_name, first_name')
      .eq('id', params.studentId)
      .eq('owner_id', user.id)
      .single()

    if (studentError || !studentData) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Get active assessment types for this teacher
    const { data: assessmentTypes, error: typesError } = await supabase
      .from('assessment_types')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .order('percentage_weight', { ascending: false })

    if (typesError) {
      console.error('Error fetching assessment types:', typesError)
      return NextResponse.json(
        { error: 'Failed to fetch assessment types' },
        { status: 500 }
      )
    }

    if (!assessmentTypes || assessmentTypes.length === 0) {
      return NextResponse.json({
        final_grade: null,
        letter_grade: null,
        breakdown: {},
        message: 'No active assessment types configured'
      })
    }

    // Calculate totals for each assessment type
    const breakdown: Record<string, any> = {}
    let weightedTotal = 0
    let totalWeight = 0

    for (const assessmentType of assessmentTypes) {
      // Get all assessments of this type for this class
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments')
        .select(`
          id, 
          title, 
          max_score,
          scores!inner(raw_score)
        `)
        .eq('class_id', params.classId)
        .eq('assessment_type_id', assessmentType.id)
        .eq('owner_id', user.id)
        .eq('scores.student_id', params.studentId)

      if (assessmentsError) {
        console.error('Error fetching assessments:', assessmentsError)
        continue
      }

      if (assessments && assessments.length > 0) {
        // Calculate average percentage for this assessment type
        const scores = assessments
          .map(a => (a.scores[0]?.raw_score || 0) / a.max_score * 100)
          .filter(score => score > 0)

        if (scores.length > 0) {
          const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
          const weightedScore = average * assessmentType.percentage_weight / 100

          breakdown[assessmentType.name] = {
            average: Math.round(average * 100) / 100,
            weight: assessmentType.percentage_weight,
            weighted_score: Math.round(weightedScore * 100) / 100,
            assessment_count: scores.length,
            assessments: assessments.map(a => ({
              title: a.title,
              score: a.scores[0]?.raw_score || 0,
              max_score: a.max_score,
              percentage: Math.round((a.scores[0]?.raw_score || 0) / a.max_score * 10000) / 100
            }))
          }

          weightedTotal += weightedScore
          totalWeight += assessmentType.percentage_weight
        }
      }
    }

    // Calculate final grade (adjust for missing assessment types)
    let finalGrade = 0
    if (totalWeight > 0) {
      finalGrade = weightedTotal * 100 / totalWeight
    }

    // Determine letter grade
    let letterGrade = 'F'
    if (finalGrade >= 97) letterGrade = 'A+'
    else if (finalGrade >= 93) letterGrade = 'A'
    else if (finalGrade >= 90) letterGrade = 'A-'
    else if (finalGrade >= 87) letterGrade = 'B+'
    else if (finalGrade >= 83) letterGrade = 'B'
    else if (finalGrade >= 80) letterGrade = 'B-'
    else if (finalGrade >= 77) letterGrade = 'C+'
    else if (finalGrade >= 73) letterGrade = 'C'
    else if (finalGrade >= 70) letterGrade = 'C-'
    else if (finalGrade >= 67) letterGrade = 'D+'
    else if (finalGrade >= 65) letterGrade = 'D'

    return NextResponse.json({
      student: {
        id: studentData.id,
        name: studentData.display_name || `${studentData.family_name}, ${studentData.first_name}`,
        family_name: studentData.family_name,
        first_name: studentData.first_name
      },
      class: {
        id: classData.id,
        name: classData.name
      },
      final_grade: Math.round(finalGrade * 100) / 100,
      letter_grade: letterGrade,
      total_weight_used: totalWeight,
      breakdown: breakdown,
      calculation_valid: totalWeight === 100
    })

  } catch (error) {
    console.error('Final grade calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate final grade' },
      { status: 500 }
    )
  }
}
