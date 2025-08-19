'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit2, Trash2, Users, BookOpen, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

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

interface ClassesListProps {
  classes: Class[]
}

export function ClassesList({ classes }: ClassesListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all associated assessments and scores.`)) {
      return
    }

    setDeletingId(id)

    try {
      const response = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete class')
      }

      toast.success('Class deleted successfully!')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete class')
    } finally {
      setDeletingId(null)
    }
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No classes</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first class.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {classes.map((classItem) => (
        <div
          key={classItem.id}
          className="bg-white overflow-hidden shadow rounded-lg border border-gray-200"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {classItem.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {classItem.subjects?.name} • Grade {classItem.year_level}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-500">
                <Users className="flex-shrink-0 mr-1.5 h-4 w-4" />
                {classItem.enrollments?.length || 0} students
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-5 py-3">
            <div className="flex justify-between items-center">
              <Link
                href={`/classes/${classItem.id}`}
                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium inline-flex items-center"
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Link>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // TODO: Implement edit functionality
                    toast('Edit functionality coming soon!', { icon: 'ℹ️' })
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                  aria-label={`Edit ${classItem.name}`}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(classItem.id, classItem.name)}
                  disabled={deletingId === classItem.id}
                  className="text-red-400 hover:text-red-600 p-1 rounded disabled:opacity-50"
                  aria-label={`Delete ${classItem.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
