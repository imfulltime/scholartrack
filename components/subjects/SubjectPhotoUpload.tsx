'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, X, Trash2, Clock, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Database } from '@/types/database'

type Subject = Database['public']['Tables']['subjects']['Row']
type SubjectPhoto = Database['public']['Tables']['subject_photos']['Row']

interface SubjectPhotoUploadProps {
  subject: Subject
  onClose?: () => void
  onSuccess?: () => void
}

export function SubjectPhotoUpload({ subject, onClose, onSuccess }: SubjectPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [photos, setPhotos] = useState<SubjectPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Fetch existing photos
  useEffect(() => {
    fetchPhotos()
  }, [subject.id])

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/subjects/photos/${subject.id}`)
      if (response.ok) {
        const data = await response.json()
        setPhotos(data)
      }
    } catch (error) {
      console.error('Error fetching photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffMs = expiry.getTime() - now.getTime()
    
    if (diffMs <= 0) return 'Expired'
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m remaining`
    }
    return `${diffMinutes}m remaining`
  }

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

    if (photos.length >= 5) {
      toast.error('Maximum 5 photos allowed per subject')
      return
    }

    setIsUploading(true)

    try {
      const file = fileInputRef.current.files[0]
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('subjectId', subject.id)
      formData.append('caption', caption)
      formData.append('displayOrder', (photos.length + 1).toString())

      const response = await fetch('/api/subjects/photos', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload photo')
      }

      toast.success('Photo uploaded successfully! Expires in 48 hours.')
      setPreview(null)
      setCaption('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      fetchPhotos() // Refresh photos list
      onSuccess?.()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload photo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    setIsDeleting(photoId)

    try {
      const response = await fetch(`/api/subjects/photos/${photoId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete photo')
      }

      toast.success('Photo deleted successfully!')
      fetchPhotos() // Refresh photos list
      onSuccess?.()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete photo')
    } finally {
      setIsDeleting(null)
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
            {/* Current Photos */}
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ) : photos.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">
                    Current Photos ({photos.length}/5)
                  </h4>
                  {photos.length >= 5 && (
                    <span className="text-xs text-amber-600 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Limit reached
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative">
                      <img
                        src={photo.photo_url}
                        alt={photo.caption || `${subject.name} photo`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        disabled={isDeleting === photo.id}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 rounded-b-lg">
                        <div className="text-xs flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeRemaining(photo.expires_at)}
                        </div>
                        {photo.caption && (
                          <div className="text-xs mt-1 truncate">{photo.caption}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Upload New Photo */}
            {photos.length < 5 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Upload New Photo ({photos.length}/5)
                </h4>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Optional caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    maxLength={100}
                  />
                  
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
                            onClick={() => {
                              setPreview(null)
                              setCaption('')
                              if (fileInputRef.current) fileInputRef.current.value = ''
                            }}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                          >
                            Cancel
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
                          Click to select an image
                        </p>
                        <p className="text-xs text-gray-500">
                          JPG, PNG, GIF up to 5MB • Expires in 48 hours
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
              </div>
            )}

            {/* Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Camera className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Photo Management Rules
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 space-y-1">
                    <p className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <strong>Auto-expiry:</strong> Photos automatically delete after 48 hours
                    </p>
                    <p className="flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      <strong>Limit:</strong> Maximum 5 photos per subject
                    </p>
                    <p>
                      <strong>Visibility:</strong> Photos are visible to parents when viewing subject details
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
