import { createClient } from '@/lib/supabase/server'
import { StudentsList } from '@/components/students/StudentsList'
import { CreateStudentForm } from '@/components/students/CreateStudentForm'
import { ImportStudentsForm } from '@/components/students/ImportStudentsForm'

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
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-bold text-gray-900">Students</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage your students and their information.
            </p>
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CreateStudentForm />
          <ImportStudentsForm />
        </div>
        
        <div className="mt-8">
          <StudentsList students={students || []} />
        </div>
      </div>
    </div>
  )
}
