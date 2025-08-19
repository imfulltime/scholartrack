import { createClient } from '@/lib/supabase/server'
import { ClassReports } from '@/components/reports/ClassReports'
import { StudentReports } from '@/components/reports/StudentReports'

export default async function ReportsPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get classes with basic statistics
  const { data: classes } = await supabase
    .from('classes')
    .select(`
      *,
      subjects(name, code),
      enrollments(count),
      assessments(count)
    `)
    .eq('owner_id', user.id)
    .order('name')

  // Get students for individual reports
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('owner_id', user.id)
    .order('full_name')

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
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ClassReports classes={classes || []} />
          <StudentReports students={students || []} />
        </div>
      </div>
    </div>
  )
}
