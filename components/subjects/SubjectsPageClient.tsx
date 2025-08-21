'use client'

import { useState } from 'react'
import { SubjectsList } from './SubjectsList'
import { CreateSubjectForm } from './CreateSubjectForm'
import { MultiFilter } from '../common/SearchFilter'
import { Database } from '@/types/database'
import { BookOpen, Image, Camera } from 'lucide-react'

type Subject = Database['public']['Tables']['subjects']['Row']

interface SubjectsPageClientProps {
  subjects: Subject[]
}

export function SubjectsPageClient({ subjects }: SubjectsPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate statistics
  const stats = {
    total: subjects.length,
    withPhotos: subjects.filter(s => s.photo_url).length,
    withoutPhotos: subjects.filter(s => !s.photo_url).length
  }

  return (
    <div className="space-y-8">
      {/* Statistics Overview */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-100 rounded-lg p-6 border border-indigo-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <BookOpen className="h-6 w-6 text-indigo-600 mr-3" />
            <h3 className="text-lg font-semibold text-indigo-900">Subjects Overview</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center border border-indigo-200">
            <div className="text-2xl font-bold text-indigo-700">{stats.total}</div>
            <div className="text-sm text-indigo-600">Total Subjects</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-green-200">
            <div className="flex items-center justify-center mb-1">
              <Image className="h-4 w-4 text-green-600 mr-1" />
              <div className="text-2xl font-bold text-green-700">{stats.withPhotos}</div>
            </div>
            <div className="text-sm text-green-600">With Photos</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-orange-200">
            <div className="flex items-center justify-center mb-1">
              <Camera className="h-4 w-4 text-orange-600 mr-1" />
              <div className="text-2xl font-bold text-orange-700">{stats.withoutPhotos}</div>
            </div>
            <div className="text-sm text-orange-600">Need Photos</div>
          </div>
        </div>
      </div>

      {/* Create Form */}
      <CreateSubjectForm />

      {/* Filtered Subjects List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Manage Subjects
        </h3>
        
        <MultiFilter
          items={subjects}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchFields={['name', 'code']}
          emptyMessage="No subjects created yet. Create your first subject above."
        >
          {(filteredSubjects) => (
            <SubjectsList subjects={filteredSubjects} />
          )}
        </MultiFilter>
      </div>
    </div>
  )
}
