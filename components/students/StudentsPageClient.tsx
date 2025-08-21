'use client'

import { useState, useMemo } from 'react'
import { StudentsList } from './StudentsList'
import { CreateStudentForm } from './CreateStudentForm'
import { ImportStudentsForm } from './ImportStudentsForm'
import { GradeLevelFilter } from './GradeLevelFilter'
import { Database } from '@/types/database'
import { BarChart3, Users, Filter } from 'lucide-react'

type Student = Database['public']['Tables']['students']['Row']

interface StudentsPageClientProps {
  students: Student[]
  gradeDistribution: Record<number, number>
}

export function StudentsPageClient({ students, gradeDistribution }: StudentsPageClientProps) {
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)

  // Filter students by grade level
  const filteredStudents = useMemo(() => {
    if (selectedGrade === null) return students
    return students.filter(student => student.year_level === selectedGrade)
  }, [students, selectedGrade])

  // Get grade statistics for the filter component
  const gradeStats = useMemo(() => {
    const stats: Record<number, number> = {}
    students.forEach(student => {
      stats[student.year_level] = (stats[student.year_level] || 0) + 1
    })
    return stats
  }, [students])

  return (
    <div className="space-y-8">
      {/* Grade Distribution Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-blue-900">Grade Level Distribution</h3>
          </div>
          <GradeLevelFilter
            selectedGrade={selectedGrade}
            onGradeChange={setSelectedGrade}
            studentCounts={gradeStats}
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(gradeStats)
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
                  {count === 1 ? 'student' : 'students'}
                </div>
              </div>
            ))}
        </div>
        
        {selectedGrade && (
          <div className="mt-4 p-3 bg-blue-100 rounded-md">
            <div className="flex items-center text-blue-800">
              <Filter className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">
                Showing {filteredStudents.length} students in Grade {selectedGrade}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Student Management Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <CreateStudentForm />
          {selectedGrade && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center text-green-800">
                <Users className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">
                  New students will be shown in all grade filters based on their assigned grade level
                </span>
              </div>
            </div>
          )}
        </div>
        <ImportStudentsForm />
      </div>

      {/* Filtered Students List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedGrade ? `Grade ${selectedGrade} Students` : 'All Students'}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'})
            </span>
          </h3>
          {selectedGrade && (
            <button
              onClick={() => setSelectedGrade(null)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Show All Grades
            </button>
          )}
        </div>
        
        <StudentsList students={filteredStudents} />
      </div>
    </div>
  )
}
