'use client'

import { useState } from 'react'
import { User, TrendingUp, Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface Student {
  id: string
  family_name: string
  first_name: string
  middle_name: string | null
  display_name: string
  year_level: number
  external_id: string | null
}

interface StudentReportsProps {
  students: Student[]
}

export function StudentReports({ students }: StudentReportsProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const handleGeneratePDF = async (studentId: string, studentName: string) => {
    setIsGeneratingPDF(true)
    
    try {
      const response = await fetch(`/api/reports/student/${studentId}/pdf`, {
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
      a.download = `${studentName}_Report.pdf`
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

  if (students.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Student Reports
        </h3>
        <div className="text-center py-8">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No students</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add students to view individual performance reports.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <User className="h-5 w-5 mr-2" />
        Student Reports
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Student
          </label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Choose a student...</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.display_name || `${student.family_name}, ${student.first_name}${student.middle_name ? ' ' + student.middle_name : ''}`} 
                {student.external_id && ` (${student.external_id})`}
                {` - Grade ${student.year_level}`}
              </option>
            ))}
          </select>
        </div>

        {selectedStudent && (
          <div className="pt-4 border-t">
            {(() => {
              const studentData = students.find(s => s.id === selectedStudent)
              if (!studentData) return null
              
              return (
                <div className="space-y-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-indigo-900">
                          {studentData.display_name || `${studentData.family_name}, ${studentData.first_name}${studentData.middle_name ? ' ' + studentData.middle_name : ''}`}
                        </h4>
                        <p className="text-sm text-indigo-700">
                          Grade {studentData.year_level}
                          {studentData.external_id && ` • ID: ${studentData.external_id}`}
                        </p>
                      </div>
                      <div className="flex items-center text-indigo-600">
                        <TrendingUp className="h-8 w-8" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      Performance Summary
                    </h5>
                    <p className="text-sm text-gray-600">
                      Individual student performance tracking shows recent assessment trends,
                      overall averages, and improvement patterns.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Note: Detailed analytics require at least 5 completed assessments.
                    </p>
                  </div>

                  <button
                    onClick={() => handleGeneratePDF(studentData.id, studentData.display_name || `${studentData.family_name}, ${studentData.first_name}${studentData.middle_name ? ' ' + studentData.middle_name : ''}`)}
                    disabled={isGeneratingPDF}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isGeneratingPDF ? 'Generating...' : 'Download Student Report PDF'}
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
