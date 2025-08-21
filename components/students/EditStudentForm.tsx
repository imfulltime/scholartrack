'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

const studentSchema = z.object({
  family_name: z.string().min(1, 'Family name is required'),
  first_name: z.string().min(1, 'First name is required'),
  middle_name: z.string().optional(),
  year_level: z.number().min(1).max(12),
  gender: z.enum(['Male', 'Female'], {
    required_error: 'Gender is required',
  }),
})

type StudentFormData = z.infer<typeof studentSchema>

interface EditStudentFormProps {
  student: {
    id: string
    family_name: string
    first_name: string
    middle_name: string | null
    display_name: string
    full_name: string | null // backward compatibility
    year_level: number
    gender: 'Male' | 'Female'
    universal_id: string
  }
  onClose: () => void
  onSuccess: () => void
}

export function EditStudentForm({ student, onClose, onSuccess }: EditStudentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      family_name: student.family_name,
      first_name: student.first_name,
      middle_name: student.middle_name || '',
      year_level: student.year_level,
      gender: student.gender,
    },
  })

  const onSubmit = async (data: StudentFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update student')
      }

      toast.success('Student updated successfully!')
      onSuccess()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update student')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Student</h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Family Name *
                </label>
                <input
                  {...register('family_name')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Last name"
                />
                {errors.family_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.family_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  {...register('first_name')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="First name"
                />
                {errors.first_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Middle Name
                </label>
                <input
                  {...register('middle_name')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Middle name (optional)"
                />
                {errors.middle_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.middle_name.message}</p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-blue-800">
                    Universal Student ID
                  </h3>
                  <div className="mt-1 text-sm text-blue-700">
                    <div className="font-mono text-lg font-bold text-blue-900">{student.universal_id}</div>
                    <p className="text-xs">This ID is unique across the entire school system and cannot be changed.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Level *
                </label>
                <select
                  {...register('year_level', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((year) => (
                    <option key={year} value={year}>
                      Grade {year}
                    </option>
                  ))}
                </select>
                {errors.year_level && (
                  <p className="text-sm text-red-600 mt-1">{errors.year_level.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <select
                  {...register('gender')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Male">👦 Male</option>
                  <option value="Female">👧 Female</option>
                </select>
                {errors.gender && (
                  <p className="text-sm text-red-600 mt-1">{errors.gender.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
