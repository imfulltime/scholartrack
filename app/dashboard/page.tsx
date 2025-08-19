import { createClient } from '@/lib/supabase/server'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { UpcomingAssessments } from '@/components/dashboard/UpcomingAssessments'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get dashboard data
  const [
    { data: classes },
    { data: students },
    { data: assessments },
    { data: recentScores }
  ] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name, subject_id, subjects(name)')
      .eq('owner_id', user.id),
    supabase
      .from('students')
      .select('id, full_name')
      .eq('owner_id', user.id),
    supabase
      .from('assessments')
      .select(`
        id,
        title,
        date,
        status,
        classes!inner(name)
      `)
      .eq('owner_id', user.id)
      .order('date', { ascending: true })
      .limit(5),
    supabase
      .from('scores')
      .select(`
        id,
        raw_score,
        updated_at,
        students!inner(full_name),
        assessments!inner(title, max_score)
      `)
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10)
  ])

  const stats = {
    totalClasses: classes?.length || 0,
    totalStudents: students?.length || 0,
    draftAssessments: assessments?.filter(a => a.status === 'DRAFT').length || 0,
    publishedAssessments: assessments?.filter(a => a.status === 'PUBLISHED').length || 0,
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <DashboardStats stats={stats} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <UpcomingAssessments assessments={(assessments as any) || []} />
          <RecentActivity scores={(recentScores as any) || []} />
        </div>
      </div>
    </div>
  )
}
