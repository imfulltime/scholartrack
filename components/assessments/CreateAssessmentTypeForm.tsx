'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const assessmentTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  percentage_weight: z.number()
    .min(0.01, 'Percentage must be greater than 0')
    .max(100, 'Percentage cannot exceed 100'),
  is_active: z.boolean().default(true),
})

type AssessmentTypeFormData = z.infer<typeof assessmentTypeSchema>

interface CreateAssessmentTypeFormProps {
  onClose: () => void
  onSuccess: () => void
  currentTotal: number
}

export function CreateAssessmentTypeForm({ onClose, onSuccess, currentTotal }: CreateAssessmentTypeFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<AssessmentTypeFormData>({
    resolver: zodResolver(assessmentTypeSchema),
    defaultValues: {
      is_active: true,
      percentage_weight: Math.max(0, 100 - currentTotal),
    },
  })

  const watchedPercentage = watch('percentage_weight')
  const newTotal = currentTotal + (watchedPercentage || 0)
  const willExceed = newTotal > 100

  const onSubmit = async (data: AssessmentTypeFormData) => {
    if (willExceed && data.is_active) {
      toast.error('Total percentage would exceed 100%. Please adjust the percentage or set as inactive.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/assessment-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create assessment type')
      }

      toast.success('Assessment type created successfully!')
      reset()
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create assessment type')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Create Assessment Type</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                {...register('name')}
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., Midterm Exams"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Brief description of this assessment type..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="percentage_weight" className="block text-sm font-medium text-gray-700">
                Percentage Weight *
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('percentage_weight', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-8"
                  placeholder="25.00"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
              {errors.percentage_weight && (
                <p className="mt-1 text-sm text-red-600">{errors.percentage_weight.message}</p>
              )}
              
              {/* Total calculation display */}
              <div className="mt-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current total:</span>
                  <span className="font-medium">{currentTotal.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">New total:</span>
                  <span className={`font-medium ${willExceed ? 'text-red-600' : 'text-green-600'}`}>
                    {newTotal.toFixed(1)}%
                  </span>
                </div>
                {willExceed && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Total would exceed 100%. Consider setting as inactive or reducing percentage.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <input
                {...register('is_active')}
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Active (counts towards final grade)
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Assessment Type'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
