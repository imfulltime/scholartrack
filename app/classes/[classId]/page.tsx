import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClassHeader } from '@/components/classes/ClassHeader'
import { EnrollmentManager } from '@/components/classes/EnrollmentManager'
import { AssessmentsList } from '@/components/assessments/AssessmentsList'
import { CreateAssessmentForm } from '@/components/assessments/CreateAssessmentForm'

interface ClassPageProps {
  params: { classId: string }
}

export default async function ClassPage({ params }: ClassPageProps) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get class details with subject info
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select(`
      *,
      subjects(name, code)
    `)
    .eq('id', params.classId)
    .eq('owner_id', user.id)
    .single()

  if (classError || !classData) {
    notFound()
  }

  // Get enrollments with student info
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      students(id, full_name, year_level, external_id)
    `)
    .eq('class_id', params.classId)
    .eq('owner_id', user.id)

  // Get available students for enrollment (same year level, not already enrolled)
  const enrolledStudentIds = enrollments?.map(e => e.student_id) || []
  const { data: availableStudents } = await supabase
    .from('students')
    .select('*')
    .eq('owner_id', user.id)
    .eq('year_level', classData.year_level)
    .not('id', 'in', `(${enrolledStudentIds.join(',') || 'null'})`)

  // Get assessments for this class
  const { data: assessments } = await supabase
    .from('assessments')
    .select('*')
    .eq('class_id', params.classId)
    .eq('owner_id', user.id)
    .order('date', { ascending: false })

  return (
    <div className="px-4 py-6 sm:px-0">
      <ClassHeader classData={classData} enrollmentCount={enrollments?.length || 0} />
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-8">
            <CreateAssessmentForm classId={params.classId} />
          </div>
          <AssessmentsList assessments={assessments || []} classId={params.classId} />
        </div>
        
        <div>
          <EnrollmentManager
            classId={params.classId}
            enrollments={enrollments || []}
            availableStudents={availableStudents || []}
          />
        </div>
      </div>
    </div>
  )
}
