import { createClient } from '@/lib/supabase/server'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { UpcomingAssessments } from '@/components/dashboard/UpcomingAssessments'
import { QuickActions } from '@/components/dashboard/QuickActions'
import PageWrapper from '@/components/layout/PageWrapper'
import { BarChart3, Settings, Users, BookOpen } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get dashboard data with simplified queries to avoid server component errors
  let classes: any[] = []
  let students: any[] = []
  let assessments: any[] = []
  let recentScores: any[] = []
  let announcements: any[] = []

  try {
    const [
      classesResult,
      studentsResult,
      assessmentsResult,
      scoresResult,
      announcementsResult
    ] = await Promise.all([
      supabase
        .from('classes')
        .select('id, name, subject_id')
        .eq('owner_id', user.id),
      supabase
        .from('students')
        .select('id, family_name, first_name, middle_name, display_name, full_name')
        .eq('owner_id', user.id),
      supabase
        .from('assessments')
        .select('id, title, date, status, class_id')
        .eq('owner_id', user.id)
        .order('date', { ascending: true })
        .limit(5),
      supabase
        .from('scores')
        .select('id, raw_score, updated_at, student_id, assessment_id')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10),
      supabase
        .from('announcements')
        .select('id, title, created_at')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)
    ])

    classes = classesResult.data || []
    students = studentsResult.data || []
    assessments = assessmentsResult.data || []
    recentScores = scoresResult.data || []
    announcements = announcementsResult.data || []

  } catch (error) {
    console.error('Dashboard data fetch error:', error)
    // Continue with empty arrays if there's an error
  }

  const stats = {
    totalClasses: classes?.length || 0,
    totalStudents: students?.length || 0,
    draftAssessments: assessments?.filter(a => a.status === 'DRAFT').length || 0,
    publishedAssessments: assessments?.filter(a => a.status === 'PUBLISHED').length || 0,
  }

  return (
    <PageWrapper
      title="ScholarTrack Dashboard"
      subtitle={`Welcome back! Manage your ${stats.totalClasses} classes and ${stats.totalStudents} students efficiently`}
      actions={[
        {
          label: 'Analytics',
          href: '/analytics',
          variant: 'secondary',
          icon: <BarChart3 className="h-4 w-4" />
        },
        {
          label: 'Reports',
          href: '/reports',
          variant: 'secondary'
        },
        {
          label: 'Grading Settings',
          href: '/settings/grading',
          variant: 'secondary',
          icon: <Settings className="h-4 w-4" />
        }
      ]}
    >
      <div className="space-y-8">
        {/* Enhanced Stats with Links */}
        <DashboardStats stats={stats} />

        {/* Quick Actions Grid */}
        <QuickActions 
          classes={classes}
          students={students}
          announcements={announcements}
        />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UpcomingAssessments assessments={assessments || []} />
          <RecentActivity scores={recentScores || []} />
        </div>
      </div>
    </PageWrapper>
  )
}
