'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2, CheckCircle, AlertTriangle, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Database } from '@/types/database'
import { CreateAssessmentTypeForm } from './CreateAssessmentTypeForm'
import { EditAssessmentTypeForm } from './EditAssessmentTypeForm'

type AssessmentType = Database['public']['Tables']['assessment_types']['Row']

export function AssessmentTypesManager() {
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingType, setEditingType] = useState<AssessmentType | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchAssessmentTypes()
  }, [])

  const fetchAssessmentTypes = async () => {
    try {
      const response = await fetch('/api/assessment-types')
      if (response.ok) {
        const data = await response.json()
        setAssessmentTypes(data)
      }
    } catch (error) {
      console.error('Error fetching assessment types:', error)
      toast.error('Failed to load assessment types')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will affect all associated assessments.`)) {
      return
    }

    setDeletingId(id)

    try {
      const response = await fetch(`/api/assessment-types/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete assessment type')
      }

      toast.success('Assessment type deleted successfully!')
      fetchAssessmentTypes()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete assessment type')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (type: AssessmentType) => {
    try {
      const response = await fetch(`/api/assessment-types/${type.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !type.is_active,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update assessment type')
      }

      toast.success(`Assessment type ${type.is_active ? 'deactivated' : 'activated'}`)
      fetchAssessmentTypes()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update assessment type')
    }
  }

  // Calculate total percentage
  const totalPercentage = assessmentTypes
    .filter(type => type.is_active)
    .reduce((sum, type) => sum + type.percentage_weight, 0)

  const isValidTotal = totalPercentage === 100

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <BarChart3 className="h-6 w-6 text-indigo-600 mr-3" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Assessment Types</h2>
            <p className="text-sm text-gray-500">Configure how final grades are calculated</p>
          </div>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Type
        </button>
      </div>

      {/* Total Percentage Indicator */}
      <div className={`p-4 rounded-lg border ${
        isValidTotal 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center">
          {isValidTotal ? (
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          )}
          <div className="flex-1">
            <div className={`text-sm font-medium ${
              isValidTotal ? 'text-green-800' : 'text-red-800'
            }`}>
              Total Active Percentage: {totalPercentage.toFixed(1)}%
            </div>
            <div className={`text-xs ${
              isValidTotal ? 'text-green-600' : 'text-red-600'
            }`}>
              {isValidTotal 
                ? 'Perfect! Final grades can be calculated correctly.' 
                : 'Warning: Total must equal 100% for accurate final grade calculation.'
              }
            </div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${
              isValidTotal ? 'text-green-700' : 'text-red-700'
            }`}>
              {totalPercentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Types List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {assessmentTypes.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assessment types</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first assessment type.
            </p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {assessmentTypes.map((type) => (
              <li key={type.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {type.name}
                        </div>
                        {type.is_default && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Default
                          </span>
                        )}
                        {!type.is_active && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      {type.description && (
                        <div className="text-sm text-gray-500 truncate">
                          {type.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center ml-4">
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${
                          type.is_active ? 'text-indigo-600' : 'text-gray-400'
                        }`}>
                          {type.percentage_weight}%
                        </div>
                        <div className="text-xs text-gray-500">Weight</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(type)}
                      className={`p-2 rounded-md transition-colors ${
                        type.is_active
                          ? 'text-green-600 hover:text-green-800 hover:bg-green-50'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                      }`}
                      aria-label={`${type.is_active ? 'Deactivate' : 'Activate'} ${type.name}`}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingType(type)}
                      className="text-indigo-600 hover:text-indigo-900 p-2 rounded-md hover:bg-indigo-50"
                      aria-label={`Edit ${type.name}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {!type.is_default && (
                      <button
                        onClick={() => handleDelete(type.id, type.name)}
                        disabled={deletingId === type.id}
                        className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 disabled:opacity-50"
                        aria-label={`Delete ${type.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create Form Modal */}
      {isCreating && (
        <CreateAssessmentTypeForm
          onClose={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false)
            fetchAssessmentTypes()
            router.refresh()
          }}
          currentTotal={totalPercentage}
        />
      )}

      {/* Edit Form Modal */}
      {editingType && (
        <EditAssessmentTypeForm
          assessmentType={editingType}
          onClose={() => setEditingType(null)}
          onSuccess={() => {
            setEditingType(null)
            fetchAssessmentTypes()
            router.refresh()
          }}
          currentTotal={totalPercentage - editingType.percentage_weight}
        />
      )}
    </div>
  )
}
