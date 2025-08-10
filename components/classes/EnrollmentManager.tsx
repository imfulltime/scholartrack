'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, UserPlus, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { Database } from '@/types/database'

type Student = Database['public']['Tables']['students']['Row']
type Enrollment = Database['public']['Tables']['enrollments']['Row'] & {
  students: Student | null
}

interface EnrollmentManagerProps {
  classId: string
  enrollments: Enrollment[]
  availableStudents: Student[]
}

export function EnrollmentManager({ 
  classId, 
  enrollments, 
  availableStudents 
}: EnrollmentManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const router = useRouter()

  const handleAddStudent = async () => {
    if (!selectedStudentId) {
      toast.error('Please select a student')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          class_id: classId,
          student_id: selectedStudentId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to enroll student')
      }

      toast.success('Student enrolled successfully!')
      setSelectedStudentId('')
      setIsAdding(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to enroll student')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Remove ${studentName} from this class?`)) {
      return
    }

    setRemovingId(studentId)

    try {
      const response = await fetch('/api/enrollments', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          class_id: classId,
          student_id: studentId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove student')
      }

      toast.success('Student removed successfully!')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove student')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Class Roster
        </h3>
        {availableStudents.length > 0 && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add Student
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
          <div className="space-y-3">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select a student</option>
              {availableStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name}
                  {student.external_id && ` (${student.external_id})`}
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsAdding(false)
                  setSelectedStudentId('')
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                disabled={isLoading || !selectedStudentId}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {enrollments.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No students enrolled</p>
          </div>
        ) : (
          enrollments.map((enrollment) => (
            <div
              key={enrollment.student_id}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
            >
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {enrollment.students?.full_name}
                </div>
                {enrollment.students?.external_id && (
                  <div className="text-xs text-gray-500">
                    ID: {enrollment.students.external_id}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleRemoveStudent(
                  enrollment.student_id,
                  enrollment.students?.full_name || ''
                )}
                disabled={removingId === enrollment.student_id}
                className="text-red-600 hover:text-red-800 p-1 rounded disabled:opacity-50"
                aria-label={`Remove ${enrollment.students?.full_name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {availableStudents.length === 0 && !isAdding && (
        <div className="mt-4 text-sm text-gray-500">
          All eligible students for this grade level are already enrolled.
        </div>
      )}
    </div>
  )
}
