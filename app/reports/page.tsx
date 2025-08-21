import { createClient } from '@/lib/supabase/server'
import { ClassReports } from '@/components/reports/ClassReports'
import { StudentReports } from '@/components/reports/StudentReports'
import PDFExportButtons from '@/components/reports/PDFExportButtons'
import PageWrapper from '@/components/layout/PageWrapper'
import { BarChart3, Users, BookOpen, ClipboardList } from 'lucide-react'

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
      .order('family_name')
      .order('first_name')

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
    <PageWrapper
      title="Reports & Analytics"
      subtitle={`${classes.length} classes • ${students.length} students • Comprehensive performance tracking`}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Reports', href: '/reports', current: true }
      ]}
      actions={[
        {
          label: 'View Classes',
          href: '/classes',
          variant: 'secondary',
          icon: <BookOpen className="h-4 w-4" />
        },
        {
          label: 'View Students',
          href: '/students',
          variant: 'secondary',
          icon: <Users className="h-4 w-4" />
        },
        {
          label: 'Analytics',
          href: '/analytics',
          variant: 'primary',
          icon: <BarChart3 className="h-4 w-4" />
        }
      ]}
    >
      <div className="space-y-8">
        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/analytics"
            className="group p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-900">Advanced Analytics</p>
                <p className="text-xs text-blue-700">Performance trends & insights</p>
              </div>
            </div>
          </a>

          <a
            href="/classes"
            className="group p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border border-green-200 hover:border-green-300 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-900">Class Management</p>
                <p className="text-xs text-green-700">{classes.length} active classes</p>
              </div>
            </div>
          </a>

          <a
            href="/students"
            className="group p-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg border border-purple-200 hover:border-purple-300 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-900">Student Records</p>
                <p className="text-xs text-purple-700">{students.length} total students</p>
              </div>
            </div>
          </a>

          <a
            href="/dashboard"
            className="group p-6 bg-gradient-to-br from-orange-50 to-amber-100 rounded-lg border border-orange-200 hover:border-orange-300 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardList className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-900">Dashboard</p>
                <p className="text-xs text-orange-700">Overview & quick actions</p>
              </div>
            </div>
          </a>
        </div>

        {/* PDF Export Section */}
        <PDFExportButtons />
        
        {/* Main Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ClassReports classes={classes} />
          <StudentReports students={students} />
        </div>
      </div>
    </PageWrapper>
  )
}
