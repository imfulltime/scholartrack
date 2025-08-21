'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'

const studentSchema = z.object({
  family_name: z.string().min(1, 'Family name is required'),
  first_name: z.string().min(1, 'First name is required'),
  middle_name: z.string().optional(),
  year_level: z.number().min(1, 'Year level must be at least 1').max(12, 'Year level must be at most 12'),
  gender: z.enum(['Male', 'Female'], {
    required_error: 'Gender is required',
  }),
})

type StudentFormData = z.infer<typeof studentSchema>

export function CreateStudentForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  })

  const onSubmit = async (data: StudentFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/students', {
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
        throw new Error(errorData.error || 'Failed to create student')
      }

      toast.success('Student created successfully!')
      reset()
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create student')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Individual Student</h3>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Add New Student</h3>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="family_name" className="block text-sm font-medium text-gray-700">
              Family Name *
            </label>
            <input
              type="text"
              id="family_name"
              {...register('family_name')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Last name"
            />
            {errors.family_name && (
              <p className="mt-1 text-sm text-red-600">{errors.family_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
              First Name *
            </label>
            <input
              type="text"
              id="first_name"
              {...register('first_name')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="First name"
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="middle_name" className="block text-sm font-medium text-gray-700">
              Middle Name
            </label>
            <input
              type="text"
              id="middle_name"
              {...register('middle_name')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Middle name (optional)"
            />
            {errors.middle_name && (
              <p className="mt-1 text-sm text-red-600">{errors.middle_name.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="year_level" className="block text-sm font-medium text-gray-700">
              Year Level *
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

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              Gender *
            </label>
            <select
              {...register('gender')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select gender</option>
              <option value="Male">👦 Male</option>
              <option value="Female">👧 Female</option>
            </select>
            {errors.gender && (
              <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Universal ID Auto-Generation
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>A unique Universal ID (e.g., SY2024-1000001) will be automatically generated for this student. This ID is unique across the entire school system.</p>
              </div>
            </div>
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
            {isLoading ? 'Creating...' : 'Create Student'}
          </button>
        </div>
      </form>
    </div>
  )
}
