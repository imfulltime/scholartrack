'use client'

import { useState } from 'react'
import { BarChart3, Download, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface Class {
  id: string
  name: string
  year_level: number
  subjects: {
    name: string
    code: string
  } | null
  enrollments: any[]
  assessments: any[]
}

interface ClassReportsProps {
  classes: Class[]
}

export function ClassReports({ classes }: ClassReportsProps) {
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const handleGeneratePDF = async (classId: string, className: string) => {
    setIsGeneratingPDF(true)
    
    try {
      const response = await fetch(`/api/reports/class/${classId}/pdf`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${className}_Report.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('PDF downloaded successfully!')
    } catch (error) {
      toast.error('PDF generation is not yet implemented')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const getClassStats = async (classId: string) => {
    try {
      const response = await fetch(`/api/reports/class/${classId}`)
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const stats = await response.json()
      return stats
    } catch (error) {
      toast.error('Failed to load class statistics')
      return null
    }
  }

  if (classes.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Class Reports
        </h3>
        <div className="text-center py-8">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No classes</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create classes to view performance reports.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <BarChart3 className="h-5 w-5 mr-2" />
        Class Reports
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Choose a class...</option>
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name} - {classItem.subjects?.name}
              </option>
            ))}
          </select>
        </div>

        {selectedClass && (
          <div className="pt-4 border-t">
            {(() => {
              const classData = classes.find(c => c.id === selectedClass)
              if (!classData) return null
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-900">Students</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {classData.enrollments?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <BarChart3 className="h-8 w-8 text-green-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-900">Assessments</p>
                          <p className="text-2xl font-bold text-green-900">
                            {classData.assessments?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Class Summary</h4>
                    <p className="text-sm text-gray-600">
                      {classData.name} - Grade {classData.year_level}
                    </p>
                    <p className="text-sm text-gray-600">
                      Subject: {classData.subjects?.name} ({classData.subjects?.code})
                    </p>
                  </div>

                  <button
                    onClick={() => handleGeneratePDF(classData.id, classData.name)}
                    disabled={isGeneratingPDF}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isGeneratingPDF ? 'Generating...' : 'Download Class Report PDF'}
                  </button>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
