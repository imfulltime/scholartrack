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

  // Fetch data with better error handling
  let classes: any[] = []
  let subjects: any[] = []

  try {
    // Simplified query to avoid complex joins
    const [classesResult, subjectsResult] = await Promise.all([
      supabase
        .from('classes')
        .select('*, subjects(name, code)')
        .eq('owner_id', user.id)
        .order('name'),
      supabase
        .from('subjects')
        .select('*')
        .eq('owner_id', user.id)
        .order('name')
    ])

    classes = classesResult.data || []
    subjects = subjectsResult.data || []

    // Get enrollment counts separately to avoid aggregation issues
    if (classes.length > 0) {
      const classIds = classes.map(c => c.id)
      const { data: enrollmentCounts } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('owner_id', user.id)
        .in('class_id', classIds)

      // Add enrollment counts to classes
      classes = classes.map(classItem => ({
        ...classItem,
        enrollments: [{
          count: enrollmentCounts?.filter(e => e.class_id === classItem.id).length || 0
        }]
      }))
    }
  } catch (error) {
    console.error('Error fetching classes data:', error)
    // Continue with empty arrays to prevent page crash
  }

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
        <CreateClassForm subjects={subjects} />
        <ClassesList classes={classes} subjects={subjects} />
      </div>
    </PageWrapper>
  )
}
