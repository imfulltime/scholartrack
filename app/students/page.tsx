import { createClient } from '@/lib/supabase/server'
import { StudentsList } from '@/components/students/StudentsList'
import { CreateStudentForm } from '@/components/students/CreateStudentForm'
import { ImportStudentsForm } from '@/components/students/ImportStudentsForm'
import PageWrapper from '@/components/layout/PageWrapper'
import { Users, Upload } from 'lucide-react'

export default async function StudentsPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('owner_id', user.id)
    .order('full_name')

  return (
    <PageWrapper
      title="Students"
      subtitle={`Manage your students and their information. Total: ${students?.length || 0} students`}
      actions={[
        {
          label: 'View Classes',
          href: '/classes',
          variant: 'secondary',
          icon: <Users className="h-4 w-4" />
        },
        {
          label: 'View Reports',
          href: '/reports',
          variant: 'secondary'
        }
      ]}
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CreateStudentForm />
          <ImportStudentsForm />
        </div>
        <StudentsList students={students || []} />
      </div>
    </PageWrapper>
  )
}
