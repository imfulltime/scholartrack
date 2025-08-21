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
  external_id: z.string().optional(),
  year_level: z.number().min(1).max(12),
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
    external_id?: string | null
    year_level: number
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
      external_id: student.external_id || '',
      year_level: student.year_level,
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
          external_id: data.external_id || null,
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student ID (Optional)
              </label>
              <input
                {...register('external_id')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., STU123"
              />
              {errors.external_id && (
                <p className="text-sm text-red-600 mt-1">{errors.external_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year Level
              </label>
              <select
                {...register('year_level', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((year) => (
                  <option key={year} value={year}>
                    Year {year}
                  </option>
                ))}
              </select>
              {errors.year_level && (
                <p className="text-sm text-red-600 mt-1">{errors.year_level.message}</p>
              )}
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
