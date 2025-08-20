import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const timeRange = searchParams.get('timeRange') || '30d'

    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate date range
    const now = new Date()
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

    // Base query conditions
    const baseConditions = {
      owner_id: user.id,
      ...(classId && { class_id: classId }),
    }

    // Get overview statistics
    const [studentsResult, assessmentsResult, scoresResult] = await Promise.all([
      // Total students
      supabase
        .from('enrollments')
        .select('student_id')
        .match(baseConditions)
        .gte('created_at', startDate.toISOString()),

      // Total assessments
      supabase
        .from('assessments')
        .select('*')
        .match(baseConditions)
        .gte('created_at', startDate.toISOString()),

      // All scores for calculations
      supabase
        .from('scores')
        .select(`
          *,
          assessment:assessments!inner(*)
        `)
        .eq('assessments.owner_id', user.id)
        .gte('created_at', startDate.toISOString())
    ])

    if (studentsResult.error || assessmentsResult.error || scoresResult.error) {
      console.error('Database error:', studentsResult.error || assessmentsResult.error || scoresResult.error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const students = studentsResult.data || []
    const assessments = assessmentsResult.data || []
    const scores = scoresResult.data || []

    // Calculate metrics
    const totalStudents = new Set(students.map(s => s.student_id)).size
    const totalAssessments = assessments.length
    
    const validScores = scores.filter(s => s.raw_score !== null && s.assessment?.max_score)
    const averageGrade = validScores.length > 0 
      ? validScores.reduce((sum, score) => sum + (score.raw_score / score.assessment.max_score * 100), 0) / validScores.length
      : 0

    const completionRate = totalAssessments > 0 
      ? (validScores.length / (totalStudents * totalAssessments)) * 100
      : 0

    // Grade distribution
    const gradeDistribution = [
      { grade: 'A', count: 0, percentage: 0 },
      { grade: 'B', count: 0, percentage: 0 },
      { grade: 'C', count: 0, percentage: 0 },
      { grade: 'D', count: 0, percentage: 0 },
      { grade: 'F', count: 0, percentage: 0 },
    ]

    validScores.forEach(score => {
      const percentage = (score.raw_score / score.assessment.max_score) * 100
      if (percentage >= 90) gradeDistribution[0].count++
      else if (percentage >= 80) gradeDistribution[1].count++
      else if (percentage >= 70) gradeDistribution[2].count++
      else if (percentage >= 60) gradeDistribution[3].count++
      else gradeDistribution[4].count++
    })

    gradeDistribution.forEach(grade => {
      grade.percentage = validScores.length > 0 ? (grade.count / validScores.length) * 100 : 0
    })

    // Performance trends (weekly aggregation)
    const performanceTrends = []
    for (let i = daysBack; i >= 0; i -= 7) {
      const weekStart = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000))
      const weekEnd = new Date(now.getTime() - ((i - 7) * 24 * 60 * 60 * 1000))
      
      const weekScores = scores.filter(score => {
        const scoreDate = new Date(score.created_at)
        return scoreDate >= weekStart && scoreDate < weekEnd
      })

      const weekAverage = weekScores.length > 0
        ? weekScores.reduce((sum, score) => sum + (score.raw_score / score.assessment.max_score * 100), 0) / weekScores.length
        : 0

      performanceTrends.push({
        date: weekStart.toLocaleDateString(),
        average: weekAverage,
        assessmentCount: new Set(weekScores.map(s => s.assessment_id)).size,
      })
    }

    // Get class comparison (if not filtered by class)
    let classComparison: Array<{
      className: string
      average: number
      studentCount: number
    }> = []
    if (!classId) {
      const { data: classes } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          enrollments(count)
        `)
        .eq('owner_id', user.id)

      // Get scores for each class separately to avoid complex nested queries
      if (classes) {
        classComparison = await Promise.all(
          classes.map(async (cls: any) => {
            const { data: classScores } = await supabase
              .from('scores')
              .select(`
                raw_score,
                assessment:assessments!inner(max_score, class_id)
              `)
              .eq('assessments.class_id', cls.id)
              .eq('owner_id', user.id)

            const validClassScores = (classScores || []).filter((s: any) => 
              s.raw_score !== null && s.assessment?.max_score
            )
            
            const average = validClassScores.length > 0
              ? validClassScores.reduce((sum: number, score: any) => 
                  sum + (score.raw_score / score.assessment.max_score * 100), 0
                ) / validClassScores.length
              : 0

            return {
              className: cls.name,
              average,
              studentCount: cls.enrollments?.[0]?.count || 0,
            }
          })
        )
      }
    }

    // Calculate student performance for top performers and struggling students
    const { data: studentsWithScores } = await supabase
      .from('students')
      .select(`
        id,
        full_name,
        scores(
          raw_score,
          assessment:assessments!inner(max_score, created_at)
        )
      `)
      .eq('owner_id', user.id)

    const studentPerformance = (studentsWithScores || []).map((student: any) => {
      const studentScores = (student.scores || []).filter((s: any) => s.raw_score !== null)
      
      if (studentScores.length === 0) {
        return {
          studentName: student.full_name,
          average: 0,
          improvementRate: 0,
          risksFailure: true,
        }
      }

      const average = studentScores.reduce((sum: number, score: any) => 
        sum + (score.raw_score / score.assessment.max_score * 100), 0
      ) / studentScores.length

      // Calculate improvement rate (compare first half vs second half of scores)
      const sortedScores = studentScores.sort((a: any, b: any) => 
        new Date(a.assessment.created_at).getTime() - new Date(b.assessment.created_at).getTime()
      )
      
      let improvementRate = 0
      if (sortedScores.length >= 4) {
        const firstHalf = sortedScores.slice(0, Math.floor(sortedScores.length / 2))
        const secondHalf = sortedScores.slice(Math.floor(sortedScores.length / 2))
        
        const firstAvg = firstHalf.reduce((sum: number, score: any) => 
          sum + (score.raw_score / score.assessment.max_score * 100), 0
        ) / firstHalf.length
        
        const secondAvg = secondHalf.reduce((sum: number, score: any) => 
          sum + (score.raw_score / score.assessment.max_score * 100), 0
        ) / secondHalf.length
        
        improvementRate = secondAvg - firstAvg
      }

      return {
        studentName: student.full_name,
        average,
        improvementRate,
        risksFailure: average < 60,
      }
    })

    const topPerformers = studentPerformance
      .sort((a, b) => b.average - a.average)
      .slice(0, 5)

    const strugglingStudents = studentPerformance
      .filter(s => s.average < 70)
      .sort((a, b) => a.average - b.average)
      .slice(0, 5)

    const analyticsData = {
      overview: {
        totalStudents,
        totalAssessments,
        averageGrade,
        completionRate,
      },
      gradeDistribution,
      performanceTrends,
      classComparison,
      topPerformers,
      strugglingStudents,
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
