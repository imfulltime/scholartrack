import { createClient } from '@/lib/supabase/server'
import { ClassReports } from '@/components/reports/ClassReports'
import { StudentReports } from '@/components/reports/StudentReports'
import PDFExportButtons from '@/components/reports/PDFExportButtons'

export default async function ReportsPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get classes and subjects separately to avoid joins
  let classes: any[] = []
  let subjects: any[] = []
  
  try {
    const [classesResult, subjectsResult] = await Promise.all([
      supabase
        .from('classes')
        .select('*')
        .eq('owner_id', user.id)
        .order('name'),
      supabase
        .from('subjects')
        .select('*')
        .eq('owner_id', user.id)
    ])

    classes = classesResult.data || []
    subjects = subjectsResult.data || []

    // Add subject info to classes on client side
    classes = classes.map(classItem => {
      const subject = subjects.find(s => s.id === classItem.subject_id)
      return {
        ...classItem,
        subjects: subject ? { name: subject.name, code: subject.code } : null
      }
    })
  } catch (error) {
    console.error('Reports data fetch error:', error)
  }

  // Get students for individual reports
  let students: any[] = []
  
  try {
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('owner_id', user.id)
      .order('full_name')

    if (studentsError) {
      console.error('Students fetch error:', studentsError)
    } else {
      students = studentsData || []
    }
  } catch (error) {
    console.error('Students query error:', error)
    students = []
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="mt-2 text-sm text-gray-700">
              View class summaries and individual student performance reports.
            </p>
          </div>
        </div>
        
        <div className="mt-8 space-y-8">
          {/* PDF Export Section */}
          <PDFExportButtons />
          
          {/* Existing Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ClassReports classes={classes} />
            <StudentReports students={students} />
          </div>
        </div>
      </div>
    </div>
  )
}
