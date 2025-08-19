'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Trash2, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { Database } from '@/types/database'

type Subject = Database['public']['Tables']['subjects']['Row']

interface SubjectsListProps {
  subjects: Subject[]
}

export function SubjectsList({ subjects }: SubjectsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject? This will also delete all associated classes and assessments.')) {
      return
    }

    setDeletingId(id)

    try {
      const response = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete subject')
      }

      toast.success('Subject deleted successfully!')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete subject')
    } finally {
      setDeletingId(null)
    }
  }

  if (subjects.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first subject.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {subjects.map((subject) => (
          <li key={subject.id}>
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {subject.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    Code: {subject.code}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // TODO: Implement edit functionality
                    toast('Edit functionality coming soon!', { icon: 'ℹ️' })
                  }}
                  className="text-indigo-600 hover:text-indigo-900 p-2 rounded-md hover:bg-indigo-50"
                  aria-label={`Edit ${subject.name}`}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(subject.id)}
                  disabled={deletingId === subject.id}
                  className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 disabled:opacity-50"
                  aria-label={`Delete ${subject.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
