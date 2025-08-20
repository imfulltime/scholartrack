'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'

const criterionSchema = z.object({
  name: z.string().min(1, 'Criterion name is required'),
  description: z.string().optional(),
  weight: z.number().min(0).max(100).default(25),
})

const rubricSchema = z.object({
  name: z.string().min(1, 'Rubric name is required'),
  description: z.string().optional(),
  criteria: z.array(criterionSchema).min(1, 'At least one criterion is required'),
  scale: z.object({
    min: z.number().default(0),
    max: z.number().default(4),
    labels: z.array(z.string()).default(['Unsatisfactory', 'Developing', 'Proficient', 'Exemplary']),
  }),
})

type RubricFormData = z.infer<typeof rubricSchema>

interface RubricBuilderProps {
  classId: string
  onSave: (rubric: any) => void
  initialData?: any
}

export default function RubricBuilder({ classId, onSave, initialData }: RubricBuilderProps) {
  const [isLoading, setIsLoading] = useState(false)

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<RubricFormData>({
    resolver: zodResolver(rubricSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      criteria: [{ name: '', description: '', weight: 25 }],
      scale: {
        min: 0,
        max: 4,
        labels: ['Unsatisfactory', 'Developing', 'Proficient', 'Exemplary'],
      },
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'criteria',
  })

  const scaleLabels = watch('scale.labels')

  const onSubmit = async (data: RubricFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/rubrics', {
        method: initialData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          classId,
          id: initialData?.id,
        }),
      })

      if (!response.ok) throw new Error('Failed to save rubric')

      const rubric = await response.json()
      toast.success(initialData ? 'Rubric updated!' : 'Rubric created!')
      onSave(rubric)
    } catch (error) {
      toast.error('Failed to save rubric')
      console.error('Error saving rubric:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addCriterion = () => {
    append({ name: '', description: '', weight: 25 })
  }

  const removeCriterion = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        {initialData ? 'Edit Rubric' : 'Create New Rubric'}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rubric Name
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Essay Writing Rubric"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <input
              {...register('description')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of this rubric"
            />
          </div>
        </div>

        {/* Scale Configuration */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Performance Scale</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Score
              </label>
              <input
                {...register('scale.min', { valueAsNumber: true })}
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Score
              </label>
              <input
                {...register('scale.max', { valueAsNumber: true })}
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Performance Labels
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {scaleLabels.map((_, index) => (
                <input
                  key={index}
                  {...register(`scale.labels.${index}`)}
                  type="text"
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Level ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Criteria */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Assessment Criteria</h4>
            <button
              type="button"
              onClick={addCriterion}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Criterion
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-800">Criterion {index + 1}</h5>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCriterion(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Criterion Name
                    </label>
                    <input
                      {...register(`criteria.${index}.name`)}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Content Quality"
                    />
                    {errors.criteria?.[index]?.name && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.criteria[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      {...register(`criteria.${index}.description`)}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="What to look for in this criterion"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (%)
                    </label>
                    <input
                      {...register(`criteria.${index}.weight`, { valueAsNumber: true })}
                      type="number"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : (initialData ? 'Update Rubric' : 'Create Rubric')}
          </button>
        </div>
      </form>
    </div>
  )
}
