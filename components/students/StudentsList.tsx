'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Trash2, Users, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { Database } from '@/types/database'

type Student = Database['public']['Tables']['students']['Row']

interface StudentsListProps {
  students: Student[]
}

export function StudentsList({ students }: StudentsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.external_id && student.external_id.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will also remove them from all classes and delete their scores.`)) {
      return
    }

    setDeletingId(id)

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete student')
      }

      toast.success('Student deleted successfully!')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete student')
    } finally {
      setDeletingId(null)
    }
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No students</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding your first student or importing from CSV.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Students ({students.length})
          </h3>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <ul role="list" className="divide-y divide-gray-200">
          {filteredStudents.map((student) => (
            <li key={student.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-700">
                        {student.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {student.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Grade {student.year_level}
                      {student.external_id && ` • ID: ${student.external_id}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      // TODO: Implement edit functionality
                      toast.info('Edit functionality coming soon!')
                    }}
                    className="text-indigo-600 hover:text-indigo-900 p-2 rounded-md hover:bg-indigo-50"
                    aria-label={`Edit ${student.full_name}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(student.id, student.full_name)}
                    disabled={deletingId === student.id}
                    className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 disabled:opacity-50"
                    aria-label={`Delete ${student.full_name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {filteredStudents.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <Search className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No students match your search term "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
