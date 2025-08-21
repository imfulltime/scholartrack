import { createClient } from '@/lib/supabase/server'
import { ClassesPageClient } from '@/components/classes/ClassesPageClient'
import PageWrapper from '@/components/layout/PageWrapper'
import { Users, BookOpen } from 'lucide-react'

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
        .select('*')
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

      // Add enrollment counts and subject names to classes
      classes = classes.map(classItem => {
        const subject = subjects.find(s => s.id === classItem.subject_id)
        return {
          ...classItem,
          subjects: subject ? { name: subject.name, code: subject.code } : null,
          enrollments: [{
            count: enrollmentCounts?.filter(e => e.class_id === classItem.id).length || 0
          }]
        }
      })
    }
  } catch (error) {
    console.error('Error fetching classes data:', error)
    // Continue with empty arrays to prevent page crash
  }

  // Calculate grade distribution
  const gradeDistribution = classes?.reduce((acc, classItem) => {
    acc[classItem.year_level] = (acc[classItem.year_level] || 0) + 1
    return acc
  }, {} as Record<number, number>) || {}

  return (
    <PageWrapper
      title="Classes Management"
      subtitle={`Manage your classes and enrollments. Total: ${classes?.length || 0} classes across ${Object.keys(gradeDistribution).length} grade levels`}
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
        },
        {
          label: 'Grading Settings',
          href: '/settings/grading',
          variant: 'secondary'
        }
      ]}
    >
      <ClassesPageClient 
        classes={classes} 
        subjects={subjects} 
        gradeDistribution={gradeDistribution}
      />
    </PageWrapper>
  )
}
