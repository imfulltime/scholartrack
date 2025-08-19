'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Megaphone, Trash2, School, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface Announcement {
  id: string
  title: string
  body: string
  scope: 'SCHOOL' | 'CLASS'
  class_id: string | null
  published_at: string | null
  created_at: string
  classes: {
    name: string
    subjects: {
      name: string
    } | null
  } | null
}

interface AnnouncementsListProps {
  announcements: Announcement[]
}

export function AnnouncementsList({ announcements }: AnnouncementsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    setDeletingId(id)

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete announcement')
      }

      toast.success('Announcement deleted successfully!')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete announcement')
    } finally {
      setDeletingId(null)
    }
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-12">
        <Megaphone className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first announcement.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        Recent Announcements ({announcements.length})
      </h3>
      
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-lg font-medium text-gray-900">
                    {announcement.title}
                  </h4>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      announcement.scope === 'SCHOOL'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {announcement.scope === 'SCHOOL' ? (
                      <>
                        <School className="h-3 w-3 mr-1" />
                        School-wide
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3 mr-1" />
                        Class: {announcement.classes?.name}
                      </>
                    )}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                  {announcement.body}
                </p>
                
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <span>
                    Created: {format(new Date(announcement.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                  {announcement.published_at && (
                    <span>
                      Published: {format(new Date(announcement.published_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  )}
                  {announcement.scope === 'CLASS' && announcement.classes && (
                    <span>
                      Subject: {announcement.classes.subjects?.name}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="ml-4">
                <button
                  onClick={() => handleDelete(announcement.id, announcement.title)}
                  disabled={deletingId === announcement.id}
                  className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 disabled:opacity-50"
                  aria-label={`Delete ${announcement.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
