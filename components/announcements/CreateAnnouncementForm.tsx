'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, X, Megaphone } from 'lucide-react'

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Message is required'),
  scope: z.enum(['SCHOOL', 'CLASS']),
  class_id: z.string().optional(),
  published_at: z.string().optional(),
})

type AnnouncementFormData = z.infer<typeof announcementSchema>

interface Class {
  id: string
  name: string
  subjects: {
    name: string
  } | null
}

interface CreateAnnouncementFormProps {
  classes: Class[]
}

export function CreateAnnouncementForm({ classes }: CreateAnnouncementFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      scope: 'SCHOOL',
    },
  })

  const scope = watch('scope')

  const onSubmit = async (data: AnnouncementFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          class_id: data.scope === 'CLASS' ? data.class_id : null,
          published_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create announcement')
      }

      toast.success('Announcement created successfully!')
      reset()
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create announcement')
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
        Create Announcement
      </button>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Megaphone className="h-5 w-5 mr-2" />
          Create New Announcement
        </h3>
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
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            {...register('title')}
            type="text"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., Important Update"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="scope" className="block text-sm font-medium text-gray-700">
            Scope
          </label>
          <select
            {...register('scope')}
            onChange={(e) => {
              setValue('scope', e.target.value as 'SCHOOL' | 'CLASS')
              if (e.target.value === 'SCHOOL') {
                setValue('class_id', undefined)
              }
            }}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="SCHOOL">School-wide</option>
            <option value="CLASS">Class-specific</option>
          </select>
          {errors.scope && (
            <p className="mt-1 text-sm text-red-600">{errors.scope.message}</p>
          )}
        </div>

        {scope === 'CLASS' && (
          <div>
            <label htmlFor="class_id" className="block text-sm font-medium text-gray-700">
              Select Class
            </label>
            <select
              {...register('class_id')}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Choose a class...</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} - {classItem.subjects?.name}
                </option>
              ))}
            </select>
            {errors.class_id && (
              <p className="mt-1 text-sm text-red-600">{errors.class_id.message}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700">
            Message
          </label>
          <textarea
            {...register('body')}
            rows={4}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter your announcement message..."
          />
          {errors.body && (
            <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>
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
            {isLoading ? 'Creating...' : 'Create Announcement'}
          </button>
        </div>
      </form>
    </div>
  )
}
