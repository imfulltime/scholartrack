import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { GradebookInterface } from '@/components/gradebook/GradebookInterface'

interface GradebookPageProps {
  params: { 
    classId: string
    assessmentId: string 
  }
}

export default async function GradebookPage({ params }: GradebookPageProps) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get assessment details
  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .select(`
      *,
      classes(name, subjects(name))
    `)
    .eq('id', params.assessmentId)
    .eq('owner_id', user.id)
    .single()

  if (assessmentError || !assessment) {
    notFound()
  }

  // Get enrolled students for this class
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      students(id, family_name, first_name, middle_name, display_name, full_name, external_id)
    `)
    .eq('class_id', params.classId)
    .eq('owner_id', user.id)
    .order('students(family_name), students(first_name)')

  // Get existing scores for this assessment
  const { data: existingScores } = await supabase
    .from('scores')
    .select('*')
    .eq('assessment_id', params.assessmentId)
    .eq('owner_id', user.id)

  // Combine student data with their scores
  const students = enrollments?.map(enrollment => {
    const student = enrollment.students
    const score = existingScores?.find(s => s.student_id === student?.id)
    
    return {
      id: student?.id || '',
      family_name: student?.family_name || '',
      first_name: student?.first_name || '',
      middle_name: student?.middle_name || null,
      display_name: student?.display_name || `${student?.family_name || ''}, ${student?.first_name || ''}${student?.middle_name ? ' ' + student.middle_name : ''}`,
      full_name: student?.full_name || null,
      external_id: student?.external_id || null,
      raw_score: score?.raw_score || null,
      comment: score?.comment || ''
    }
  }) || []

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {assessment.classes?.subjects?.name} • {assessment.classes?.name} • Max Score: {assessment.max_score}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                assessment.status === 'PUBLISHED' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {assessment.status}
              </span>
            </div>
          </div>
        </div>

        <GradebookInterface
          assessmentId={params.assessmentId}
          students={students}
          maxScore={assessment.max_score}
          classId={params.classId}
        />
      </div>
    </div>
  )
}
