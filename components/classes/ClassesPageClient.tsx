'use client'

import { useState } from 'react'
import { ClassesList } from './ClassesList'
import { CreateClassForm } from './CreateClassForm'
import { MultiFilter } from '../common/SearchFilter'
import { GradeLevelFilter } from '../students/GradeLevelFilter'
import { BookOpen, Users, GraduationCap } from 'lucide-react'

interface Class {
  id: string
  name: string
  year_level: number
  subjects: {
    name: string
    code: string
  } | null
  enrollments: any[]
}

interface Subject {
  id: string
  name: string
  code: string
  photo_url: string | null
  photo_public_id: string | null
  photo_uploaded_at: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

interface ClassesPageClientProps {
  classes: Class[]
  subjects: Subject[]
  gradeDistribution: Record<number, number>
}

export function ClassesPageClient({ classes, subjects, gradeDistribution }: ClassesPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)

  // Filter classes by search and grade
  const filteredClasses = classes.filter(classItem => {
    // Search filter
    const matchesSearch = !searchQuery.trim() || 
      classItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.subjects?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.subjects?.code.toLowerCase().includes(searchQuery.toLowerCase())

    // Grade filter
    const matchesGrade = selectedGrade === null || classItem.year_level === selectedGrade

    return matchesSearch && matchesGrade
  })

  // Calculate statistics
  const stats = {
    total: classes.length,
    totalStudents: classes.reduce((sum, cls) => sum + (cls.enrollments[0]?.count || 0), 0),
    subjects: subjects.length
  }

  return (
    <div className="space-y-8">
      {/* Statistics Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <GraduationCap className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-blue-900">Classes Overview</h3>
          </div>
          <GradeLevelFilter
            selectedGrade={selectedGrade}
            onGradeChange={setSelectedGrade}
            studentCounts={gradeDistribution}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center border border-blue-200">
            <div className="flex items-center justify-center mb-1">
              <BookOpen className="h-4 w-4 text-blue-600 mr-1" />
              <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
            </div>
            <div className="text-sm text-blue-600">Total Classes</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-green-200">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-green-600 mr-1" />
              <div className="text-2xl font-bold text-green-700">{stats.totalStudents}</div>
            </div>
            <div className="text-sm text-green-600">Total Enrollments</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-purple-200">
            <div className="flex items-center justify-center mb-1">
              <BookOpen className="h-4 w-4 text-purple-600 mr-1" />
              <div className="text-2xl font-bold text-purple-700">{stats.subjects}</div>
            </div>
            <div className="text-sm text-purple-600">Available Subjects</div>
          </div>
        </div>

        {/* Grade distribution cards */}
        <div className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(gradeDistribution)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([grade, count]) => (
                <div
                  key={grade}
                  className={`p-3 rounded-lg text-center transition-all cursor-pointer ${
                    selectedGrade === parseInt(grade)
                      ? 'bg-blue-200 border-2 border-blue-400'
                      : 'bg-white border border-blue-200 hover:bg-blue-50'
                  }`}
                  onClick={() => setSelectedGrade(
                    selectedGrade === parseInt(grade) ? null : parseInt(grade)
                  )}
                >
                  <div className="text-sm font-medium text-blue-900">Grade {grade}</div>
                  <div className="text-xl font-bold text-blue-700">{count}</div>
                  <div className="text-xs text-blue-600">
                    {count === 1 ? 'class' : 'classes'}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Create Form */}
      <CreateClassForm subjects={subjects} />

      {/* Filtered Classes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedGrade ? `Grade ${selectedGrade} Classes` : 'All Classes'}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredClasses.length} {filteredClasses.length === 1 ? 'class' : 'classes'})
            </span>
          </h3>
          {(selectedGrade || searchQuery) && (
            <button
              onClick={() => {
                setSelectedGrade(null)
                setSearchQuery('')
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
        
        <MultiFilter
          items={filteredClasses}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchFields={['name']}
          emptyMessage="No classes found. Create your first class above."
        >
          {(finalFilteredClasses) => (
            <ClassesList classes={finalFilteredClasses} subjects={subjects} />
          )}
        </MultiFilter>
      </div>
    </div>
  )
}
