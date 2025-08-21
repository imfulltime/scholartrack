import { createClient } from '@/lib/supabase/server'
import { SubjectsPageClient } from '@/components/subjects/SubjectsPageClient'
import PageWrapper from '@/components/layout/PageWrapper'

export default async function SubjectsPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .eq('owner_id', user.id)
    .order('name')

  return (
    <PageWrapper
      title="Subjects"
      subtitle="Manage your curriculum subjects and their codes"
      actions={[
        {
          label: 'View Classes',
          href: '/classes',
          variant: 'secondary'
        },
        {
          label: 'View Reports',
          href: '/reports',
          variant: 'secondary'
        },
        {
          label: 'Analytics',
          href: '/analytics',
          variant: 'secondary'
        }
      ]}
    >
      <SubjectsPageClient subjects={subjects || []} />
    </PageWrapper>
  )
}
