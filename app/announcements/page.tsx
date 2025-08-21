import { createClient } from '@/lib/supabase/server'
import { AnnouncementsList } from '@/components/announcements/AnnouncementsList'
import { CreateAnnouncementForm } from '@/components/announcements/CreateAnnouncementForm'
import PageWrapper from '@/components/layout/PageWrapper'
import { Megaphone, Users, BookOpen, BarChart3, Settings } from 'lucide-react'

export default async function AnnouncementsPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get announcements with class information
  const { data: announcements } = await supabase
    .from('announcements')
    .select(`
      *,
      classes(name, subjects(name))
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  // Get classes for creating class-specific announcements
  const { data: classes } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      subjects(name)
    `)
    .eq('owner_id', user.id)
    .order('name')

  // Get announcement statistics
  const totalAnnouncements = announcements?.length || 0
  const schoolWideAnnouncements = announcements?.filter(a => !a.class_id).length || 0
  const classSpecificAnnouncements = announcements?.filter(a => a.class_id).length || 0

  return (
    <PageWrapper
      title="Announcements"
      subtitle={`Communicate with students and parents. Total: ${totalAnnouncements} announcements (${schoolWideAnnouncements} school-wide, ${classSpecificAnnouncements} class-specific)`}
      actions={[
        {
          label: 'Dashboard',
          href: '/dashboard',
          variant: 'secondary',
          icon: <BarChart3 className="h-4 w-4" />
        },
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
          label: 'View Reports',
          href: '/reports',
          variant: 'secondary'
        },
        {
          label: 'Settings',
          href: '/settings/grading',
          variant: 'secondary',
          icon: <Settings className="h-4 w-4" />
        }
      ]}
    >
      <div className="space-y-8">
        {/* Announcements Overview */}
        <div className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 rounded-xl p-6 border border-orange-200 shadow-lg">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-orange-500 rounded-lg shadow-md">
              <Megaphone className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-orange-900">Communication Center</h3>
              <p className="text-sm text-orange-600">Keep everyone informed with important updates</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 text-center border border-orange-200 shadow-sm">
              <div className="text-2xl font-bold text-orange-700 mb-1">{totalAnnouncements}</div>
              <div className="text-sm text-orange-600 font-medium">Total Announcements</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center border border-blue-200 shadow-sm">
              <div className="text-2xl font-bold text-blue-700 mb-1">{schoolWideAnnouncements}</div>
              <div className="text-sm text-blue-600 font-medium">School-wide</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center border border-green-200 shadow-sm">
              <div className="text-2xl font-bold text-green-700 mb-1">{classSpecificAnnouncements}</div>
              <div className="text-sm text-green-600 font-medium">Class-specific</div>
            </div>
          </div>
        </div>

        {/* Create Announcement Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="w-1 h-5 bg-orange-500 rounded-full mr-3"></div>
              Create New Announcement
            </h3>
          </div>
          <div className="p-6">
            <CreateAnnouncementForm classes={(classes as any) || []} />
          </div>
        </div>
        
        {/* Announcements List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <div className="w-1 h-5 bg-blue-500 rounded-full mr-3"></div>
              Recent Announcements
            </h3>
          </div>
          <div className="p-6">
            <AnnouncementsList announcements={announcements || []} />
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
