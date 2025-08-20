'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface Student {
  id: string
  full_name: string
  external_id?: string
  year_level: number
  isEnrolled?: boolean
}

interface Class {
  id: string
  name: string
  subject: { name: string }
  year_level: number
  _count: { enrollments: number }
}

const transferSchema = z.object({
  targetClassId: z.string().min(1, 'Please select a target class'),
  studentIds: z.array(z.string()).min(1, 'Please select at least one student'),
  transferType: z.enum(['move', 'copy']),
  reason: z.string().optional(),
})

type TransferFormData = z.infer<typeof transferSchema>

interface BulkEnrollmentManagerProps {
  classId: string
  onUpdate: () => void
}

export default function BulkEnrollmentManager({ classId, onUpdate }: BulkEnrollmentManagerProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [availableClasses, setAvailableClasses] = useState<Class[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'enroll' | 'transfer' | 'bulk'>('enroll')

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      transferType: 'move',
      studentIds: [],
    },
  })

  useEffect(() => {
    fetchStudents()
    fetchClasses()
  }, [classId])

  useEffect(() => {
    // Update form with selected students
    reset({ ...watch(), studentIds: Array.from(selectedStudents) })
  }, [selectedStudents, reset, watch])

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/students?includeEnrollment=${classId}`)
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      toast.error('Failed to fetch students')
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes')
      if (response.ok) {
        const data = await response.json()
        setAvailableClasses(data.filter((cls: Class) => cls.id !== classId))
      }
    } catch (error) {
      toast.error('Failed to fetch classes')
    }
  }

  const handleStudentToggle = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleSelectAll = (enrolled: boolean) => {
    const filteredStudents = students.filter(s => s.isEnrolled === enrolled)
    const newSelected = new Set(selectedStudents)
    
    filteredStudents.forEach(student => {
      if (enrolled && student.isEnrolled) {
        newSelected.add(student.id)
      } else if (!enrolled && !student.isEnrolled) {
        newSelected.add(student.id)
      }
    })
    
    setSelectedStudents(newSelected)
  }

  const handleBulkEnroll = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select students to enroll')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/enrollments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          studentIds: Array.from(selectedStudents),
          action: 'enroll',
        }),
      })

      if (!response.ok) throw new Error('Failed to enroll students')

      const result = await response.json()
      toast.success(`Successfully enrolled ${result.enrolled} students`)
      setSelectedStudents(new Set())
      fetchStudents()
      onUpdate()
    } catch (error) {
      toast.error('Failed to enroll students')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkUnenroll = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select students to unenroll')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/enrollments/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          studentIds: Array.from(selectedStudents),
        }),
      })

      if (!response.ok) throw new Error('Failed to unenroll students')

      const result = await response.json()
      toast.success(`Successfully unenrolled ${result.unenrolled} students`)
      setSelectedStudents(new Set())
      fetchStudents()
      onUpdate()
    } catch (error) {
      toast.error('Failed to unenroll students')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTransfer = async (data: TransferFormData) => {
    if (data.studentIds.length === 0) {
      toast.error('Please select students to transfer')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/enrollments/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromClassId: classId,
          toClassId: data.targetClassId,
          studentIds: data.studentIds,
          transferType: data.transferType,
          reason: data.reason,
        }),
      })

      if (!response.ok) throw new Error('Failed to transfer students')

      const result = await response.json()
      toast.success(`Successfully ${data.transferType === 'move' ? 'moved' : 'copied'} ${result.transferred} students`)
      setSelectedStudents(new Set())
      fetchStudents()
      onUpdate()
      reset()
    } catch (error) {
      toast.error('Failed to transfer students')
    } finally {
      setIsLoading(false)
    }
  }

  const enrolledStudents = students.filter(s => s.isEnrolled)
  const unenrolledStudents = students.filter(s => !s.isEnrolled)

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6 pt-4">
          {[
            { id: 'enroll', label: 'Enroll Students', count: unenrolledStudents.length },
            { id: 'transfer', label: 'Transfer Students', count: enrolledStudents.length },
            { id: 'bulk', label: 'Bulk Operations', count: selectedStudents.size },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Enroll Students Tab */}
        {activeTab === 'enroll' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Available Students</h3>
              <div className="space-x-2">
                <button
                  onClick={() => handleSelectAll(false)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                >
                  Select All
                </button>
                <button
                  onClick={handleBulkEnroll}
                  disabled={selectedStudents.size === 0 || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Enrolling...' : `Enroll Selected (${selectedStudents.size})`}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {unenrolledStudents.map((student) => (
                <div
                  key={student.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedStudents.has(student.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleStudentToggle(student.id)}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{student.full_name}</p>
                      <p className="text-sm text-gray-500">
                        {student.external_id && `ID: ${student.external_id} • `}
                        Year {student.year_level}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {unenrolledStudents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                All students are already enrolled in this class
              </div>
            )}
          </div>
        )}

        {/* Transfer Students Tab */}
        {activeTab === 'transfer' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Transfer Students</h3>

            <form onSubmit={handleSubmit(handleTransfer)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Class
                  </label>
                  <select
                    {...register('targetClassId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a class</option>
                    {availableClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} - {cls.subject.name} (Year {cls.year_level}) 
                        [{cls._count.enrollments} students]
                      </option>
                    ))}
                  </select>
                  {errors.targetClassId && (
                    <p className="text-sm text-red-600 mt-1">{errors.targetClassId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transfer Type
                  </label>
                  <select
                    {...register('transferType')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="move">Move (remove from current class)</option>
                    <option value="copy">Copy (keep in both classes)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <input
                  {...register('reason')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Schedule conflict, level adjustment"
                />
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                >
                  Select All Enrolled
                </button>
                <button
                  type="submit"
                  disabled={selectedStudents.size === 0 || isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Transferring...' : `Transfer Selected (${selectedStudents.size})`}
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {enrolledStudents.map((student) => (
                <div
                  key={student.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedStudents.has(student.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleStudentToggle(student.id)}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{student.full_name}</p>
                      <p className="text-sm text-gray-500">
                        {student.external_id && `ID: ${student.external_id} • `}
                        Year {student.year_level}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bulk Operations Tab */}
        {activeTab === 'bulk' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Bulk Operations</h3>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Bulk Operations Warning
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Bulk operations affect multiple students at once. Please review your selections carefully.
                      Selected students: <strong>{selectedStudents.size}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Enrollment Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={handleBulkEnroll}
                    disabled={selectedStudents.size === 0 || isLoading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Bulk Enroll ({selectedStudents.size} students)
                  </button>
                  <button
                    onClick={handleBulkUnenroll}
                    disabled={selectedStudents.size === 0 || isLoading}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Bulk Unenroll ({selectedStudents.size} students)
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Quick Selection</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedStudents(new Set(enrolledStudents.map(s => s.id)))}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Select All Enrolled ({enrolledStudents.length})
                  </button>
                  <button
                    onClick={() => setSelectedStudents(new Set(unenrolledStudents.map(s => s.id)))}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Select All Unenrolled ({unenrolledStudents.length})
                  </button>
                  <button
                    onClick={() => setSelectedStudents(new Set())}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
