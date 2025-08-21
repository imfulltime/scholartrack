import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClassHeader } from '@/components/classes/ClassHeader'
import { EnrollmentManager } from '@/components/classes/EnrollmentManager'
import { AssessmentsList } from '@/components/assessments/AssessmentsList'
import { CreateAssessmentForm } from '@/components/assessments/CreateAssessmentForm'
import BulkEnrollmentManager from '@/components/enrollments/BulkEnrollmentManager'
import PageWrapper from '@/components/layout/PageWrapper'
import { Users, ClipboardList, BarChart3 } from 'lucide-react'

interface ClassPageProps {
  params: { classId: string }
}

export default async function ClassPage({ params }: ClassPageProps) {
  const supabase = createClient()
  
  try {
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
      console.error('Class fetch error:', classError)
      notFound()
    }

    // Log if subjects data is missing but don't fail
    if (!classData.subjects) {
      console.warn('Class missing subject data, continuing without subject info:', classData.id)
    }

    // Get enrollments with student info
    let enrollments: any[] = []
    
    try {
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          *,
          students(id, family_name, first_name, middle_name, display_name, year_level, external_id)
        `)
        .eq('class_id', params.classId)
        .eq('owner_id', user.id)

      if (enrollmentsError) {
        console.error('Enrollments query error:', enrollmentsError)
        // Try a simpler query if the join fails
        const { data: simpleEnrollments } = await supabase
          .from('enrollments')
          .select('*')
          .eq('class_id', params.classId)
          .eq('owner_id', user.id)
        
        enrollments = simpleEnrollments || []
      } else {
        enrollments = enrollmentsData || []
      }
    } catch (error) {
      console.error('Enrollments fetch error:', error)
      enrollments = []
    }

    // Get available students for enrollment (simplified query)
    let availableStudents: any[] = []
    
    try {
      const enrolledStudentIds = enrollments?.map(e => e.student_id).filter(id => id) || []
      
      // Get all students of the same year level first
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('owner_id', user.id)
        .eq('year_level', classData.year_level)

      if (studentsError) {
        console.error('Students query error:', studentsError)
      } else {
        // Filter out enrolled students on the client side for safety
        availableStudents = (allStudents || []).filter(student => 
          !enrolledStudentIds.includes(student.id)
        )
      }
    } catch (error) {
      console.error('Available students query error:', error)
      availableStudents = []
    }

    // Get assessments for this class
    let assessments: any[] = []
    
    try {
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select('*')
        .eq('class_id', params.classId)
        .eq('owner_id', user.id)
        .order('date', { ascending: false })

      if (assessmentsError) {
        console.error('Assessments query error:', assessmentsError)
      } else {
        assessments = assessmentsData || []
      }
    } catch (error) {
      console.error('Assessments fetch error:', error)
      assessments = []
    }

    return (
      <PageWrapper
        title={`${classData.name} - ${classData.subjects?.name || 'Unknown Subject'}`}
        subtitle={`Year ${classData.year_level} • ${enrollments.length} students enrolled • ${assessments.length} assessments`}
        backButton={{
          label: 'Back to Classes',
          href: '/classes'
        }}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Classes', href: '/classes' },
          { label: classData.name, href: `/classes/${params.classId}`, current: true }
        ]}
        actions={[
          {
            label: 'View Students',
            href: '/students',
            variant: 'secondary',
            icon: <Users className="h-4 w-4" />
          },
          {
            label: 'Class Analytics',
            href: `/analytics?classId=${params.classId}`,
            variant: 'secondary',
            icon: <BarChart3 className="h-4 w-4" />
          },
          {
            label: 'View Reports',
            href: '/reports',
            variant: 'primary',
            icon: <ClipboardList className="h-4 w-4" />
          }
        ]}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <CreateAssessmentForm classId={params.classId} />
            <AssessmentsList assessments={assessments} classId={params.classId} />
          </div>
          
          <div className="space-y-6">
            <EnrollmentManager
              classId={params.classId}
              enrollments={enrollments}
              availableStudents={availableStudents}
            />
            
            <BulkEnrollmentManager classId={params.classId} />
          </div>
        </div>
      </PageWrapper>
    )
  } catch (error) {
    console.error('Class page error:', error)
    notFound()
  }
}
