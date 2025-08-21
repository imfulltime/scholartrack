'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { Database } from '@/types/database'

type AssessmentType = Database['public']['Tables']['assessment_types']['Row']

const assessmentSchema = z.object({
  title: z.string().min(1, 'Assessment title is required'),
  type: z.enum(['QUIZ', 'EXAM', 'ASSIGNMENT'], {
    required_error: 'Assessment type is required',
  }),
  assessment_type_id: z.string().uuid('Please select an assessment type').optional(),
  date: z.string().min(1, 'Date is required'),
  max_score: z.number().min(0.01, 'Max score must be greater than 0'),
  weight: z.number().min(0, 'Weight cannot be negative').default(1),
})

type AssessmentFormData = z.infer<typeof assessmentSchema>

interface CreateAssessmentFormProps {
  classId: string
}

export function CreateAssessmentForm({ classId }: CreateAssessmentFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([])
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      fetchAssessmentTypes()
    }
  }, [isOpen])

  const fetchAssessmentTypes = async () => {
    try {
      const response = await fetch('/api/assessment-types')
      if (response.ok) {
        const data = await response.json()
        setAssessmentTypes(data.filter((type: AssessmentType) => type.is_active))
      }
    } catch (error) {
      console.error('Error fetching assessment types:', error)
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      weight: 1,
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  const onSubmit = async (data: AssessmentFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          class_id: classId,
          max_score: Number(data.max_score),
          weight: Number(data.weight),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create assessment')
      }

      toast.success('Assessment created successfully!')
      reset()
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create assessment')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Assessment
      </button>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Create New Assessment</h3>
        <button
          onClick={() => {
            setIsOpen(false)
            reset()
          }}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Assessment Title
            </label>
            <input
              {...register('title')}
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., Algebra Quiz 1"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Basic Type
            </label>
            <select
              {...register('type')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select type</option>
              <option value="QUIZ">Quiz</option>
              <option value="EXAM">Exam</option>
              <option value="ASSIGNMENT">Assignment</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="assessment_type_id" className="block text-sm font-medium text-gray-700">
              Assessment Category
              <span className="text-gray-500 text-xs ml-1">(for grade calculation)</span>
            </label>
            <select
              {...register('assessment_type_id')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select category (optional)</option>
              {assessmentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.percentage_weight}%)
                </option>
              ))}
            </select>
            {errors.assessment_type_id && (
              <p className="mt-1 text-sm text-red-600">{errors.assessment_type_id.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Choose a category to include this assessment in final grade calculations
            </p>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              {...register('date')}
              type="date"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="max_score" className="block text-sm font-medium text-gray-700">
              Max Score
            </label>
            <input
              {...register('max_score', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0.01"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="100"
            />
            {errors.max_score && (
              <p className="mt-1 text-sm text-red-600">{errors.max_score.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
              Weight
            </label>
            <input
              {...register('weight', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="1.0"
            />
            {errors.weight && (
              <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              reset()
            }}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Assessment'}
          </button>
        </div>
      </form>
    </div>
  )
}
