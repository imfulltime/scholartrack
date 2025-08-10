import { createClient } from '@/lib/supabase/server'
import { SubjectsList } from '@/components/subjects/SubjectsList'
import { CreateSubjectForm } from '@/components/subjects/CreateSubjectForm'
import { Plus } from 'lucide-react'
import { useState } from 'react'

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
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage your curriculum subjects and their codes.
            </p>
          </div>
        </div>
        
        <div className="mt-8">
          <CreateSubjectForm />
        </div>
        
        <div className="mt-8">
          <SubjectsList subjects={subjects || []} />
        </div>
      </div>
    </div>
  )
}
