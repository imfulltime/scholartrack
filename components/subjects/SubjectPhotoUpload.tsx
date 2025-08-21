'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Database } from '@/types/database'

type Subject = Database['public']['Tables']['subjects']['Row']

interface SubjectPhotoUploadProps {
  subject: Subject
  onClose?: () => void
  onSuccess?: () => void
}

export function SubjectPhotoUpload({ subject, onClose, onSuccess }: SubjectPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      toast.error('Please select an image')
      return
    }

    setIsUploading(true)

    try {
      const file = fileInputRef.current.files[0]
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('subjectId', subject.id)

      const response = await fetch('/api/subjects/photo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload photo')
      }

      toast.success('Photo uploaded successfully!')
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onSuccess?.()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload photo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePhoto = async () => {
    if (!subject.photo_url) return

    setIsDeleting(true)

    try {
      const response = await fetch('/api/subjects/photo', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subjectId: subject.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete photo')
      }

      toast.success('Photo deleted successfully!')
      onSuccess?.()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete photo')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              {subject.name} Photo
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Current Photo */}
            {subject.photo_url && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Current Photo</h4>
                <div className="relative">
                  <img
                    src={subject.photo_url}
                    alt={`${subject.name} photo`}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <button
                    onClick={handleDeletePhoto}
                    disabled={isDeleting}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Uploaded on {new Date(subject.photo_uploaded_at!).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Upload New Photo */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">
                {subject.photo_url ? 'Upload New Photo' : 'Upload Photo'}
              </h4>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {preview ? (
                  <div className="space-y-3">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Choose Different
                      </button>
                      <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isUploading ? 'Uploading...' : 'Upload Photo'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      Click to select an image or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, GIF up to 5MB
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                    >
                      Select Image
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Camera className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Photo Visibility
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      This photo will be visible to parents when they view their child's subjects and classes.
                      It helps parents identify and connect with the subject material.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
