'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'

const assessmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['QUIZ', 'EXAM', 'ASSIGNMENT', 'PROJECT', 'PRESENTATION']),
  date: z.string().min(1, 'Date is required'),
  dueDate: z.string().optional(),
  weight: z.number().min(0).max(100),
  maxScore: z.number().min(1, 'Max score must be at least 1'),
  instructions: z.string().optional(),
  categoryId: z.string().optional(),
  rubricId: z.string().optional(),
  allowLateSubmission: z.boolean().default(true),
  latePenalty: z.number().min(0).max(100).default(0),
})

type AssessmentFormData = z.infer<typeof assessmentSchema>

interface EnhancedAssessmentFormProps {
  classId: string
  onSave: (assessment: any) => void
  onCancel: () => void
  initialData?: any
}

export default function EnhancedAssessmentForm({ 
  classId, 
  onSave, 
  onCancel, 
  initialData 
}: EnhancedAssessmentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [rubrics, setRubrics] = useState<any[]>([])

  const { register, handleSubmit, watch, formState: { errors } } = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      type: initialData.type,
      date: initialData.date?.split('T')[0],
      dueDate: initialData.due_date?.split('T')[0],
      weight: initialData.weight,
      maxScore: initialData.max_score,
      instructions: initialData.instructions,
      categoryId: initialData.category_id,
      rubricId: initialData.rubric_id,
      allowLateSubmission: initialData.allow_late_submission ?? true,
      latePenalty: initialData.late_penalty ?? 0,
    } : {
      type: 'QUIZ',
      weight: 10,
      maxScore: 100,
      allowLateSubmission: true,
      latePenalty: 0,
    },
  })

  const allowLateSubmission = watch('allowLateSubmission')

  useEffect(() => {
    fetchCategories()
    fetchRubrics()
  }, [classId])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/assessment-categories?classId=${classId}`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchRubrics = async () => {
    try {
      const response = await fetch(`/api/rubrics?classId=${classId}`)
      if (response.ok) {
        const data = await response.json()
        setRubrics(data)
      }
    } catch (error) {
      console.error('Error fetching rubrics:', error)
    }
  }

  const onSubmit = async (data: AssessmentFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/assessments', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          classId,
          id: initialData?.id,
          dueDate: data.dueDate || null,
          categoryId: data.categoryId || null,
          rubricId: data.rubricId || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to save assessment')

      const assessment = await response.json()
      toast.success(initialData ? 'Assessment updated!' : 'Assessment created!')
      onSave(assessment)
    } catch (error) {
      toast.error('Failed to save assessment')
      console.error('Error saving assessment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        {initialData ? 'Edit Assessment' : 'Create New Assessment'}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assessment Title
            </label>
            <input
              {...register('title')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Chapter 5 Quiz"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              {...register('type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="QUIZ">Quiz</option>
              <option value="EXAM">Exam</option>
              <option value="ASSIGNMENT">Assignment</option>
              <option value="PROJECT">Project</option>
              <option value="PRESENTATION">Presentation</option>
            </select>
          </div>
        </div>

        {/* Dates and Scoring */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assessment Date
            </label>
            <input
              {...register('date')}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.date && (
              <p className="text-sm text-red-600 mt-1">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date (Optional)
            </label>
            <input
              {...register('dueDate')}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (%)
            </label>
            <input
              {...register('weight', { valueAsNumber: true })}
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.weight && (
              <p className="text-sm text-red-600 mt-1">{errors.weight.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Score
            </label>
            <input
              {...register('maxScore', { valueAsNumber: true })}
              type="number"
              min="1"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.maxScore && (
              <p className="text-sm text-red-600 mt-1">{errors.maxScore.message}</p>
            )}
          </div>
        </div>

        {/* Category and Rubric */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category (Optional)
            </label>
            <select
              {...register('categoryId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.weight}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rubric (Optional)
            </label>
            <select
              {...register('rubricId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No rubric</option>
              {rubrics.map((rubric) => (
                <option key={rubric.id} value={rubric.id}>
                  {rubric.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instructions (Optional)
          </label>
          <textarea
            {...register('instructions')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Special instructions for this assessment..."
          />
        </div>

        {/* Late Submission Settings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Late Submission Policy</h4>
          
          <div className="flex items-center mb-3">
            <input
              {...register('allowLateSubmission')}
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Allow late submissions
            </label>
          </div>

          {allowLateSubmission && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Late Penalty (% deduction per day)
              </label>
              <input
                {...register('latePenalty', { valueAsNumber: true })}
                type="number"
                min="0"
                max="100"
                step="1"
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500 ml-2">% per day late</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : (initialData ? 'Update Assessment' : 'Create Assessment')}
          </button>
        </div>
      </form>
    </div>
  )
}
