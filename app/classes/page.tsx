import { createClient } from '@/lib/supabase/server'
import { ClassesList } from '@/components/classes/ClassesList'
import { CreateClassForm } from '@/components/classes/CreateClassForm'
import PageWrapper from '@/components/layout/PageWrapper'
import { BookOpen, Users } from 'lucide-react'

export default async function ClassesPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const [{ data: classes }, { data: subjects }] = await Promise.all([
    supabase
      .from('classes')
      .select(`
        *,
        subjects(name, code),
        enrollments(count)
      `)
      .eq('owner_id', user.id)
      .order('name'),
    supabase
      .from('subjects')
      .select('*')
      .eq('owner_id', user.id)
      .order('name')
  ])

  return (
    <PageWrapper
      title="Classes"
      subtitle={`Manage your classes and their enrollments. Total: ${classes?.length || 0} classes`}
      actions={[
        {
          label: 'Manage Subjects',
          href: '/subjects',
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
          label: 'View Reports',
          href: '/reports',
          variant: 'secondary'
        }
      ]}
    >
      <div className="space-y-8">
        <CreateClassForm subjects={subjects || []} />
        <ClassesList classes={classes || []} />
      </div>
    </PageWrapper>
  )
}
