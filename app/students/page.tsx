import { createClient } from '@/lib/supabase/server'
import { StudentsPageClient } from '@/components/students/StudentsPageClient'
import PageWrapper from '@/components/layout/PageWrapper'
import { Users } from 'lucide-react'

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
    .order('family_name')
    .order('first_name')

  // Calculate grade level distribution
  const gradeDistribution = students?.reduce((acc, student) => {
    acc[student.year_level] = (acc[student.year_level] || 0) + 1
    return acc
  }, {} as Record<number, number>) || {}

  return (
    <PageWrapper
      title="Students Management"
      subtitle={`Manage your students and their information. Total: ${students?.length || 0} students across ${Object.keys(gradeDistribution).length} grade levels`}
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
      <StudentsPageClient 
        students={students || []} 
        gradeDistribution={gradeDistribution}
      />
    </PageWrapper>
  )
}
