import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFGenerator } from '@/lib/pdf-generator'
import { z } from 'zod'

const pdfReportSchema = z.object({
  type: z.enum(['student', 'class', 'transcript']),
  studentId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, studentId, classId } = pdfReportSchema.parse(body)

    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pdfGenerator = new PDFGenerator()
    let pdfBuffer: ArrayBuffer
    let filename: string

    if (type === 'student' && studentId && classId) {
      // Generate student report
      const studentData = await fetchStudentReportData(supabase, user.id, studentId, classId)
      if (!studentData) {
        return NextResponse.json({ error: 'Student or class not found' }, { status: 404 })
      }

      pdfBuffer = pdfGenerator.generateStudentReport(studentData)
      filename = `student-report-${studentData.student.full_name.replace(/\s+/g, '-')}.pdf`

    } else if (type === 'class' && classId) {
      // Generate class summary
      const classData = await fetchClassSummaryData(supabase, user.id, classId)
      if (!classData) {
        return NextResponse.json({ error: 'Class not found' }, { status: 404 })
      }

      pdfBuffer = pdfGenerator.generateClassSummary(classData)
      filename = `class-summary-${classData.className.replace(/\s+/g, '-')}.pdf`

    } else if (type === 'transcript' && studentId) {
      // Generate transcript
      const transcriptData = await fetchTranscriptData(supabase, user.id, studentId)
      if (!transcriptData) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }

      pdfBuffer = pdfGenerator.generateTranscript(transcriptData)
      filename = `transcript-${transcriptData.student.full_name.replace(/\s+/g, '-')}.pdf`

    } else {
      return NextResponse.json({ error: 'Invalid parameters for report type' }, { status: 400 })
    }

    // Log audit trail
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'GENERATE_PDF_REPORT',
      entity: 'report',
      entity_id: studentId || classId || '',
      meta: { 
        report_type: type,
        filename 
      },
      owner_id: user.id,
    })

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }

    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function fetchStudentReportData(supabase: any, ownerId: string, studentId: string, classId: string) {
  try {
    // Get student info
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .eq('owner_id', ownerId)
      .single()

    if (!student) return null

    // Get class info
    const { data: classInfo } = await supabase
      .from('classes')
      .select('name, subject:subjects(name)')
      .eq('id', classId)
      .eq('owner_id', ownerId)
      .single()

    if (!classInfo) return null

    // Get teacher info
    const { data: teacher } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', ownerId)
      .single()

    // Get scores for this student in this class
    const { data: scores } = await supabase
      .from('scores')
      .select(`
        raw_score,
        grade_letter,
        comment,
        assessment:assessments!inner(
          title,
          type,
          date,
          max_score,
          weight
        )
      `)
      .eq('student_id', studentId)
      .eq('assessments.class_id', classId)
      .eq('owner_id', ownerId)
      .order('assessments.date', { ascending: true })

    // Calculate overall grade and trends
    const validScores = scores?.filter((s: any) => s.raw_score !== null) || []
    const overallGrade = validScores.length > 0
      ? validScores.reduce((sum: number, score: any) => sum + (score.raw_score / score.assessment.max_score * 100), 0) / validScores.length
      : 0

    // Calculate trends
    const trends = calculateTrends(validScores)
    const letterGrade = getLetterGrade(overallGrade)

    return {
      student,
      className: classInfo.name,
      subject: classInfo.subject.name,
      teacher: teacher?.full_name || 'Unknown Teacher',
      scores: validScores,
      overallGrade,
      letterGrade,
      trends,
    }
  } catch (error) {
    console.error('Error fetching student report data:', error)
    return null
  }
}

async function fetchClassSummaryData(supabase: any, ownerId: string, classId: string) {
  try {
    // Get class info
    const { data: classInfo } = await supabase
      .from('classes')
      .select('name, subject:subjects(name)')
      .eq('id', classId)
      .eq('owner_id', ownerId)
      .single()

    if (!classInfo) return null

    // Get teacher info
    const { data: teacher } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', ownerId)
      .single()

    // Get students in this class
    const { data: students } = await supabase
      .from('enrollments')
      .select('student:students(*)')
      .eq('class_id', classId)
      .eq('owner_id', ownerId)

    // Get assessments for this class
    const { data: assessments } = await supabase
      .from('assessments')
      .select('*')
      .eq('class_id', classId)
      .eq('owner_id', ownerId)
      .order('date', { ascending: true })

    // Get all scores for this class
    const { data: scores } = await supabase
      .from('scores')
      .select('*, assessment:assessments!inner(*)')
      .eq('assessments.class_id', classId)
      .eq('owner_id', ownerId)

    // Calculate analytics
    const validScores = scores?.filter((s: any) => s.raw_score !== null) || []
    const classAverage = validScores.length > 0
      ? validScores.reduce((sum: number, score: any) => sum + (score.raw_score / score.assessment.max_score * 100), 0) / validScores.length
      : 0

    const percentages = validScores.map((score: any) => (score.raw_score / score.assessment.max_score) * 100)
    const highestScore = percentages.length > 0 ? Math.max(...percentages) : 0
    const lowestScore = percentages.length > 0 ? Math.min(...percentages) : 0

    return {
      className: classInfo.name,
      subject: classInfo.subject.name,
      teacher: teacher?.full_name || 'Unknown Teacher',
      students: students?.map((e: any) => e.student) || [],
      assessments: assessments || [],
      scores: validScores,
      analytics: {
        classAverage,
        highestScore,
        lowestScore,
        totalAssessments: assessments?.length || 0,
      },
    }
  } catch (error) {
    console.error('Error fetching class summary data:', error)
    return null
  }
}

async function fetchTranscriptData(supabase: any, ownerId: string, studentId: string) {
  try {
    // Get student info
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .eq('owner_id', ownerId)
      .single()

    if (!student) return null

    // Get teacher info
    const { data: teacher } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', ownerId)
      .single()

    // For now, just get the main class data (could be expanded for multiple classes)
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        class:classes(
          name,
          subject:subjects(name)
        )
      `)
      .eq('student_id', studentId)
      .eq('owner_id', ownerId)
      .limit(1)

    if (!enrollments || enrollments.length === 0) return null

    const mainClass = enrollments[0].class

    // Get scores for transcript calculation
    const { data: scores } = await supabase
      .from('scores')
      .select(`
        raw_score,
        grade_letter,
        comment,
        assessment:assessments!inner(
          title,
          type,
          date,
          max_score,
          weight,
          class:classes(name, subject:subjects(name))
        )
      `)
      .eq('student_id', studentId)
      .eq('owner_id', ownerId)
      .order('assessments.date', { ascending: true })

    const validScores = scores?.filter((s: any) => s.raw_score !== null) || []
    const overallGrade = validScores.length > 0
      ? validScores.reduce((sum: number, score: any) => sum + (score.raw_score / score.assessment.max_score * 100), 0) / validScores.length
      : 0

    const trends = calculateTrends(validScores)
    const letterGrade = getLetterGrade(overallGrade)

    return {
      student,
      className: mainClass.name,
      subject: mainClass.subject.name,
      teacher: teacher?.full_name || 'Unknown Teacher',
      scores: validScores,
      overallGrade,
      letterGrade,
      trends,
      // Could add additional classes here for a full transcript
      additionalClasses: [],
    }
  } catch (error) {
    console.error('Error fetching transcript data:', error)
    return null
  }
}

function calculateTrends(scores: any[]) {
  if (scores.length < 3) {
    return { improving: false, consistent: true, declining: false }
  }

  const firstThird = scores.slice(0, Math.floor(scores.length / 3))
  const lastThird = scores.slice(-Math.floor(scores.length / 3))

  const firstAvg = firstThird.reduce((sum: number, score: any) => 
    sum + (score.raw_score / score.assessment.max_score * 100), 0
  ) / firstThird.length

  const lastAvg = lastThird.reduce((sum: number, score: any) => 
    sum + (score.raw_score / score.assessment.max_score * 100), 0
  ) / lastThird.length

  const difference = lastAvg - firstAvg

  return {
    improving: difference > 5,
    consistent: Math.abs(difference) <= 5,
    declining: difference < -5,
  }
}

function getLetterGrade(percentage: number): string {
  if (percentage >= 97) return 'A+'
  if (percentage >= 93) return 'A'
  if (percentage >= 90) return 'A-'
  if (percentage >= 87) return 'B+'
  if (percentage >= 83) return 'B'
  if (percentage >= 80) return 'B-'
  if (percentage >= 77) return 'C+'
  if (percentage >= 73) return 'C'
  if (percentage >= 70) return 'C-'
  if (percentage >= 67) return 'D+'
  if (percentage >= 65) return 'D'
  return 'F'
}
