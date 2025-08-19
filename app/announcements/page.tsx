import { createClient } from '@/lib/supabase/server'
import { AnnouncementsList } from '@/components/announcements/AnnouncementsList'
import { CreateAnnouncementForm } from '@/components/announcements/CreateAnnouncementForm'

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

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
            <p className="mt-2 text-sm text-gray-700">
              Create and manage school-wide and class-specific announcements.
            </p>
          </div>
        </div>
        
        <div className="mt-8">
          <CreateAnnouncementForm classes={(classes as any) || []} />
        </div>
        
        <div className="mt-8">
          <AnnouncementsList announcements={announcements || []} />
        </div>
      </div>
    </div>
  )
}
