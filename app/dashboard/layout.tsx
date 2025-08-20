import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Dashboard layout auth error:', authError)
      redirect('/login')
    }

    // Get user profile with robust error handling
    let profile = null
    
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('full_name, email, role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        // Create a default profile if none exists
        profile = {
          full_name: user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: 'TEACHER_ADMIN'
        }
      } else {
        profile = profileData
      }
    } catch (error) {
      console.error('Profile query error:', error)
      // Fallback profile
      profile = {
        full_name: user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: 'TEACHER_ADMIN'
      }
    }

    if (!profile) {
      redirect('/login')
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={profile} />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    )
  } catch (error) {
    console.error('Dashboard layout error:', error)
    redirect('/login')
  }
}
