'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { FileText, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { Database } from '@/types/database'

type Assessment = Database['public']['Tables']['assessments']['Row']

interface AssessmentsListProps {
  assessments: Assessment[]
  classId: string
}

export function AssessmentsList({ assessments, classId }: AssessmentsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toggleStatusId, setToggleStatusId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also delete all associated scores.`)) {
      return
    }

    setDeletingId(id)

    try {
      const response = await fetch(`/api/assessments/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete assessment')
      }

      toast.success('Assessment deleted successfully!')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete assessment')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    setToggleStatusId(id)

    try {
      const response = await fetch(`/api/assessments/${id}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: currentStatus === 'DRAFT' ? 'PUBLISHED' : 'DRAFT',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update status')
      }

      const newStatus = currentStatus === 'DRAFT' ? 'PUBLISHED' : 'DRAFT'
      toast.success(`Assessment ${newStatus.toLowerCase()} successfully!`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    } finally {
      setToggleStatusId(null)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'QUIZ':
        return 'bg-blue-100 text-blue-800'
      case 'EXAM':
        return 'bg-red-100 text-red-800'
      case 'ASSIGNMENT':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (assessments.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No assessments</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first assessment.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Assessments ({assessments.length})
        </h3>
        
        <ul role="list" className="divide-y divide-gray-200">
          {assessments.map((assessment) => (
            <li key={assessment.id} className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {assessment.title}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(assessment.type)}`}>
                        {assessment.type}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        assessment.status === 'PUBLISHED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {assessment.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{format(new Date(assessment.date), 'MMM d, yyyy')}</span>
                      <span>Max: {assessment.max_score} pts</span>
                      <span>Weight: {assessment.weight}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/classes/${classId}/assessments/${assessment.id}`}
                    className="text-indigo-600 hover:text-indigo-900 p-2 rounded-md hover:bg-indigo-50"
                    title="Grade Assessment"
                  >
                    <FileText className="h-4 w-4" />
                  </Link>
                  
                  <button
                    onClick={() => handleToggleStatus(assessment.id, assessment.status)}
                    disabled={toggleStatusId === assessment.id}
                    className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    title={assessment.status === 'DRAFT' ? 'Publish' : 'Unpublish'}
                  >
                    {assessment.status === 'DRAFT' ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      // TODO: Implement edit functionality
                      toast.info('Edit functionality coming soon!')
                    }}
                    className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50"
                    title="Edit Assessment"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(assessment.id, assessment.title)}
                    disabled={deletingId === assessment.id}
                    className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 disabled:opacity-50"
                    title="Delete Assessment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
