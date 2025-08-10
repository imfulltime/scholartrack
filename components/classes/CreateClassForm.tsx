'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'
import { Database } from '@/types/database'

type Subject = Database['public']['Tables']['subjects']['Row']

const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  subject_id: z.string().min(1, 'Subject is required'),
  year_level: z.number().min(1, 'Year level must be at least 1').max(12, 'Year level must be at most 12'),
})

type ClassFormData = z.infer<typeof classSchema>

interface CreateClassFormProps {
  subjects: Subject[]
}

export function CreateClassForm({ subjects }: CreateClassFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
  })

  const onSubmit = async (data: ClassFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          year_level: Number(data.year_level),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create class')
      }

      toast.success('Class created successfully!')
      reset()
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create class')
    } finally {
      setIsLoading(false)
    }
  }

  if (subjects.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="text-sm text-yellow-800">
          You need to create at least one subject before you can create a class.{' '}
          <a href="/subjects" className="font-medium underline hover:text-yellow-900">
            Create a subject first
          </a>
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Class
      </button>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Create New Class</h3>
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
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Class Name
          </label>
          <input
            {...register('name')}
            type="text"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., Grade 8 Mathematics A"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="subject_id" className="block text-sm font-medium text-gray-700">
            Subject
          </label>
          <select
            {...register('subject_id')}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select a subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} ({subject.code})
              </option>
            ))}
          </select>
          {errors.subject_id && (
            <p className="mt-1 text-sm text-red-600">{errors.subject_id.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="year_level" className="block text-sm font-medium text-gray-700">
            Year Level
          </label>
          <select
            {...register('year_level', { valueAsNumber: true })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select year level</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Grade {i + 1}
              </option>
            ))}
          </select>
          {errors.year_level && (
            <p className="mt-1 text-sm text-red-600">{errors.year_level.message}</p>
          )}
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
            {isLoading ? 'Creating...' : 'Create Class'}
          </button>
        </div>
      </form>
    </div>
  )
}
