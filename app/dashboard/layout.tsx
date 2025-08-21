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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Subtle background pattern */}
        <div 
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        
        <div className="relative z-10">
          <Navbar user={profile} />
          <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
              {children}
            </div>
          </main>
        </div>

        {/* Floating decoration elements */}
        <div className="fixed top-20 right-10 w-20 h-20 bg-blue-500 rounded-full opacity-5 animate-pulse hidden lg:block"></div>
        <div 
          className="fixed bottom-20 left-10 w-16 h-16 bg-indigo-500 rounded-full opacity-5 animate-pulse hidden lg:block" 
          style={{ animationDelay: '1s' }}
        ></div>
        <div 
          className="fixed top-1/2 right-20 w-12 h-12 bg-purple-500 rounded-full opacity-5 animate-pulse hidden lg:block" 
          style={{ animationDelay: '2s' }}
        ></div>
      </div>
    )
  } catch (error) {
    console.error('Dashboard layout error:', error)
    redirect('/login')
  }
}
